"""Regression checks for deployment configuration and route/schema structure."""
import os
import secrets
import subprocess
import sys

import pytest
from django.contrib.auth import get_user_model
from django.urls import resolve
from drf_spectacular.generators import SchemaGenerator
from rest_framework.test import APIClient


def production_environment(**overrides):
    return {
        **os.environ,
        "DJANGO_SETTINGS_MODULE": "colearn.settings.prod",
        "SECRET_KEY": secrets.token_urlsafe(64),
        "DEBUG": "release",  # Unrelated shell settings must not enable/break production debugging.
        "DB_NAME": "audit",
        "DB_USER": "audit",
        "DB_PASSWORD": "audit",
        "SECURE_SSL_REDIRECT": "True",
        "PYTHONDONTWRITEBYTECODE": "1",
        **overrides,
    }


def test_production_deployment_checks():
    result = subprocess.run(
        [sys.executable, "manage.py", "check", "--deploy", "--fail-level", "WARNING"],
        env=production_environment(), capture_output=True, text=True,
    )
    assert result.returncode == 0, result.stdout + result.stderr


def test_production_rejects_example_secret():
    result = subprocess.run(
        [sys.executable, "manage.py", "check"],
        env=production_environment(SECRET_KEY="django-insecure-change-me"),
        capture_output=True, text=True,
    )
    assert result.returncode != 0
    assert "Production SECRET_KEY" in result.stderr


def test_schema_lists_routes_and_preserves_array_responses():
    schema = SchemaGenerator().get_schema(public=True)
    assert "patch" not in schema["paths"]["/api/v1/admin/reports/"]
    assert "patch" in schema["paths"]["/api/v1/admin/reports/{id}/"]
    ids = []
    for methods in schema["paths"].values():
        for operation in methods.values():
            if isinstance(operation, dict) and "operationId" in operation:
                ids.append(operation["operationId"])
    assert len(ids) == len(set(ids))
    for path in ("books", "projects", "threads", "notifications", "leaderboard"):
        response = schema["paths"][f"/api/v1/{path}/"]["get"]["responses"]["200"]
        assert response["content"]["application/json"]["schema"]["type"] == "array"


@pytest.mark.django_db
def test_admin_report_list_rejects_patch_without_id():
    staff = get_user_model().objects.create_user(
        username="route-auditor", email="route-auditor@example.com", is_staff=True,
    )
    client = APIClient()
    client.force_authenticate(staff)
    response = client.patch("/api/v1/admin/reports/", {"status": "resolved"}, format="json")
    assert response.status_code == 405
    assert resolve("/api/v1/admin/reports/1/").url_name == "admin-report-detail"
