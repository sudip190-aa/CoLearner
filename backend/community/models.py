from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.utils import timezone
from django.utils.text import slugify

from core.models import SlugModel, TimeStampedModel


class Thread(TimeStampedModel, SlugModel):
    CATEGORY_CHOICES = (
        ("frontend", "Frontend"),
        ("backend", "Backend"),
        ("product", "Product"),
        ("career", "Career"),
        ("community", "Community"),
    )

    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="threads")
    title = models.CharField(max_length=200)
    body = models.TextField()
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default="community")
    is_pinned = models.BooleanField(default=False)
    views = models.PositiveIntegerField(default=0)
    tags = models.ManyToManyField("Tag", related_name="threads", blank=True)

    class Meta:
        ordering = ["-is_pinned", "-created_at"]
        indexes = [models.Index(fields=["slug"]), models.Index(fields=["category", "created_at"]) ]

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.title) or "thread"
            slug = base_slug
            counter = 2
            while Thread.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


class Comment(TimeStampedModel):
    thread = models.ForeignKey("Thread", on_delete=models.CASCADE, related_name="comments")
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="comments")
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        related_name="replies",
        blank=True,
        null=True,
    )
    body = models.TextField()
    xp_awarded = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["thread", "created_at"]), models.Index(fields=["parent", "created_at"])]

    def __str__(self):
        return f"Comment by {self.author} on {self.thread}"


class Vote(TimeStampedModel):
    VALUE_CHOICES = (
        (1, "Upvote"),
        (-1, "Downvote"),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="votes")
    value = models.SmallIntegerField(choices=VALUE_CHOICES)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, related_name="votes")
    object_id = models.PositiveBigIntegerField()
    content_object = GenericForeignKey("content_type", "object_id")

    class Meta:
        ordering = ["-created_at"]
        unique_together = ("user", "content_type", "object_id")
        indexes = [models.Index(fields=["content_type", "object_id"]), models.Index(fields=["created_at"])]

    def __str__(self):
        return f"{self.user} voted {self.value}"


class Tag(TimeStampedModel, SlugModel):
    name = models.CharField(max_length=50, unique=True)
    color = models.CharField(max_length=20, default="#2E78E5")

    class Meta:
        ordering = ["name"]
        indexes = [models.Index(fields=["slug"]), models.Index(fields=["created_at"])]

    def __str__(self):
        return self.name


class ThreadView(TimeStampedModel):
    thread = models.ForeignKey("Thread", on_delete=models.CASCADE, related_name="thread_views")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="thread_views")
    viewed_on = models.DateField(default=timezone.now)

    class Meta:
        unique_together = ("thread", "user", "viewed_on")
        ordering = ["-viewed_on"]

    def __str__(self):
        return f"{self.user} viewed {self.thread} on {self.viewed_on}"
