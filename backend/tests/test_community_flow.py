"""Community: threads, comments, replies, votes, tags, reports, notifications and XP."""
import io

import pytest
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image
from rest_framework.test import APIClient

from community.models import Comment, Tag, Thread, ThreadView, Vote
from core.models import Report
from gamification.models import XPEvent
from notifications.models import Notification

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


def make_thread(author, title="A useful question", category="backend", tags=(), body="Body of the thread goes here."):
    thread = Thread.objects.create(author=author, title=title, body=body, category=category)
    for name in tags:
        thread.tags.add(Tag.objects.get_or_create(name=name)[0])
    return thread


def items(data):
    return data if isinstance(data, list) else data["results"]


def vote(client, kind, obj_id, value):
    return client.post("/api/v1/vote/", {"content_type": kind, "object_id": obj_id, "value": value}, format="json")


def comment(client, thread, body="A helpful reply", parent=None):
    payload = {"body": body}
    if parent:
        payload["parent_id"] = parent
    return client.post(f"/api/v1/threads/{thread.slug}/comments/", payload, format="json")


@pytest.mark.django_db
class TestThreadList:
    def test_list_carries_counts_votes_and_the_viewers_vote(self):
        author, voter = make_user("author"), make_user("voter")
        thread = make_thread(author, tags=["python"])
        comment(client_for(voter), thread)
        vote(client_for(voter), "thread", thread.id, 1)
        row = items(client_for(voter).get("/api/v1/threads/").data)[0]
        assert (row["comment_count"], row["vote_score"], row["user_vote"], row["tags"]) == (1, 1, 1, ["python"])
        assert row["author"]["username"] == "author"

    def test_anonymous_can_read(self):
        make_thread(make_user("anon-author"))
        row = items(client_for().get("/api/v1/threads/").data)[0]
        assert row["user_vote"] == 0

    def test_list_does_not_query_per_thread(self, django_assert_max_num_queries):
        user = make_user("bulk")
        for index in range(15):
            make_thread(user, title=f"Thread number {index}", tags=["a", "b"])
        with django_assert_max_num_queries(8):
            client_for(user).get("/api/v1/threads/")

    def test_orderings(self):
        author, a, b = make_user("ordauthor"), make_user("va"), make_user("vb")
        old = make_thread(author, title="Old but loved")
        new = make_thread(author, title="Brand new one")
        pinned = make_thread(author, title="Pinned notice")
        Thread.objects.filter(pk=pinned.pk).update(is_pinned=True)
        vote(client_for(a), "thread", old.id, 1)
        vote(client_for(b), "thread", old.id, 1)
        comment(client_for(a), old)
        client = client_for(a)
        titles = lambda **p: [t["title"] for t in items(client.get("/api/v1/threads/", p).data)]  # noqa: E731
        assert titles() == ["Pinned notice", "Brand new one", "Old but loved"]
        assert titles(ordering="top") == ["Pinned notice", "Old but loved", "Brand new one"]
        assert titles(ordering="unanswered")[:2] == ["Pinned notice", "Brand new one"] and titles(ordering="unanswered")[-1] == "Old but loved"
        assert new.title in titles(answered="false") and old.title not in titles(answered="false")
        assert titles(answered="true") == ["Old but loved"]

    def test_filters(self):
        me, other = make_user("filterme"), make_user("filterother")
        make_thread(me, title="React state tips", category="frontend", tags=["react"])
        make_thread(other, title="Postgres indexes", category="backend", tags=["postgresql", "databases"])
        client = client_for(me)
        titles = lambda **p: sorted(t["title"] for t in items(client.get("/api/v1/threads/", p).data))  # noqa: E731
        assert titles(category="Frontend") == ["React state tips"]
        assert titles(tag="postgresql") == ["Postgres indexes"]
        assert titles(search="indexes") == ["Postgres indexes"]
        assert titles(mine="true") == ["React state tips"]
        assert len(titles()) == 2

    def test_author_avatar_is_an_absolute_url(self, settings, tmp_path):
        settings.MEDIA_ROOT = tmp_path
        author = make_user("pictured")
        buffer = io.BytesIO()
        Image.new("RGB", (10, 10), "red").save(buffer, format="PNG")
        author.avatar = SimpleUploadedFile("a.png", buffer.getvalue(), content_type="image/png")
        author.save()
        make_thread(author)
        assert items(client_for().get("/api/v1/threads/").data)[0]["author"]["avatar"].startswith("http://testserver/media/avatars/")


@pytest.mark.django_db
class TestCreateEditDelete:
    def test_create_thread_pays_xp_and_normalises_tags(self):
        user = make_user("poster")
        res = client_for(user).post("/api/v1/threads/", {"title": "How do I test this?", "body": "I would like some advice please.", "category": "backend", "tags": ["#Testing", "testing", " Django "]}, format="json")
        assert res.status_code == 201
        assert (res.data["xp_awarded"], res.data["tags"], res.data["slug"]) == (20, ["django", "testing"], "how-do-i-test-this")
        user.refresh_from_db()
        assert user.xp == 20 and XPEvent.objects.filter(user=user, reason="thread_create").count() == 1

    def test_each_thread_pays_but_only_five_a_day(self):
        user = make_user("prolific")
        client = client_for(user)
        for index in range(7):
            client.post("/api/v1/threads/", {"title": f"Question number {index}", "body": "Some body text here.", "category": "community"}, format="json")
        user.refresh_from_db()
        assert user.xp == 5 * 20 and Thread.objects.filter(author=user).count() == 7

    @pytest.mark.parametrize(
        "changes,field",
        [
            ({"title": "ab"}, "title"),
            ({"body": "short"}, "body"),
            ({"category": "made-up"}, "category"),
            ({"tags": ["a", "b", "c", "d", "e", "f"]}, "tags"),
            ({"tags": ["x" * 31]}, "tags"),
            ({"tags": ["bad tag!"]}, "tags"),
        ],
    )
    def test_invalid_threads_are_field_errors(self, changes, field):
        body = {"title": "A good title", "body": "A good long enough body.", "category": "backend", **changes}
        res = client_for(make_user("invalid")).post("/api/v1/threads/", body, format="json")
        assert res.status_code == 400 and field in res.data["error"]["fields"]
        assert Thread.objects.count() == 0

    def test_login_required_to_post(self):
        assert client_for().post("/api/v1/threads/", {"title": "Hello there", "body": "Body body body.", "category": "backend"}, format="json").status_code == 401

    def test_author_can_edit_including_tags(self):
        author = make_user("editor")
        thread = make_thread(author, tags=["old"])
        res = client_for(author).patch(f"/api/v1/threads/{thread.slug}/", {"title": "Edited title", "tags": ["fresh"]}, format="json")
        assert res.status_code == 200 and res.data["title"] == "Edited title" and res.data["tags"] == ["fresh"]

    def test_others_cannot_edit_or_delete_but_staff_can(self):
        author, other = make_user("owner"), make_user("intruder")
        thread = make_thread(author)
        assert client_for(other).patch(f"/api/v1/threads/{thread.slug}/", {"title": "Hijacked"}, format="json").status_code == 403
        assert client_for(other).delete(f"/api/v1/threads/{thread.slug}/").status_code == 403
        staff = make_user("moderator", is_staff=True)
        assert client_for(staff).delete(f"/api/v1/threads/{thread.slug}/").status_code == 200
        assert not Thread.objects.filter(pk=thread.pk).exists()


@pytest.mark.django_db
class TestDetailAndComments:
    def test_detail_counts_a_view_once_per_user_per_day(self):
        author, reader = make_user("viewauthor"), make_user("viewer")
        thread = make_thread(author)
        client = client_for(reader)
        client.get(f"/api/v1/threads/{thread.slug}/")
        again = client.get(f"/api/v1/threads/{thread.slug}/")
        assert again.data["views"] == 1 and ThreadView.objects.count() == 1
        assert client_for().get(f"/api/v1/threads/{thread.slug}/").data["views"] == 1  # anonymous views don't count

    def test_comment_tree_shows_replies_and_flattens_reply_to_reply(self):
        author, a, b = make_user("treeauthor"), make_user("alice"), make_user("bob")
        thread = make_thread(author)
        root = comment(client_for(a), thread, "root comment").data
        first = comment(client_for(b), thread, "first reply", parent=root["id"]).data
        deep = comment(client_for(a), thread, "reply to the reply", parent=first["id"]).data
        assert deep["parent"] == root["id"]  # attached to the top-level comment, so it can be displayed
        data = client_for(a).get(f"/api/v1/threads/{thread.slug}/").data
        assert data["comment_count"] == 3 and len(data["comments"]) == 1
        assert [r["body"] for r in data["comments"][0]["replies"]] == ["first reply", "reply to the reply"]

    def test_roots_are_newest_first(self):
        author, a = make_user("ordr"), make_user("ordc")
        thread = make_thread(author)
        comment(client_for(a), thread, "older")
        comment(client_for(a), thread, "newer")
        assert [c["body"] for c in client_for(a).get(f"/api/v1/threads/{thread.slug}/").data["comments"]] == ["newer", "older"]

    def test_detail_carries_comment_votes_for_the_viewer(self):
        author, a, b = make_user("cvauthor"), make_user("cva"), make_user("cvb")
        thread = make_thread(author)
        c = comment(client_for(a), thread).data
        vote(client_for(b), "comment", c["id"], -1)
        mine = client_for(b).get(f"/api/v1/threads/{thread.slug}/").data["comments"][0]
        assert (mine["vote_score"], mine["user_vote"]) == (-1, -1)
        assert client_for(a).get(f"/api/v1/threads/{thread.slug}/").data["comments"][0]["user_vote"] == 0

    @pytest.mark.parametrize("body", ["", "   ", "x" * 5001])
    def test_bad_comment_bodies_are_field_errors(self, body):
        thread = make_thread(make_user("cauthor"))
        res = comment(client_for(make_user("commenter")), thread, body)
        assert res.status_code == 400 and "body" in res.data["error"]["fields"]

    def test_bad_parent_ids(self):
        thread, other = make_thread(make_user("pa")), make_thread(make_user("pb"))
        foreign = Comment.objects.create(thread=other, author=other.author, body="elsewhere")
        client = client_for(make_user("parenter"))
        assert comment(client, thread, parent=foreign.id).status_code == 404  # a comment from another thread
        assert client.post(f"/api/v1/threads/{thread.slug}/comments/", {"body": "x", "parent_id": "abc"}, format="json").status_code == 400

    def test_comment_requires_login_and_existing_thread(self):
        thread = make_thread(make_user("lg"))
        assert comment(client_for(), thread).status_code == 401
        assert client_for(make_user("nobody")).post("/api/v1/threads/nope/comments/", {"body": "hi"}, format="json").status_code == 404

    def test_edit_and_delete_own_comment_only(self):
        author, a, b = make_user("edauthor"), make_user("eda"), make_user("edb")
        thread = make_thread(author)
        c = comment(client_for(a), thread).data
        assert client_for(b).patch(f"/api/v1/comments/{c['id']}/", {"body": "hax"}, format="json").status_code == 403
        assert client_for(b).delete(f"/api/v1/comments/{c['id']}/").status_code == 403
        assert client_for(a).patch(f"/api/v1/comments/{c['id']}/", {"body": "fixed"}, format="json").data["body"] == "fixed"
        assert client_for(a).patch(f"/api/v1/comments/{c['id']}/", {"body": " "}, format="json").status_code == 400
        assert client_for(a).delete(f"/api/v1/comments/{c['id']}/").status_code == 200


@pytest.mark.django_db
class TestNotifications:
    def test_thread_author_reply_target_and_mentions_are_notified_once_each(self):
        author, alice, bob, carol = make_user("nauthor"), make_user("nalice"), make_user("nbob"), make_user("ncarol")
        thread = make_thread(author)
        root = comment(client_for(alice), thread, "first!").data
        # bob replies to alice and mentions carol and the thread author too
        comment(client_for(bob), thread, "thanks @nalice and @ncarol and @nauthor", parent=root["id"])
        verbs = lambda user: sorted(Notification.objects.filter(user=user).values_list("verb", flat=True))  # noqa: E731
        assert verbs(author) == ["commented_on_thread", "commented_on_thread"]  # alice's comment, then bob's (no extra "mention")
        assert verbs(alice) == ["replied_to_comment"]  # replied-to, not also "mentioned"
        assert verbs(carol) == ["mentioned_you"]
        assert verbs(bob) == []

    def test_no_self_notifications_and_unknown_mentions_ignored(self):
        me = make_user("selfie")
        thread = make_thread(me)
        comment(client_for(me), thread, "note to self @selfie and @ghost-user")
        assert Notification.objects.count() == 0


@pytest.mark.django_db
class TestVoting:
    def test_toggle_switch_and_clear(self):
        author, voter = make_user("vauthor"), make_user("vvoter")
        thread = make_thread(author)
        client = client_for(voter)
        assert vote(client, "thread", thread.id, 1).data["score"] == 1
        assert vote(client, "thread", thread.id, 1).data["score"] == 0  # same vote again removes it
        assert vote(client, "thread", thread.id, -1).data["user_vote"] == -1
        assert vote(client, "thread", thread.id, 1).data["score"] == 1  # switching replaces, does not stack
        cleared = vote(client, "thread", thread.id, 0).data
        assert (cleared["score"], cleared["user_vote"]) == (0, 0) and Vote.objects.count() == 0

    def test_scores_add_up_across_voters(self):
        thread = make_thread(make_user("sauthor"))
        for name in ("s1", "s2", "s3"):
            vote(client_for(make_user(name)), "thread", thread.id, 1)
        vote(client_for(make_user("s4")), "thread", thread.id, -1)
        assert vote(client_for(make_user("s5")), "thread", thread.id, 1).data["score"] == 3

    def test_cannot_vote_on_your_own_post(self):
        author = make_user("selfvoter")
        thread = make_thread(author)
        res = vote(client_for(author), "thread", thread.id, 1)
        assert res.status_code == 400 and "object_id" in res.data["error"]["fields"]

    @pytest.mark.parametrize(
        "body,field",
        [
            ({"object_id": 1, "value": 1}, "content_type"),
            ({"content_type": "user", "object_id": 1, "value": 1}, "content_type"),
            ({"content_type": "thread", "object_id": "x", "value": 1}, "object_id"),
            ({"content_type": "thread", "object_id": 1, "value": 5}, "value"),
            ({"content_type": "thread", "object_id": 1, "value": "up"}, "value"),
        ],
    )
    def test_bad_votes_are_field_errors(self, body, field):
        res = client_for(make_user("badvoter")).post("/api/v1/vote/", body, format="json")
        assert res.status_code == 400 and field in res.data["error"]["fields"]

    def test_unknown_target_is_404_and_login_is_required(self):
        assert vote(client_for(make_user("v404")), "thread", 99999, 1).status_code == 404
        assert vote(client_for(), "thread", 1, 1).status_code == 401

    def test_helpful_comment_xp_is_paid_to_its_author_once_per_comment(self):
        thread_author, commenter = make_user("hauthor"), make_user("hcommenter")
        thread = make_thread(thread_author)
        first = comment(client_for(commenter), thread, "great answer").data
        second = comment(client_for(commenter), thread, "another great answer").data
        for index in range(5):
            voter = make_user(f"hv{index}")
            res = vote(client_for(voter), "comment", first["id"], 1)
            vote(client_for(voter), "comment", second["id"], 1)
        commenter.refresh_from_db()
        # 25 XP for each of the two helpful comments (the old constant source paid only the first, ever)
        assert commenter.xp == 50 and XPEvent.objects.filter(user=commenter, reason="helpful_comment").count() == 2
        assert Comment.objects.get(pk=first["id"]).xp_awarded is True
        for voter in User.objects.filter(username__startswith="hv"):
            assert voter.xp == 0  # voters earn nothing
        assert res.data["score"] == 5
        # more votes never pay again
        vote(client_for(make_user("hv-late")), "comment", first["id"], 1)
        commenter.refresh_from_db()
        assert commenter.xp == 50


@pytest.mark.django_db
class TestTagsAndReports:
    def test_tag_counts_are_real_thread_counts(self):
        user = make_user("tagger")
        make_thread(user, tags=["python", "web"])
        make_thread(user, tags=["python"])
        Tag.objects.create(name="unused")
        rows = client_for().get("/api/v1/tags/").data
        assert [(t["name"], t["count"]) for t in rows] == [("python", 2), ("web", 1)]  # unused tags are hidden

    def test_report_is_stored_once_per_person_per_item(self):
        author, reporter = make_user("rauthor"), make_user("reporter")
        thread = make_thread(author)
        client = client_for(reporter)
        first = client.post("/api/v1/report/", {"content_type": "thread", "object_id": thread.id, "reason": "Spam"}, format="json")
        again = client.post("/api/v1/report/", {"content_type": "thread", "object_id": thread.id, "reason": "Spam again"}, format="json")
        assert (first.status_code, again.status_code, again.data["already_reported"]) == (201, 200, True)
        assert Report.objects.count() == 1 and Report.objects.get().reason == "Spam"

    def test_report_validation(self):
        thread = make_thread(make_user("rvauthor"))
        client = client_for(make_user("rvreporter"))
        assert client.post("/api/v1/report/", {"content_type": "thread", "object_id": thread.id, "reason": "x" * 256}, format="json").status_code == 400
        assert client.post("/api/v1/report/", {"content_type": "nope", "object_id": 1}, format="json").status_code == 400
        assert client.post("/api/v1/report/", {"content_type": "comment", "object_id": 99999}, format="json").status_code == 404
        assert client_for().post("/api/v1/report/", {"content_type": "thread", "object_id": thread.id}, format="json").status_code == 401
