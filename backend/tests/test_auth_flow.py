"""End-to-end checks of the JWT auth contract the React frontend relies on."""
import pytest
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.core.cache import cache
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework.throttling import SimpleRateThrottle

User = get_user_model()
PASSWORD = "StrongPassword123!"


@pytest.fixture(autouse=True)
def _fresh_throttle_cache():
    # Throttle counters live in the (process-wide) cache; isolate every test from the shared per-IP buckets.
    cache.clear()
    yield
    cache.clear()


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def user(db):
    return User.objects.create_user(email="flow@example.com", username="flow-user", full_name="Flow User", password=PASSWORD)


@pytest.fixture
def authed(client, user):
    login = client.post("/api/v1/auth/login/", {"email": user.email, "password": PASSWORD}, format="json")
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['access']}")
    return client, login.data


def register_payload(**overrides):
    payload = {
        "email": "new@example.com",
        "username": "new-user",
        "full_name": "New User",
        "password": PASSWORD,
        "password2": PASSWORD,
    }
    payload.update(overrides)
    return payload


@pytest.mark.django_db
class TestRegister:
    def test_success_returns_user_and_tokens(self, client):
        res = client.post("/api/v1/auth/register/", register_payload(), format="json")
        assert res.status_code == status.HTTP_201_CREATED
        assert res.data["access"] and res.data["refresh"]
        assert res.data["user"]["email"] == "new@example.com"
        assert "password" not in res.data["user"]

    def test_duplicate_email_is_case_insensitive(self, client, user):
        res = client.post("/api/v1/auth/register/", register_payload(email=user.email.upper()), format="json")
        assert res.status_code == status.HTTP_400_BAD_REQUEST
        assert "email" in res.data["error"]["fields"]

    def test_duplicate_username(self, client, user):
        res = client.post("/api/v1/auth/register/", register_payload(username=user.username), format="json")
        assert res.status_code == status.HTTP_400_BAD_REQUEST
        assert "username" in res.data["error"]["fields"]

    def test_password_mismatch(self, client):
        res = client.post("/api/v1/auth/register/", register_payload(password2="Different123!"), format="json")
        assert res.status_code == status.HTTP_400_BAD_REQUEST
        assert "password2" in res.data["error"]["fields"]

    def test_weak_password_rejected(self, client):
        res = client.post("/api/v1/auth/register/", register_payload(password="12345678", password2="12345678"), format="json")
        assert res.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestLogin:
    def test_success(self, client, user):
        res = client.post("/api/v1/auth/login/", {"email": user.email, "password": PASSWORD}, format="json")
        assert res.status_code == status.HTTP_200_OK
        assert res.data["user"]["username"] == user.username

    def test_email_is_case_insensitive(self, client, user):
        res = client.post("/api/v1/auth/login/", {"email": user.email.upper(), "password": PASSWORD}, format="json")
        assert res.status_code == status.HTTP_200_OK

    def test_bad_password_gives_string_message(self, client, user):
        res = client.post("/api/v1/auth/login/", {"email": user.email, "password": "nope-nope-nope"}, format="json")
        assert res.status_code in (status.HTTP_400_BAD_REQUEST, status.HTTP_401_UNAUTHORIZED)
        assert isinstance(res.data["error"]["message"], str)
        assert "Invalid email or password" in res.data["error"]["message"]

    def test_inactive_user_cannot_log_in(self, client, user):
        user.is_active = False
        user.save(update_fields=["is_active"])
        res = client.post("/api/v1/auth/login/", {"email": user.email, "password": PASSWORD}, format="json")
        assert res.status_code in (status.HTTP_400_BAD_REQUEST, status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)
        assert "access" not in res.data


@pytest.mark.django_db
class TestSession:
    def test_protected_endpoint_requires_token(self, client):
        assert client.get("/api/v1/auth/me/").status_code == status.HTTP_401_UNAUTHORIZED
        assert client.get("/api/v1/notifications/").status_code == status.HTTP_401_UNAUTHORIZED

    def test_garbage_token_rejected(self, client):
        client.credentials(HTTP_AUTHORIZATION="Bearer not-a-token")
        assert client.get("/api/v1/auth/me/").status_code == status.HTTP_401_UNAUTHORIZED

    def test_me_returns_current_user(self, authed, user):
        client, _ = authed
        res = client.get("/api/v1/auth/me/")
        assert res.status_code == status.HTTP_200_OK
        assert res.data["email"] == user.email

    def test_refresh_rotates_and_blacklists_old_token(self, client, user):
        login = client.post("/api/v1/auth/login/", {"email": user.email, "password": PASSWORD}, format="json")
        first = client.post("/api/v1/auth/refresh/", {"refresh": login.data["refresh"]}, format="json")
        assert first.status_code == status.HTTP_200_OK
        reuse = client.post("/api/v1/auth/refresh/", {"refresh": login.data["refresh"]}, format="json")
        assert reuse.status_code == status.HTTP_401_UNAUTHORIZED

    def test_logout_invalidates_refresh_token(self, authed):
        client, tokens = authed
        out = client.post("/api/v1/auth/logout/", {"refresh": tokens["refresh"]}, format="json")
        assert out.status_code == status.HTTP_200_OK
        again = client.post("/api/v1/auth/refresh/", {"refresh": tokens["refresh"]}, format="json")
        assert again.status_code == status.HTTP_401_UNAUTHORIZED

    def test_deactivated_user_token_stops_working(self, authed, user):
        client, _ = authed
        user.is_active = False
        user.save(update_fields=["is_active"])
        assert client.get("/api/v1/auth/me/").status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestPrivilegeEscalation:
    @pytest.mark.parametrize(
        "field,value",
        [("xp", 999999), ("level", 99), ("streak_days", 365), ("is_verified", True)],
    )
    def test_me_patch_cannot_change_gamification_or_verification(self, authed, user, field, value):
        client, _ = authed
        user.refresh_from_db()  # logging in legitimately awards daily XP/streak, so baseline after login
        before = getattr(user, field)
        client.patch("/api/v1/auth/me/", {field: value}, format="json")
        user.refresh_from_db()
        assert getattr(user, field) == before != value

    def test_me_patch_cannot_grant_admin_role(self, authed, user):
        client, _ = authed
        res = client.patch("/api/v1/auth/me/", {"role": "admin"}, format="json")
        user.refresh_from_db()
        assert user.role != "admin"
        assert res.status_code == status.HTTP_400_BAD_REQUEST

    def test_me_patch_can_pick_builder_role_and_edit_profile(self, authed, user):
        client, _ = authed
        res = client.patch("/api/v1/auth/me/", {"role": "builder", "bio": "Hello"}, format="json")
        assert res.status_code == status.HTTP_200_OK
        user.refresh_from_db()
        assert (user.role, user.bio) == ("builder", "Hello")

    def test_onboarding_cannot_grant_admin_role(self, authed, user):
        client, _ = authed
        res = client.post("/api/v1/auth/onboarding/", {"role": "admin"}, format="json")
        user.refresh_from_db()
        assert user.role != "admin"
        assert res.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.parametrize("role", ["learner", "builder", "mentor"])
    def test_onboarding_accepts_public_roles(self, authed, user, role):
        client, _ = authed
        res = client.post("/api/v1/auth/onboarding/", {"role": role, "skills": ["Python"]}, format="json")
        assert res.status_code == status.HTTP_200_OK
        user.refresh_from_db()
        assert user.role == role and user.onboarding_completed

    def test_onboarding_flag_is_exposed_and_only_the_onboarding_endpoint_sets_it(self, authed, user):
        # The frontend routes on this flag after login; if it is missing every login is sent to /onboarding.
        client, tokens = authed
        assert client.get("/api/v1/auth/me/").data["onboarding_completed"] is False
        client.patch("/api/v1/auth/me/", {"onboarding_completed": True}, format="json")
        assert client.get("/api/v1/auth/me/").data["onboarding_completed"] is False
        client.post("/api/v1/auth/onboarding/", {"role": "builder"}, format="json")
        assert client.get("/api/v1/auth/me/").data["onboarding_completed"] is True
        relogin = APIClient().post("/api/v1/auth/login/", {"email": user.email, "password": PASSWORD}, format="json")
        assert relogin.data["user"]["onboarding_completed"] is True

    def test_me_exposes_is_staff_read_only(self, authed, user):
        client, _ = authed
        assert client.get("/api/v1/auth/me/").data["is_staff"] is False
        client.patch("/api/v1/auth/me/", {"is_staff": True}, format="json")
        user.refresh_from_db()
        assert user.is_staff is False


@pytest.mark.django_db
class TestPrivateFieldsStayPrivate:
    @staticmethod
    def _items(data):
        return data if isinstance(data, list) else data.get("results", data)

    def test_anonymous_list_and_detail_hide_email_and_staff_flag(self, client, user):
        listed = self._items(client.get("/api/v1/users/").data)
        assert listed and all("email" not in item and "is_staff" not in item for item in listed)
        detail = client.get(f"/api/v1/users/{user.username}/").data
        assert "email" not in detail and "is_staff" not in detail

    def test_other_authenticated_user_cannot_see_email(self, authed, django_user_model):
        other = django_user_model.objects.create_user(email="other@example.com", username="other-user", full_name="Other", password=PASSWORD)
        client, _ = authed
        detail = client.get(f"/api/v1/users/{other.username}/").data
        assert "email" not in detail

    def test_user_still_sees_own_email(self, authed, user):
        client, _ = authed
        assert client.get("/api/v1/auth/me/").data["email"] == user.email

    def test_staff_sees_email_in_admin_list(self, client, django_user_model, user):
        staff = django_user_model.objects.create_user(email="staff@example.com", username="staff-user", full_name="Staff", password=PASSWORD, is_staff=True)
        client.force_authenticate(staff)
        res = client.get("/api/v1/admin/users/")
        assert res.status_code == status.HTTP_200_OK
        rows = self._items(res.data)
        assert any(row.get("email") == user.email for row in rows)


@pytest.mark.django_db
class TestPasswordReset:
    def test_forgot_is_uniform_for_known_and_unknown_email(self, client, user):
        known = client.post("/api/v1/auth/password/forgot/", {"email": user.email}, format="json")
        unknown = client.post("/api/v1/auth/password/forgot/", {"email": "ghost@example.com"}, format="json")
        assert known.status_code == unknown.status_code == status.HTTP_200_OK
        assert known.data["detail"] == unknown.data["detail"]

    def test_forgot_sends_email_with_frontend_link(self, client, user, mailoutbox):
        client.post("/api/v1/auth/password/forgot/", {"email": user.email}, format="json")
        assert len(mailoutbox) == 1
        message = mailoutbox[0]
        assert message.to == [user.email]
        assert "/reset-password/" in message.body and "email=" in message.body

    def test_forgot_sends_nothing_for_unknown_email(self, client, mailoutbox):
        client.post("/api/v1/auth/password/forgot/", {"email": "ghost@example.com"}, format="json")
        assert mailoutbox == []

    def test_full_reset_flow(self, client, user):
        token = PasswordResetTokenGenerator().make_token(user)
        body = {"email": user.email, "token": token, "password": "BrandNewPass456!", "password2": "BrandNewPass456!"}
        assert client.post("/api/v1/auth/password/reset/", body, format="json").status_code == status.HTTP_200_OK
        assert client.post("/api/v1/auth/login/", {"email": user.email, "password": PASSWORD}, format="json").status_code != 200
        assert client.post("/api/v1/auth/login/", {"email": user.email, "password": "BrandNewPass456!"}, format="json").status_code == 200
        # token is single-use: it stops validating once the password changed
        assert client.post("/api/v1/auth/password/reset/", body, format="json").status_code == status.HTTP_400_BAD_REQUEST

    def test_reset_with_bad_token_fails(self, client, user):
        body = {"email": user.email, "token": "bad-token", "password": "BrandNewPass456!", "password2": "BrandNewPass456!"}
        res = client.post("/api/v1/auth/password/reset/", body, format="json")
        assert res.status_code == status.HTTP_400_BAD_REQUEST
        assert "token" in res.data["error"]["fields"]


@pytest.mark.django_db
class TestUsernameAvailability:
    def test_reports_taken_and_free(self, client, user):
        taken = client.get("/api/v1/auth/username-available/", {"username": user.username.upper()})
        free = client.get("/api/v1/auth/username-available/", {"username": "totally-free"})
        assert taken.status_code == free.status_code == status.HTTP_200_OK
        assert taken.data["available"] is False
        assert free.data["available"] is True

    def test_missing_username_is_400(self, client):
        assert client.get("/api/v1/auth/username-available/").status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestThrottleScope:
    """Only credential endpoints share the strict 'auth' bucket, not every API call."""

    # DRF reads throttle rates when a throttle is instantiated, so patch them on the class
    # (override_settings can't change DEFAULT_THROTTLE_CLASSES/RATES once views are imported).
    @pytest.fixture
    def strict_auth_rate(self, monkeypatch):
        monkeypatch.setattr(SimpleRateThrottle, "THROTTLE_RATES", {"anon": "1000/min", "user": "1000/min", "auth": "3/min"})

    def test_regular_endpoints_do_not_consume_auth_bucket(self, client, strict_auth_rate):
        statuses = [client.get("/api/v1/health/").status_code for _ in range(8)]
        assert 429 not in statuses

    @pytest.mark.parametrize(
        "path,body",
        [
            ("/api/v1/auth/login/", {"email": "a@example.com", "password": "wrong-password"}),
            ("/api/v1/auth/password/forgot/", {"email": "a@example.com"}),
            ("/api/v1/auth/password/reset/", {"email": "a@example.com", "token": "x", "password": "Abcdefgh1!", "password2": "Abcdefgh1!"}),
        ],
    )
    def test_credential_endpoints_are_throttled(self, client, strict_auth_rate, path, body):
        statuses = [client.post(path, body, format="json").status_code for _ in range(5)]
        assert statuses[-1] == 429
