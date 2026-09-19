"""Library, book detail and the Reader: reading progress, XP/badges, bookmarks and notes."""
import pytest
from django.contrib.auth import get_user_model
from django.core.cache import cache
from rest_framework.test import APIClient

from books.models import Book, Bookmark, Chapter, Note, ReadingProgress
from gamification.models import Badge, UserBadge, XPEvent
from gamification.services import calculate_level

User = get_user_model()
PASSWORD = "StrongPassword123!"
WORDS = "word " * 450  # ~2 minutes at 200 wpm


@pytest.fixture(autouse=True)
def _fresh_throttle_cache():
    cache.clear()
    yield
    cache.clear()


def make_user(username):
    return User.objects.create_user(email=f"{username}@example.com", username=username, full_name=username.title(), password=PASSWORD)


def client_for(user=None):
    client = APIClient()
    if user:
        client.force_authenticate(user)
    return client


def make_book(title="Alpha Book", chapters=3, **extra):
    book = Book.objects.create(title=title, author="A. Author", description="About it", category=extra.pop("category", "Backend"), difficulty=extra.pop("difficulty", "beginner"), tags=extra.pop("tags", ["python"]), est_minutes=extra.pop("est_minutes", 60), **extra)
    for number in range(1, chapters + 1):
        Chapter.objects.create(book=book, title=f"Chapter {number}", chapter_number=number, content=f"Chapter {number} body.\n\n" + WORDS)
    return book


def progress(client, book, chapter, completed=True):
    return client.post(f"/api/v1/books/{book.slug}/progress/", {"chapter_id": chapter.id, "completed": completed}, format="json")


def items(data):
    return data if isinstance(data, list) else data["results"]


@pytest.fixture
def badges(db):
    Badge.objects.create(name="First Chapter", slug="first-chapter", criteria_key="first_chapter", xp_reward=5)
    Badge.objects.create(name="First Book", slug="first-book", criteria_key="first_book", xp_reward=20)


@pytest.mark.django_db
class TestCatalogue:
    def test_list_exposes_reading_state_and_counts(self):
        book = make_book()
        user = make_user("reader")
        c1 = book.chapters.first()
        progress(client_for(user), book, c1)
        row = items(client_for(user).get("/api/v1/books/").data)[0]
        assert (row["chapter_count"], row["readers_count"], row["status"], row["progress_percent"]) == (3, 1, "started", 33)
        assert row["completed_chapter_ids"] == [c1.id] and row["current_chapter_id"] == c1.id

    def test_anonymous_can_browse(self):
        make_book()
        row = items(client_for().get("/api/v1/books/").data)[0]
        assert row["status"] == "not_started" and row["progress_percent"] is None

    def test_list_does_not_query_per_book(self, django_assert_max_num_queries):
        for index in range(12):
            make_book(f"Book {index}")
        user = make_user("many")
        with django_assert_max_num_queries(6):
            client_for(user).get("/api/v1/books/")

    def test_filters_and_ordering(self):
        a = make_book("Python Deep Dive", category="Backend", difficulty="advanced", tags=["python", "async"])
        b = make_book("CSS Basics", category="Frontend", difficulty="beginner", tags=["css"])
        c = make_book("Go Systems", category="Backend", difficulty="intermediate", tags=["go"])
        client = client_for(make_user("filterer"))
        titles = lambda **p: sorted(x["title"] for x in items(client.get("/api/v1/books/", p).data))  # noqa: E731
        assert titles(category="backend") == ["Go Systems", "Python Deep Dive"]
        assert titles(difficulty="beginner") == ["CSS Basics"]
        assert titles(tags="async,css") == ["CSS Basics", "Python Deep Dive"]
        assert titles(search="systems") == ["Go Systems"]
        # popularity = number of readers
        for name in ("r1", "r2"):
            progress(client_for(make_user(name)), c, c.chapters.first(), completed=False)
        progress(client_for(make_user("r3")), a, a.chapters.first(), completed=False)
        ordered = [x["title"] for x in items(client.get("/api/v1/books/", {"ordering": "popular"}).data)]
        assert ordered[:2] == ["Go Systems", "Python Deep Dive"] and b.title == ordered[2]

    def test_detail_has_chapters_with_minutes_completion_and_related(self):
        book = make_book("Main", category="Backend")
        make_book("Sibling", category="Backend")
        make_book("Other", category="Design")
        user = make_user("detailer")
        done = book.chapters.first()
        progress(client_for(user), book, done)
        data = client_for(user).get(f"/api/v1/books/{book.slug}/").data
        assert [c["is_completed"] for c in data["chapters"]] == [True, False, False]
        assert all(c["est_minutes"] >= 2 for c in data["chapters"])
        related = [b["title"] for b in data["related"]]
        assert "Main" not in related and related[0] == "Sibling" and len(related) == 2

    def test_unknown_book_is_a_clean_404(self):
        res = client_for().get("/api/v1/books/nope/")
        assert res.status_code == 404 and res.data["error"]["code"] == "not_found"

    def test_chapter_detail_has_content_and_private_state(self):
        book = make_book()
        chapter = book.chapters.first()
        anon = client_for().get(f"/api/v1/chapters/{chapter.id}/").data
        assert "Chapter 1 body." in anon["content"] and anon["notes"] == [] and anon["bookmarks"] == [] and anon["est_minutes"] >= 2


@pytest.mark.django_db
class TestReadingProgress:
    def test_completing_a_chapter_pays_xp_once_and_updates_level(self):
        book = make_book()
        user = make_user("xp-reader")
        client = client_for(user)
        c1 = book.chapters.first()
        first = progress(client, book, c1)
        assert first.status_code == 200
        assert (first.data["xp_awarded"], first.data["chapter_completed"], first.data["progress"]["progress_percent"]) == (10, True, 33)
        again = progress(client, book, c1)
        assert (again.data["xp_awarded"], again.data["chapter_completed"]) == (0, False)
        user.refresh_from_db()
        assert user.xp == 10 and user.level == calculate_level(user.xp)
        assert XPEvent.objects.filter(user=user, reason="chapter_complete").count() == 1

    def test_each_chapter_pays_separately(self):
        book = make_book()
        user = make_user("each-chapter")
        client = client_for(user)
        for chapter in book.chapters.all()[:2]:
            assert progress(client, book, chapter).data["xp_awarded"] == 10
        user.refresh_from_db()
        assert user.xp == 20

    def test_opening_a_chapter_only_moves_the_resume_pointer(self):
        book = make_book()
        user = make_user("resumer")
        c2 = book.chapters.all()[1]
        res = progress(client_for(user), book, c2, completed=False)
        assert (res.data["xp_awarded"], res.data["progress"]["progress_percent"], res.data["progress"]["chapter_id"]) == (0, 0, c2.id)
        assert ReadingProgress.objects.get(user=user, book=book).chapter_id == c2.id
        user.refresh_from_db()
        assert user.xp == 0

    def test_a_single_finished_chapter_does_not_finish_the_book(self):
        book = make_book()
        user = make_user("not-done")
        res = progress(client_for(user), book, book.chapters.first())
        assert res.data["progress"]["completed"] is False and res.data["book_completed"] is False

    def test_finishing_every_chapter_finishes_the_book_once(self, badges):
        book = make_book()
        user = make_user("finisher")
        client = client_for(user)
        results = [progress(client, book, chapter) for chapter in book.chapters.all()]
        last = results[-1].data
        assert last["book_completed"] is True and last["progress"]["completed"] is True and last["progress"]["progress_percent"] == 100
        assert last["xp_awarded"] == 10 + 100
        assert XPEvent.objects.filter(user=user, reason="book_complete").count() == 1
        replay = progress(client, book, book.chapters.first())
        assert (replay.data["xp_awarded"], replay.data["book_completed"]) == (0, False)
        user.refresh_from_db()
        assert user.level == calculate_level(user.xp) and user.level > 1
        assert client.get("/api/v1/me/library/").data[0]["status"] == "finished"
        assert client_for().get(f"/api/v1/users/{user.username}/portfolio/").data["books"][0]["title"] == "Alpha Book"

    def test_reading_badges_are_awarded_through_the_badge_rules(self, badges):
        book = make_book()
        user = make_user("badger")
        client = client_for(user)
        first = progress(client, book, book.chapters.first())
        assert [b["slug"] for b in first.data["badges_earned"]] == ["first-chapter"]  # the first_chapter rule
        for chapter in list(book.chapters.all())[1:]:
            last = progress(client, book, chapter)
        assert "first-book" in [b["slug"] for b in last.data["badges_earned"]]
        assert UserBadge.objects.filter(user=user).count() == 2

    @pytest.mark.parametrize("body,field", [({}, "chapter_id"), ({"chapter_id": "abc"}, "chapter_id")])
    def test_bad_input_is_a_400_not_a_500(self, body, field):
        book = make_book()
        res = client_for(make_user("bad")).post(f"/api/v1/books/{book.slug}/progress/", body, format="json")
        assert res.status_code == 400 and field in res.data["error"]["fields"]

    def test_chapter_from_another_book_is_404(self):
        book, other = make_book("One"), make_book("Two")
        assert progress(client_for(make_user("mixer")), book, other.chapters.first()).status_code == 404

    def test_requires_login(self):
        book = make_book()
        assert progress(client_for(), book, book.chapters.first()).status_code == 401

    def test_library_lists_only_my_books_newest_first(self):
        a, b = make_book("Lib A"), make_book("Lib B")
        me, other = make_user("librarian"), make_user("someone-else")
        progress(client_for(me), a, a.chapters.first(), completed=False)
        progress(client_for(me), b, b.chapters.first(), completed=False)
        progress(client_for(other), a, a.chapters.first(), completed=False)
        rows = client_for(me).get("/api/v1/me/library/").data
        assert [r["book"]["title"] for r in rows] == ["Lib B", "Lib A"]


@pytest.mark.django_db
class TestBookmarksAndNotes:
    def test_bookmark_toggles_and_shows_in_chapter_detail(self):
        book = make_book()
        chapter = book.chapters.first()
        client = client_for(make_user("marker"))
        assert client.post(f"/api/v1/chapters/{chapter.id}/bookmark/", {}, format="json").data["status"] == "created"
        assert len(client.get(f"/api/v1/chapters/{chapter.id}/").data["bookmarks"]) == 1
        assert client.post(f"/api/v1/chapters/{chapter.id}/bookmark/", {}, format="json").data["status"] == "removed"
        assert client.get(f"/api/v1/chapters/{chapter.id}/").data["bookmarks"] == []
        assert Bookmark.objects.count() == 0

    def test_bad_bookmark_page_is_400(self):
        chapter = make_book().chapters.first()
        res = client_for(make_user("pager")).post(f"/api/v1/chapters/{chapter.id}/bookmark/", {"page": "x"}, format="json")
        assert res.status_code == 400

    def test_notes_crud_and_privacy(self):
        chapter = make_book().chapters.first()
        mine, theirs = make_user("noter"), make_user("snoop")
        client = client_for(mine)
        created = client.post(f"/api/v1/chapters/{chapter.id}/notes/", {"content": "  remember this  "}, format="json")
        assert created.status_code == 201 and created.data["content"] == "remember this"
        assert [n["content"] for n in client.get(f"/api/v1/chapters/{chapter.id}/").data["notes"]] == ["remember this"]
        # someone else neither sees nor can delete it
        other = client_for(theirs)
        assert other.get(f"/api/v1/chapters/{chapter.id}/").data["notes"] == []
        assert other.delete(f"/api/v1/chapters/{chapter.id}/notes/?note_id={created.data['id']}").status_code == 404
        assert client.delete(f"/api/v1/chapters/{chapter.id}/notes/?note_id={created.data['id']}").status_code == 200
        assert Note.objects.count() == 0

    @pytest.mark.parametrize("content", ["", "   ", "x" * 5001])
    def test_invalid_notes_are_rejected(self, content):
        chapter = make_book().chapters.first()
        res = client_for(make_user("badnote")).post(f"/api/v1/chapters/{chapter.id}/notes/", {"content": content}, format="json")
        assert res.status_code == 400 and "content" in res.data["error"]["fields"]

    def test_delete_needs_a_valid_note_id(self):
        chapter = make_book().chapters.first()
        client = client_for(make_user("delnote"))
        assert client.delete(f"/api/v1/chapters/{chapter.id}/notes/").status_code == 400
        assert client.delete(f"/api/v1/chapters/{chapter.id}/notes/?note_id=abc").status_code == 400
