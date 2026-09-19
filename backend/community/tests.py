from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from community.models import Comment, Thread, Vote

User = get_user_model()


class CommunityAPITests(APITestCase):
    def setUp(self):
        self.author = User.objects.create_user(
            email="threadauthor@example.com",
            username="threadauthor",
            full_name="Thread Author",
            password="StrongPassword123!",
        )
        self.user2 = User.objects.create_user(
            email="voter2@example.com",
            username="voter2",
            full_name="Voter Two",
            password="StrongPassword123!",
        )
        self.user3 = User.objects.create_user(
            email="voter3@example.com",
            username="voter3",
            full_name="Voter Three",
            password="StrongPassword123!",
        )
        self.user4 = User.objects.create_user(
            email="voter4@example.com",
            username="voter4",
            full_name="Voter Four",
            password="StrongPassword123!",
        )
        self.user5 = User.objects.create_user(
            email="voter5@example.com",
            username="voter5",
            full_name="Voter Five",
            password="StrongPassword123!",
        )
        self.user6 = User.objects.create_user(
            email="voter6@example.com",
            username="voter6",
            full_name="Voter Six",
            password="StrongPassword123!",
        )
        self.thread = Thread.objects.create(
            author=self.author,
            title="How should we structure the app?",
            body="I'm planning the project structure. What do you think?",
            category="community",
        )

    def test_vote_toggle_math(self):
        self.client.force_authenticate(user=self.user2)
        first = self.client.post(
            reverse("vote"),
            {"content_type": "thread", "object_id": self.thread.id, "value": 1},
            format="json",
        )
        self.assertEqual(first.status_code, status.HTTP_200_OK)
        self.assertEqual(first.data["score"], 1)
        self.assertEqual(first.data["user_vote"], 1)

        second = self.client.post(
            reverse("vote"),
            {"content_type": "thread", "object_id": self.thread.id, "value": 0},
            format="json",
        )
        self.assertEqual(second.status_code, status.HTTP_200_OK)
        self.assertEqual(second.data["score"], 0)
        self.assertEqual(second.data["user_vote"], 0)

    def test_one_vote_per_user(self):
        self.client.force_authenticate(user=self.user2)
        first = self.client.post(
            reverse("vote"),
            {"content_type": "thread", "object_id": self.thread.id, "value": 1},
            format="json",
        )
        second = self.client.post(
            reverse("vote"),
            {"content_type": "thread", "object_id": self.thread.id, "value": -1},
            format="json",
        )

        self.assertEqual(first.status_code, status.HTTP_200_OK)
        self.assertEqual(second.status_code, status.HTTP_200_OK)
        self.assertEqual(second.data["score"], -1)
        self.assertEqual(Vote.objects.filter(user=self.user2, content_type__model="thread", object_id=self.thread.id).count(), 1)

    def test_comment_upvote_threshold_fires_once(self):
        comment = Comment.objects.create(
            thread=self.thread,
            author=self.user3,
            body="This is a useful idea.",
        )

        voters = [self.user2, self.user4, self.user5, self.user6, self.author]
        for user in voters:
            self.client.force_authenticate(user=user)
            response = self.client.post(
                reverse("vote"),
                {"content_type": "comment", "object_id": comment.id, "value": 1},
                format="json",
            )
            self.assertEqual(response.status_code, status.HTTP_200_OK)

        comment.refresh_from_db()
        comment.author.refresh_from_db()
        self.assertTrue(comment.xp_awarded)
        self.assertEqual(comment.author.xp, 25)

        self.client.force_authenticate(user=self.user2)
        extra = self.client.post(
            reverse("vote"),
            {"content_type": "comment", "object_id": comment.id, "value": 1},
            format="json",
        )
        self.assertEqual(extra.status_code, status.HTTP_200_OK)
        comment.author.refresh_from_db()
        self.assertEqual(comment.author.xp, 25)
