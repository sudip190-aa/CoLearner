from django.contrib.auth import get_user_model
from rest_framework import serializers

from community.serializers import author_payload

from .models import JoinRequest, Milestone, Project, ProjectMember, ProjectUpdate, Task

User = get_user_model()

MAX_TECH_ITEMS = 15
MAX_ROLE_ITEMS = 10


def _person(user, request):
    return author_payload(user, request)


class ProjectMemberSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()

    class Meta:
        model = ProjectMember
        fields = ("id", "user", "role", "joined_at")

    def get_user(self, obj):
        person = _person(obj.user, self.context.get("request"))
        person["headline"] = obj.user.headline
        person["skills"] = [item.skill.name for item in obj.user.skills.all()[:4]]
        return person


def _clean_list(items, label, max_items, max_length):
    cleaned = []
    for item in items:
        value = str(item).strip()
        if not value:
            continue
        if len(value) > max_length:
            raise serializers.ValidationError(f"Each {label} can be up to {max_length} characters.")
        if value.lower() not in {existing.lower() for existing in cleaned}:
            cleaned.append(value)
    if len(cleaned) > max_items:
        raise serializers.ValidationError(f"Use at most {max_items} {label}s.")
    return cleaned


class ProjectSerializer(serializers.ModelSerializer):
    """Card/list shape, and the write shape for create and edit."""

    title = serializers.CharField(min_length=3, max_length=200)
    summary = serializers.CharField(max_length=255, required=False, allow_blank=True)
    description = serializers.CharField(max_length=10000, required=False, allow_blank=True)
    max_members = serializers.IntegerField(min_value=1, max_value=50, required=False)
    member_count = serializers.SerializerMethodField()
    spots_left = serializers.SerializerMethodField()
    task_progress = serializers.SerializerMethodField()
    owner = serializers.SerializerMethodField()
    cover = serializers.ImageField(required=False, allow_null=True)
    member_preview = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = (
            "id",
            "slug",
            "title",
            "summary",
            "description",
            "status",
            "category",
            "tech_stack",
            "looking_for_roles",
            "cover",
            "max_members",
            "is_public",
            "owner",
            "member_count",
            "spots_left",
            "member_preview",
            "task_progress",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("slug",)

    def validate_tech_stack(self, value):
        return _clean_list(value, "technology", MAX_TECH_ITEMS, 30)

    def validate_looking_for_roles(self, value):
        return _clean_list(value, "role", MAX_ROLE_ITEMS, 40)

    def validate_max_members(self, value):
        if self.instance is not None:
            current = self.instance.members.count()
            if value < current:
                raise serializers.ValidationError(f"The team already has {current} members.")
        return value

    def get_owner(self, obj):
        return _person(obj.owner, self.context.get("request"))

    def get_member_count(self, obj):
        return obj.member_count if hasattr(obj, "member_count") else obj.members.count()

    def get_spots_left(self, obj):
        return max(0, obj.max_members - self.get_member_count(obj))

    def get_member_preview(self, obj):
        request = self.context.get("request")
        return [_person(member.user, request) for member in list(obj.members.all())[:5]]

    def get_task_progress(self, obj):
        total = obj.task_total if hasattr(obj, "task_total") else obj.tasks.count()
        done = obj.task_done if hasattr(obj, "task_done") else obj.tasks.filter(status=Task.STATUS_DONE).count()
        return {"total": total, "done": done, "percent": round(100 * done / total) if total else 0}

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # ImageField renders a relative URL without a request; the SPA needs an absolute one.
        request = self.context.get("request")
        if instance.cover and request:
            data["cover"] = request.build_absolute_uri(instance.cover.url)
        return data


class JoinRequestSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()
    project_slug = serializers.CharField(source="project.slug", read_only=True)
    project_title = serializers.CharField(source="project.title", read_only=True)

    class Meta:
        model = JoinRequest
        fields = ("id", "project", "project_slug", "project_title", "user", "message", "status", "created_at")

    def get_user(self, obj):
        return _person(obj.user, self.context.get("request"))


class TaskSerializer(serializers.ModelSerializer):
    title = serializers.CharField(min_length=1, max_length=200)
    assignee = serializers.SerializerMethodField()
    assignee_id = serializers.PrimaryKeyRelatedField(source="assignee", queryset=User.objects.filter(is_active=True), allow_null=True, required=False)
    xp_paid = serializers.BooleanField(source="xp_awarded", read_only=True)  # has completing this task already paid XP?

    class Meta:
        model = Task
        fields = (
            "id",
            "project",
            "assignee",
            "assignee_id",
            "title",
            "description",
            "status",
            "priority",
            "due_date",
            "order",
            "xp_paid",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("project",)

    def get_assignee(self, obj):
        return _person(obj.assignee, self.context.get("request")) if obj.assignee else None

    def validate_assignee_id(self, user):
        project = self.context.get("project") or (self.instance.project if self.instance else None)
        if user is not None and project is not None:
            if not (project.owner_id == user.id or ProjectMember.objects.filter(project=project, user=user).exists()):
                raise serializers.ValidationError("The assignee must be a member of this project.")
        return user


class MilestoneSerializer(serializers.ModelSerializer):
    title = serializers.CharField(min_length=1, max_length=200)

    class Meta:
        model = Milestone
        fields = ("id", "project", "title", "description", "due_date", "status", "created_at", "updated_at")
        read_only_fields = ("project",)


class ProjectUpdateSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField()
    body = serializers.CharField(max_length=5000)

    class Meta:
        model = ProjectUpdate
        fields = ("id", "project", "author", "body", "created_at")
        read_only_fields = ("project",)

    def get_author(self, obj):
        return _person(obj.author, self.context.get("request"))


class ProjectDetailSerializer(ProjectSerializer):
    """Full project page. Tasks are only included for members (the board is a private workspace)."""

    members = serializers.SerializerMethodField()
    milestones = serializers.SerializerMethodField()
    updates = serializers.SerializerMethodField()
    tasks = serializers.SerializerMethodField()
    viewer = serializers.SerializerMethodField()

    class Meta(ProjectSerializer.Meta):
        fields = ProjectSerializer.Meta.fields + ("members", "milestones", "updates", "tasks", "viewer")

    def _member_of(self, obj):
        cache = self.context.setdefault("_membership", {})
        if obj.pk not in cache:
            request = self.context.get("request")
            user = getattr(request, "user", None)
            cache[obj.pk] = (
                ProjectMember.objects.filter(project=obj, user=user).first()
                if user is not None and user.is_authenticated
                else None
            )
        return cache[obj.pk]

    def get_members(self, obj):
        members = obj.members.select_related("user").prefetch_related("user__skills__skill")
        return ProjectMemberSerializer(members, many=True, context=self.context).data

    def get_milestones(self, obj):
        return MilestoneSerializer(obj.milestones.all(), many=True, context=self.context).data

    def get_updates(self, obj):
        return ProjectUpdateSerializer(obj.updates.select_related("author")[:50], many=True, context=self.context).data

    def get_tasks(self, obj):
        if not self._member_of(obj):
            return []
        return TaskSerializer(obj.tasks.select_related("assignee"), many=True, context=self.context).data

    def get_viewer(self, obj):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        membership = self._member_of(obj)
        pending = None
        if user is not None and user.is_authenticated and not membership:
            pending = JoinRequest.objects.filter(project=obj, user=user, status__in=["pending", "invited"]).first()
        return {
            "is_member": bool(membership),
            "is_owner": bool(user is not None and user.is_authenticated and obj.owner_id == user.id),
            "role": membership.role if membership else None,
            "join_request": {"id": pending.id, "status": pending.status} if pending else None,
        }
