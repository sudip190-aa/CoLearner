from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone

from core.models import SlugModel, TimeStampedModel
from core.validators import validate_avatar_upload
from .managers import CustomUserManager


class CustomUser(TimeStampedModel, AbstractUser):
    ROLE_LEARNER = "learner"
    ROLE_BUILDER = "builder"
    ROLE_MENTOR = "mentor"
    ROLE_ADMIN = "admin"

    ROLE_CHOICES = (
        (ROLE_LEARNER, "Learner"),
        (ROLE_BUILDER, "Builder"),
        (ROLE_MENTOR, "Mentor"),
        (ROLE_ADMIN, "Admin"),
    )

    created_at = models.DateTimeField(default=timezone.now, editable=False)
    updated_at = models.DateTimeField(default=timezone.now, editable=False)
    email = models.EmailField(unique=True, db_index=True)
    username = models.CharField(max_length=150, unique=True, db_index=True)
    full_name = models.CharField(max_length=150, blank=True)
    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True, validators=[validate_avatar_upload])
    bio = models.TextField(blank=True)
    headline = models.CharField(max_length=200, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_LEARNER)
    location = models.CharField(max_length=100, blank=True)
    github = models.URLField(blank=True)
    linkedin = models.URLField(blank=True)
    website = models.URLField(blank=True)
    availability = models.CharField(max_length=50, blank=True)
    interests = models.JSONField(default=list, blank=True)
    xp = models.PositiveIntegerField(default=0)
    level = models.PositiveIntegerField(default=1)
    streak_days = models.PositiveIntegerField(default=0)
    last_active = models.DateTimeField(blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    onboarding_completed = models.BooleanField(default=False)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username", "full_name"]

    objects = CustomUserManager()

    class Meta:
        ordering = ["email"]
        indexes = [models.Index(fields=["email"]), models.Index(fields=["username"])]

    def __str__(self):
        return self.email


class Skill(TimeStampedModel, SlugModel):
    name = models.CharField(max_length=100)
    category = models.CharField(max_length=50, blank=True)

    class Meta:
        ordering = ["category", "name"]
        indexes = [
            models.Index(fields=["slug"]),
            models.Index(fields=["category", "name"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        return self.name


class UserSkill(TimeStampedModel):
    LEVEL_CHOICES = (
        ("beginner", "Beginner"),
        ("intermediate", "Intermediate"),
        ("advanced", "Advanced"),
    )

    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="skills")
    skill = models.ForeignKey("Skill", on_delete=models.CASCADE, related_name="user_skills")
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES, default="beginner")
    is_verified = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]
        unique_together = ("user", "skill")
        indexes = [models.Index(fields=["user", "skill"]), models.Index(fields=["created_at"])]

    def __str__(self):
        return f"{self.user} → {self.skill}"


class Connection(TimeStampedModel):
    STATUS_CHOICES = (
        ("pending", "Pending"),
        ("accepted", "Accepted"),
        ("blocked", "Blocked"),
    )

    from_user = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="connections_sent",
    )
    to_user = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="connections_received",
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")

    class Meta:
        ordering = ["-created_at"]
        unique_together = ("from_user", "to_user")
        indexes = [models.Index(fields=["status", "created_at"])]

    def __str__(self):
        return f"{self.from_user} -> {self.to_user} ({self.status})"
