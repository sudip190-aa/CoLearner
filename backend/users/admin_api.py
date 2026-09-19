"""Staff-only management API (users, books + chapters, projects, reports, stats).

Every endpoint requires `is_staff` (IsAdminUser). Lists are paginated ({count, page, page_size, results}) and filterable,
inputs are validated (field errors come back in the standard error envelope), and destructive actions are guarded so an
admin cannot lock themselves out.
"""

from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema

import re
from datetime import timedelta
from math import ceil

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.db import IntegrityError, transaction
from django.db.models import Count, Q, Sum
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.text import slugify
from PIL import Image
from rest_framework import permissions, status
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from users.models import Skill
from books.models import Book, Chapter
from books.serializers import reading_minutes
from community.models import Comment, Thread
from community.serializers import avatar_url
from core.models import Report
from core.validators import validate_cover_upload
from gamification.models import UserBadge, XPEvent
from projects.models import Project

User = get_user_model()

DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100
USERNAME_PATTERN = re.compile(r"^[\w.-]{3,50}$")
ROLES = [value for value, _label in User.ROLE_CHOICES]
DIFFICULTIES = [value for value, _label in Book.DIFFICULTY_CHOICES]
PROJECT_STATUSES = [value for value, _label in Project.STATUS_CHOICES]
REPORT_ACTIONS = {
    "review": "review",
    "resolve": "resolved",
    "dismiss": "dismissed",
    "reopen": "open",
}


# ---------------------------------------------------------------- helpers
def _paginate(request, queryset, serialize):
    def number(name, default, maximum=None):
        try:
            value = int(request.query_params.get(name, default))
        except (TypeError, ValueError):
            return default
        return max(1, min(value, maximum) if maximum else value)

    page_size = number("page_size", DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE)
    count = queryset.count()
    pages = max(ceil(count / page_size), 1)
    page = min(number("page", 1), pages)
    start = (page - 1) * page_size
    return {
        "count": count,
        "page": page,
        "page_size": page_size,
        "pages": pages,
        "results": [serialize(item) for item in queryset[start:start + page_size]],
    }


def _bool(value, field):
    if isinstance(value, bool):
        return value
    if str(value).lower() in {"true", "1", "yes", "on"}:
        return True
    if str(value).lower() in {"false", "0", "no", "off"}:
        return False
    raise ValidationError({field: ["Must be true or false."]})


def _text(data, field, *, required=False, maximum=None, minimum=0, current=None):
    if field not in data:
        if required and current is None:
            raise ValidationError({field: ["This field is required."]})
        return current
    value = str(data.get(field) or "").strip()
    if required and not value:
        raise ValidationError({field: ["This field may not be blank."]})
    if len(value) < minimum:
        raise ValidationError({field: [f"Ensure this field has at least {minimum} characters."]})
    if maximum and len(value) > maximum:
        raise ValidationError({field: [f"Ensure this field has no more than {maximum} characters."]})
    return value


def _choice(data, field, choices, current=None):
    if field not in data:
        return current
    value = str(data.get(field) or "").strip().lower()
    if value not in choices:
        raise ValidationError({field: [f"Choose one of: {', '.join(choices)}."]})
    return value


def _tags(data, current=None):
    if "tags" not in data:
        return current
    raw = data.get("tags")
    if isinstance(raw, str):
        raw = [part for part in raw.split(",")]
    if not isinstance(raw, (list, tuple)):
        raise ValidationError({"tags": ["Send a list of tags."]})
    cleaned = []
    for tag in raw:
        tag = str(tag).strip()
        if not tag:
            continue
        if len(tag) > 30:
            raise ValidationError({"tags": ["Each tag must be 30 characters or fewer."]})
        if tag.lower() not in {existing.lower() for existing in cleaned}:
            cleaned.append(tag)
    if len(cleaned) > 15:
        raise ValidationError({"tags": ["Use at most 15 tags."]})
    return cleaned


# ---------------------------------------------------------------- stats
class AdminStatsAPIView(APIView):
    permission_classes = [permissions.IsAdminUser]

    @extend_schema(operation_id='users_admin_stats_get', responses={200: OpenApiTypes.OBJECT})
    def get(self, request, *args, **kwargs):
        now = timezone.now()
        today = timezone.localdate(now)
        totals = {
            "users": User.objects.count(),
            "projects": Project.objects.count(),
            "books": Book.objects.count(),
            "threads": Thread.objects.count(),
            "skills": Skill.objects.count(),
        }
        week_start = now - timedelta(days=6)
        signups = {}
        for created in User.objects.filter(created_at__date__gte=today - timedelta(days=6)).values_list("created_at", flat=True):
            signups[timezone.localdate(created)] = signups.get(timezone.localdate(created), 0) + 1
        started = {}
        for created in Project.objects.filter(created_at__date__gte=today - timedelta(days=6)).values_list("created_at", flat=True):
            started[timezone.localdate(created)] = started.get(timezone.localdate(created), 0) + 1
        daily = []
        for offset in range(6, -1, -1):
            day = today - timedelta(days=offset)
            daily.append({"date": day.isoformat(), "signups": signups.get(day, 0), "projects": started.get(day, 0)})

        people = max(totals["users"], 1)

        def share(count):
            return round(100 * count / people)

        finished_book = User.objects.filter(reading_progress__completed=True).distinct().count()
        on_a_project = User.objects.filter(Q(owned_projects__isnull=False) | Q(project_memberships__isnull=False)).distinct().count()
        with_badge = UserBadge.objects.values("user").distinct().count()
        posted = User.objects.filter(Q(threads__isnull=False) | Q(comments__isnull=False)).distinct().count()

        top_books = [
            {"id": book.id, "title": book.title, "slug": book.slug, "completions": book.completions}
            for book in Book.objects.annotate(completions=Count("reading_progress", distinct=True)).order_by("-completions", "-created_at")[:5]
        ]
        return Response(
            {
                "totals": totals,
                "signups_30d": User.objects.filter(created_at__gte=now - timedelta(days=30)).count(),
                "signups_7d": User.objects.filter(created_at__gte=week_start).count(),
                "active_projects": Project.objects.filter(status=Project.STATUS_ACTIVE).count(),
                "books_added_30d": Book.objects.filter(created_at__gte=now - timedelta(days=30)).count(),
                "open_reports": Report.objects.filter(status__in=["open", "review"]).count(),
                "xp_awarded_30d": XPEvent.objects.filter(created_at__gte=now - timedelta(days=30)).aggregate(total=Sum("amount"))["total"] or 0,
                "daily": daily,
                "signals": {
                    "books": share(finished_book),
                    "projects": share(on_a_project),
                    "badges": share(with_badge),
                    "community": share(posted),
                },
                "top_books": top_books,
            },
            status=status.HTTP_200_OK,
        )


# ---------------------------------------------------------------- users
def _user_row(user, request):
    return {
        "id": user.id,
        "username": user.username,
        "full_name": user.full_name,
        "email": user.email,
        "avatar": avatar_url(user, request),
        "role": user.role,
        "is_active": user.is_active,
        "is_staff": user.is_staff,
        "xp": user.xp,
        "level": user.level,
        "created_at": user.created_at,
        "last_active": user.last_active,
    }


class AdminUserListAPIView(APIView):
    permission_classes = [permissions.IsAdminUser]

    @extend_schema(operation_id='users_admin_user_list_get', responses={200: OpenApiTypes.OBJECT})
    def get(self, request, *args, **kwargs):
        params = request.query_params
        users = User.objects.all()
        query = (params.get("q") or params.get("search") or "").strip()
        if query:
            users = users.filter(Q(username__icontains=query) | Q(full_name__icontains=query) | Q(email__icontains=query))
        role = params.get("role")
        if role:
            if role not in ROLES:
                raise ValidationError({"role": [f"Choose one of: {', '.join(ROLES)}."]})
            users = users.filter(role=role)
        state = params.get("status")
        if state in {"active", "banned"}:
            users = users.filter(is_active=(state == "active"))
        return Response(_paginate(request, users.order_by("-created_at", "-id"), lambda user: _user_row(user, request)))

    @extend_schema(operation_id='users_admin_user_list_post', request=OpenApiTypes.OBJECT, responses={201: OpenApiTypes.OBJECT})
    def post(self, request, *args, **kwargs):
        data = request.data
        errors = {}
        email = ""
        username = ""
        for field in ("email", "username"):
            try:
                value = _text(data, field, required=True, maximum=254 if field == "email" else 50)
            except ValidationError as error:
                errors.update(error.detail)
                continue
            if field == "email":
                email = value.lower()
                if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
                    errors["email"] = ["Enter a valid email address."]
                elif User.objects.filter(email__iexact=email).exists():
                    errors["email"] = ["A user with that email already exists."]
            else:
                username = value
                if not USERNAME_PATTERN.match(username):
                    errors["username"] = ["Use 3-50 letters, numbers, dots, dashes or underscores."]
                elif User.objects.filter(username__iexact=username).exists():
                    errors["username"] = ["A user with that username already exists."]
        try:
            role = _choice(data, "role", ROLES, User.ROLE_LEARNER)
        except ValidationError as error:
            errors.update(error.detail)
        if errors:
            raise ValidationError(errors)
        password = data.get("password") or None
        if password:
            try:
                validate_password(password)
            except Exception as error:  # DjangoValidationError -> field error
                raise ValidationError({"password": list(getattr(error, "messages", [str(error)]))})
        user = User.objects.create_user(
            email=email,
            username=username,
            full_name=_text(data, "full_name", maximum=150) or "",
            # Without a password the account gets an unusable one and the person uses "Forgot password".
            password=password,
            role=role,
        )
        return Response(_user_row(user, request), status=status.HTTP_201_CREATED)


class AdminUserDetailAPIView(APIView):
    permission_classes = [permissions.IsAdminUser]

    @extend_schema(operation_id='users_admin_user_detail_patch', request=OpenApiTypes.OBJECT, responses={200: OpenApiTypes.OBJECT})
    def patch(self, request, id, *args, **kwargs):
        user = get_object_or_404(User, pk=id)
        data = request.data
        role = _choice(data, "role", ROLES, user.role)
        active = user.is_active
        if "is_active" in data:
            active = _bool(data["is_active"], "is_active")
        if "ban" in data:
            active = not _bool(data["ban"], "ban")
        if not active and user.is_active:
            if user == request.user:
                raise ValidationError({"is_active": ["You cannot deactivate your own account."]})
            if user.is_superuser and not request.user.is_superuser:
                raise ValidationError({"is_active": ["Only a superuser can deactivate a superuser."]})
        user.role, user.is_active = role, active
        user.save(update_fields=["role", "is_active", "updated_at"])
        return Response(_user_row(user, request), status=status.HTTP_200_OK)

    @extend_schema(operation_id='users_admin_user_detail_delete', responses={200: OpenApiTypes.OBJECT})
    def delete(self, request, id, *args, **kwargs):
        user = get_object_or_404(User, pk=id)
        if user == request.user:
            return Response({"error": {"code": "cannot_delete_self", "message": "You cannot delete yourself as an admin.", "fields": {}}}, status=status.HTTP_400_BAD_REQUEST)
        if user.is_superuser and not request.user.is_superuser:
            return Response({"error": {"code": "permission_denied", "message": "Only a superuser can delete a superuser.", "fields": {}}}, status=status.HTTP_403_FORBIDDEN)
        user.delete()
        return Response({"detail": "User deleted."}, status=status.HTTP_200_OK)


# ---------------------------------------------------------------- books
def _book_row(book, request, chapters=False):
    payload = {
        "id": book.id,
        "slug": book.slug,
        "title": book.title,
        "author": book.author,
        "description": book.description,
        "category": book.category,
        "difficulty": book.difficulty,
        "tags": book.tags or [],
        "cover": request.build_absolute_uri(book.cover.url) if book.cover else None,
        "is_featured": book.is_featured,
        "est_minutes": book.est_minutes,
        "chapter_count": getattr(book, "chapter_total", None) if getattr(book, "chapter_total", None) is not None else book.chapters.count(),
        "readers_count": getattr(book, "reader_total", 0),
        "created_at": book.created_at,
    }
    if chapters:
        payload["chapters"] = [_chapter_row(chapter) for chapter in book.chapters.all()]
    return payload


def _chapter_row(chapter):
    return {
        "id": chapter.id,
        "title": chapter.title,
        "chapter_number": chapter.chapter_number,
        "content": chapter.content,
        "est_minutes": reading_minutes(chapter.content),
    }


def _sync_reading_time(book):
    """Keep the book's headline reading time in step with its chapters."""
    minutes = sum(reading_minutes(chapter.content) for chapter in book.chapters.all())
    Book.objects.filter(pk=book.pk).update(est_minutes=minutes)
    book.est_minutes = minutes


def _annotated_books():
    return Book.objects.annotate(chapter_total=Count("chapters", distinct=True), reader_total=Count("reading_progress", distinct=True))


def _apply_book_fields(book, data, files, creating):
    book.title = _text(data, "title", required=True, minimum=2, maximum=200, current=book.title or None)
    book.author = _text(data, "author", required=creating, maximum=150, current=book.author or None) or "Unknown"
    book.description = _text(data, "description", maximum=5000, current=book.description) or ""
    book.category = _text(data, "category", maximum=50, current=book.category) or ""
    book.difficulty = _choice(data, "difficulty", DIFFICULTIES, book.difficulty or "beginner")
    tags = _tags(data, None)
    if tags is not None:
        book.tags = tags
    if "is_featured" in data:
        book.is_featured = _bool(data["is_featured"], "is_featured")
    upload = files.get("cover") if files else None
    if upload:
        try:
            validate_cover_upload(upload)
            # The validator checks name and size only; make sure the bytes really are an image.
            Image.open(upload).verify()
            upload.seek(0)
        except Exception as error:
            raise ValidationError({"cover": list(getattr(error, "messages", None) or ["Upload a valid image (JPG, PNG or WebP)."])})
        book.cover = upload
    if str(data.get("remove_cover", "")).lower() in {"true", "1"}:
        book.cover = None


class AdminBookListCreateAPIView(APIView):
    permission_classes = [permissions.IsAdminUser]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    @extend_schema(operation_id='users_admin_book_list_create_get', responses={200: OpenApiTypes.OBJECT})
    def get(self, request, *args, **kwargs):
        params = request.query_params
        books = _annotated_books()
        query = (params.get("q") or params.get("search") or "").strip()
        if query:
            books = books.filter(Q(title__icontains=query) | Q(author__icontains=query) | Q(category__icontains=query))
        if params.get("difficulty"):
            books = books.filter(difficulty=params["difficulty"])
        return Response(_paginate(request, books.order_by("-created_at", "-id"), lambda book: _book_row(book, request)))

    @extend_schema(operation_id='users_admin_book_list_create_post', request=OpenApiTypes.OBJECT, responses={201: OpenApiTypes.OBJECT})
    @transaction.atomic
    def post(self, request, *args, **kwargs):
        data = request.data
        book = Book()
        _apply_book_fields(book, data, request.FILES, creating=True)
        requested_slug = slugify(str(data.get("slug") or ""))
        if requested_slug:
            if Book.objects.filter(slug=requested_slug).exists():
                raise ValidationError({"slug": ["A book with this slug already exists."]})
            book.slug = requested_slug
        book.published_at = timezone.now()
        book.save()
        chapters = data.get("chapters") or []
        if not isinstance(chapters, list):
            raise ValidationError({"chapters": ["Send a list of chapters."]})
        for position, chapter in enumerate(chapters, start=1):
            if not isinstance(chapter, dict):
                raise ValidationError({"chapters": ["Each chapter must be an object."]})
            book.chapters.create(
                title=_text(chapter, "title", required=True, maximum=200),
                chapter_number=int(chapter.get("chapter_number") or position),
                content=_text(chapter, "content") or "",
            )
        _sync_reading_time(book)
        return Response(_book_row(_annotated_books().get(pk=book.pk), request, chapters=True), status=status.HTTP_201_CREATED)


class AdminBookDetailAPIView(APIView):
    permission_classes = [permissions.IsAdminUser]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    @extend_schema(operation_id='users_admin_book_detail_get', responses={200: OpenApiTypes.OBJECT})
    def get(self, request, id, *args, **kwargs):
        book = get_object_or_404(_annotated_books(), pk=id)
        return Response(_book_row(book, request, chapters=True))

    @extend_schema(operation_id='users_admin_book_detail_patch', request=OpenApiTypes.OBJECT, responses={200: OpenApiTypes.OBJECT})
    def patch(self, request, id, *args, **kwargs):
        book = get_object_or_404(Book, pk=id)
        _apply_book_fields(book, request.data, request.FILES, creating=False)
        book.save()
        return Response(_book_row(_annotated_books().get(pk=book.pk), request, chapters=True), status=status.HTTP_200_OK)

    @extend_schema(operation_id='users_admin_book_detail_delete', responses={200: OpenApiTypes.OBJECT})
    def delete(self, request, id, *args, **kwargs):
        get_object_or_404(Book, pk=id).delete()
        return Response({"detail": "Book deleted."}, status=status.HTTP_200_OK)


def _save_chapter(chapter, data):
    chapter.title = _text(data, "title", required=True, maximum=200, current=chapter.title or None)
    chapter.content = _text(data, "content", maximum=200000, current=chapter.content) or ""
    if "chapter_number" in data:
        try:
            number = int(data["chapter_number"])
        except (TypeError, ValueError):
            raise ValidationError({"chapter_number": ["A whole number is required."]})
        if number < 1:
            raise ValidationError({"chapter_number": ["Chapter numbers start at 1."]})
        chapter.chapter_number = number
    try:
        with transaction.atomic():
            chapter.save()
    except IntegrityError:
        raise ValidationError({"chapter_number": ["This book already has a chapter with that number."]})
    _sync_reading_time(chapter.book)


class AdminBookChaptersAPIView(APIView):
    permission_classes = [permissions.IsAdminUser]

    @extend_schema(operation_id='users_admin_book_chapters_post', request=OpenApiTypes.OBJECT, responses={201: OpenApiTypes.OBJECT})
    def post(self, request, id, *args, **kwargs):
        book = get_object_or_404(Book, pk=id)
        chapter = Chapter(book=book)
        if "chapter_number" not in request.data:
            last = book.chapters.order_by("-chapter_number").values_list("chapter_number", flat=True).first() or 0
            data = {**request.data, "chapter_number": last + 1}
        else:
            data = request.data
        _save_chapter(chapter, data)
        return Response(_chapter_row(chapter), status=status.HTTP_201_CREATED)


class AdminChapterDetailAPIView(APIView):
    permission_classes = [permissions.IsAdminUser]

    @extend_schema(operation_id='users_admin_chapter_detail_patch', request=OpenApiTypes.OBJECT, responses={200: OpenApiTypes.OBJECT})
    def patch(self, request, id, *args, **kwargs):
        chapter = get_object_or_404(Chapter.objects.select_related("book"), pk=id)
        _save_chapter(chapter, request.data)
        return Response(_chapter_row(chapter), status=status.HTTP_200_OK)

    @extend_schema(operation_id='users_admin_chapter_detail_delete', responses={200: OpenApiTypes.OBJECT})
    def delete(self, request, id, *args, **kwargs):
        chapter = get_object_or_404(Chapter.objects.select_related("book"), pk=id)
        book = chapter.book
        chapter.delete()
        _sync_reading_time(book)
        return Response({"detail": "Chapter deleted."}, status=status.HTTP_200_OK)


# ---------------------------------------------------------------- projects
def _project_row(project):
    return {
        "id": project.id,
        "slug": project.slug,
        "title": project.title,
        "category": project.category,
        "summary": project.summary,
        "status": project.status,
        "is_public": project.is_public,
        "owner": {"id": project.owner_id, "username": project.owner.username, "full_name": project.owner.full_name},
        "member_count": getattr(project, "member_total", 0),
        "created_at": project.created_at,
    }


def _apply_project_moderation(project, data):
    if "status" in data:
        project.status = _choice(data, "status", PROJECT_STATUSES, project.status)
    if "is_public" in data:
        project.is_public = _bool(data["is_public"], "is_public")
    project.save(update_fields=["status", "is_public", "updated_at"])


class AdminProjectListAPIView(APIView):
    permission_classes = [permissions.IsAdminUser]

    @extend_schema(operation_id='users_admin_project_list_get', responses={200: OpenApiTypes.OBJECT})
    def get(self, request, *args, **kwargs):
        params = request.query_params
        projects = Project.objects.select_related("owner").annotate(member_total=Count("members", distinct=True))
        query = (params.get("q") or params.get("search") or "").strip()
        if query:
            projects = projects.filter(Q(title__icontains=query) | Q(owner__username__icontains=query) | Q(owner__full_name__icontains=query))
        if params.get("status"):
            if params["status"] not in PROJECT_STATUSES:
                raise ValidationError({"status": [f"Choose one of: {', '.join(PROJECT_STATUSES)}."]})
            projects = projects.filter(status=params["status"])
        if params.get("visibility") in {"public", "hidden"}:
            projects = projects.filter(is_public=params["visibility"] == "public")
        return Response(_paginate(request, projects.order_by("-created_at", "-id"), _project_row))

    @extend_schema(operation_id='users_admin_project_list_patch', request=OpenApiTypes.OBJECT, responses={200: OpenApiTypes.OBJECT})
    def patch(self, request, *args, **kwargs):
        slug = request.data.get("slug") or request.data.get("project_slug")
        project = get_object_or_404(Project, slug=slug)
        _apply_project_moderation(project, request.data)
        return Response({"id": project.id, "title": project.title, "status": project.status, "is_public": project.is_public}, status=status.HTTP_200_OK)


class AdminProjectDetailAPIView(APIView):
    permission_classes = [permissions.IsAdminUser]

    @extend_schema(operation_id='users_admin_project_detail_patch', request=OpenApiTypes.OBJECT, responses={200: OpenApiTypes.OBJECT})
    def patch(self, request, slug, *args, **kwargs):
        project = get_object_or_404(Project.objects.select_related("owner").annotate(member_total=Count("members", distinct=True)), slug=slug)
        _apply_project_moderation(project, request.data)
        return Response(_project_row(project), status=status.HTTP_200_OK)

    @extend_schema(operation_id='users_admin_project_detail_delete', responses={200: OpenApiTypes.OBJECT})
    def delete(self, request, slug, *args, **kwargs):
        get_object_or_404(Project, slug=slug).delete()
        return Response({"detail": "Project deleted."}, status=status.HTTP_200_OK)


# ---------------------------------------------------------------- reports
def _describe_target(report, request):
    """What the report is about, so a moderator can judge it without leaving the page. exists=False if it was deleted."""
    model = report.content_type.model_class()
    target = model.objects.filter(pk=report.object_id).first() if model else None
    kind = report.content_type.model
    if target is None:
        return {"type": kind, "id": report.object_id, "exists": False, "label": "Deleted content", "preview": ""}
    if isinstance(target, Thread):
        return {"type": "thread", "id": target.id, "exists": True, "label": target.title, "slug": target.slug, "preview": target.body[:240], "author": target.author.username}
    if isinstance(target, Comment):
        return {"type": "comment", "id": target.id, "exists": True, "label": f"Comment on {target.thread.title}", "slug": target.thread.slug, "preview": target.body[:240], "author": target.author.username}
    if isinstance(target, User):
        return {"type": "user", "id": target.id, "exists": True, "label": target.full_name or target.username, "username": target.username, "preview": target.headline or target.bio[:240], "author": target.username, "is_active": target.is_active}
    return {"type": kind, "id": target.pk, "exists": True, "label": str(target), "preview": ""}


def _report_row(report, request):
    return {
        "id": report.id,
        "reporter": {"id": report.reporter_id, "username": report.reporter.username, "full_name": report.reporter.full_name},
        "reason": report.reason,
        "status": report.status,
        "created_at": report.created_at,
        "target": _describe_target(report, request),
    }


class AdminReportsAPIView(APIView):
    permission_classes = [permissions.IsAdminUser]

    @extend_schema(operation_id='users_admin_reports_get', responses={200: OpenApiTypes.OBJECT})
    def get(self, request, *args, **kwargs):
        reports = Report.objects.select_related("reporter", "content_type")
        state = request.query_params.get("status")
        if state == "pending":
            reports = reports.filter(status__in=["open", "review"])
        elif state:
            if state not in {value for value, _label in Report.REPORT_STATUS_CHOICES}:
                raise ValidationError({"status": ["Unknown status."]})
            reports = reports.filter(status=state)
        return Response(_paginate(request, reports.order_by("-created_at", "-id"), lambda report: _report_row(report, request)))

    def update_report(self, request, id, *args, **kwargs):
        report = get_object_or_404(Report.objects.select_related("reporter", "content_type"), pk=id)
        action = request.data.get("action")
        legacy_status = request.data.get("status")
        if action is None and legacy_status is not None:
            if legacy_status not in {value for value, _label in Report.REPORT_STATUS_CHOICES}:
                raise ValidationError({"status": ["Unknown status."]})
            report.status = legacy_status
            report.save(update_fields=["status", "updated_at"])
            return Response(_report_row(report, request), status=status.HTTP_200_OK)

        if action in REPORT_ACTIONS:
            report.status = REPORT_ACTIONS[action]
            report.save(update_fields=["status", "updated_at"])
        elif action in {"remove_content", "deactivate_user"}:
            self._act_on_target(request, report, action)
        else:
            raise ValidationError({"action": [f"Choose one of: {', '.join([*REPORT_ACTIONS, 'remove_content', 'deactivate_user'])}."]})
        report.refresh_from_db()
        return Response(_report_row(report, request), status=status.HTTP_200_OK)

    @transaction.atomic
    def _act_on_target(self, request, report, action):
        model = report.content_type.model_class()
        target = model.objects.filter(pk=report.object_id).first() if model else None
        if target is None:
            raise ValidationError({"action": ["That content no longer exists."]})
        if action == "remove_content":
            if not isinstance(target, (Thread, Comment)):
                raise ValidationError({"action": ["Only threads and comments can be removed. Deactivate the account instead."]})
            target.delete()
        else:
            if not isinstance(target, User):
                raise ValidationError({"action": ["Only reports about a person can deactivate an account."]})
            if target == request.user or target.is_staff:
                raise ValidationError({"action": ["Staff accounts cannot be deactivated from a report."]})
            target.is_active = False
            target.save(update_fields=["is_active", "updated_at"])
        # Everyone who reported the same thing is now dealt with (a deleted target's reports are found by type + id).
        Report.objects.filter(content_type=report.content_type, object_id=report.object_id).exclude(status__in=["resolved", "dismissed"]).update(status="resolved")


class AdminReportDetailAPIView(APIView):
    permission_classes = [permissions.IsAdminUser]

    @extend_schema(operation_id='users_admin_report_detail_patch', request=OpenApiTypes.OBJECT, responses={200: OpenApiTypes.OBJECT})
    def patch(self, request, id, *args, **kwargs):
        return AdminReportsAPIView().update_report(request, id, *args, **kwargs)
