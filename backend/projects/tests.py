from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from notifications.models import Notification
from projects.models import JoinRequest, Project, ProjectMember, Task

User = get_user_model()


class ProjectAPITests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            email="owner@example.com",
            username="owner",
            full_name="Project Owner",
            password="StrongPassword123!",
        )
        self.joiner = User.objects.create_user(
            email="joiner@example.com",
            username="joiner",
            full_name="Project Joiner",
            password="StrongPassword123!",
        )
        self.project = Project.objects.create(
            owner=self.owner,
            title="Colearn Builder Tool",
            summary="Build something helpful.",
            description="A useful cohort product.",
            status="active",
            max_members=2,
            category="product",
            tech_stack=["django", "react"],
        )
        ProjectMember.objects.create(project=self.project, user=self.owner, role="owner")

    def test_full_join_flow(self):
        self.client.force_authenticate(user=self.joiner)
        join_response = self.client.post(
            reverse("project-join", kwargs={"slug": self.project.slug}),
            {"message": "I would love to join."},
            format="json",
        )

        self.assertEqual(join_response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(JoinRequest.objects.filter(project=self.project, user=self.joiner).exists())

        self.client.force_authenticate(user=self.owner)
        requests_response = self.client.get(reverse("project-requests", kwargs={"slug": self.project.slug}))
        self.assertEqual(requests_response.status_code, status.HTTP_200_OK)

        request_id = JoinRequest.objects.get(project=self.project, user=self.joiner).id
        accept_response = self.client.post(
            reverse("request-respond", kwargs={"id": request_id}),
            {"status": "approved"},
            format="json",
        )

        self.assertEqual(accept_response.status_code, status.HTTP_200_OK)
        self.assertTrue(ProjectMember.objects.filter(project=self.project, user=self.joiner).exists())
        self.joiner.refresh_from_db()
        self.assertEqual(self.joiner.xp, 40)
        self.assertTrue(Notification.objects.filter(user=self.joiner).exists())

    def test_non_member_blocked_from_tasks(self):
        self.client.force_authenticate(user=self.joiner)
        response = self.client.post(
            reverse("project-task-list", kwargs={"slug": self.project.slug}),
            {"title": "New task", "description": "Do the work", "status": "todo", "priority": "high"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_task_done_xp_awarded_once(self):
        member = User.objects.create_user(
            email="member@example.com",
            username="member",
            full_name="Task Member",
            password="StrongPassword123!",
        )
        ProjectMember.objects.create(project=self.project, user=member, role="member")
        task = Task.objects.create(project=self.project, assignee=member, title="Write docs", status="todo", priority="high")

        self.client.force_authenticate(user=member)
        first = self.client.patch(reverse("task-detail", kwargs={"id": task.id}), {"status": "done"}, format="json")
        second = self.client.patch(reverse("task-detail", kwargs={"id": task.id}), {"status": "done"}, format="json")

        self.assertEqual(first.status_code, status.HTTP_200_OK)
        self.assertEqual(second.status_code, status.HTTP_200_OK)
        self.assertEqual(first.data["xp_awarded"], 15)
        self.assertEqual(second.data["xp_awarded"], 0)
        member.refresh_from_db()
        self.assertEqual(member.xp, 15)
