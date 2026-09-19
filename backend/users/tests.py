from datetime import timedelta

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class AuthAPITests(APITestCase):
    def setUp(self):
        self.register_url = reverse("auth-register")
        self.login_url = reverse("auth-login")
        self.refresh_url = reverse("auth-refresh")

    def test_register_returns_tokens_and_user(self):
        payload = {
            "email": "newuser@example.com",
            "username": "newuser",
            "full_name": "New User",
            "password": "StrongPassword123!",
            "password2": "StrongPassword123!",
        }

        response = self.client.post(self.register_url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertIn("user", response.data)
        self.assertTrue(User.objects.filter(email="newuser@example.com").exists())

    def test_login_wrong_password_returns_error(self):
        user = User.objects.create_user(
            email="login@example.com",
            username="loginuser",
            full_name="Login User",
            password="StrongPassword123!",
        )

        response = self.client.post(
            self.login_url,
            {"email": "login@example.com", "password": "wrong-password"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    def test_refresh_rotates_refresh_token(self):
        user = User.objects.create_user(
            email="refresh@example.com",
            username="refreshuser",
            full_name="Refresh User",
            password="StrongPassword123!",
        )

        login_response = self.client.post(
            self.login_url,
            {"email": "refresh@example.com", "password": "StrongPassword123!"},
            format="json",
        )
        refresh_token = login_response.data["refresh"]

        response = self.client.post(
            self.refresh_url,
            {"refresh": refresh_token},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_login_increments_streak_when_last_active_was_yesterday(self):
        user = User.objects.create_user(
            email="streak@example.com",
            username="streakuser",
            full_name="Streak User",
            password="StrongPassword123!",
            last_active=timezone.now() - timedelta(days=1),
            streak_days=1,
        )

        response = self.client.post(
            self.login_url,
            {"email": "streak@example.com", "password": "StrongPassword123!"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        self.assertEqual(user.streak_days, 2)

    def test_user_list_supports_best_match_and_filtering(self):
        current = User.objects.create_user(
            email="current@example.com",
            username="current-user",
            full_name="Current User",
            password="StrongPassword123!",
            role="builder",
        )
        user_a = User.objects.create_user(
            email="alpha@example.com",
            username="alpha-user",
            full_name="Alpha User",
            password="StrongPassword123!",
            role="builder",
        )
        user_b = User.objects.create_user(
            email="beta@example.com",
            username="beta-user",
            full_name="Beta User",
            password="StrongPassword123!",
            role="mentor",
        )

        from users.models import Skill, UserSkill

        python = Skill.objects.create(name="Python", slug="python", category="Backend")
        django = Skill.objects.create(name="Django", slug="django", category="Backend")
        react = Skill.objects.create(name="React", slug="react", category="Frontend")

        UserSkill.objects.create(user=current, skill=python, level="advanced")
        UserSkill.objects.create(user=current, skill=django, level="advanced")
        UserSkill.objects.create(user=current, skill=react, level="beginner")

        UserSkill.objects.create(user=user_a, skill=python, level="advanced")
        UserSkill.objects.create(user=user_a, skill=django, level="advanced")
        UserSkill.objects.create(user=user_b, skill=python, level="beginner")

        self.client.force_authenticate(current)
        response = self.client.get("/api/v1/users/?ordering=best_match&role=builder")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]["username"], "alpha-user")
        self.assertGreaterEqual(response.data[0]["mutual_skills_count"], 2)

    def test_search_groups_results_by_type(self):
        from books.models import Book
        from community.models import Thread
        from projects.models import Project

        user = User.objects.create_user(
            email="search@example.com",
            username="searchuser",
            full_name="Search User",
            password="StrongPassword123!",
        )
        book = Book.objects.create(title="Python for Builders", slug="python-for-builders", author="Test Author", description="Searchable book")
        project = Project.objects.create(owner=user, title="Searchable Project", slug="searchable-project", summary="Project for search")
        Thread.objects.create(author=user, title="Searchable Thread", slug="searchable-thread", body="Thread body")

        response = self.client.get("/api/v1/search/?q=search")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("type_counts", response.data)
        self.assertGreater(response.data["type_counts"]["books"], 0)
        self.assertGreater(response.data["type_counts"]["projects"], 0)
        self.assertGreater(response.data["type_counts"]["threads"], 0)

    def test_seed_demo_command_builds_reference_volume(self):
        from django.core.management import call_command

        call_command("seed_demo", flush=True)

        self.assertEqual(User.objects.count(), 14)
        self.assertEqual(User.objects.filter(email__in=["demo@colearn.dev", "admin@colearn.dev"]).count(), 2)
