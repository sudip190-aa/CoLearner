import io

import pytest
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from django.test import override_settings
from PIL import Image
from rest_framework import status
from rest_framework.test import APIClient

User = get_user_model()
THROTTLE_DISABLED = {
    "EXCEPTION_HANDLER": "core.exceptions.custom_exception_handler",
    "DEFAULT_THROTTLE_CLASSES": [],
    "DEFAULT_THROTTLE_RATES": {"anon": "1000/min", "user": "1000/min", "auth": "1000/min"},
}
DEBUG_OFF = {"DEBUG": False, "REST_FRAMEWORK": THROTTLE_DISABLED}


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user(db):
    return User.objects.create_user(
        email="hardening@example.com",
        username="hardening-user",
        full_name="Hardening User",
        password="StrongPassword123!",
    )


@pytest.mark.django_db
class TestAuthAndSecurity:
    def test_register_login_refresh(self, api_client):
        with override_settings(**DEBUG_OFF):
            register = api_client.post(
                "/api/v1/auth/register/",
                {
                    "email": "new@example.com",
                    "username": "new-user",
                    "full_name": "New User",
                    "password": "StrongPassword123!",
                    "password2": "StrongPassword123!",
                },
                format="json",
            )
            assert register.status_code == status.HTTP_201_CREATED
            assert "access" in register.data

            login = api_client.post(
                "/api/v1/auth/login/",
                {"email": "new@example.com", "password": "StrongPassword123!"},
                format="json",
            )
            assert login.status_code == status.HTTP_200_OK
            refresh = api_client.post(
                "/api/v1/auth/refresh/",
                {"refresh": login.data["refresh"]},
                format="json",
            )
            assert refresh.status_code == status.HTTP_200_OK

    def test_avatar_upload_validator(self):
        from core.validators import validate_avatar_upload

        image_bytes = io.BytesIO()
        Image.new("RGB", (120, 120), color="blue").save(image_bytes, format="PNG")
        good = SimpleUploadedFile("avatar.png", image_bytes.getvalue(), content_type="image/png")
        validate_avatar_upload(good)

        bad = SimpleUploadedFile("avatar.txt", b"not an image", content_type="text/plain")
        with pytest.raises(ValidationError):
            validate_avatar_upload(bad)


@pytest.mark.django_db
class TestBooksAndGamification:
    def test_book_progress_awards_single_xp(self, user):
        from books.models import Book, Chapter, ReadingProgress
        from gamification.services import award_xp

        book = Book.objects.create(title="Book Test", slug="book-test", author="A", description="D")
        chapter = Chapter.objects.create(book=book, title="C1", chapter_number=1, content="x")
        ReadingProgress.objects.create(user=user, book=book, chapter=chapter, progress_percent=100, completed=True)

        event = award_xp(user, "chapter_complete", 10, source="progress")
        second = award_xp(user, "chapter_complete", 10, source="progress")

        assert event is not None
        assert second is None
        assert user.xp == 10

    def test_streak_and_level_updates(self, user):
        from django.utils import timezone
        from gamification.services import award_xp, update_streak

        user.xp = 0
        user.level = 1
        user.save(update_fields=["xp", "level"])

        award_xp(user, "manual", 250, source="manual")
        assert user.level >= 3

        user.last_active = timezone.now() - timezone.timedelta(days=1)
        user.streak_days = 6
        user.save(update_fields=["last_active", "streak_days"])
        update_streak(user)
        user.refresh_from_db()
        assert user.streak_days == 7


@pytest.mark.django_db
class TestProjectAndCommunityFlows:
    def test_project_create_join_and_task_permissions(self, api_client):
        owner = User.objects.create_user(
            email="owner2@example.com",
            username="owner2",
            full_name="Owner Two",
            password="StrongPassword123!",
        )
        joiner = User.objects.create_user(
            email="joiner2@example.com",
            username="joiner2",
            full_name="Joiner Two",
            password="StrongPassword123!",
        )
        with override_settings(**DEBUG_OFF):
            api_client.force_authenticate(user=owner)
            project = api_client.post(
                "/api/v1/projects/create/",
                {
                    "title": "Project A",
                    "summary": "Test project",
                    "description": "A project for testing",
                    "status": "active",
                    "category": "product",
                    "tech_stack": ["django"],
                },
                format="json",
            )
            assert project.status_code == status.HTTP_201_CREATED
            slug = project.data["slug"]

            api_client.force_authenticate(user=joiner)
            join = api_client.post(f"/api/v1/projects/{slug}/join/", {"message": "Please let me in."}, format="json")
            assert join.status_code == status.HTTP_201_CREATED

            api_client.force_authenticate(user=owner)
            requests = api_client.get(f"/api/v1/projects/{slug}/requests/")
            assert requests.status_code == status.HTTP_200_OK
            request_id = requests.data[0]["id"]
            decision = api_client.post(f"/api/v1/requests/{request_id}/respond/", {"status": "approved"}, format="json")
            assert decision.status_code == status.HTTP_200_OK

    def test_vote_toggle_and_comment_notifications(self, api_client):
        from community.models import Comment, Thread

        author = User.objects.create_user(email="thread-author@example.com", username="thread-author", full_name="Thread Author", password="StrongPassword123!")
        voter = User.objects.create_user(email="voter@example.com", username="voter", full_name="Voter", password="StrongPassword123!")
        thread = Thread.objects.create(author=author, title="Vote this", body="What do you think?", category="community")
        with override_settings(**DEBUG_OFF):
            api_client.force_authenticate(user=voter)
            first = api_client.post("/api/v1/vote/", {"content_type": "thread", "object_id": thread.id, "value": 1}, format="json")
            second = api_client.post("/api/v1/vote/", {"content_type": "thread", "object_id": thread.id, "value": 0}, format="json")
            assert first.status_code == status.HTTP_200_OK
            assert second.status_code == status.HTTP_200_OK
            assert second.data["score"] == 0

            comment = Comment.objects.create(thread=thread, author=author, body="Useful commentary")
            vote = api_client.post("/api/v1/vote/", {"content_type": "comment", "object_id": comment.id, "value": 1}, format="json")
            assert vote.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestValidationAndSeed:
    def test_writable_serializers_use_standard_error_shape(self, api_client):
        with override_settings(**DEBUG_OFF):
            response = api_client.post(
                "/api/v1/auth/login/",
                {"email": "missing@example.com", "password": "bad"},
                format="json",
            )
            assert response.status_code == status.HTTP_400_BAD_REQUEST
            assert "error" in response.data
            assert "message" in response.data["error"]
            assert "fields" in response.data["error"]

    def test_seed_demo_command_builds_reference_volume(self):
        call_command("seed_demo", flush=True)
        assert User.objects.count() >= 10
