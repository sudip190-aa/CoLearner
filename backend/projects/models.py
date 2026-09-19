from django.conf import settings
from django.db import models

from core.models import SlugModel, TimeStampedModel
from core.validators import validate_cover_upload


class Project(TimeStampedModel, SlugModel):
    STATUS_IDEA = "idea"
    STATUS_ACTIVE = "active"
    STATUS_COMPLETED = "completed"
    STATUS_ARCHIVED = "archived"

    STATUS_CHOICES = (
        (STATUS_IDEA, "idea"),
        (STATUS_ACTIVE, "active"),
        (STATUS_COMPLETED, "completed"),
        (STATUS_ARCHIVED, "archived"),
    )

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="owned_projects")
    title = models.CharField(max_length=200)
    summary = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=50, blank=True)
    tech_stack = models.JSONField(default=list, blank=True)
    looking_for_roles = models.JSONField(default=list, blank=True)
    cover = models.ImageField(upload_to="projects/covers/", blank=True, null=True, validators=[validate_cover_upload])
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_IDEA)
    max_members = models.PositiveIntegerField(default=5)
    is_public = models.BooleanField(default=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["slug"]), models.Index(fields=["status", "created_at"]) ]

    def __str__(self):
        return self.title


class ProjectMember(TimeStampedModel):
    ROLE_CHOICES = (
        ("owner", "Owner"),
        ("member", "Member"),
        ("mentor", "Mentor"),
    )

    project = models.ForeignKey("Project", on_delete=models.CASCADE, related_name="members")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="project_memberships")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="member")
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["project", "user__email"]
        unique_together = ("project", "user")
        indexes = [models.Index(fields=["project", "user"]), models.Index(fields=["created_at"])]

    def __str__(self):
        return f"{self.user} in {self.project}"


class JoinRequest(TimeStampedModel):
    # "invited" = the owner invited this person and is waiting for THEM to accept.
    STATUS_CHOICES = (
        ("pending", "Pending"),
        ("invited", "Invited"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
    )

    project = models.ForeignKey("Project", on_delete=models.CASCADE, related_name="join_requests")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="join_requests")
    message = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")

    class Meta:
        ordering = ["-created_at"]
        unique_together = ("project", "user")
        indexes = [models.Index(fields=["project", "status"]), models.Index(fields=["created_at"])]

    def __str__(self):
        return f"{self.user} → {self.project} ({self.status})"


class Task(TimeStampedModel):
    STATUS_TODO = "todo"
    STATUS_IN_PROGRESS = "in_progress"
    STATUS_REVIEW = "review"
    STATUS_DONE = "done"

    PRIORITY_LOW = "low"
    PRIORITY_MEDIUM = "medium"
    PRIORITY_HIGH = "high"
    PRIORITY_URGENT = "urgent"

    STATUS_CHOICES = (
        (STATUS_TODO, "todo"),
        (STATUS_IN_PROGRESS, "in_progress"),
        (STATUS_REVIEW, "review"),
        (STATUS_DONE, "done"),
    )

    PRIORITY_CHOICES = (
        (PRIORITY_LOW, "low"),
        (PRIORITY_MEDIUM, "medium"),
        (PRIORITY_HIGH, "high"),
        (PRIORITY_URGENT, "urgent"),
    )

    project = models.ForeignKey("Project", on_delete=models.CASCADE, related_name="tasks")
    assignee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="assigned_tasks",
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_TODO)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default=PRIORITY_MEDIUM)
    due_date = models.DateField(blank=True, null=True)
    order = models.PositiveIntegerField(default=0)
    xp_awarded = models.BooleanField(default=False)

    class Meta:
        ordering = ["due_date", "-created_at"]
        indexes = [models.Index(fields=["project", "status"]), models.Index(fields=["created_at"])]

    def __str__(self):
        return self.title


class Milestone(TimeStampedModel):
    STATUS_CHOICES = (
        ("planned", "Planned"),
        ("in_progress", "In progress"),
        ("done", "Done"),
    )

    project = models.ForeignKey("Project", on_delete=models.CASCADE, related_name="milestones")
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    due_date = models.DateField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="planned")

    class Meta:
        ordering = ["due_date", "-created_at"]
        indexes = [models.Index(fields=["project", "status"]), models.Index(fields=["created_at"])]

    def __str__(self):
        return self.title


class ProjectUpdate(TimeStampedModel):
    project = models.ForeignKey("Project", on_delete=models.CASCADE, related_name="updates")
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="project_updates")
    body = models.TextField()

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["project", "created_at"])]

    def __str__(self):
        return f"Update on {self.project}"
