from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema

from django.contrib.auth import get_user_model
from django.db.models import Count, F, IntegerField, OuterRef, Q, Subquery
from django.db.models.functions import Coalesce
from django.http import Http404
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from gamification.models import XPEvent
from gamification.services import XP_RULES, award_xp
from notifications.services import create_notification
from .models import JoinRequest, Milestone, Project, ProjectMember, ProjectUpdate, Task
from .serializers import (
    JoinRequestSerializer,
    MilestoneSerializer,
    ProjectDetailSerializer,
    ProjectSerializer,
    ProjectUpdateSerializer,
    TaskSerializer,
)

User = get_user_model()

# XP is paid for the first few of each action per day, so creating things just to farm XP stops paying.
DAILY_XP_CAPS = {"project_create": 3, "project_join": 5, "task_complete": 10, "milestone_complete": 3}
MAX_JOIN_MESSAGE = 1000
CLOSED_STATUSES = (Project.STATUS_COMPLETED, Project.STATUS_ARCHIVED)


# --------------------------------------------------------------------------- helpers
def _membership(project, user):
    if not user or not user.is_authenticated:
        return None
    return ProjectMember.objects.filter(project=project, user=user).first()


def is_project_member(project, user):
    if not user or not user.is_authenticated:
        return False
    return project.owner_id == user.id or ProjectMember.objects.filter(project=project, user=user).exists()


def is_project_owner(project, user):
    return bool(user and user.is_authenticated and project.owner_id == user.id)


def _visible(queryset, user):
    """Public projects, plus private ones the viewer owns or belongs to. (Signed-in users used to see ALL private projects.)"""
    if user and user.is_authenticated:
        return queryset.filter(Q(is_public=True) | Q(owner=user) | Q(members__user=user)).distinct()
    return queryset.filter(is_public=True)


def _count_subquery(model, **filters):
    rows = model.objects.filter(project=OuterRef("pk"), **filters).values("project").annotate(total=Count("pk")).values("total")
    return Coalesce(Subquery(rows, output_field=IntegerField()), 0)


def _annotated(queryset):
    """Team size and task counts computed by subqueries. (A joined Sum multiplied the done-count by the team size.)"""
    return queryset.annotate(
        member_count=_count_subquery(ProjectMember),
        task_total=_count_subquery(Task),
        task_done=_count_subquery(Task, status=Task.STATUS_DONE),
        active_tasks=_count_subquery(Task, status=Task.STATUS_IN_PROGRESS),
    ).annotate(spots=F("max_members") - F("member_count"))


def _get_project(slug, user, *, members_only=False):
    """404 (not 403) for a private project the viewer can't see, so its existence isn't revealed."""
    project = get_object_or_404(Project.objects.select_related("owner"), slug=slug)
    if not project.is_public and not is_project_member(project, user):
        raise Http404
    if members_only and not is_project_member(project, user):
        raise PermissionDenied("You must be a project member to do that.")
    return project


def _detail(project, request):
    fresh = _annotated(Project.objects.filter(pk=project.pk).select_related("owner").prefetch_related("members__user")).get()
    return ProjectDetailSerializer(fresh, context={"request": request}).data


def _award_capped(user, reason, source):
    """Award XP for `reason` unless the daily cap is reached. Returns the XP actually paid."""
    cap = DAILY_XP_CAPS[reason]
    paid_today = XPEvent.objects.filter(user=user, reason=reason, created_at__date=timezone.localdate()).count()
    if paid_today >= cap:
        return 0
    event = award_xp(user, reason, XP_RULES[reason], source=source)
    return event.amount if event else 0


def _text(value, field, max_length, required=False):
    text = str(value or "").strip()
    if required and not text:
        raise ValidationError({field: ["This field may not be blank."]})
    if len(text) > max_length:
        raise ValidationError({field: [f"Ensure this field has no more than {max_length} characters."]})
    return text


def _int(value, field):
    try:
        return int(value)
    except (TypeError, ValueError):
        raise ValidationError({field: ["A whole number is required."]})


# --------------------------------------------------------------------------- projects
class ProjectListAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(operation_id='projects_project_list_get', responses={200: ProjectSerializer(many=True)})
    def get(self, request, *args, **kwargs):
        user = request.user
        queryset = _annotated(_visible(Project.objects.select_related("owner").prefetch_related("members__user"), user))

        if status_filter := request.query_params.get("status"):
            queryset = queryset.filter(status=status_filter)
        if category := request.query_params.get("category"):
            queryset = queryset.filter(category__iexact=category)
        if search := (request.query_params.get("search") or request.query_params.get("q")):
            queryset = queryset.filter(Q(title__icontains=search) | Q(summary__icontains=search) | Q(description__icontains=search))
        if request.query_params.get("mine") in {"1", "true", "yes"} and user.is_authenticated:
            queryset = queryset.filter(Q(owner=user) | Q(members__user=user)).distinct()
        if request.query_params.get("looking") in {"1", "true", "yes"}:
            queryset = queryset.filter(spots__gt=0).exclude(status__in=CLOSED_STATUSES)

        ordering = request.query_params.get("ordering", "newest")
        if ordering == "active":
            queryset = queryset.order_by("-active_tasks", "-created_at")
        elif ordering == "fewest":
            queryset = queryset.order_by("spots", "-created_at")
        else:
            queryset = queryset.order_by("-created_at")

        projects = list(queryset)
        wanted = {item.strip().lower() for item in request.query_params.getlist("tech") if item.strip()}
        if wanted:  # has ALL of the chosen technologies (tech_stack is a JSON list, filtered here)
            projects = [p for p in projects if wanted <= {str(t).lower() for t in (p.tech_stack or [])}]
        return Response(ProjectSerializer(projects, many=True, context={"request": request}).data, status=status.HTTP_200_OK)


class ProjectCreateAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    @extend_schema(operation_id='projects_project_create_post', request=ProjectSerializer, responses={201: OpenApiTypes.OBJECT})
    def post(self, request, *args, **kwargs):
        serializer = ProjectSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        project = serializer.save(owner=request.user)
        ProjectMember.objects.create(project=project, user=request.user, role="owner")
        xp = _award_capped(request.user, "project_create", source=f"project:{project.id}")
        payload = _detail(project, request)
        payload["xp_awarded"] = xp
        return Response(payload, status=status.HTTP_201_CREATED)


class ProjectDetailAPIView(APIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    @extend_schema(operation_id='projects_project_detail_get', responses={200: ProjectDetailSerializer})
    def get(self, request, slug, *args, **kwargs):
        project = _get_project(slug, request.user)
        return Response(_detail(project, request), status=status.HTTP_200_OK)

    @extend_schema(operation_id='projects_project_detail_patch', request=ProjectSerializer, responses={200: ProjectDetailSerializer})
    def patch(self, request, slug, *args, **kwargs):
        project = _get_project(slug, request.user)
        if not (is_project_owner(project, request.user) or request.user.is_staff):
            raise PermissionDenied("Only the project owner can edit this project.")
        serializer = ProjectSerializer(project, data=request.data, partial=True, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(_detail(project, request), status=status.HTTP_200_OK)

    @extend_schema(operation_id='projects_project_detail_delete', responses={200: OpenApiTypes.OBJECT})
    def delete(self, request, slug, *args, **kwargs):
        project = _get_project(slug, request.user)
        if not (is_project_owner(project, request.user) or request.user.is_staff):
            raise PermissionDenied("Only the project owner can delete this project.")
        project.delete()
        return Response({"detail": "Project deleted."}, status=status.HTTP_200_OK)


# --------------------------------------------------------------------------- joining, inviting, members
def _team_is_full(project):
    return project.members.count() >= project.max_members


def _add_member(join_request, actor):
    project = join_request.project
    ProjectMember.objects.get_or_create(project=project, user=join_request.user, defaults={"role": "member"})
    join_request.status = "approved"
    join_request.save(update_fields=["status"])
    _award_capped(join_request.user, "project_join", source=f"project_join:{project.id}")


class JoinProjectAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(operation_id='projects_join_project_post', request=OpenApiTypes.OBJECT, responses={200: JoinRequestSerializer, 201: JoinRequestSerializer})
    def post(self, request, slug, *args, **kwargs):
        project = _get_project(slug, request.user)
        if is_project_member(project, request.user):
            raise ValidationError({"detail": ["You are already on this team."]})
        if project.status in CLOSED_STATUSES:
            raise ValidationError({"detail": ["This project is no longer accepting members."]})
        message = _text(request.data.get("message"), "message", MAX_JOIN_MESSAGE)

        existing = JoinRequest.objects.filter(project=project, user=request.user).first()
        if existing and existing.status == "pending":
            raise ValidationError({"detail": ["You already asked to join this project."]})
        if _team_is_full(project):
            raise ValidationError({"detail": ["This team is full."]})

        if existing and existing.status == "invited":
            # Asking to join after being invited simply accepts the invitation.
            _add_member(existing, request.user)
            create_notification(project.owner, request.user, "project_invite_accepted", project)
            return Response(JoinRequestSerializer(existing, context={"request": request}).data, status=status.HTTP_200_OK)

        if existing:  # a rejected (or old approved-then-removed) request can be made again
            existing.status, existing.message = "pending", message
            existing.save(update_fields=["status", "message", "updated_at"])
            join_request = existing
        else:
            join_request = JoinRequest.objects.create(project=project, user=request.user, message=message)
        create_notification(project.owner, request.user, "project_join_request", project)
        return Response(JoinRequestSerializer(join_request, context={"request": request}).data, status=status.HTTP_201_CREATED)


class JoinRequestsAPIView(APIView):
    """The owner's inbox: people who asked to join, and people they invited who haven't answered."""

    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(operation_id='projects_join_requests_get', responses={200: JoinRequestSerializer(many=True)})
    def get(self, request, slug, *args, **kwargs):
        project = _get_project(slug, request.user)
        if not is_project_owner(project, request.user):
            raise PermissionDenied("Only the project owner can view join requests.")
        rows = JoinRequest.objects.filter(project=project, status__in=["pending", "invited"]).select_related("user", "project")
        return Response(JoinRequestSerializer(rows, many=True, context={"request": request}).data, status=status.HTTP_200_OK)


class JoinRequestRespondAPIView(APIView):
    """Owner answers a "pending" request; the invitee answers an "invited" one."""

    permission_classes = [permissions.IsAuthenticated]
    ACCEPT = {"approved", "accept", "accepted", "approve"}
    DECLINE = {"rejected", "decline", "declined", "reject"}

    @extend_schema(operation_id='projects_join_request_respond_post', request=OpenApiTypes.OBJECT, responses={200: JoinRequestSerializer})
    def post(self, request, id, *args, **kwargs):
        join_request = get_object_or_404(JoinRequest.objects.select_related("project", "user"), id=id)
        project = join_request.project
        answer = str(request.data.get("status") or "").lower()
        if answer not in self.ACCEPT | self.DECLINE:
            raise ValidationError({"status": ["Must be approved or rejected."]})
        approving = answer in self.ACCEPT

        if join_request.status == "invited":
            if request.user.id != join_request.user_id:
                raise PermissionDenied("Only the invited person can answer this invitation.")
            owner_side = False
        elif join_request.status == "pending":
            if not is_project_owner(project, request.user):
                raise PermissionDenied("Only the project owner can respond to requests.")
            owner_side = True
        else:
            raise ValidationError({"status": ["This request has already been answered."]})

        if approving:
            if _team_is_full(project):
                raise ValidationError({"detail": ["This team is full."]})
            _add_member(join_request, request.user)
        else:
            join_request.status = "rejected"
            join_request.save(update_fields=["status"])

        if owner_side:
            create_notification(join_request.user, request.user, "project_join_approved" if approving else "project_join_rejected", project)
        else:
            create_notification(project.owner, request.user, "project_invite_accepted" if approving else "project_invite_declined", project)
        return Response(JoinRequestSerializer(join_request, context={"request": request}).data, status=status.HTTP_200_OK)


class InviteAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(operation_id='projects_invite_post', request=OpenApiTypes.OBJECT, responses={201: JoinRequestSerializer})
    def post(self, request, slug, *args, **kwargs):
        project = _get_project(slug, request.user)
        if not is_project_owner(project, request.user):
            raise PermissionDenied("Only the project owner can invite people.")
        username = _text(request.data.get("username"), "username", 150, required=True)
        invitee = User.objects.filter(username__iexact=username, is_active=True).first()
        if invitee is None:
            raise ValidationError({"username": ["No member with that username."]})
        if is_project_member(project, invitee):
            raise ValidationError({"username": ["They are already on the team."]})
        if project.status in CLOSED_STATUSES:
            raise ValidationError({"detail": ["This project is no longer accepting members."]})
        if _team_is_full(project):
            raise ValidationError({"detail": ["The team is full."]})

        existing = JoinRequest.objects.filter(project=project, user=invitee).first()
        if existing and existing.status == "pending":
            raise ValidationError({"username": ["They already asked to join. Approve their request instead."]})
        if existing and existing.status == "invited":
            raise ValidationError({"username": ["They already have an invitation."]})
        if existing:
            existing.status, existing.message = "invited", f"Invited by {request.user.username}"
            existing.save(update_fields=["status", "message", "updated_at"])
            invitation = existing
        else:
            invitation = JoinRequest.objects.create(project=project, user=invitee, status="invited", message=f"Invited by {request.user.username}")
        create_notification(invitee, request.user, "project_invite", project)
        return Response(JoinRequestSerializer(invitation, context={"request": request}).data, status=status.HTTP_201_CREATED)


class MemberAPIView(APIView):
    """PATCH {"role": "member"|"mentor"} (owner). DELETE removes a member (owner) or leaves the team (yourself)."""

    permission_classes = [permissions.IsAuthenticated]

    def _target(self, project, user_id):
        return get_object_or_404(ProjectMember.objects.select_related("user"), project=project, user_id=user_id)

    @extend_schema(operation_id='projects_member_patch', request=OpenApiTypes.OBJECT, responses={200: OpenApiTypes.OBJECT})
    def patch(self, request, slug, user_id, *args, **kwargs):
        project = _get_project(slug, request.user)
        if not is_project_owner(project, request.user):
            raise PermissionDenied("Only the project owner can change roles.")
        member = self._target(project, user_id)
        if member.user_id == project.owner_id:
            raise ValidationError({"role": ["The owner's role can't be changed."]})
        role = str(request.data.get("role") or "").lower()
        if role not in {"member", "mentor"}:
            raise ValidationError({"role": ["Must be member or mentor."]})
        member.role = role
        member.save(update_fields=["role"])
        return Response({"id": member.id, "user_id": member.user_id, "role": member.role}, status=status.HTTP_200_OK)

    @extend_schema(operation_id='projects_member_delete', responses={200: OpenApiTypes.OBJECT})
    def delete(self, request, slug, user_id, *args, **kwargs):
        project = _get_project(slug, request.user)
        member = self._target(project, user_id)
        if member.user_id == project.owner_id:
            raise ValidationError({"detail": ["The owner can't leave. Delete the project instead."]})
        leaving = member.user_id == request.user.id
        if not leaving and not is_project_owner(project, request.user):
            raise PermissionDenied("Only the project owner can remove members.")
        Task.objects.filter(project=project, assignee_id=member.user_id).update(assignee=None)
        removed = member.user
        member.delete()
        if not leaving:
            create_notification(removed, request.user, "project_removed", project)
        else:
            create_notification(project.owner, request.user, "project_member_left", project)
        return Response({"detail": "You left the project." if leaving else "Member removed."}, status=status.HTTP_200_OK)


# --------------------------------------------------------------------------- tasks
def _apply_legacy_assignee(data):
    data = data.copy()
    if "assignee_id" not in data and "assignee" in data:
        data["assignee_id"] = data.get("assignee") or None
    data.pop("assignee", None)
    return data


class TaskListAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(operation_id='projects_task_list_get', responses={200: TaskSerializer(many=True)})
    def get(self, request, slug, *args, **kwargs):
        project = _get_project(slug, request.user, members_only=True)
        return Response(TaskSerializer(project.tasks.select_related("assignee"), many=True, context={"request": request}).data, status=status.HTTP_200_OK)

    @extend_schema(operation_id='projects_task_list_post', request=TaskSerializer, responses={201: TaskSerializer})
    def post(self, request, slug, *args, **kwargs):
        project = _get_project(slug, request.user, members_only=True)
        serializer = TaskSerializer(data=_apply_legacy_assignee(request.data), context={"request": request, "project": project})
        serializer.is_valid(raise_exception=True)
        task = serializer.save(project=project)
        if task.assignee_id:
            create_notification(task.assignee, request.user, "task_assigned", project)
        return Response(TaskSerializer(task, context={"request": request}).data, status=status.HTTP_201_CREATED)


class TaskDetailAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def _task(self, request, id):
        task = get_object_or_404(Task.objects.select_related("project", "assignee"), id=id)
        if not is_project_member(task.project, request.user):
            raise PermissionDenied("You must be a project member to do that.")
        return task

    @extend_schema(operation_id='projects_task_detail_get', responses={200: TaskSerializer})
    def get(self, request, id, *args, **kwargs):
        task = self._task(request, id)
        return Response(TaskSerializer(task, context={"request": request}).data, status=status.HTTP_200_OK)

    @extend_schema(operation_id='projects_task_detail_patch', request=TaskSerializer, responses={200: OpenApiTypes.OBJECT})
    def patch(self, request, id, *args, **kwargs):
        task = self._task(request, id)
        previous_assignee = task.assignee_id
        previous_status = task.status
        was_done = task.status == Task.STATUS_DONE
        serializer = TaskSerializer(task, data=_apply_legacy_assignee(request.data), partial=True, context={"request": request, "project": task.project})
        serializer.is_valid(raise_exception=True)
        task = serializer.save()

        if task.assignee_id and task.assignee_id != previous_assignee:
            create_notification(task.assignee, request.user, "task_assigned", task.project)

        # Notify the relevant party when the task status changes.
        _STATUS_VERB = {
            Task.STATUS_TODO: "task_status_todo",
            Task.STATUS_IN_PROGRESS: "task_status_in_progress",
            Task.STATUS_REVIEW: "task_status_review",
            Task.STATUS_DONE: "task_status_done",
        }
        if task.status != previous_status and task.status in _STATUS_VERB:
            verb = _STATUS_VERB[task.status]
            # Notify the assignee (if someone else changed their task's status).
            if task.assignee_id and task.assignee_id != request.user.id:
                create_notification(task.assignee, request.user, verb, task)
            # Also notify the project owner so they stay aware of progress.
            elif task.project.owner_id and task.project.owner_id != request.user.id:
                create_notification(task.project.owner, request.user, verb, task)

        xp_awarded, recipient = 0, None
        if task.status == Task.STATUS_DONE and not was_done and not task.xp_awarded:
            recipient = task.assignee or request.user
            paid = _award_capped(recipient, "task_complete", source=f"task:{task.id}")
            if paid:
                Task.objects.filter(pk=task.pk).update(xp_awarded=True)
                task.xp_awarded = True
                # Only report XP to the person who received it (a teammate finishing your task pays you, not them).
                xp_awarded = paid if recipient.id == request.user.id else 0

        payload = TaskSerializer(task, context={"request": request}).data
        payload["xp_awarded"] = xp_awarded  # XP paid to THIS user by this call
        payload["xp_recipient"] = recipient.username if recipient else None
        return Response(payload, status=status.HTTP_200_OK)

    @extend_schema(operation_id='projects_task_detail_delete', responses={200: OpenApiTypes.OBJECT})
    def delete(self, request, id, *args, **kwargs):
        task = self._task(request, id)
        if not is_project_owner(task.project, request.user):
            raise PermissionDenied("Only the project owner can delete tasks.")
        task.delete()
        return Response({"detail": "Task deleted."}, status=status.HTTP_200_OK)


# --------------------------------------------------------------------------- milestones and updates
class MilestoneAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(operation_id='projects_milestone_get', responses={200: MilestoneSerializer(many=True)})
    def get(self, request, slug, *args, **kwargs):
        project = _get_project(slug, request.user, members_only=True)
        return Response(MilestoneSerializer(project.milestones.all(), many=True, context={"request": request}).data, status=status.HTTP_200_OK)

    @extend_schema(operation_id='projects_milestone_post', request=MilestoneSerializer, responses={201: MilestoneSerializer})
    def post(self, request, slug, *args, **kwargs):
        project = _get_project(slug, request.user, members_only=True)
        serializer = MilestoneSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        milestone = serializer.save(project=project)
        return Response(MilestoneSerializer(milestone, context={"request": request}).data, status=status.HTTP_201_CREATED)


class MilestoneDetailAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def _milestone(self, request, id):
        milestone = get_object_or_404(Milestone.objects.select_related("project"), id=id)
        if not is_project_member(milestone.project, request.user):
            raise PermissionDenied("You must be a project member to do that.")
        return milestone

    @extend_schema(operation_id='projects_milestone_detail_patch', request=MilestoneSerializer, responses={200: OpenApiTypes.OBJECT})
    def patch(self, request, id, *args, **kwargs):
        milestone = self._milestone(request, id)
        was_done = milestone.status == "done"
        serializer = MilestoneSerializer(milestone, data=request.data, partial=True, context={"request": request})
        serializer.is_valid(raise_exception=True)
        milestone = serializer.save()
        xp = 0
        if milestone.status == "done" and not was_done:
            xp = _award_capped(request.user, "milestone_complete", source=f"milestone:{milestone.id}")
        payload = MilestoneSerializer(milestone, context={"request": request}).data
        payload["xp_awarded"] = xp
        return Response(payload, status=status.HTTP_200_OK)

    @extend_schema(operation_id='projects_milestone_detail_delete', responses={200: OpenApiTypes.OBJECT})
    def delete(self, request, id, *args, **kwargs):
        milestone = self._milestone(request, id)
        if not is_project_owner(milestone.project, request.user):
            raise PermissionDenied("Only the project owner can delete milestones.")
        milestone.delete()
        return Response({"detail": "Milestone deleted."}, status=status.HTTP_200_OK)


class ProjectUpdateAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(operation_id='projects_project_update_get', responses={200: ProjectUpdateSerializer(many=True)})
    def get(self, request, slug, *args, **kwargs):
        project = _get_project(slug, request.user, members_only=True)
        return Response(ProjectUpdateSerializer(project.updates.select_related("author"), many=True, context={"request": request}).data, status=status.HTTP_200_OK)

    @extend_schema(operation_id='projects_project_update_post', request=ProjectUpdateSerializer, responses={201: ProjectUpdateSerializer})
    def post(self, request, slug, *args, **kwargs):
        project = _get_project(slug, request.user, members_only=True)
        serializer = ProjectUpdateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        update = serializer.save(project=project, author=request.user)
        # Everyone else on the team hears about it (the author never notifies themself).
        for member in project.members.select_related("user"):
            create_notification(member.user, request.user, "project_update", project)
        return Response(ProjectUpdateSerializer(update, context={"request": request}).data, status=status.HTTP_201_CREATED)
