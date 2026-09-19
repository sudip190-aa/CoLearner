"""Gamification (XP, streaks, badges, leaderboard) and notifications."""
import importlib
from datetime import timedelta

import pytest
from django.apps import apps
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.utils import timezone
from rest_framework.test import APIClient

from community.models import Comment, Thread
from gamification.models import Badge, UserBadge, XPEvent
from gamification.services import BADGE_THRESHOLDS, award_xp, check_badges, update_streak
from notifications.models import Notification
from notifications.services import create_notification
from projects.models import Project, ProjectMember

User = get_user_model()
PASSWORD = "StrongPassword123!"


@pytest.fixture(autouse=True)
def _fresh_throttle_cache():
    cache.clear()
    yield
    cache.clear()


def make_user(username, **extra):
    return User.objects.create_user(email=f"{username}@example.com", username=username, full_name=username.title(), password=PASSWORD, **extra)


def client_for(user=None):
    client = APIClient()
    if user:
        client.force_authenticate(user)
    return client


def load_default_badges():
    migration = importlib.import_module("gamification.migrations.0002_default_badges")
    migration.add_default_badges(apps, None)
    return migration.DEFAULT_BADGES


def make_project(owner, title="Open Path"):
    project = Project.objects.create(owner=owner, title=title, summary="s", description="d", category="Education")
    ProjectMember.objects.create(project=project, user=owner, role="owner")
    return project


@pytest.mark.django_db
class TestDefaultBadges:
    def test_migration_ships_a_badge_for_every_rule_and_is_repeatable(self):
        defaults = load_default_badges()
        load_default_badges()  # running it twice must not duplicate anything
        assert Badge.objects.count() == len(defaults)
        assert {badge.criteria_key for badge in Badge.objects.all()} == set(BADGE_THRESHOLDS)
        assert all(badge.description and badge.icon for badge in Badge.objects.all())

    def test_a_fresh_database_can_award_badges(self):
        load_default_badges()
        user = make_user("fresh")
        Thread.objects.create(author=user, title="Hello", body="World", category="community")
        check_badges(user)
        assert UserBadge.objects.filter(user=user, badge__criteria_key="first_thread").exists()
        assert Notification.objects.filter(user=user, verb="badge_first_thread").exists()

    def test_badge_endpoints_report_progress_and_categories(self):
        load_default_badges()
        user = make_user("prog")
        thread = Thread.objects.create(author=user, title="T", body="b", category="c")
        for _ in range(3):
            Comment.objects.create(thread=thread, author=user, body="hi")
        check_badges(user)
        data = client_for(user).get("/api/v1/me/badges/").json()
        earned = {badge["criteria_key"]: badge for badge in data["earned"]}
        locked = {badge["criteria_key"]: badge for badge in data["locked"]}
        assert "first_thread" in earned and earned["first_thread"]["earned_at"]
        assert locked["ten_comments"]["progress"] == 3 and locked["ten_comments"]["required"] == 10
        assert locked["ten_comments"]["category"] == "Community"
        assert len(earned) + len(locked) == Badge.objects.count()
        public = client_for().get("/api/v1/badges/").json()
        assert len(public) == Badge.objects.count() and public[0]["required"] >= 1


@pytest.mark.django_db
class TestStreaksAndDailyXp:
    def test_daily_login_xp_is_paid_every_new_day_not_once_ever(self):
        user = make_user("daily")
        update_streak(user)
        assert XPEvent.objects.filter(user=user, reason="daily_login").count() == 1
        update_streak(user)  # same day: nothing more
        assert XPEvent.objects.filter(user=user, reason="daily_login").count() == 1
        # Move "today's" payment to yesterday, as it would be when the next day arrives.
        yesterday = timezone.localdate() - timedelta(days=1)
        XPEvent.objects.filter(user=user, reason="daily_login").update(source=f"login:{yesterday.isoformat()}")
        user.last_active = timezone.now() - timedelta(days=1)
        user.save(update_fields=["last_active"])
        update_streak(user)
        user.refresh_from_db()
        assert user.streak_days == 2
        assert XPEvent.objects.filter(user=user, reason="daily_login").count() == 2

    def test_same_day_calls_do_not_write(self):
        user = make_user("quiet")
        update_streak(user)
        before = User.objects.get(pk=user.pk).last_active
        update_streak(user)
        assert User.objects.get(pk=user.pk).last_active == before

    def test_seventh_day_pays_the_streak_bonus_once(self):
        user = make_user("week", streak_days=6, last_active=timezone.now() - timedelta(days=1))
        update_streak(user)
        assert XPEvent.objects.filter(user=user, reason="streak_week_bonus").count() == 1
        update_streak(user)
        assert XPEvent.objects.filter(user=user, reason="streak_week_bonus").count() == 1

    def test_missing_a_day_resets_the_streak(self):
        user = make_user("lapsed", streak_days=9, last_active=timezone.now() - timedelta(days=3))
        update_streak(user)
        user.refresh_from_db()
        assert user.streak_days == 1

    def test_registering_starts_a_streak_without_double_paying(self):
        body = {"email": "n@example.com", "username": "newbie", "full_name": "New Bie", "password": PASSWORD, "password2": PASSWORD}
        assert client_for().post("/api/v1/auth/register/", body, format="json").status_code == 201
        user = User.objects.get(username="newbie")
        assert user.streak_days == 1 and user.last_active is not None
        assert user.xp == 10  # the signup bonus only

    def test_opening_the_app_counts_as_activity_for_people_who_stay_signed_in(self):
        user = make_user("stayin", streak_days=3, last_active=timezone.now() - timedelta(days=1))
        assert client_for(user).get("/api/v1/auth/me/").json()["streak_days"] == 4
        assert client_for(user).get("/api/v1/auth/me/").json()["streak_days"] == 4  # not counted twice

    def test_level_up_notifies(self):
        user = make_user("lvl")
        award_xp(user, "custom", 500, source="x")
        assert Notification.objects.filter(user=user, verb="level_up").exists()


@pytest.mark.django_db
class TestLeaderboard:
    def test_all_time_ranking_and_shape(self):
        make_user("low", xp=10)
        make_user("high", xp=900, role="mentor")
        make_user("mid", xp=300, streak_days=4)
        data = client_for().get("/api/v1/leaderboard/").json()
        assert [row["user"]["username"] for row in data] == ["high", "mid", "low"]
        assert [row["rank"] for row in data] == [1, 2, 3]
        assert {"level", "role", "streak_days", "badge_count", "avatar", "full_name"} <= set(data[0]["user"])
        assert client_for().get("/api/v1/leaderboard/?role=mentor").json()[0]["user"]["username"] == "high"

    def test_weekly_board_counts_only_recent_xp_and_hides_the_idle(self):
        old, recent = make_user("old", xp=5000), make_user("recent", xp=50)
        award_xp(recent, "chapter_complete", 40, source="a")
        event = XPEvent.objects.create(user=old, amount=5000, reason="x", source="ancient")
        XPEvent.objects.filter(pk=event.pk).update(created_at=timezone.now() - timedelta(days=20))
        week = client_for().get("/api/v1/leaderboard/?period=week").json()
        assert [(row["user"]["username"], row["xp"]) for row in week] == [("recent", 40)]
        month = client_for().get("/api/v1/leaderboard/?period=month").json()
        assert [row["user"]["username"] for row in month] == ["old", "recent"]
        assert client_for().get("/api/v1/leaderboard/").json()[0]["user"]["username"] == "old"

    def test_caller_gets_a_row_with_their_real_rank_even_below_the_limit(self):
        for index in range(5):
            make_user(f"top{index}", xp=1000 - index)
        me = make_user("me", xp=1)
        data = client_for(me).get("/api/v1/leaderboard/?limit=3").json()
        assert len(data) == 4
        assert data[-1]["user"]["username"] == "me" and data[-1]["rank"] == 6 and data[-1]["self"] is True
        inside = client_for(User.objects.get(username="top0")).get("/api/v1/leaderboard/?limit=3").json()
        assert len(inside) == 3 and inside[0]["self"] is True

    def test_inactive_accounts_and_bad_params_are_handled(self):
        make_user("gone", xp=99999, is_active=False)
        make_user("here", xp=1)
        data = client_for().get("/api/v1/leaderboard/?period=bogus&limit=abc&role=nope").json()
        assert [row["user"]["username"] for row in data] == ["here"]

    def test_badge_count_does_not_multiply_rows(self):
        load_default_badges()
        user = make_user("badged", xp=10)
        for badge in Badge.objects.all()[:3]:
            UserBadge.objects.create(user=user, badge=badge)
        data = client_for().get("/api/v1/leaderboard/").json()
        assert len(data) == 1 and data[0]["user"]["badge_count"] == 3

    def test_query_count_does_not_grow_with_people(self, django_assert_max_num_queries):
        for index in range(15):
            make_user(f"p{index}", xp=index)
        with django_assert_max_num_queries(3):
            client_for().get("/api/v1/leaderboard/")


@pytest.mark.django_db
class TestXpHistory:
    def test_history_is_private_newest_first_and_limited(self):
        user = make_user("hist")
        award_xp(user, "a", 5, source="1")
        award_xp(user, "b", 7, source="2")
        rows = client_for(user).get("/api/v1/me/xp-history/").json()
        assert [row["reason"] for row in rows][:2] == ["b", "a"]
        assert len(client_for(user).get("/api/v1/me/xp-history/?limit=1").json()) == 1
        assert client_for().get("/api/v1/me/xp-history/").status_code == 401


@pytest.mark.django_db
class TestNotifications:
    def test_payload_names_actor_and_resolves_targets(self):
        owner, other = make_user("owner"), make_user("other")
        project = make_project(owner)
        thread = Thread.objects.create(author=owner, title="A thread", body="b", category="community")
        comment = Comment.objects.create(thread=thread, author=other, body="hi")
        create_notification(owner, other, "project_join_request", project)
        create_notification(owner, other, "commented_on_thread", comment)
        create_notification(owner, other, "connection_request")
        by_verb = {row["verb"]: row for row in client_for(owner).get("/api/v1/notifications/").json()}
        assert by_verb["project_join_request"]["target"] == {"type": "project", "id": project.id, "label": "Open Path", "slug": project.slug}
        assert by_verb["commented_on_thread"]["target"]["slug"] == thread.slug
        assert by_verb["commented_on_thread"]["target"]["label"] == "A thread"
        assert by_verb["connection_request"]["target"] is None
        assert by_verb["connection_request"]["actor"]["username"] == "other"
        assert by_verb["connection_request"]["is_read"] is False

    def test_a_deleted_target_becomes_null_instead_of_breaking_the_list(self):
        owner, other = make_user("owner2"), make_user("other2")
        project = make_project(owner, "Gone Soon")
        create_notification(owner, other, "project_update", project)
        project.delete()
        rows = client_for(owner).get("/api/v1/notifications/").json()
        assert len(rows) == 1 and rows[0]["target"] is None

    def test_badge_notification_points_at_the_badge(self):
        load_default_badges()
        user = make_user("badger")
        Thread.objects.create(author=user, title="T", body="b", category="c")
        check_badges(user)
        row = next(r for r in client_for(user).get("/api/v1/notifications/").json() if r["verb"] == "badge_first_thread")
        assert row["target"]["type"] == "badge" and row["target"]["label"] == "Community Builder" and row["actor"] is None

    def test_each_person_sees_only_their_own(self):
        a, b = make_user("na"), make_user("nb")
        create_notification(a, b, "connection_request")
        assert client_for(b).get("/api/v1/notifications/").json() == []
        assert client_for(b).get("/api/v1/notifications/unread-count/").json() == {"unread_count": 0}

    def test_mark_read_and_read_all_and_count(self):
        a, b = make_user("ra"), make_user("rb")
        first = create_notification(a, b, "connection_request")
        create_notification(a, b, "connection_accepted")
        client = client_for(a)
        assert client.get("/api/v1/notifications/unread-count/").json()["unread_count"] == 2
        assert client.post(f"/api/v1/notifications/{first.id}/read/").json() == {"id": first.id, "is_read": True}
        assert client.get("/api/v1/notifications/unread-count/").json()["unread_count"] == 1
        assert len(client.get("/api/v1/notifications/?unread=1").json()) == 1
        assert client.post("/api/v1/notifications/read-all/").json()["updated"] == 1
        assert client.get("/api/v1/notifications/unread-count/").json()["unread_count"] == 0

    def test_cannot_mark_someone_elses_notification(self):
        a, b = make_user("ma"), make_user("mb")
        note = create_notification(a, b, "connection_request")
        assert client_for(b).post(f"/api/v1/notifications/{note.id}/read/").status_code == 404
        note.refresh_from_db()
        assert note.is_read is False

    def test_limit_and_query_count(self, django_assert_max_num_queries):
        a, b = make_user("la"), make_user("lb")
        project = make_project(a, "P")
        for _ in range(12):
            create_notification(a, b, "project_update", project)
        assert len(client_for(a).get("/api/v1/notifications/?limit=5").json()) == 5
        with django_assert_max_num_queries(6):
            client_for(a).get("/api/v1/notifications/")

    def test_requires_login(self):
        assert client_for().get("/api/v1/notifications/").status_code == 401
        assert client_for().post("/api/v1/notifications/read-all/").status_code == 401
        assert client_for().get("/api/v1/me/badges/").status_code == 401
