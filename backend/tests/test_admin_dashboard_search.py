"""Admin management API, the dashboard endpoint, and global search."""
import io
from datetime import timedelta

import pytest
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from PIL import Image
from rest_framework.test import APIClient

from books.models import Book, Chapter, ReadingProgress
from community.models import Comment, Tag, Thread
from core.models import Report
from gamification.models import Badge, UserBadge, XPEvent
from projects.models import Project, ProjectMember

User = get_user_model()
PASSWORD = "StrongPassword123!"
API = "/api/v1"


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


@pytest.fixture
def staff():
    return make_user("boss", is_staff=True)


@pytest.fixture
def admin(staff):
    return client_for(staff)


def png(name="cover.png"):
    buffer = io.BytesIO()
    Image.new("RGB", (4, 4), "red").save(buffer, "PNG")
    return SimpleUploadedFile(name, buffer.getvalue(), content_type="image/png")


# ------------------------------------------------------------------ access
@pytest.mark.django_db
class TestAccess:
    @pytest.mark.parametrize("path", ["/admin/stats/", "/admin/users/", "/admin/books/", "/admin/projects/", "/admin/reports/"])
    def test_staff_only(self, path):
        assert client_for().get(API + path).status_code == 401
        assert client_for(make_user("plain")).get(API + path).status_code == 403


# ------------------------------------------------------------------ users
@pytest.mark.django_db
class TestAdminUsers:
    def test_list_is_paginated_filterable_and_lightweight(self, admin):
        for index in range(25):
            make_user(f"user{index:02d}", role="mentor" if index % 5 == 0 else "learner")
        data = admin.get(f"{API}/admin/users/?page_size=10").json()
        assert data["count"] == 26 and data["pages"] == 3 and len(data["results"]) == 10
        assert {"id", "username", "full_name", "email", "role", "is_active", "is_staff", "xp", "level", "created_at"} <= set(data["results"][0])
        assert admin.get(f"{API}/admin/users/?page=99&page_size=10").json()["page"] == 3
        assert admin.get(f"{API}/admin/users/?role=mentor").json()["count"] == 5
        assert admin.get(f"{API}/admin/users/?q=user07").json()["count"] == 1
        assert admin.get(f"{API}/admin/users/?role=wizard").status_code == 400

    def test_status_filter(self, admin):
        make_user("gone", is_active=False)
        assert admin.get(f"{API}/admin/users/?status=banned").json()["count"] == 1
        assert admin.get(f"{API}/admin/users/?status=active").json()["count"] == 1

    def test_query_count_is_flat(self, admin, django_assert_max_num_queries):
        for index in range(15):
            make_user(f"flat{index}")
        with django_assert_max_num_queries(6):
            admin.get(f"{API}/admin/users/?page_size=20")

    def test_create_validates_and_never_500s(self, admin):
        ok = admin.post(f"{API}/admin/users/", {"email": "New@Example.com", "username": "newperson", "full_name": "New Person", "role": "mentor"}, format="json")
        assert ok.status_code == 201 and ok.json()["email"] == "new@example.com" and ok.json()["role"] == "mentor"
        assert not User.objects.get(username="newperson").has_usable_password()
        duplicate = admin.post(f"{API}/admin/users/", {"email": "new@example.com", "username": "NewPerson"}, format="json")
        assert duplicate.status_code == 400 and set(duplicate.json()["error"]["fields"]) == {"email", "username"}
        assert admin.post(f"{API}/admin/users/", {}, format="json").status_code == 400
        assert admin.post(f"{API}/admin/users/", {"email": "nope", "username": "abc"}, format="json").json()["error"]["fields"]["email"]
        assert admin.post(f"{API}/admin/users/", {"email": "a@b.co", "username": "a b"}, format="json").json()["error"]["fields"]["username"]
        assert admin.post(f"{API}/admin/users/", {"email": "a@b.co", "username": "okname", "role": "root"}, format="json").json()["error"]["fields"]["role"]
        weak = admin.post(f"{API}/admin/users/", {"email": "w@b.co", "username": "weakling", "password": "123"}, format="json")
        assert weak.status_code == 400 and "password" in weak.json()["error"]["fields"]

    def test_role_is_validated_and_ban_round_trips(self, admin):
        target = make_user("target")
        assert admin.patch(f"{API}/admin/users/{target.id}/", {"role": "superhero"}, format="json").status_code == 400
        assert admin.patch(f"{API}/admin/users/{target.id}/", {"role": "builder"}, format="json").json()["role"] == "builder"
        assert admin.patch(f"{API}/admin/users/{target.id}/", {"is_active": False}, format="json").json()["is_active"] is False
        login = client_for().post(f"{API}/auth/login/", {"email": target.email, "password": PASSWORD}, format="json")
        assert login.status_code == 400
        assert admin.patch(f"{API}/admin/users/{target.id}/", {"is_active": "banana"}, format="json").status_code == 400
        assert admin.patch(f"{API}/admin/users/{target.id}/", {"ban": False}, format="json").json()["is_active"] is True

    def test_guards(self, admin, staff):
        assert admin.patch(f"{API}/admin/users/{staff.id}/", {"is_active": False}, format="json").status_code == 400
        assert admin.delete(f"{API}/admin/users/{staff.id}/").status_code == 400
        root = User.objects.create_superuser(email="root@example.com", username="root", password=PASSWORD, full_name="Root")
        assert admin.patch(f"{API}/admin/users/{root.id}/", {"is_active": False}, format="json").status_code == 400
        assert admin.delete(f"{API}/admin/users/{root.id}/").status_code == 403
        assert User.objects.filter(pk=root.pk, is_active=True).exists()
        assert client_for(root).delete(f"{API}/admin/users/{make_user('victim').id}/").status_code == 200
        assert admin.patch(f"{API}/admin/users/99999/", {"role": "mentor"}, format="json").status_code == 404


# ------------------------------------------------------------------ books
@pytest.mark.django_db
class TestAdminBooks:
    def create(self, admin, **extra):
        body = {"title": "Admin Made Book", "author": "Ada Author", "category": "Backend", "difficulty": "intermediate", "tags": ["python", "Python", " django "], "description": "About the book."}
        return admin.post(f"{API}/admin/books/", {**body, **extra}, format="json")

    def test_create_with_chapters_and_reading_time(self, admin):
        words = " ".join(["word"] * 420)
        res = self.create(admin, chapters=[{"title": "One", "content": words}, {"title": "Two", "content": words}])
        assert res.status_code == 201
        body = res.json()
        assert body["tags"] == ["python", "django"] and body["chapter_count"] == 2
        assert [c["chapter_number"] for c in body["chapters"]] == [1, 2]
        assert body["est_minutes"] == 4  # 2 chapters x 420 words at 200 wpm, rounded per chapter
        book = Book.objects.get(pk=body["id"])
        assert book.published_at is not None and book.slug == "admin-made-book"

    def test_validation(self, admin):
        assert self.create(admin, title="").status_code == 400
        assert admin.post(f"{API}/admin/books/", {"title": "No Author"}, format="json").json()["error"]["fields"]["author"]
        assert self.create(admin, difficulty="impossible").json()["error"]["fields"]["difficulty"]
        assert self.create(admin, tags=["x" * 31]).json()["error"]["fields"]["tags"]
        assert self.create(admin, tags=[f"t{i}" for i in range(16)]).status_code == 400
        assert self.create(admin, title="x" * 201).status_code == 400
        assert self.create(admin, chapters="nope").status_code == 400
        assert Book.objects.count() == 0
        assert self.create(admin, slug="taken").status_code == 201
        assert self.create(admin, title="Other", slug="taken").json()["error"]["fields"]["slug"]

    def test_list_search_and_detail(self, admin):
        self.create(admin)
        self.create(admin, title="Second Book", author="Someone Else", category="Design")
        data = admin.get(f"{API}/admin/books/?q=design").json()
        assert data["count"] == 1 and data["results"][0]["title"] == "Second Book"
        book_id = admin.get(f"{API}/admin/books/").json()["results"][0]["id"]
        detail = admin.get(f"{API}/admin/books/{book_id}/").json()
        assert "chapters" in detail and detail["readers_count"] == 0

    def test_patch_and_cover_upload(self, admin):
        book_id = self.create(admin).json()["id"]
        res = admin.patch(f"{API}/admin/books/{book_id}/", {"title": "Renamed", "is_featured": True, "difficulty": "advanced"}, format="json")
        assert res.status_code == 200 and res.json()["title"] == "Renamed" and res.json()["is_featured"] is True
        assert admin.patch(f"{API}/admin/books/{book_id}/", {"difficulty": "nope"}, format="json").status_code == 400
        assert admin.patch(f"{API}/admin/books/{book_id}/", {"title": ""}, format="json").status_code == 400
        assert Book.objects.get(pk=book_id).title == "Renamed"
        upload = admin.patch(f"{API}/admin/books/{book_id}/", {"cover": png()}, format="multipart")
        assert upload.status_code == 200 and upload.json()["cover"].startswith("http")
        bad = admin.patch(f"{API}/admin/books/{book_id}/", {"cover": SimpleUploadedFile("x.png", b"not an image", content_type="image/png")}, format="multipart")
        assert bad.status_code == 400 and "cover" in bad.json()["error"]["fields"]
        assert admin.patch(f"{API}/admin/books/{book_id}/", {"remove_cover": "true"}, format="multipart").json()["cover"] is None

    def test_chapters_crud_keeps_numbers_unique_and_time_in_sync(self, admin):
        book_id = self.create(admin).json()["id"]
        first = admin.post(f"{API}/admin/books/{book_id}/chapters/", {"title": "Intro", "content": " ".join(["w"] * 400)}, format="json")
        assert first.status_code == 201 and first.json()["chapter_number"] == 1
        second = admin.post(f"{API}/admin/books/{book_id}/chapters/", {"title": "Next"}, format="json")
        assert second.json()["chapter_number"] == 2
        clash = admin.post(f"{API}/admin/books/{book_id}/chapters/", {"title": "Clash", "chapter_number": 1}, format="json")
        assert clash.status_code == 400 and "chapter_number" in clash.json()["error"]["fields"]
        assert admin.post(f"{API}/admin/books/{book_id}/chapters/", {"title": ""}, format="json").status_code == 400
        assert admin.post(f"{API}/admin/books/{book_id}/chapters/", {"title": "Zero", "chapter_number": 0}, format="json").status_code == 400
        assert Book.objects.get(pk=book_id).est_minutes == 3  # 400 words -> 2, empty chapter -> 1
        edited = admin.patch(f"{API}/admin/chapters/{second.json()['id']}/", {"content": " ".join(["w"] * 1000)}, format="json")
        assert edited.status_code == 200 and edited.json()["est_minutes"] == 5
        assert Book.objects.get(pk=book_id).est_minutes == 7
        assert admin.patch(f"{API}/admin/chapters/{second.json()['id']}/", {"chapter_number": 1}, format="json").status_code == 400
        assert admin.delete(f"{API}/admin/chapters/{second.json()['id']}/").status_code == 200
        assert Book.objects.get(pk=book_id).est_minutes == 2
        assert Chapter.objects.filter(book_id=book_id).count() == 1
        detail = admin.get(f"{API}/admin/books/{book_id}/").json()
        assert detail["chapter_count"] == 1 and detail["chapters"][0]["title"] == "Intro"

    def test_delete(self, admin):
        book_id = self.create(admin).json()["id"]
        assert admin.delete(f"{API}/admin/books/{book_id}/").status_code == 200
        assert admin.get(f"{API}/admin/books/{book_id}/").status_code == 404


# ------------------------------------------------------------------ projects
def make_project(owner, title="Open Path", **extra):
    project = Project.objects.create(owner=owner, title=title, summary="s", description="d", category="Education", **extra)
    ProjectMember.objects.create(project=project, user=owner, role="owner")
    return project


@pytest.mark.django_db
class TestAdminProjects:
    def test_list_filters_and_members(self, admin):
        owner = make_user("proj-owner")
        project = make_project(owner, "Alpha", status="active")
        ProjectMember.objects.create(project=project, user=make_user("mem"), role="member")
        make_project(owner, "Beta", is_public=False)
        data = admin.get(f"{API}/admin/projects/").json()
        assert data["count"] == 2
        alpha = next(row for row in data["results"] if row["title"] == "Alpha")
        assert alpha["member_count"] == 2 and alpha["owner"]["username"] == "proj-owner" and alpha["is_public"] is True
        assert admin.get(f"{API}/admin/projects/?visibility=hidden").json()["count"] == 1
        assert admin.get(f"{API}/admin/projects/?status=active").json()["count"] == 1
        assert admin.get(f"{API}/admin/projects/?status=bogus").status_code == 400
        assert admin.get(f"{API}/admin/projects/?q=proj-owner").json()["count"] == 2

    def test_moderation_is_validated(self, admin):
        project = make_project(make_user("o2"))
        assert admin.patch(f"{API}/admin/projects/{project.slug}/", {"status": "in_orbit"}, format="json").status_code == 400
        res = admin.patch(f"{API}/admin/projects/{project.slug}/", {"is_public": False, "status": "archived"}, format="json")
        assert res.status_code == 200 and res.json()["is_public"] is False and res.json()["status"] == "archived"
        project.refresh_from_db()
        assert project.is_public is False
        assert admin.patch(f"{API}/admin/projects/{project.slug}/", {"is_public": "maybe"}, format="json").status_code == 400
        assert admin.patch(f"{API}/admin/projects/nope/", {"is_public": True}, format="json").status_code == 404
        assert admin.patch(f"{API}/admin/projects/", {"slug": project.slug, "is_public": True}, format="json").status_code == 200

    def test_hidden_project_disappears_for_others_and_delete(self, admin):
        project = make_project(make_user("o3"), "Visible Then Not")
        stranger = client_for(make_user("stranger"))
        assert any(p["slug"] == project.slug for p in stranger.get(f"{API}/projects/").json())
        admin.patch(f"{API}/admin/projects/{project.slug}/", {"is_public": False}, format="json")
        assert not any(p["slug"] == project.slug for p in stranger.get(f"{API}/projects/").json())
        assert admin.delete(f"{API}/admin/projects/{project.slug}/").json()["detail"] == "Project deleted."
        assert not Project.objects.filter(pk=project.pk).exists()


# ------------------------------------------------------------------ reports
def report(reporter, target, reason="Looks wrong"):
    return Report.objects.create(reporter=reporter, content_type=ContentType.objects.get_for_model(target), object_id=target.pk, reason=reason)


@pytest.mark.django_db
class TestAdminReports:
    def setup_method(self):
        self.author = make_user("author")
        self.reporter = make_user("reporter")
        self.thread = Thread.objects.create(author=self.author, title="Spammy thread", body="Buy now! " * 40, category="community")
        self.comment = Comment.objects.create(thread=self.thread, author=self.author, body="Rude comment")

    def test_list_describes_what_was_reported(self, admin):
        report(self.reporter, self.thread)
        report(self.reporter, self.comment)
        report(self.reporter, self.author)
        rows = {row["target"]["type"]: row for row in admin.get(f"{API}/admin/reports/").json()["results"]}
        assert rows["thread"]["target"]["label"] == "Spammy thread" and rows["thread"]["target"]["slug"] == self.thread.slug
        assert len(rows["thread"]["target"]["preview"]) <= 240
        assert rows["comment"]["target"]["preview"] == "Rude comment" and rows["comment"]["target"]["slug"] == self.thread.slug
        assert rows["user"]["target"]["username"] == "author"
        assert rows["thread"]["reporter"]["username"] == "reporter" and rows["thread"]["status"] == "open"

    def test_status_filter_and_pending(self, admin):
        first, second = report(self.reporter, self.thread), report(make_user("r2"), self.comment)
        admin.patch(f"{API}/admin/reports/{second.id}/", {"action": "dismiss"}, format="json")
        assert admin.get(f"{API}/admin/reports/?status=pending").json()["count"] == 1
        assert admin.get(f"{API}/admin/reports/?status=dismissed").json()["results"][0]["id"] == second.id
        assert admin.get(f"{API}/admin/reports/?status=weird").status_code == 400
        assert first.status == "open"

    def test_actions(self, admin):
        item = report(self.reporter, self.thread)
        assert admin.patch(f"{API}/admin/reports/{item.id}/", {"action": "review"}, format="json").json()["status"] == "review"
        assert admin.patch(f"{API}/admin/reports/{item.id}/", {"action": "resolve"}, format="json").json()["status"] == "resolved"
        assert admin.patch(f"{API}/admin/reports/{item.id}/", {"action": "reopen"}, format="json").json()["status"] == "open"
        assert admin.patch(f"{API}/admin/reports/{item.id}/", {"action": "explode"}, format="json").status_code == 400
        assert admin.patch(f"{API}/admin/reports/{item.id}/", {"status": "resolved"}, format="json").json()["status"] == "resolved"  # legacy body
        assert admin.patch(f"{API}/admin/reports/{item.id}/", {"status": "made-up"}, format="json").status_code == 400
        assert admin.patch(f"{API}/admin/reports/999/", {"action": "resolve"}, format="json").status_code == 404

    def test_removing_content_resolves_every_report_about_it(self, admin):
        a, b = report(self.reporter, self.comment), report(make_user("r3"), self.comment)
        res = admin.patch(f"{API}/admin/reports/{a.id}/", {"action": "remove_content"}, format="json")
        assert res.status_code == 200 and res.json()["status"] == "resolved" and res.json()["target"]["exists"] is False
        assert not Comment.objects.filter(pk=self.comment.pk).exists()
        b.refresh_from_db()
        assert b.status == "resolved"
        again = admin.patch(f"{API}/admin/reports/{a.id}/", {"action": "remove_content"}, format="json")
        assert again.status_code == 400
        thread_report = report(self.reporter, self.thread)
        admin.patch(f"{API}/admin/reports/{thread_report.id}/", {"action": "remove_content"}, format="json")
        assert not Thread.objects.filter(pk=self.thread.pk).exists()

    def test_user_reports_deactivate_but_never_staff(self, admin, staff):
        about_author = report(self.reporter, self.author)
        assert admin.patch(f"{API}/admin/reports/{about_author.id}/", {"action": "remove_content"}, format="json").status_code == 400
        assert admin.patch(f"{API}/admin/reports/{about_author.id}/", {"action": "deactivate_user"}, format="json").status_code == 200
        self.author.refresh_from_db()
        assert self.author.is_active is False
        about_staff = report(self.reporter, staff)
        assert admin.patch(f"{API}/admin/reports/{about_staff.id}/", {"action": "deactivate_user"}, format="json").status_code == 400
        about_thread = report(self.reporter, Thread.objects.create(author=make_user("t2"), title="x thread", body="body", category="c"))
        assert admin.patch(f"{API}/admin/reports/{about_thread.id}/", {"action": "deactivate_user"}, format="json").status_code == 400

    def test_reporting_again_after_dismissal_creates_a_fresh_report(self):
        item = report(self.reporter, self.thread)
        item.status = "dismissed"
        item.save()
        res = client_for(self.reporter).post(f"{API}/report/", {"content_type": "thread", "object_id": self.thread.id, "reason": "Still bad"}, format="json")
        assert res.status_code in (200, 201)
        assert Report.objects.filter(object_id=self.thread.pk, status="open").count() == 1


# ------------------------------------------------------------------ stats
@pytest.mark.django_db
class TestAdminStats:
    def test_numbers_are_real(self, admin, staff):
        reader = make_user("reader")
        book = Book.objects.create(title="B", author="A")
        ReadingProgress.objects.create(user=reader, book=book, completed=True)
        make_project(reader, status="active")
        thread = Thread.objects.create(author=reader, title="A thread", body="b", category="c")
        report(reader, thread)
        old = make_user("old")
        User.objects.filter(pk=old.pk).update(created_at=timezone.now() - timedelta(days=40))
        data = admin.get(f"{API}/admin/stats/").json()
        assert data["totals"]["users"] == 3 and data["totals"]["books"] == 1 and data["totals"]["projects"] == 1 and data["totals"]["threads"] == 1
        assert data["signups_30d"] == 2 and data["active_projects"] == 1 and data["open_reports"] == 1
        assert len(data["daily"]) == 7 and data["daily"][-1]["signups"] == 2 and data["daily"][-1]["projects"] == 1
        assert data["signals"]["books"] == 33 and data["signals"]["projects"] == 33 and data["signals"]["community"] == 33 and data["signals"]["badges"] == 0
        assert data["top_books"][0]["completions"] == 1


# ------------------------------------------------------------------ dashboard
@pytest.mark.django_db
class TestDashboard:
    def test_requires_login(self):
        assert client_for().get(f"{API}/dashboard/").status_code == 401

    def test_empty_account(self):
        data = client_for(make_user("fresh")).get(f"{API}/dashboard/").json()
        assert data["reading"] is None and data["activity"] == [] and data["badges"] == []
        assert data["stats"]["level"] == 1 and data["stats"]["level_floor_xp"] == 0 and data["stats"]["next_level_xp"] == 50
        assert len(data["weekly_xp"]) == 7 and sum(day["xp"] for day in data["weekly_xp"]) == 0

    def test_level_bounds_follow_the_level_formula(self):
        user = make_user("lvl", xp=250, level=3)
        stats = client_for(user).get(f"{API}/dashboard/").json()["stats"]
        assert (stats["level_floor_xp"], stats["next_level_xp"]) == (200, 450)

    def test_reading_activity_badges_and_weekly_xp(self):
        user = make_user("busy", xp=30, level=1, streak_days=4)
        book = Book.objects.create(title="Half Read", author="A", category="Backend")
        finished = Book.objects.create(title="Done Book", author="A")
        second = Chapter.objects.create(book=book, title="Second", chapter_number=2)
        Chapter.objects.create(book=book, title="First", chapter_number=1)
        ReadingProgress.objects.create(user=user, book=finished, completed=True, progress_percent=100, last_read_at=timezone.now())
        ReadingProgress.objects.create(user=user, book=book, chapter=second, progress_percent=40, last_read_at=timezone.now() - timedelta(hours=1))
        XPEvent.objects.create(user=user, amount=10, reason="chapter_complete", source="c1")
        old = XPEvent.objects.create(user=user, amount=99, reason="task_complete", source="t1")
        XPEvent.objects.filter(pk=old.pk).update(created_at=timezone.now() - timedelta(days=30))
        badge = Badge.objects.create(name="Reader", slug="reader", criteria_key="first_chapter", xp_reward=50, icon="book-open")
        UserBadge.objects.create(user=user, badge=badge)
        make_project(user, status="active")
        make_project(user, "Old One", status="archived")
        data = client_for(user).get(f"{API}/dashboard/").json()
        assert data["reading"]["book"]["slug"] == book.slug and data["reading"]["chapter"] == {"id": second.id, "number": 2, "title": "Second"} and data["reading"]["progress"] == 40
        assert data["stats"]["books_in_progress"] == 1 and data["stats"]["active_projects"] == 1 and data["stats"]["badges_earned"] == 1 and data["stats"]["streak_days"] == 4
        assert data["activity"][0]["text"] == "Finished a chapter" and data["activity"][0]["amount"] == 10
        assert data["badges"][0]["name"] == "Reader" and data["badges"][0]["xp_reward"] == 50
        assert data["weekly_xp"][-1]["xp"] == 10 and sum(day["xp"] for day in data["weekly_xp"]) == 10

    def test_query_count_is_flat(self, django_assert_max_num_queries):
        user = make_user("flatdash")
        with django_assert_max_num_queries(12):
            client_for(user).get(f"{API}/dashboard/")


# ------------------------------------------------------------------ search
@pytest.mark.django_db
class TestSearch:
    def setup_method(self):
        self.owner = make_user("searchowner")
        Book.objects.create(title="Django in Practice", author="Ann Writer", description="A guide", category="Backend")
        Book.objects.create(title="Gardening", author="Django Reinhardt", description="Plants", category="Life")
        Book.objects.create(title="Other", author="Other", description="Talks about django deeply", category="Misc")
        self.public = make_project(self.owner, "Django Dashboard")
        self.private = make_project(self.owner, "Django Secret", is_public=False)
        make_user("djangofan", headline="Loves Django")
        make_user("retired", headline="Django veteran", is_active=False)
        thread = Thread.objects.create(author=self.owner, title="Help with forms", body="My form breaks", category="backend")
        thread.tags.add(Tag.objects.create(name="djangoforms"))

    def search(self, query, user=None, **params):
        query_string = "&".join(f"{k}={v}" for k, v in {"q": query, **params}.items())
        return client_for(user).get(f"{API}/search/?{query_string}")

    def test_grouped_results_and_full_counts(self):
        data = self.search("django").json()
        assert data["type"] == "all" and data["total"] == sum(data["type_counts"].values())
        assert data["type_counts"] == {"books": 3, "projects": 1, "people": 1, "threads": 1}
        assert set(data["results"]) == {"books", "projects", "people", "threads"}

    def test_title_matches_come_first(self):
        titles = [b["title"] for b in self.search("django").json()["results"]["books"]]
        assert titles[0] == "Django in Practice"

    def test_private_projects_and_inactive_people_are_hidden(self):
        data = self.search("django").json()
        assert [p["title"] for p in data["results"]["projects"]] == ["Django Dashboard"]
        assert [p["username"] for p in data["results"]["people"]] == ["djangofan"]
        mine = self.search("django", self.owner).json()
        assert {p["title"] for p in mine["results"]["projects"]} == {"Django Dashboard", "Django Secret"}

    def test_tags_and_multiple_words(self):
        assert self.search("djangoforms").json()["type_counts"]["threads"] == 1
        assert self.search("gardening reinhardt").json()["type_counts"]["books"] == 1
        assert self.search("gardening zebra").json()["total"] == 0

    def test_single_type_limit_and_validation(self):
        for index in range(8):
            Book.objects.create(title=f"Django extra {index}", author="X")
        limited = self.search("django", type="books", limit=3).json()
        assert limited["type_counts"] == {"books": 11} and len(limited["results"]["books"]) == 3 and list(limited["results"]) == ["books"]
        assert self.search("django", type="discussions").json()["type"] == "threads"
        assert self.search("django", type="everything").status_code == 400
        assert self.search("django", limit="abc").status_code == 400
        assert len(self.search("django", limit=999, type="books").json()["results"]["books"]) == 11

    def test_short_or_blank_queries_return_nothing(self):
        for query in ("", "d", "   "):
            data = self.search(query).json()
            assert data["total"] == 0 and all(not rows for rows in data["results"].values())

    def test_row_shapes(self):
        data = self.search("django").json()["results"]
        assert {"slug", "title", "author", "category", "cover"} <= set(data["books"][0])
        assert {"slug", "title", "summary", "status", "member_count", "owner"} <= set(data["projects"][0])
        assert {"username", "full_name", "headline", "avatar", "skills"} <= set(data["people"][0])
        assert {"slug", "title", "excerpt", "author", "comment_count"} <= set(data["threads"][0])

    def test_query_count_is_flat(self, django_assert_max_num_queries):
        with django_assert_max_num_queries(20):
            self.search("django")
