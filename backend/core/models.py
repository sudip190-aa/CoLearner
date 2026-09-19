from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.utils.text import slugify


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        indexes = [models.Index(fields=["created_at"]) ]


class SlugModel(models.Model):
    slug = models.SlugField(max_length=200, unique=True, blank=True, db_index=True)

    def populate_slug(self, source):
        return slugify(source) or "item"

    def unique_slug(self, base):
        max_length = self._meta.get_field("slug").max_length
        others = type(self)._default_manager.all()
        if self.pk is not None:
            others = others.exclude(pk=self.pk)
        candidate, counter = base[:max_length], 2
        while others.filter(slug=candidate).exists():
            suffix = f"-{counter}"
            candidate = f"{base[:max_length - len(suffix)]}{suffix}"
            counter += 1
        return candidate

    def save(self, *args, **kwargs):
        if not self.slug:
            source = next(
                (getattr(self, name) for name in ("title", "name", "full_name", "email") if getattr(self, name, None)),
                self.__class__.__name__,
            )
            self.slug = self.unique_slug(self.populate_slug(source))
        super().save(*args, **kwargs)

    class Meta:
        abstract = True
        indexes = [models.Index(fields=["slug"])]


class ContactMessage(TimeStampedModel):
    """A message submitted through the public Contact page; staff read and resolve these in the admin."""

    name = models.CharField(max_length=120)
    email = models.EmailField()
    subject = models.CharField(max_length=200)
    message = models.TextField()
    is_resolved = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["is_resolved", "created_at"])]

    def __str__(self):
        return f"{self.name}: {self.subject}"


class Report(TimeStampedModel):
    REPORT_STATUS_CHOICES = (
        ("open", "Open"),
        ("review", "Review"),
        ("resolved", "Resolved"),
        ("dismissed", "Dismissed"),
    )

    reporter = models.ForeignKey(
        "users.CustomUser",
        on_delete=models.CASCADE,
        related_name="reports_made",
    )
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        related_name="report_objects",
    )
    object_id = models.PositiveBigIntegerField()
    content_object = GenericForeignKey("content_type", "object_id")
    reason = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=REPORT_STATUS_CHOICES, default="open")

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "created_at"]),
            models.Index(fields=["content_type", "object_id"]),
        ]

    def __str__(self):
        return f"{self.reporter} reported {self.content_object}"
