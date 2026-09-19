from django.conf import settings
from django.db import models

from core.models import SlugModel, TimeStampedModel
from core.validators import validate_cover_upload


class Book(TimeStampedModel, SlugModel):
    DIFFICULTY_CHOICES = (
        ("beginner", "Beginner"),
        ("intermediate", "Intermediate"),
        ("advanced", "Advanced"),
    )

    title = models.CharField(max_length=200)
    author = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    cover = models.ImageField(upload_to="books/covers/", blank=True, null=True, validators=[validate_cover_upload])
    category = models.CharField(max_length=50, blank=True)
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, default="beginner")
    tags = models.JSONField(default=list, blank=True)
    est_minutes = models.PositiveIntegerField(default=0)
    total_pages = models.PositiveIntegerField(default=0)
    published_at = models.DateTimeField(blank=True, null=True)
    is_featured = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["slug"]),
            models.Index(fields=["category", "difficulty"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        return self.title


class Chapter(TimeStampedModel, SlugModel):
    book = models.ForeignKey("Book", on_delete=models.CASCADE, related_name="chapters")
    title = models.CharField(max_length=200)
    chapter_number = models.PositiveIntegerField(default=1)
    content = models.TextField(blank=True)

    class Meta:
        ordering = ["chapter_number", "created_at"]
        unique_together = ("book", "chapter_number")
        indexes = [
            models.Index(fields=["book", "chapter_number"]),
            models.Index(fields=["slug"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        return f"Chapter {self.chapter_number}: {self.title}"


class ReadingProgress(TimeStampedModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reading_progress")
    book = models.ForeignKey("Book", on_delete=models.CASCADE, related_name="reading_progress")
    chapter = models.ForeignKey("Chapter", on_delete=models.CASCADE, related_name="reading_progress", blank=True, null=True)
    progress_percent = models.PositiveIntegerField(default=0)
    completed = models.BooleanField(default=False)
    completed_chapters = models.JSONField(default=list, blank=True)
    book_completion_awarded = models.BooleanField(default=False)
    last_read_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ["-updated_at"]
        unique_together = ("user", "book")
        indexes = [models.Index(fields=["user", "book"]), models.Index(fields=["created_at"])]

    def __str__(self):
        return f"{self.user} — {self.book} ({self.progress_percent}%)"


class Bookmark(TimeStampedModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="bookmarks")
    book = models.ForeignKey("Book", on_delete=models.CASCADE, related_name="bookmarks")
    chapter = models.ForeignKey("Chapter", on_delete=models.CASCADE, related_name="bookmarks", blank=True, null=True)
    page = models.PositiveIntegerField(default=1)
    note = models.TextField(blank=True)

    class Meta:
        ordering = ["-created_at"]
        unique_together = ("user", "book", "chapter", "page")
        indexes = [models.Index(fields=["user", "book"]), models.Index(fields=["created_at"])]

    def __str__(self):
        return f"{self.user} bookmark on {self.book}"


class Note(TimeStampedModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notes")
    chapter = models.ForeignKey("Chapter", on_delete=models.CASCADE, related_name="notes")
    content = models.TextField()

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["chapter", "created_at"])]

    def __str__(self):
        return f"Note by {self.user} on {self.chapter}"
