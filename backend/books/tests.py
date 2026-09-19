from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from books.models import Book, Chapter, ReadingProgress

User = get_user_model()


class BookProgressAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="reader@example.com",
            username="reader",
            full_name="Reader User",
            password="StrongPassword123!",
        )
        self.book = Book.objects.create(
            title="Frontend Foundations",
            author="Jane Doe",
            category="frontend",
            difficulty="beginner",
            est_minutes=120,
            tags=["react", "ui"],
        )
        self.chapter_1 = Chapter.objects.create(book=self.book, title="Intro", chapter_number=1, content="hello")
        self.chapter_2 = Chapter.objects.create(book=self.book, title="Build", chapter_number=2, content="world")

    def test_progress_upserts_and_updates_single_record(self):
        self.client.force_authenticate(user=self.user)
        url = reverse("book-progress", kwargs={"slug": self.book.slug})

        opened = self.client.post(url, {"chapter_id": self.chapter_1.id, "completed": False}, format="json")
        first_done = self.client.post(url, {"chapter_id": self.chapter_1.id, "completed": True}, format="json")
        progress = ReadingProgress.objects.get(user=self.user, book=self.book)

        self.assertEqual(opened.status_code, status.HTTP_200_OK)
        self.assertEqual(first_done.status_code, status.HTTP_200_OK)
        self.assertEqual(ReadingProgress.objects.filter(user=self.user, book=self.book).count(), 1)
        # Book progress comes from completed chapters: 1 of 2, so the book is NOT finished yet.
        self.assertEqual(progress.progress_percent, 50)
        self.assertFalse(progress.completed)

        second_done = self.client.post(url, {"chapter_id": self.chapter_2.id, "completed": True}, format="json")
        progress.refresh_from_db()
        self.assertEqual(second_done.status_code, status.HTTP_200_OK)
        self.assertEqual(ReadingProgress.objects.filter(user=self.user, book=self.book).count(), 1)
        self.assertEqual(progress.progress_percent, 100)
        self.assertTrue(progress.completed)

    def test_completed_chapter_only_awards_xp_once(self):
        self.client.force_authenticate(user=self.user)
        url = reverse("book-progress", kwargs={"slug": self.book.slug})

        first = self.client.post(
            url,
            {"chapter_id": self.chapter_1.id, "percent": 100, "completed": True},
            format="json",
        )
        second = self.client.post(
            url,
            {"chapter_id": self.chapter_1.id, "percent": 100, "completed": True},
            format="json",
        )

        self.assertEqual(first.status_code, status.HTTP_200_OK)
        self.assertEqual(second.status_code, status.HTTP_200_OK)
        self.assertEqual(first.data["xp_awarded"], 10)
        self.assertEqual(second.data["xp_awarded"], 0)
        self.user.refresh_from_db()
        self.assertEqual(self.user.xp, 10)
