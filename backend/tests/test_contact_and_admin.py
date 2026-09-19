import pytest
from django.apps import apps
from django.contrib import admin
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import RequestFactory
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework.throttling import SimpleRateThrottle

from core.models import ContactMessage

User = get_user_model()
VALID = {"name": "Maya Chen", "email": "maya@example.com", "subject": "Hello", "message": "I would like to know more."}


@pytest.fixture(autouse=True)
def _fresh_throttle_cache():
    cache.clear()
    yield
    cache.clear()


@pytest.mark.django_db
class TestContactEndpoint:
    def test_anonymous_submission_is_stored(self):
        res = APIClient().post("/api/v1/contact/", VALID, format="json")
        assert res.status_code == status.HTTP_201_CREATED
        stored = ContactMessage.objects.get()
        assert (stored.name, stored.email, stored.is_resolved) == ("Maya Chen", "maya@example.com", False)

    @pytest.mark.parametrize(
        "field,value",
        [("email", "not-an-email"), ("message", "too short"), ("name", "   "), ("subject", ""), ("message", "x" * 5001)],
    )
    def test_invalid_input_is_rejected_with_field_error(self, field, value):
        res = APIClient().post("/api/v1/contact/", {**VALID, field: value}, format="json")
        assert res.status_code == status.HTTP_400_BAD_REQUEST
        assert field in res.data["error"]["fields"]
        assert ContactMessage.objects.count() == 0

    def test_missing_fields_are_rejected(self):
        res = APIClient().post("/api/v1/contact/", {}, format="json")
        assert res.status_code == status.HTTP_400_BAD_REQUEST
        assert set(res.data["error"]["fields"]) == {"name", "email", "subject", "message"}

    def test_form_is_rate_limited_per_ip(self, monkeypatch):
        monkeypatch.setattr(SimpleRateThrottle, "THROTTLE_RATES", {"anon": "1000/min", "user": "1000/min", "auth": "30/min", "contact": "2/min"})
        statuses = [APIClient().post("/api/v1/contact/", VALID, format="json").status_code for _ in range(4)]
        assert statuses == [201, 201, 429, 429]


@pytest.mark.django_db
class TestAdminSiteRenders:
    """Every registered model's admin pages must render (no 500 / TemplateDoesNotExist / broken field config)."""

    @pytest.fixture
    def superuser(self, client):
        user = User.objects.create_superuser(email="root@example.com", username="root", password="StrongPassword123!", full_name="Root")
        client.force_login(user)
        return user

    def test_login_page_and_index(self, client, superuser):
        anonymous = client.__class__()
        assert anonymous.get("/admin/login/").status_code == 200
        assert anonymous.get("/admin/").status_code == 302  # sends visitors to the login page
        assert client.get("/admin/").status_code == 200

    def test_non_staff_user_is_kept_out(self, client, django_user_model):
        user = django_user_model.objects.create_user(email="plain@example.com", username="plain", password="StrongPassword123!")
        client.force_login(user)
        assert client.get("/admin/").status_code == 302

    def test_every_model_changelist_and_add_page(self, client, superuser):
        failures = []
        request = RequestFactory().get("/")
        request.user = superuser
        for model, model_admin in admin.site._registry.items():
            opts = model._meta
            for name in ("changelist", "add"):
                # Some admins are read-only on purpose (e.g. SimpleJWT's token tables); a 403 there is correct.
                if name == "add" and not model_admin.has_add_permission(request):
                    continue
                url = reverse(f"admin:{opts.app_label}_{opts.model_name}_{name}")
                response = client.get(url)
                if response.status_code != 200:
                    failures.append(f"{url} -> {response.status_code}")
        assert not failures, failures

    def test_every_registered_model_has_seed_row_that_opens(self, client, superuser):
        """Open the change form of one real row per model to catch bad list/fieldset/raw_id configuration."""
        from django.core.management import call_command

        call_command("seed_demo")
        failures = []
        for model in admin.site._registry:
            obj = model.objects.first()
            if obj is None:
                continue
            opts = model._meta
            url = reverse(f"admin:{opts.app_label}_{opts.model_name}_change", args=[obj.pk])
            response = client.get(url)
            if response.status_code != 200:
                failures.append(f"{url} -> {response.status_code}")
        assert not failures, failures
