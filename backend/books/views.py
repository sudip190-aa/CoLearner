from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema

from django.db import transaction
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from gamification.models import UserBadge
from gamification.services import XP_RULES, award_xp
from .models import Book, Bookmark, Chapter, Note, ReadingProgress
from .serializers import (
    BookChapterSerializer,
    BookDetailSerializer,
    BookMiniSerializer,
    BookmarkSerializer,
    ChapterDetailSerializer,
    NoteSerializer,
)


class BookListAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(operation_id='books_book_list_get', responses={200: BookMiniSerializer(many=True)})
    def get(self, request, *args, **kwargs):
        queryset = Book.objects.annotate(
            chapter_count=Count("chapters", distinct=True),
            readers_count=Count("reading_progress", distinct=True),
        )

        category = request.query_params.get("category")
        if category:
            queryset = queryset.filter(category__iexact=category)

        difficulty = request.query_params.get("difficulty")
        if difficulty:
            queryset = queryset.filter(difficulty__iexact=difficulty)

        tags = []
        for item in request.query_params.getlist("tags"):
            tags.extend(part.strip() for part in item.split(",") if part.strip())
        if tags:
            filtered_ids = []
            for book in queryset:
                book_tags = set(book.tags or [])
                if set(tags).intersection(book_tags):
                    filtered_ids.append(book.id)
            queryset = queryset.filter(id__in=filtered_ids)

        search = request.query_params.get("search") or request.query_params.get("q")
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search)
                | Q(author__icontains=search)
                | Q(description__icontains=search)
            )

        ordering = request.query_params.get("ordering") or "-created_at"
        allowed = {
            "created_at": "created_at",
            "-created_at": "-created_at",
            "title": "title",
            "-title": "-title",
            "est_minutes": "est_minutes",
            "-est_minutes": "-est_minutes",
            "popular": "-readers_count",
        }
        queryset = queryset.order_by(allowed.get(ordering, "-created_at"))

        serializer = BookMiniSerializer(queryset, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class BookDetailAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(operation_id='books_book_detail_get', responses={200: BookDetailSerializer})
    def get(self, request, slug, *args, **kwargs):
        book = get_object_or_404(Book, slug=slug)
        serializer = BookDetailSerializer(book, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class BookChapterListAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(operation_id='books_book_chapter_list_get', responses={200: BookChapterSerializer(many=True)})
    def get(self, request, slug, *args, **kwargs):
        book = get_object_or_404(Book, slug=slug)
        serializer = BookChapterSerializer(book.chapters.all(), many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class ChapterDetailAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(operation_id='books_chapter_detail_get', responses={200: ChapterDetailSerializer})
    def get(self, request, pk, *args, **kwargs):
        chapter = get_object_or_404(Chapter, id=pk)
        serializer = ChapterDetailSerializer(chapter, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)


def _int_or_400(value, field):
    try:
        return int(value)
    except (TypeError, ValueError):
        raise ValidationError({field: ["A whole number is required."]})


class BookProgressAPIView(APIView):
    """Record reading. Book progress is derived from which chapters are completed, never trusted from the client.

    body: {"chapter_id": <id>, "completed": true|false}
      - always moves the "continue reading" pointer to that chapter
      - completed=true marks the chapter done (once) and pays chapter XP; finishing the last outstanding
        chapter marks the book finished and pays book XP. Badges and level-ups go through the XP service.
    """

    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(operation_id='books_book_progress_post', request=OpenApiTypes.OBJECT, responses={200: OpenApiTypes.OBJECT})
    @transaction.atomic
    def post(self, request, slug, *args, **kwargs):
        book = get_object_or_404(Book, slug=slug)
        chapter_id = request.data.get("chapter_id")
        if chapter_id in (None, ""):
            raise ValidationError({"chapter_id": ["This field is required."]})
        chapter = get_object_or_404(book.chapters, id=_int_or_400(chapter_id, "chapter_id"))
        completed = request.data.get("completed") in (True, "true", "True", "1", 1)

        progress, _ = ReadingProgress.objects.get_or_create(user=request.user, book=book, defaults={"chapter": chapter})
        done = set(progress.completed_chapters or [])
        badges_before = set(UserBadge.objects.filter(user=request.user).values_list("badge_id", flat=True))

        chapter_newly_completed = completed and chapter.id not in done
        if chapter_newly_completed:
            done.add(chapter.id)

        total = book.chapters.count()
        progress.chapter = chapter
        progress.completed_chapters = sorted(done)
        progress.progress_percent = round(100 * len(done) / total) if total else 0
        progress.last_read_at = timezone.now()

        book_newly_finished = bool(total) and len(done) == total and not progress.book_completion_awarded
        if book_newly_finished:
            progress.completed = True
            progress.book_completion_awarded = True
        progress.save()

        # Pay after saving: the XP service checks badge rules, which read the progress just written.
        xp_awarded = 0
        if chapter_newly_completed:
            event = award_xp(request.user, "chapter_complete", XP_RULES["chapter_complete"], source=f"chapter:{chapter.id}")
            xp_awarded += event.amount if event else 0
        if book_newly_finished:
            event = award_xp(request.user, "book_complete", XP_RULES["book_complete"], source=f"book:{book.id}")
            xp_awarded += event.amount if event else 0

        earned = UserBadge.objects.filter(user=request.user).exclude(badge_id__in=badges_before).select_related("badge")
        request.user.refresh_from_db(fields=["xp", "level"])
        return Response(
            {
                "progress": {
                    "book": book.slug,
                    "chapter_id": chapter.id,
                    "progress_percent": progress.progress_percent,
                    "completed": progress.completed,
                    "completed_chapter_ids": sorted(done),
                },
                "chapter_completed": chapter_newly_completed,
                "book_completed": book_newly_finished,
                "xp_awarded": xp_awarded,
                "xp": request.user.xp,
                "level": request.user.level,
                "badges_earned": [{"id": ub.badge.id, "name": ub.badge.name, "slug": ub.badge.slug} for ub in earned],
            },
            status=status.HTTP_200_OK,
        )


class UserLibraryAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(operation_id='books_user_library_get', responses={200: {'type': 'array', 'items': {'type': 'object'}}})
    def get(self, request, *args, **kwargs):
        progresses = ReadingProgress.objects.filter(user=request.user).select_related("book").order_by("-last_read_at", "-updated_at")
        context = {"request": request}
        payload = [
            {
                "book": BookMiniSerializer(progress.book, context=context).data,
                "status": "finished" if progress.completed else "started",
                "progress_percent": progress.progress_percent,
            }
            for progress in progresses
        ]
        return Response(payload, status=status.HTTP_200_OK)


class ChapterBookmarkAPIView(APIView):
    """Toggle: bookmarks the chapter, or removes the existing bookmark."""

    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(operation_id='books_chapter_bookmark_post', request=OpenApiTypes.OBJECT, responses={200: OpenApiTypes.OBJECT, 201: OpenApiTypes.OBJECT})
    def post(self, request, pk, *args, **kwargs):
        chapter = get_object_or_404(Chapter, id=pk)
        existing = Bookmark.objects.filter(user=request.user, chapter=chapter).first()
        if existing:
            existing.delete()
            return Response({"status": "removed", "bookmark": None}, status=status.HTTP_200_OK)

        bookmark = Bookmark.objects.create(
            user=request.user,
            book=chapter.book,
            chapter=chapter,
            page=max(1, _int_or_400(request.data.get("page", 1), "page")),
            note=str(request.data.get("note", ""))[:2000],
        )
        return Response({"status": "created", "bookmark": BookmarkSerializer(bookmark).data}, status=status.HTTP_201_CREATED)


class ChapterNoteAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    MAX_NOTE_LENGTH = 5000

    @extend_schema(operation_id='books_chapter_note_get', responses={200: NoteSerializer(many=True)})
    def get(self, request, pk, *args, **kwargs):
        chapter = get_object_or_404(Chapter, id=pk)
        notes = Note.objects.filter(user=request.user, chapter=chapter).order_by("-created_at")
        return Response(NoteSerializer(notes, many=True).data, status=status.HTTP_200_OK)

    @extend_schema(operation_id='books_chapter_note_post', request=OpenApiTypes.OBJECT, responses={201: NoteSerializer})
    def post(self, request, pk, *args, **kwargs):
        chapter = get_object_or_404(Chapter, id=pk)
        content = str(request.data.get("content") or "").strip()
        if not content:
            raise ValidationError({"content": ["This field may not be blank."]})
        if len(content) > self.MAX_NOTE_LENGTH:
            raise ValidationError({"content": [f"Notes can be up to {self.MAX_NOTE_LENGTH} characters."]})
        note = Note.objects.create(user=request.user, chapter=chapter, content=content)
        return Response(NoteSerializer(note).data, status=status.HTTP_201_CREATED)

    @extend_schema(operation_id='books_chapter_note_delete', responses={200: OpenApiTypes.OBJECT})
    def delete(self, request, pk, *args, **kwargs):
        chapter = get_object_or_404(Chapter, id=pk)
        note_id = request.query_params.get("note_id") or request.data.get("id") or request.data.get("note_id")
        if not note_id:
            raise ValidationError({"note_id": ["This field is required."]})
        note = get_object_or_404(Note, id=_int_or_400(note_id, "note_id"), chapter=chapter, user=request.user)
        note.delete()
        return Response({"detail": "Note deleted."}, status=status.HTTP_200_OK)
