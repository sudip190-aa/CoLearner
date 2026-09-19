from django.contrib.auth import get_user_model
from django.db.models import Case, Count, IntegerField, Q, Value, When
from rest_framework import permissions, status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from books.models import Book
from community.models import Thread
from community.serializers import avatar_url
from projects.models import Project

User = get_user_model()

TYPES = ("books", "projects", "people", "threads")
MIN_QUERY_LENGTH = 2
MAX_WORDS = 5
ALL_LIMIT = 5
TYPE_LIMIT = 20
MAX_LIMIT = 50


def _match(queryset, words, fields):
    """Every word must appear in at least one of the fields ("django tutorial" finds a Django book by a Tutorial author)."""
    for word in words:
        clause = Q()
        for field in fields:
            clause |= Q(**{f"{field}__icontains": word})
        queryset = queryset.filter(clause)
    return queryset


def _best_first(queryset, title_field, query):
    """Title matches before body-only matches, then newest."""
    return queryset.annotate(
        _rank=Case(When(**{f"{title_field}__icontains": query}, then=Value(0)), default=Value(1), output_field=IntegerField())
    ).order_by("_rank", "-id")


class SearchAPIView(APIView):
    """Search books, projects, people and discussions.

    ?q=text (min 2 characters)  ?type=all|books|projects|people|threads  ?limit=N per type
    Private projects and deactivated people never show up. `type_counts` are the full match counts, not the page size.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        query = " ".join((request.query_params.get("q") or "").split())
        requested = (request.query_params.get("type") or "all").lower()
        if requested == "discussions":
            requested = "threads"
        if requested != "all" and requested not in TYPES:
            raise ValidationError({"type": [f"Choose one of: all, {', '.join(TYPES)}."]})
        try:
            limit = int(request.query_params.get("limit") or (ALL_LIMIT if requested == "all" else TYPE_LIMIT))
        except ValueError:
            raise ValidationError({"limit": ["A whole number is required."]})
        limit = max(1, min(limit, MAX_LIMIT))

        counts = {key: 0 for key in TYPES}
        results = {key: [] for key in TYPES}
        if len(query) >= MIN_QUERY_LENGTH:
            words = query.split()[:MAX_WORDS]
            wanted = TYPES if requested == "all" else (requested,)
            for key in wanted:
                queryset = getattr(self, f"_{key}")(request, query, words)
                counts[key] = queryset.count()
                results[key] = [self._row(key, item, request) for item in queryset[:limit]]

        shown = TYPES if requested == "all" else (requested,)
        return Response(
            {
                "query": query,
                "type": requested,
                "type_counts": {key: counts[key] for key in shown},
                "results": {key: results[key] for key in shown},
                "total": sum(counts[key] for key in shown),
            },
            status=status.HTTP_200_OK,
        )

    # -- querysets
    def _books(self, request, query, words):
        books = _match(Book.objects.all(), words, ["title", "author", "description", "category"])
        return _best_first(books, "title", query)

    def _projects(self, request, query, words):
        visible = Q(is_public=True)
        if request.user.is_authenticated:
            visible |= Q(owner=request.user) | Q(members__user=request.user)
        projects = Project.objects.filter(visible).distinct().select_related("owner").annotate(member_total=Count("members", distinct=True))
        projects = _match(projects, words, ["title", "summary", "description", "category"])
        return _best_first(projects, "title", query)

    def _people(self, request, query, words):
        people = User.objects.filter(is_active=True).prefetch_related("skills__skill")
        people = _match(people, words, ["full_name", "username", "headline"])
        return _best_first(people, "full_name", query)

    def _threads(self, request, query, words):
        threads = Thread.objects.select_related("author").annotate(comment_total=Count("comments", distinct=True))
        threads = _match(threads, words, ["title", "body", "category", "tags__name"]).distinct()
        return _best_first(threads, "title", query)

    # -- rows
    def _row(self, key, item, request):
        if key == "books":
            return {
                "id": item.id,
                "slug": item.slug,
                "title": item.title,
                "author": item.author,
                "description": item.description[:200],
                "category": item.category,
                "difficulty": item.difficulty,
                "cover": request.build_absolute_uri(item.cover.url) if item.cover else None,
            }
        if key == "projects":
            return {
                "id": item.id,
                "slug": item.slug,
                "title": item.title,
                "summary": item.summary,
                "status": item.status,
                "category": item.category,
                "member_count": item.member_total,
                "owner": {"username": item.owner.username, "full_name": item.owner.full_name},
            }
        if key == "people":
            return {
                "id": item.id,
                "username": item.username,
                "full_name": item.full_name,
                "headline": item.headline,
                "role": item.role,
                "avatar": avatar_url(item, request),
                "skills": [link.skill.name for link in list(item.skills.all())[:3]],
            }
        return {
            "id": item.id,
            "slug": item.slug,
            "title": item.title,
            "category": item.category,
            "excerpt": item.body[:200],
            "author": {"username": item.author.username, "full_name": item.author.full_name},
            "comment_count": item.comment_total,
        }
