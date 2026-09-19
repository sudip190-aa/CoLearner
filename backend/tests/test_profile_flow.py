"""Profile building, settings, discovery and connections: the contract behind Onboarding, Settings, People and PublicProfile."""
import io

import pytest
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image
from rest_framework import status
from rest_framework.test import APIClient

from gamification.models import XPEvent
from notifications.models import Notification
from users.models import Connection, Skill, UserSkill

User = get_user_model()
PASSWORD = "StrongPassword123!"


@pytest.fixture(autouse=True)
def _fresh_throttle_cache():
    cache.clear()
    yield
    cache.clear()


def make_user(email, username, **extra):
    return User.objects.create_user(email=email, username=username, full_name=extra.pop("full_name", username.title()), password=PASSWORD, **extra)


def client_for(user):
    client = APIClient()
    client.force_authenticate(user)
    return client


def png_file(name="avatar.png", size=(20, 20)):
    buffer = io.BytesIO()
    Image.new("RGB", size, "blue").save(buffer, format="PNG")
    return SimpleUploadedFile(name, buffer.getvalue(), content_type="image/png")


def items(data):
    return data if isinstance(data, list) else data["results"]


@pytest.mark.django_db
class TestXpOnSignupAndOnboarding:
    def test_signup_awards_welcome_xp_once(self):
        res = APIClient().post(
            "/api/v1/auth/register/",
            {"email": "n@example.com", "username": "newbie", "full_name": "New Bie", "password": PASSWORD, "password2": PASSWORD},
            format="json",
        )
        assert res.status_code == 201
        user = User.objects.get(username="newbie")
        assert user.xp == 10
        assert XPEvent.objects.filter(user=user, reason="signup", amount=10).count() == 1

    def test_onboarding_awards_profile_xp_through_the_ledger_once(self):
        user = make_user("o@example.com", "onboarder")
        client = client_for(user)
        body = {"role": "builder", "skills": ["Python", "python", "React"], "interests": ["web"], "headline": "Builder", "bio": "Hello there", "location": "Pune"}
        first = client.post("/api/v1/auth/onboarding/", body, format="json")
        assert first.status_code == 200
        user.refresh_from_db()
        assert (user.xp, user.role, user.onboarding_completed, user.interests, user.location) == (50, "builder", True, ["web"], "Pune")
        assert XPEvent.objects.filter(user=user, reason="profile_complete").count() == 1
        assert sorted(s.skill.name for s in user.skills.select_related("skill")) == ["Python", "React"]  # 'python' did not duplicate
        client.post("/api/v1/auth/onboarding/", body, format="json")
        user.refresh_from_db()
        assert user.xp == 50  # finishing again never pays twice

    def test_case_insensitive_skill_reuse(self):
        Skill.objects.create(name="Django")
        user = make_user("s@example.com", "skiller")
        client_for(user).post("/api/v1/auth/onboarding/", {"skills": ["django"]}, format="json")
        assert Skill.objects.filter(name__iexact="django").count() == 1


@pytest.mark.django_db
class TestProfileEditing:
    def test_patch_me_accepts_snake_case_profile_fields(self):
        user = make_user("p@example.com", "profiler")
        res = client_for(user).patch(
            "/api/v1/auth/me/",
            {"full_name": "Pro Filer", "headline": "Dev", "bio": "About me", "location": "Delhi", "github": "https://github.com/x", "website": "https://x.dev"},
            format="json",
        )
        assert res.status_code == 200
        user.refresh_from_db()
        assert (user.full_name, user.headline, user.location, user.github) == ("Pro Filer", "Dev", "Delhi", "https://github.com/x")

    def test_bad_url_is_a_field_error(self):
        res = client_for(make_user("u@example.com", "urlbad")).patch("/api/v1/auth/me/", {"github": "not a url"}, format="json")
        assert res.status_code == 400 and "github" in res.data["error"]["fields"]

    def test_avatar_upload_returns_absolute_url_everywhere(self, settings, tmp_path):
        settings.MEDIA_ROOT = tmp_path
        user = make_user("a@example.com", "avataruser")
        client = client_for(user)
        res = client.patch("/api/v1/auth/me/", {"avatar": png_file()}, format="multipart")
        assert res.status_code == 200, res.data
        assert res.data["avatar"].startswith("http://testserver/media/avatars/")
        other = APIClient()
        listed = items(other.get("/api/v1/users/").data)  # would have crashed with a user object as "request"
        assert listed[0]["avatar"].startswith("http://testserver/media/avatars/")
        assert other.get("/api/v1/users/avataruser/").data["avatar"].startswith("http://testserver/")
        assert other.get("/api/v1/users/avataruser/portfolio/").status_code == 200

    def test_oversized_or_wrong_avatar_type_rejected(self, settings, tmp_path):
        settings.MEDIA_ROOT = tmp_path
        client = client_for(make_user("b@example.com", "badavatar"))
        res = client.patch("/api/v1/auth/me/", {"avatar": SimpleUploadedFile("x.gif", b"GIF89a", content_type="image/gif")}, format="multipart")
        assert res.status_code == 400


@pytest.mark.django_db
class TestSkillsSync:
    def test_put_replaces_the_skill_set(self):
        user = make_user("k@example.com", "skiller2")
        client = client_for(user)
        client.put("/api/v1/auth/me/skills/", {"skills": ["Python", {"name": "React", "level": "advanced"}]}, format="json")
        res = client.put("/api/v1/auth/me/skills/", {"skills": [{"name": "React", "level": "intermediate"}, "SQL"]}, format="json")
        assert res.status_code == 200
        assert {(s["name"], s["level"]) for s in res.data["skills"]} == {("React", "intermediate"), ("SQL", "beginner")}
        assert UserSkill.objects.filter(user=user).count() == 2

    @pytest.mark.parametrize("payload", [{"skills": [{"name": "X", "level": "godlike"}]}, {"skills": [""]}, {"skills": ["s%d" % i for i in range(51)]}])
    def test_invalid_payloads(self, payload):
        res = client_for(make_user("k2@example.com", "skiller3")).put("/api/v1/auth/me/skills/", payload, format="json")
        assert res.status_code == 400

    def test_requires_login(self):
        assert APIClient().put("/api/v1/auth/me/skills/", {"skills": []}, format="json").status_code == 401


@pytest.mark.django_db
class TestPasswordChangeAndAccountDeletion:
    def test_password_change_success_rotates_sessions(self):
        user = make_user("c@example.com", "changer")
        anon = APIClient()
        old = anon.post("/api/v1/auth/login/", {"email": user.email, "password": PASSWORD}, format="json").data
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {old['access']}")
        res = client.post("/api/v1/auth/password/change/", {"current_password": PASSWORD, "new_password": "BrandNew#Pass987", "new_password2": "BrandNew#Pass987"}, format="json")
        assert res.status_code == 200 and res.data["access"] and res.data["refresh"]
        assert anon.post("/api/v1/auth/login/", {"email": user.email, "password": PASSWORD}, format="json").status_code == 400
        assert anon.post("/api/v1/auth/login/", {"email": user.email, "password": "BrandNew#Pass987"}, format="json").status_code == 200
        assert anon.post("/api/v1/auth/refresh/", {"refresh": old["refresh"]}, format="json").status_code == 401  # other devices signed out
        assert anon.post("/api/v1/auth/refresh/", {"refresh": res.data["refresh"]}, format="json").status_code == 200  # this one is fine

    @pytest.mark.parametrize(
        "body,field",
        [
            ({"current_password": "wrong-pass-1", "new_password": "BrandNew#Pass987", "new_password2": "BrandNew#Pass987"}, "current_password"),
            ({"current_password": PASSWORD, "new_password": "BrandNew#Pass987", "new_password2": "Different#Pass1"}, "new_password2"),
        ],
    )
    def test_password_change_field_errors(self, body, field):
        res = client_for(make_user("c2@example.com", "changer2")).post("/api/v1/auth/password/change/", body, format="json")
        assert res.status_code == 400 and field in res.data["error"]["fields"]

    def test_weak_new_password_rejected(self):
        res = client_for(make_user("c3@example.com", "changer3")).post("/api/v1/auth/password/change/", {"current_password": PASSWORD, "new_password": "12345678", "new_password2": "12345678"}, format="json")
        assert res.status_code == 400

    def test_refreshing_a_deleted_users_token_is_401_not_500(self):
        user = make_user("gone@example.com", "gone-user")
        anon = APIClient()
        tokens = anon.post("/api/v1/auth/login/", {"email": user.email, "password": PASSWORD}, format="json").data
        user.delete()
        res = anon.post("/api/v1/auth/refresh/", {"refresh": tokens["refresh"]}, format="json")
        assert res.status_code == 401

    def test_delete_account_needs_the_right_password(self):
        user = make_user("d@example.com", "deleter")
        client = client_for(user)
        assert client.delete("/api/v1/auth/me/", {"password": "nope"}, format="json").status_code == 400
        assert User.objects.filter(pk=user.pk).exists()
        assert client.delete("/api/v1/auth/me/", {"password": PASSWORD}, format="json").status_code == 204
        assert not User.objects.filter(pk=user.pk).exists()
        assert APIClient().post("/api/v1/auth/login/", {"email": "d@example.com", "password": PASSWORD}, format="json").status_code == 400


@pytest.mark.django_db
class TestDiscovery:
    @pytest.fixture
    def people(self):
        me = make_user("me@example.com", "me-user")
        a = make_user("a1@example.com", "anna", role="mentor", location="Pune, India", headline="Backend mentor", availability="mentoring", xp=300)
        b = make_user("b1@example.com", "bob", role="learner", location="Delhi, India", xp=100)
        gone = make_user("g1@example.com", "ghost", is_active=False)
        for user, names in ((me, ["Python", "React"]), (a, ["Python", "React", "Django"]), (b, ["Python"]), (gone, ["Python"])):
            for name in names:
                UserSkill.objects.create(user=user, skill=Skill.objects.get_or_create(name=name)[0])
        return me, a, b, gone

    def usernames(self, client, **params):
        return [u["username"] for u in items(client.get("/api/v1/users/", params).data)]

    def test_deactivated_users_are_hidden_everywhere(self, people):
        me, _, _, gone = people
        client = client_for(me)
        assert "ghost" not in self.usernames(client)
        assert client.get("/api/v1/users/ghost/").status_code == 404
        assert client.get("/api/v1/users/ghost/portfolio/").status_code == 404
        assert "ghost" not in [u["username"] for u in client.get("/api/v1/users/suggested/").data]

    def test_own_profile_is_not_listed(self, people):
        assert "me-user" not in self.usernames(client_for(people[0]))

    def test_filters(self, people):
        client = client_for(people[0])
        assert self.usernames(client, role="mentor") == ["anna"]
        assert self.usernames(client, location="delhi") == ["bob"]
        assert self.usernames(client, availability="mentoring") == ["anna"]
        assert self.usernames(client, search="backend") == ["anna"]

    def test_multiple_skills_mean_all_of_them_case_insensitively(self, people):
        client = client_for(people[0])
        assert self.usernames(client, skills=["python", "DJANGO"]) == ["anna"]
        assert sorted(self.usernames(client, skills=["Python"])) == ["anna", "bob"]

    def test_ordering(self, people):
        client = client_for(people[0])
        assert self.usernames(client, ordering="xp") == ["anna", "bob"]
        assert self.usernames(client, ordering="best_match") == ["anna", "bob"]  # anna shares 2 skills, bob 1
        listed = items(client.get("/api/v1/users/", {"ordering": "best_match"}).data)
        assert (listed[0]["mutual_skills_count"], listed[0]["shared_skills"]) == (2, ["Python", "React"])

    def test_anonymous_can_browse_without_private_fields(self, people):
        data = items(APIClient().get("/api/v1/users/").data)
        assert data and all("email" not in u and u["connection_status"] == "none" for u in data)


@pytest.mark.django_db
class TestConnections:
    def test_request_accept_and_notifications(self):
        a, b = make_user("ca@example.com", "conn-a"), make_user("cb@example.com", "conn-b")
        ca, cb = client_for(a), client_for(b)
        first = ca.post("/api/v1/users/conn-b/connect/", {"action": "connect"}, format="json")
        assert first.status_code == 201 and first.data["connection_status"] == "pending_sent"
        assert Notification.objects.filter(user=b, actor=a, verb="connection_request").count() == 1
        assert cb.get("/api/v1/users/conn-a/").data["connection_status"] == "pending_received"
        assert items(ca.get("/api/v1/users/").data)[0]["connection_status"] == "pending_sent"

        # the requester cannot accept their own request
        assert ca.post("/api/v1/users/conn-b/connect/", {"action": "accept"}, format="json").data["connection_status"] == "pending_sent"
        accepted = cb.post("/api/v1/users/conn-a/connect/", {"action": "accept"}, format="json")
        assert accepted.data["connection_status"] == "accepted"
        assert Notification.objects.filter(user=a, actor=b, verb="connection_accepted").count() == 1
        assert ca.get("/api/v1/users/conn-b/").data["connection_status"] == "accepted"

        removed = ca.post("/api/v1/users/conn-b/connect/", {"action": "cancel"}, format="json")
        assert removed.data["connection_status"] == "none" and Connection.objects.count() == 0

    def test_repeat_connect_does_not_duplicate_or_renotify(self):
        a, b = make_user("ra@example.com", "rep-a"), make_user("rb@example.com", "rep-b")
        ca = client_for(a)
        ca.post("/api/v1/users/rep-b/connect/", {"action": "connect"}, format="json")
        ca.post("/api/v1/users/rep-b/connect/", {"action": "connect"}, format="json")
        assert Connection.objects.count() == 1
        assert Notification.objects.filter(user=b, verb="connection_request").count() == 1

    def test_guards(self):
        a = make_user("ga@example.com", "guard-a")
        make_user("gb@example.com", "guard-b")
        client = client_for(a)
        assert client.post("/api/v1/users/guard-a/connect/", {"action": "connect"}, format="json").status_code == 400
        assert client.post("/api/v1/users/guard-b/connect/", {"action": "accept"}, format="json").status_code == 400
        assert client.post("/api/v1/users/nobody/connect/", {"action": "connect"}, format="json").status_code == 404
        assert APIClient().post("/api/v1/users/guard-b/connect/", {"action": "connect"}, format="json").status_code == 401


@pytest.mark.django_db
class TestErrorEnvelope:
    def test_404_has_a_stable_code_and_does_not_leak_model_names(self):
        for path in ("/api/v1/users/nobody/", "/api/v1/users/nobody/portfolio/"):
            res = APIClient().get(path)
            assert res.status_code == 404
            assert res.data["error"]["code"] == "not_found"
            assert res.data["error"]["message"] == "Not found."
            assert "CustomUser" not in str(res.data)


@pytest.mark.django_db
class TestPortfolio:
    def test_portfolio_shape_for_a_real_user(self):
        user = make_user("pf@example.com", "portfolio-user", xp=120)
        UserSkill.objects.create(user=user, skill=Skill.objects.create(name="Go"), level="advanced")
        data = APIClient().get("/api/v1/users/portfolio-user/portfolio/").data
        assert set(data) == {"profile", "skills", "projects", "badges", "books", "heatmap", "stats"}
        assert data["profile"]["username"] == "portfolio-user" and "email" not in data["profile"]
        assert data["skills"][0]["name"] == "Go" and len(data["heatmap"]) == 12
