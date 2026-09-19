from datetime import timedelta

from django.db.models import Q
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from books.models import ReadingProgress
from gamification.models import UserBadge, XPEvent
from projects.models import Project

# Plain-English label for each XP reason, shown in the activity feed.
XP_LABELS = {
    "signup": "Joined Colearn",
    "profile_complete": "Completed your profile",
    "chapter_complete": "Finished a chapter",
    "book_complete": "Finished a book",
    "project_create": "Started a project",
    "project_join": "Joined a project",
    "task_complete": "Completed a task",
    "milestone_complete": "Reached a milestone",
    "thread_create": "Started a discussion",
    "helpful_comment": "Wrote a helpful comment",
    "daily_login": "Daily check-in",
    "streak_week_bonus": "Week-long streak bonus",
}


def level_bounds(level):
    """XP at which `level` starts and at which the next one starts (level = floor(sqrt(xp / 50)) + 1)."""
    return 50 * (level - 1) ** 2, 50 * level**2


class DashboardAPIView(APIView):
    """Everything on the signed-in person's home page that is theirs alone, in one request.

    Projects, suggested people and trending threads come from their own endpoints (projects?mine=1, users/suggested,
    threads?ordering=top), so this stays small.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        now = timezone.now()
        today = timezone.localdate(now)

        floor_xp, next_xp = level_bounds(user.level or 1)
        in_progress = ReadingProgress.objects.filter(user=user, completed=False).select_related("book", "chapter")
        active_projects = Project.objects.filter(Q(owner=user) | Q(members__user=user), status__in=[Project.STATUS_IDEA, Project.STATUS_ACTIVE]).distinct().count()

        resume = in_progress.order_by("-last_read_at", "-updated_at").first()
        reading = None
        if resume is not None:
            book = resume.book
            reading = {
                "book": {
                    "id": book.id,
                    "slug": book.slug,
                    "title": book.title,
                    "category": book.category,
                    "cover": request.build_absolute_uri(book.cover.url) if book.cover else None,
                },
                "chapter": {"id": resume.chapter_id, "number": resume.chapter.chapter_number, "title": resume.chapter.title} if resume.chapter else None,
                "progress": resume.progress_percent,
            }

        events = XPEvent.objects.filter(user=user).order_by("-created_at", "-id")[:6]
        activity = [
            {"id": event.id, "text": XP_LABELS.get(event.reason, event.reason.replace("_", " ").capitalize()), "amount": event.amount, "created_at": event.created_at}
            for event in events
        ]

        earned = UserBadge.objects.filter(user=user).select_related("badge").order_by("-earned_at")
        badges = [
            {"id": item.badge_id, "name": item.badge.name, "slug": item.badge.slug, "icon": item.badge.icon, "xp_reward": item.badge.xp_reward, "earned_at": item.earned_at}
            for item in earned[:4]
        ]

        start = today - timedelta(days=6)
        per_day = {}
        for created_at, amount in XPEvent.objects.filter(user=user, created_at__date__gte=start).values_list("created_at", "amount"):
            day = timezone.localdate(created_at)
            per_day[day] = per_day.get(day, 0) + amount
        weekly = [{"date": (start + timedelta(days=i)).isoformat(), "xp": per_day.get(start + timedelta(days=i), 0)} for i in range(7)]

        return Response(
            {
                "stats": {
                    "xp": user.xp,
                    "level": user.level,
                    "level_floor_xp": floor_xp,
                    "next_level_xp": next_xp,
                    "streak_days": user.streak_days,
                    "active_projects": active_projects,
                    "books_in_progress": in_progress.count(),
                    "badges_earned": earned.count(),
                },
                "reading": reading,
                "activity": activity,
                "badges": badges,
                "weekly_xp": weekly,
            },
            status=status.HTTP_200_OK,
        )
