"""Projects: visibility, create/edit/delete, teams (join, invite, roles, leave), tasks, milestones, updates, XP."""
import io

import pytest
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image
from rest_framework.test import APIClient

from gamification.models import Badge, UserBadge, XPEvent
from notifications.models import Notification
from projects.models import JoinRequest, Milestone, Project, ProjectMember, Task

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


def make_project(owner, title="Open Path", members=(), **extra):
    project = Project.objects.create(owner=owner, title=title, summary="A summary", description="A long description", category="Education", max_members=extra.pop("max_members", 5), **extra)
    ProjectMember.objects.create(project=project, user=owner, role="owner")
    for user in members:
        ProjectMember.objects.create(project=project, user=user, role="member")
    return project


def rows(data):
    return data if isinstance(data, list) else data["results"]


CREATE = {"title": "Brand New Project", "summary": "Short summary", "description": "Longer description text", "category": "Learning", "tech_stack": ["Python", "python", " React "], "looking_for_roles": ["Designer"], "max_members": 4}


@pytest.mark.django_db
class TestVisibilityAndList:
    def test_private_projects_are_hidden_from_other_signed_in_users(self):
        owner, member, outsider = make_user("own"), make_user("mem"), make_user("out")
        make_project(owner, "Public One")
        secret = make_project(owner, "Secret One", members=[member], is_public=False)
        titles = lambda user: sorted(p["title"] for p in rows(client_for(user).get("/api/v1/projects/").data))  # noqa: E731
        assert titles(outsider) == ["Public One"]  # used to include every private project
        assert titles(member) == ["Public One", "Secret One"] and titles(owner) == ["Public One", "Secret One"]
        assert [p["title"] for p in rows(client_for().get("/api/v1/projects/").data)] == ["Public One"]
        assert client_for(outsider).get(f"/api/v1/projects/{secret.slug}/").status_code == 404
        assert client_for(member).get(f"/api/v1/projects/{secret.slug}/").status_code == 200

    def test_progress_is_not_inflated_by_team_size(self):
        owner, a, b = make_user("po"), make_user("pa"), make_user("pb")
        project = make_project(owner, members=[a, b])  # 3 members
        for index in range(3):
            Task.objects.create(project=project, title=f"t{index}", status="done" if index < 2 else "todo")
        row = rows(client_for(owner).get("/api/v1/projects/").data)[0]
        assert row["task_progress"] == {"total": 3, "done": 2, "percent": 67}  # a joined Sum used to report done=6
        assert (row["member_count"], row["spots_left"]) == (3, 2)

    def test_card_payload(self):
        owner = make_user("cardowner")
        make_project(owner, tech_stack=["React"], looking_for_roles=["QA engineer"])
        row = rows(client_for(owner).get("/api/v1/projects/").data)[0]
        assert row["tech_stack"] == ["React"] and row["looking_for_roles"] == ["QA engineer"]
        assert row["owner"]["username"] == "cardowner" and row["member_preview"][0]["username"] == "cardowner"

    def test_filters_and_ordering(self):
        a, b = make_user("fa"), make_user("fb")
        p1 = make_project(a, "Alpha Tool", tech_stack=["React", "Python"], status="active", max_members=2, members=[b])  # full
        p2 = make_project(a, "Beta Site", tech_stack=["React"], status="idea", max_members=6)
        Task.objects.create(project=p2, title="busy", status="in_progress")
        client = client_for(a)
        titles = lambda **p: [x["title"] for x in rows(client.get("/api/v1/projects/", p).data)]  # noqa: E731
        assert sorted(titles(status="active")) == ["Alpha Tool"]
        assert titles(search="beta") == ["Beta Site"]
        assert sorted(titles(tech=["react"])) == ["Alpha Tool", "Beta Site"]
        assert titles(tech=["react", "python"]) == ["Alpha Tool"]
        assert titles(looking="true") == ["Beta Site"]  # Alpha is full
        assert titles(mine="true") == ["Beta Site", "Alpha Tool"]
        assert titles(ordering="active")[0] == "Beta Site"
        assert titles(ordering="fewest")[0] == "Alpha Tool"

    def test_list_query_count_is_flat(self, django_assert_max_num_queries):
        owner = make_user("qc")
        for index in range(10):
            make_project(owner, f"Project {index}", tech_stack=["a"])
        with django_assert_max_num_queries(10):
            client_for(owner).get("/api/v1/projects/")


@pytest.mark.django_db
class TestCreateEditDelete:
    def test_create_makes_owner_member_and_pays_xp_once_per_project(self):
        user = make_user("creator")
        res = client_for(user).post("/api/v1/projects/create/", CREATE, format="json")
        assert res.status_code == 201
        assert (res.data["xp_awarded"], res.data["status"], res.data["tech_stack"]) == (75, "idea", ["Python", "React"])
        assert res.data["viewer"]["is_owner"] is True and res.data["members"][0]["role"] == "owner"
        second = client_for(user).post("/api/v1/projects/create/", {**CREATE, "title": "Second Project"}, format="json")
        assert second.data["xp_awarded"] == 75  # per project, not once ever
        user.refresh_from_db()
        assert user.xp == 150

    def test_daily_cap_on_project_xp(self):
        user = make_user("spammer")
        client = client_for(user)
        paid = [client.post("/api/v1/projects/create/", {**CREATE, "title": f"Project number {i}"}, format="json").data["xp_awarded"] for i in range(5)]
        assert paid == [75, 75, 75, 0, 0] and Project.objects.filter(owner=user).count() == 5

    def test_duplicate_titles_get_distinct_slugs(self):
        user = make_user("dupes")
        a = client_for(user).post("/api/v1/projects/create/", CREATE, format="json").data["slug"]
        b = client_for(user).post("/api/v1/projects/create/", CREATE, format="json").data["slug"]
        assert a != b

    @pytest.mark.parametrize(
        "changes,field",
        [
            ({"title": "ab"}, "title"),
            ({"status": "planning"}, "status"),
            ({"max_members": 0}, "max_members"),
            ({"max_members": 51}, "max_members"),
            ({"tech_stack": ["x" * 31]}, "tech_stack"),
            ({"tech_stack": [str(i) for i in range(16)]}, "tech_stack"),
            ({"looking_for_roles": ["r"] * 3 + ["y" * 41]}, "looking_for_roles"),
            ({"summary": "s" * 256}, "summary"),
        ],
    )
    def test_invalid_projects_are_field_errors(self, changes, field):
        res = client_for(make_user("invalid")).post("/api/v1/projects/create/", {**CREATE, **changes}, format="json")
        assert res.status_code == 400 and field in res.data["error"]["fields"]

    def test_login_required(self):
        assert client_for().post("/api/v1/projects/create/", CREATE, format="json").status_code == 401

    def test_detail_for_a_visitor_has_public_parts_but_no_tasks(self):
        owner, visitor = make_user("downer"), make_user("dvisitor")
        project = make_project(owner)
        Task.objects.create(project=project, title="secret board task")
        Milestone.objects.create(project=project, title="Ship v1")
        client_for(owner).post(f"/api/v1/projects/{project.slug}/updates/", {"body": "First update"}, format="json")
        data = client_for(visitor).get(f"/api/v1/projects/{project.slug}/").data
        assert data["tasks"] == [] and [m["title"] for m in data["milestones"]] == ["Ship v1"] and data["updates"][0]["body"] == "First update"
        assert data["viewer"] == {"is_member": False, "is_owner": False, "role": None, "join_request": None}
        assert len(client_for(owner).get(f"/api/v1/projects/{project.slug}/").data["tasks"]) == 1

    def test_owner_edits_including_cover_upload(self, settings, tmp_path):
        settings.MEDIA_ROOT = tmp_path
        owner = make_user("editor")
        project = make_project(owner)
        client = client_for(owner)
        res = client.patch(f"/api/v1/projects/{project.slug}/", {"title": "Renamed Project", "status": "active", "tech_stack": ["Go"]}, format="json")
        assert res.status_code == 200 and (res.data["title"], res.data["status"], res.data["tech_stack"]) == ("Renamed Project", "active", ["Go"])
        assert res.data["slug"] == project.slug  # links keep working after a rename
        buffer = io.BytesIO()
        Image.new("RGB", (10, 10), "blue").save(buffer, format="PNG")
        up = client.patch(f"/api/v1/projects/{project.slug}/", {"cover": SimpleUploadedFile("c.png", buffer.getvalue(), content_type="image/png")}, format="multipart")
        assert up.status_code == 200 and up.data["cover"].startswith("http://testserver/media/projects/covers/")

    def test_cannot_shrink_below_current_team(self):
        owner, a, b = make_user("shrink"), make_user("sa"), make_user("sb")
        project = make_project(owner, members=[a, b])
        res = client_for(owner).patch(f"/api/v1/projects/{project.slug}/", {"max_members": 2}, format="json")
        assert res.status_code == 400 and "max_members" in res.data["error"]["fields"]

    def test_only_the_owner_edits_or_deletes_but_staff_can_delete(self):
        owner, member, staff = make_user("eo"), make_user("em"), make_user("staffer", is_staff=True)
        project = make_project(owner, members=[member])
        for user in (member,):
            assert client_for(user).patch(f"/api/v1/projects/{project.slug}/", {"title": "Hijack"}, format="json").status_code == 403
            assert client_for(user).delete(f"/api/v1/projects/{project.slug}/").status_code == 403
        assert client_for(staff).delete(f"/api/v1/projects/{project.slug}/").status_code == 200
        assert not Project.objects.filter(pk=project.pk).exists()


@pytest.mark.django_db
class TestJoinInviteAndTeam:
    def test_join_request_approval_flow_with_notifications_and_xp(self):
        owner, joiner = make_user("jo"), make_user("jj")
        project = make_project(owner)
        res = client_for(joiner).post(f"/api/v1/projects/{project.slug}/join/", {"message": "Let me in"}, format="json")
        assert res.status_code == 201 and res.data["status"] == "pending"
        assert Notification.objects.filter(user=owner, actor=joiner, verb="project_join_request").count() == 1
        assert Notification.objects.get(user=owner).target_object == project  # the bell can link to the project
        inbox = client_for(owner).get(f"/api/v1/projects/{project.slug}/requests/").data
        assert [(r["user"]["username"], r["message"]) for r in inbox] == [("jj", "Let me in")]
        done = client_for(owner).post(f"/api/v1/requests/{inbox[0]['id']}/respond/", {"status": "approved"}, format="json")
        assert done.data["status"] == "approved" and ProjectMember.objects.filter(project=project, user=joiner, role="member").exists()
        joiner.refresh_from_db()
        assert joiner.xp == 40
        assert Notification.objects.filter(user=joiner, verb="project_join_approved").count() == 1
        assert client_for(joiner).get(f"/api/v1/projects/{project.slug}/").data["viewer"]["is_member"] is True

    def test_repeat_and_invalid_join_attempts(self):
        owner, joiner = make_user("ro"), make_user("rj")
        project = make_project(owner)
        client = client_for(joiner)
        client.post(f"/api/v1/projects/{project.slug}/join/", {}, format="json")
        assert client.post(f"/api/v1/projects/{project.slug}/join/", {}, format="json").status_code == 400  # already pending
        assert client_for(owner).post(f"/api/v1/projects/{project.slug}/join/", {}, format="json").status_code == 400  # own team
        assert client.post(f"/api/v1/projects/{project.slug}/join/", {"message": "x" * 1001}, format="json").status_code == 400
        Project.objects.filter(pk=project.pk).update(status="completed")
        assert client_for(make_user("late")).post(f"/api/v1/projects/{project.slug}/join/", {}, format="json").status_code == 400

    def test_a_rejected_person_can_ask_again(self):
        owner, joiner = make_user("ao"), make_user("aj")
        project = make_project(owner)
        client = client_for(joiner)
        first = client.post(f"/api/v1/projects/{project.slug}/join/", {"message": "one"}, format="json").data
        client_for(owner).post(f"/api/v1/requests/{first['id']}/respond/", {"status": "rejected"}, format="json")
        again = client.post(f"/api/v1/projects/{project.slug}/join/", {"message": "two"}, format="json")
        assert again.status_code == 201 and again.data["status"] == "pending" and again.data["message"] == "two"
        assert JoinRequest.objects.count() == 1

    def test_full_teams_refuse_requests_and_approvals(self):
        owner, a, b = make_user("fo"), make_user("fa1"), make_user("fb1")
        project = make_project(owner, max_members=2, members=[a])
        assert client_for(b).post(f"/api/v1/projects/{project.slug}/join/", {}, format="json").status_code == 400
        # a request made before the team filled up cannot be approved once it is full
        Project.objects.filter(pk=project.pk).update(max_members=3)
        request_id = client_for(b).post(f"/api/v1/projects/{project.slug}/join/", {}, format="json").data["id"]
        ProjectMember.objects.create(project=project, user=make_user("sneak"), role="member")
        assert client_for(owner).post(f"/api/v1/requests/{request_id}/respond/", {"status": "approved"}, format="json").status_code == 400
        assert not ProjectMember.objects.filter(project=project, user=b).exists()

    def test_respond_rules(self):
        owner, joiner, other = make_user("so"), make_user("sj"), make_user("sx")
        project = make_project(owner)
        rid = client_for(joiner).post(f"/api/v1/projects/{project.slug}/join/", {}, format="json").data["id"]
        assert client_for(other).post(f"/api/v1/requests/{rid}/respond/", {"status": "approved"}, format="json").status_code == 403
        assert client_for(joiner).post(f"/api/v1/requests/{rid}/respond/", {"status": "approved"}, format="json").status_code == 403  # can't approve yourself
        assert client_for(owner).post(f"/api/v1/requests/{rid}/respond/", {"status": "maybe"}, format="json").status_code == 400
        assert client_for(owner).post(f"/api/v1/requests/{rid}/respond/", {"status": "decline"}, format="json").data["status"] == "rejected"
        assert client_for(owner).post(f"/api/v1/requests/{rid}/respond/", {"status": "approved"}, format="json").status_code == 400  # already answered
        assert client_for(other).get(f"/api/v1/projects/{project.slug}/requests/").status_code == 403

    def test_invitation_accept_and_decline(self):
        owner, guest, shy = make_user("io"), make_user("ig"), make_user("is")
        project = make_project(owner)
        invite = client_for(owner).post(f"/api/v1/projects/{project.slug}/invite/", {"username": "IG"}, format="json")
        assert invite.status_code == 201 and invite.data["status"] == "invited"
        assert Notification.objects.filter(user=guest, verb="project_invite").count() == 1
        assert client_for(guest).get(f"/api/v1/projects/{project.slug}/").data["viewer"]["join_request"]["status"] == "invited"
        assert client_for(owner).post(f"/api/v1/projects/{project.slug}/invite/", {"username": "ig"}, format="json").status_code == 400  # already invited
        # only the invitee answers, not the owner
        assert client_for(owner).post(f"/api/v1/requests/{invite.data['id']}/respond/", {"status": "approved"}, format="json").status_code == 403
        ok = client_for(guest).post(f"/api/v1/requests/{invite.data['id']}/respond/", {"status": "approved"}, format="json")
        assert ok.status_code == 200 and ProjectMember.objects.filter(project=project, user=guest).exists()
        assert Notification.objects.filter(user=owner, verb="project_invite_accepted").count() == 1
        second = client_for(owner).post(f"/api/v1/projects/{project.slug}/invite/", {"username": "is"}, format="json").data
        client_for(shy).post(f"/api/v1/requests/{second['id']}/respond/", {"status": "declined"}, format="json")
        assert not ProjectMember.objects.filter(project=project, user=shy).exists()
        assert Notification.objects.filter(user=owner, verb="project_invite_declined").count() == 1

    def test_joining_after_being_invited_accepts_the_invitation(self):
        owner, guest = make_user("jio"), make_user("jig")
        project = make_project(owner)
        client_for(owner).post(f"/api/v1/projects/{project.slug}/invite/", {"username": "jig"}, format="json")
        res = client_for(guest).post(f"/api/v1/projects/{project.slug}/join/", {}, format="json")
        assert res.status_code == 200 and ProjectMember.objects.filter(project=project, user=guest).exists()

    @pytest.mark.parametrize("username,expected", [("nobody-here", 400), ("io2", 400), ("", 400)])
    def test_invite_validation(self, username, expected):
        owner = make_user("io2")
        project = make_project(owner)
        assert client_for(owner).post(f"/api/v1/projects/{project.slug}/invite/", {"username": username}, format="json").status_code == expected

    def test_only_the_owner_can_invite(self):
        owner, member, target = make_user("ino"), make_user("inm"), make_user("int")
        project = make_project(owner, members=[member])
        assert client_for(member).post(f"/api/v1/projects/{project.slug}/invite/", {"username": "int"}, format="json").status_code == 403

    def test_roles_removal_and_leaving(self):
        owner, a, b = make_user("mo"), make_user("ma"), make_user("mb")
        project = make_project(owner, members=[a, b])
        task = Task.objects.create(project=project, title="assigned", assignee=a)
        base = f"/api/v1/projects/{project.slug}/members"
        assert client_for(owner).patch(f"{base}/{a.id}/", {"role": "mentor"}, format="json").data["role"] == "mentor"
        assert client_for(owner).patch(f"{base}/{a.id}/", {"role": "owner"}, format="json").status_code == 400
        assert client_for(a).patch(f"{base}/{b.id}/", {"role": "mentor"}, format="json").status_code == 403
        assert client_for(owner).patch(f"{base}/{owner.id}/", {"role": "member"}, format="json").status_code == 400
        # a member can't remove another member, but the owner can, and their tasks become unassigned
        assert client_for(b).delete(f"{base}/{a.id}/").status_code == 403
        assert client_for(owner).delete(f"{base}/{a.id}/").status_code == 200
        task.refresh_from_db()
        assert task.assignee is None and not ProjectMember.objects.filter(project=project, user=a).exists()
        assert Notification.objects.filter(user=a, verb="project_removed").count() == 1
        # a member leaves by removing themself; the owner can't leave
        assert client_for(b).delete(f"{base}/{b.id}/").status_code == 200
        assert client_for(owner).delete(f"{base}/{owner.id}/").status_code == 400
        assert Notification.objects.filter(user=owner, verb="project_member_left").count() == 1


@pytest.mark.django_db
class TestTasks:
    def test_members_only_and_validation(self):
        owner, member, outsider = make_user("to"), make_user("tm"), make_user("tx")
        project = make_project(owner, members=[member])
        url = f"/api/v1/projects/{project.slug}/tasks/"
        assert client_for(outsider).get(url).status_code == 403 and client_for(outsider).post(url, {"title": "x"}, format="json").status_code == 403
        assert client_for(member).post(url, {"title": ""}, format="json").status_code == 400
        assert client_for(member).post(url, {"title": "t", "status": "wat"}, format="json").status_code == 400
        assert client_for(member).post(url, {"title": "t", "priority": "meh"}, format="json").status_code == 400
        assert client_for(member).post(url, {"title": "t", "assignee_id": outsider.id}, format="json").status_code == 400  # assignee must be on the team
        assert client_for(member).post(url, {"title": "t", "assignee_id": "abc"}, format="json").status_code == 400  # junk id is a 400, not a 500
        ok = client_for(member).post(url, {"title": "Real task", "assignee_id": member.id, "due_date": "2030-01-05", "priority": "high"}, format="json")
        assert ok.status_code == 201 and ok.data["assignee"]["username"] == "tm" and ok.data["due_date"] == "2030-01-05"

    def test_legacy_assignee_key_still_works(self):
        owner = make_user("lo")
        project = make_project(owner)
        res = client_for(owner).post(f"/api/v1/projects/{project.slug}/tasks/", {"title": "legacy", "assignee": owner.id}, format="json")
        assert res.status_code == 201 and res.data["assignee"]["id"] == owner.id

    def test_reassigning_and_unassigning_notifies(self):
        owner, member = make_user("ro2"), make_user("rm2")
        project = make_project(owner, members=[member])
        task = Task.objects.create(project=project, title="movable")
        client = client_for(owner)
        res = client.patch(f"/api/v1/tasks/{task.id}/", {"assignee_id": member.id}, format="json")
        assert res.data["assignee"]["username"] == "rm2"
        assert Notification.objects.filter(user=member, verb="task_assigned").count() == 1
        assert client.patch(f"/api/v1/tasks/{task.id}/", {"assignee_id": None}, format="json").data["assignee"] is None
        assert client.patch(f"/api/v1/tasks/{task.id}/", {"title": "renamed"}, format="json").data["title"] == "renamed"

    def test_completion_xp_goes_to_the_assignee_once_per_task(self):
        owner, member = make_user("xo"), make_user("xm")
        project = make_project(owner, members=[member])
        mine = Task.objects.create(project=project, title="mine", assignee=member)
        res = client_for(member).patch(f"/api/v1/tasks/{mine.id}/", {"status": "done"}, format="json")
        assert res.data["xp_awarded"] == 15
        client_for(member).patch(f"/api/v1/tasks/{mine.id}/", {"status": "todo"}, format="json")
        again = client_for(member).patch(f"/api/v1/tasks/{mine.id}/", {"status": "done"}, format="json")
        assert again.data["xp_awarded"] == 0  # reopening and finishing again doesn't pay twice
        other = Task.objects.create(project=project, title="teammate's", assignee=member)
        by_owner = client_for(owner).patch(f"/api/v1/tasks/{other.id}/", {"status": "done"}, format="json")
        assert by_owner.data["xp_awarded"] == 0 and by_owner.data["xp_recipient"] == "xm"  # paid to the assignee, not to who clicked
        member.refresh_from_db(), owner.refresh_from_db()
        assert (member.xp, owner.xp) == (30, 0)

    def test_task_xp_is_capped_per_day(self):
        owner = make_user("capowner")
        project = make_project(owner)
        client = client_for(owner)
        paid = []
        for index in range(12):
            task = Task.objects.create(project=project, title=f"farm {index}", assignee=owner)
            paid.append(client.patch(f"/api/v1/tasks/{task.id}/", {"status": "done"}, format="json").data["xp_awarded"])
        assert paid == [15] * 10 + [0, 0]

    def test_task_badges_count_completed_tasks_not_assigned_ones(self):
        Badge.objects.create(name="First Task", slug="first-task", criteria_key="first_task", xp_reward=0)
        owner = make_user("badgeowner")
        project = make_project(owner)
        task = Task.objects.create(project=project, title="badge", assignee=owner)
        client_for(owner).patch(f"/api/v1/tasks/{task.id}/", {"title": "still just assigned"}, format="json")
        assert UserBadge.objects.filter(user=owner).count() == 0
        client_for(owner).patch(f"/api/v1/tasks/{task.id}/", {"status": "done"}, format="json")
        assert UserBadge.objects.filter(user=owner, badge__criteria_key="first_task").count() == 1

    def test_delete_is_owner_only_and_outsiders_are_blocked(self):
        owner, member, outsider = make_user("do"), make_user("dm"), make_user("dx")
        project = make_project(owner, members=[member])
        task = Task.objects.create(project=project, title="deletable")
        assert client_for(member).delete(f"/api/v1/tasks/{task.id}/").status_code == 403
        assert client_for(outsider).patch(f"/api/v1/tasks/{task.id}/", {"title": "x"}, format="json").status_code == 403
        assert client_for(owner).delete(f"/api/v1/tasks/{task.id}/").status_code == 200


@pytest.mark.django_db
class TestMilestonesAndUpdates:
    def test_milestone_create_edit_complete_delete(self):
        owner, member = make_user("mso"), make_user("msm")
        project = make_project(owner, members=[member])
        client = client_for(member)
        created = client.post(f"/api/v1/projects/{project.slug}/milestones/", {"title": "Beta", "due_date": "2030-02-01", "status": "planned"}, format="json")
        assert created.status_code == 201
        mid = created.data["id"]
        edited = client.patch(f"/api/v1/milestones/{mid}/", {"title": "Beta launch"}, format="json")
        assert edited.data["title"] == "Beta launch" and edited.data["xp_awarded"] == 0 and Milestone.objects.count() == 1  # edits, not a new row
        done = client.patch(f"/api/v1/milestones/{mid}/", {"status": "done"}, format="json")
        assert done.data["xp_awarded"] == 60
        client.patch(f"/api/v1/milestones/{mid}/", {"status": "planned"}, format="json")
        assert client.patch(f"/api/v1/milestones/{mid}/", {"status": "done"}, format="json").data["xp_awarded"] == 0
        assert client.delete(f"/api/v1/milestones/{mid}/").status_code == 403  # owner only
        assert client_for(owner).delete(f"/api/v1/milestones/{mid}/").status_code == 200

    @pytest.mark.parametrize("body", [{"title": ""}, {"title": "x", "status": "complete"}, {"title": "x", "due_date": "not-a-date"}])
    def test_invalid_milestones(self, body):
        owner = make_user("imo")
        project = make_project(owner)
        assert client_for(owner).post(f"/api/v1/projects/{project.slug}/milestones/", body, format="json").status_code == 400

    def test_outsiders_cannot_touch_milestones(self):
        owner, outsider = make_user("oo"), make_user("ox")
        project = make_project(owner)
        milestone = Milestone.objects.create(project=project, title="m")
        assert client_for(outsider).post(f"/api/v1/projects/{project.slug}/milestones/", {"title": "x"}, format="json").status_code == 403
        assert client_for(outsider).patch(f"/api/v1/milestones/{milestone.id}/", {"title": "x"}, format="json").status_code == 403

    def test_updates_notify_the_team_but_not_the_author(self):
        owner, member, other = make_user("uo"), make_user("um"), make_user("uom")
        project = make_project(owner, members=[member, other])
        res = client_for(member).post(f"/api/v1/projects/{project.slug}/updates/", {"body": "We shipped it"}, format="json")
        assert res.status_code == 201 and res.data["author"]["username"] == "um"
        assert sorted(Notification.objects.filter(verb="project_update").values_list("user__username", flat=True)) == ["uo", "uom"]
        # an owner posting their own update no longer notifies themself
        client_for(owner).post(f"/api/v1/projects/{project.slug}/updates/", {"body": "Thanks all"}, format="json")
        assert not Notification.objects.filter(user=owner, actor=owner).exists()

    @pytest.mark.parametrize("body", ["", "  ", "x" * 5001])
    def test_invalid_updates(self, body):
        owner = make_user("iuo")
        project = make_project(owner)
        assert client_for(owner).post(f"/api/v1/projects/{project.slug}/updates/", {"body": body}, format="json").status_code == 400

    def test_update_list_is_members_only(self):
        owner, outsider = make_user("ulo"), make_user("ulx")
        project = make_project(owner)
        assert client_for(outsider).get(f"/api/v1/projects/{project.slug}/updates/").status_code == 403
