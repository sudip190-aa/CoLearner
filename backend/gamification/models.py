from django.conf import settings
from django.db import models

from core.models import SlugModel, TimeStampedModel


class Badge(TimeStampedModel, SlugModel):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    criteria_key = models.CharField(max_length=100)
    xp_reward = models.PositiveIntegerField(default=0)
    icon = models.CharField(max_length=50, default="award")

    class Meta:
        ordering = ["-xp_reward", "name"]
        indexes = [models.Index(fields=["slug"]), models.Index(fields=["criteria_key", "xp_reward"]), models.Index(fields=["created_at"])]

    def __str__(self):
        return self.name


class UserBadge(TimeStampedModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="badges")
    badge = models.ForeignKey("Badge", on_delete=models.CASCADE, related_name="users")
    earned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-earned_at"]
        unique_together = ("user", "badge")
        indexes = [models.Index(fields=["user", "badge"]), models.Index(fields=["created_at"])]

    def __str__(self):
        return f"{self.user} earned {self.badge}"


class XPEvent(TimeStampedModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="xp_events")
    amount = models.IntegerField(default=0)
    reason = models.CharField(max_length=100)
    source = models.CharField(max_length=100, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["user", "created_at"]), models.Index(fields=["source", "amount"])]

    def __str__(self):
        return f"{self.user}: {self.amount} XP for {self.reason}"
