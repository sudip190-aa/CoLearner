from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Book, Bookmark, Chapter, Note, ReadingProgress

User = get_user_model()

WORDS_PER_MINUTE = 200


def _user_progress(context, book_id):
    """The signed-in user's ReadingProgress for a book, loaded once per request (not once per row)."""
    request = context.get("request")
    if not request or not getattr(request.user, "is_authenticated", False):
        return None
    cache = context.setdefault("_progress_by_book", {})
    if "all" not in cache:
        cache["all"] = {p.book_id: p for p in ReadingProgress.objects.filter(user=request.user)}
    return cache["all"].get(book_id)


def reading_minutes(text):
    return max(1, round(len((text or "").split()) / WORDS_PER_MINUTE))


class ChapterSummarySerializer(serializers.ModelSerializer):
    is_completed = serializers.SerializerMethodField()
    est_minutes = serializers.SerializerMethodField()

    class Meta:
        model = Chapter
        fields = ("id", "slug", "title", "chapter_number", "est_minutes", "is_completed")

    def get_is_completed(self, obj) -> bool:
        progress = _user_progress(self.context, obj.book_id)
        return bool(progress and obj.id in (progress.completed_chapters or []))

    def get_est_minutes(self, obj) -> int:
        return reading_minutes(obj.content)


class BookChapterSerializer(ChapterSummarySerializer):
    """Chapter list for /books/<slug>/chapters/ (same shape as the summary embedded in a book)."""


class BookMiniSerializer(serializers.ModelSerializer):
    progress_percent = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    current_chapter_id = serializers.SerializerMethodField()
    completed_chapter_ids = serializers.SerializerMethodField()
    chapter_count = serializers.SerializerMethodField()
    readers_count = serializers.SerializerMethodField()

    class Meta:
        model = Book
        fields = (
            "id",
            "slug",
            "title",
            "author",
            "description",
            "category",
            "difficulty",
            "cover",
            "tags",
            "est_minutes",
            "created_at",
            "chapter_count",
            "readers_count",
            "progress_percent",
            "status",
            "current_chapter_id",
            "completed_chapter_ids",
        )

    def get_progress_percent(self, obj) -> float | None:
        request = self.context.get("request")
        if not request or not getattr(request.user, "is_authenticated", False):
            return None
        progress = _user_progress(self.context, obj.id)
        return progress.progress_percent if progress else 0

    def get_status(self, obj) -> str:
        progress = _user_progress(self.context, obj.id)
        if not progress:
            return "not_started"
        return "finished" if progress.completed else "started"

    def get_current_chapter_id(self, obj) -> int | None:
        progress = _user_progress(self.context, obj.id)
        return progress.chapter_id if progress else None

    def get_completed_chapter_ids(self, obj) -> list[int]:
        progress = _user_progress(self.context, obj.id)
        return sorted(progress.completed_chapters or []) if progress else []

    def get_chapter_count(self, obj) -> int:
        # The list view annotates this; fall back to a query for single objects.
        value = getattr(obj, "chapter_count", None)
        return value if value is not None else obj.chapters.count()

    def get_readers_count(self, obj) -> int:
        value = getattr(obj, "readers_count", None)
        return value if value is not None else obj.reading_progress.count()


class BookDetailSerializer(BookMiniSerializer):
    chapters = serializers.SerializerMethodField()
    related = serializers.SerializerMethodField()

    class Meta(BookMiniSerializer.Meta):
        fields = BookMiniSerializer.Meta.fields + ("chapters", "related")

    def get_chapters(self, obj) -> list[dict]:
        return ChapterSummarySerializer(obj.chapters.all(), many=True, context=self.context).data

    def get_related(self, obj) -> list[dict]:
        # Same category first, then anything else, never the book itself.
        siblings = list(Book.objects.filter(category=obj.category).exclude(pk=obj.pk)[:3])
        if len(siblings) < 3:
            siblings += list(Book.objects.exclude(pk=obj.pk).exclude(pk__in=[b.pk for b in siblings])[: 3 - len(siblings)])
        return BookMiniSerializer(siblings, many=True, context=self.context).data


class BookmarkSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bookmark
        fields = ("id", "chapter", "page", "note", "created_at")
        read_only_fields = ("id", "created_at")


class NoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Note
        fields = ("id", "chapter", "content", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")


class ChapterDetailSerializer(serializers.ModelSerializer):
    bookmarks = serializers.SerializerMethodField()
    notes = serializers.SerializerMethodField()
    book = serializers.SerializerMethodField()
    est_minutes = serializers.SerializerMethodField()
    is_completed = serializers.SerializerMethodField()

    class Meta:
        model = Chapter
        fields = ("id", "book", "slug", "title", "chapter_number", "content", "est_minutes", "is_completed", "bookmarks", "notes")

    def get_book(self, obj) -> dict:
        return {"id": obj.book.id, "slug": obj.book.slug, "title": obj.book.title}

    def get_est_minutes(self, obj) -> int:
        return reading_minutes(obj.content)

    def get_is_completed(self, obj) -> bool:
        progress = _user_progress(self.context, obj.book_id)
        return bool(progress and obj.id in (progress.completed_chapters or []))

    def get_bookmarks(self, obj) -> list[dict]:
        request = self.context.get("request")
        if not request or not getattr(request.user, "is_authenticated", False):
            return []
        return BookmarkSerializer(Bookmark.objects.filter(user=request.user, chapter=obj), many=True).data

    def get_notes(self, obj) -> list[dict]:
        request = self.context.get("request")
        if not request or not getattr(request.user, "is_authenticated", False):
            return []
        return NoteSerializer(Note.objects.filter(user=request.user, chapter=obj).order_by("-created_at"), many=True).data
