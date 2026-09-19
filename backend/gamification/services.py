import math

from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.db.models import Sum
from django.utils import timezone

from books.models import ReadingProgress
from community.models import Comment, Thread, Vote
from notifications.services import create_notification
from projects.models import Milestone, Project, ProjectMember, Task
from .models import Badge, UserBadge, XPEvent

User = get_user_model()

XP_RULES = {
    "signup": 10,
    "profile_complete": 50,
    "chapter_complete": 10,
    "book_complete": 100,
    "project_create": 75,
    "project_join": 40,
    "task_complete": 15,
    "milestone_complete": 60,
    "thread_create": 20,
    "helpful_comment": 25,
    "daily_login": 5,
    "streak_week_bonus": 5,
}


# criteria_key -> how much progress earns the badge (shared by check_badges and the badges endpoint).
BADGE_THRESHOLDS = {
    "first_chapter": 1,
    "first_book": 1,
    "five_books": 5,
    "first_project": 1,
    "first_task": 1,
    "ten_tasks": 10,
    "first_milestone": 1,
    "project_completed": 1,
    "first_thread": 1,
    "ten_comments": 10,
    "helpful_5": 5,
    "streak_7": 7,
    "streak_30": 30,
    "level_5": 5,
    "level_10": 10,
}

BADGE_CATEGORIES = {
    "first_chapter": "Learning",
    "first_book": "Learning",
    "five_books": "Learning",
    "first_project": "Building",
    "first_task": "Building",
    "ten_tasks": "Building",
    "first_milestone": "Building",
    "project_completed": "Building",
    "first_thread": "Community",
    "ten_comments": "Community",
    "helpful_5": "Community",
    "streak_7": "Consistency",
    "streak_30": "Consistency",
    "level_5": "Consistency",
    "level_10": "Consistency",
}


def calculate_level(xp):
    return int(math.floor(math.sqrt(max(xp, 0) / 50))) + 1


def _award_xp_internal(user, action, points, source=None):
    source_key = source or ""
    if XPEvent.objects.filter(user=user, reason=action, source=source_key).exists():
        return None

    event = XPEvent.objects.create(user=user, amount=int(points), reason=action, source=source_key)
    previous_level = user.level or 1
    user.xp = (user.xp or 0) + int(points)
    user.level = calculate_level(user.xp)
    user.save(update_fields=["xp", "level"])

    if user.level != previous_level:
        create_notification(user, None, "level_up", None)
    return event


def award_xp(user, action, points, source=None):
    event = _award_xp_internal(user, action, int(points), source=source)
    if event is not None:
        check_badges(user)
    return event


def badge_progress(user, criteria_key):
    if criteria_key == "first_chapter":
        # (JSONField has no "len" lookup: `completed_chapters__len__gt` is read as a key named "len" and never matches.)
        finished_any = ReadingProgress.objects.filter(user=user, completed=True).exists()
        return 1 if finished_any or any(p.completed_chapters for p in ReadingProgress.objects.filter(user=user).only("completed_chapters")) else 0
    if criteria_key == "first_book":
        return 1 if ReadingProgress.objects.filter(user=user, completed=True).exists() else 0
    if criteria_key == "five_books":
        return ReadingProgress.objects.filter(user=user, completed=True).values("book").distinct().count()
    if criteria_key == "first_project":
        return 1 if (Project.objects.filter(owner=user).exists() or ProjectMember.objects.filter(user=user).exists()) else 0
    if criteria_key in ("first_task", "ten_tasks"):
        # Completed tasks (these used to count merely-assigned ones, so a badge fired on assignment).
        return Task.objects.filter(assignee=user, status=Task.STATUS_DONE).count()
    if criteria_key == "first_milestone":
        return 1 if Milestone.objects.filter(project__owner=user).exists() or Milestone.objects.filter(project__members__user=user).exists() else 0
    if criteria_key == "project_completed":
        return 1 if (Project.objects.filter(owner=user, status=Project.STATUS_COMPLETED).exists() or ProjectMember.objects.filter(user=user, project__status=Project.STATUS_COMPLETED).exists()) else 0
    if criteria_key == "first_thread":
        return Thread.objects.filter(author=user).count()
    if criteria_key == "ten_comments":
        return Comment.objects.filter(author=user).count()
    if criteria_key == "helpful_5":
        comment_ids = list(Comment.objects.filter(author=user).values_list("id", flat=True))
        if not comment_ids:
            return 0
        comment_type = ContentType.objects.get_for_model(Comment)
        return Vote.objects.filter(content_type=comment_type, object_id__in=comment_ids, value=1).count()
    if criteria_key == "streak_7":
        return user.streak_days or 0
    if criteria_key == "streak_30":
        return user.streak_days or 0
    if criteria_key == "level_5":
        return user.level or 1
    if criteria_key == "level_10":
        return user.level or 1
    return 0


def check_badges(user):
    earned = set(UserBadge.objects.filter(user=user).values_list("badge_id", flat=True))
    for badge in Badge.objects.all():
        if badge.id in earned:
            continue

        progress = badge_progress(user, badge.criteria_key)
        required = BADGE_THRESHOLDS.get(badge.criteria_key, 1)
        if progress >= required:
            UserBadge.objects.create(user=user, badge=badge)
            create_notification(user, None, f"badge_{badge.criteria_key}", badge)
            _award_xp_internal(user, badge.criteria_key, int(badge.xp_reward), source="badge")


def update_streak(user, award=True):
    """Count today as an active day. Cheap no-op when the user was already active today.

    Daily XP is keyed by date, so each new day pays once (a constant source used to pay once ever).
    A 7-day streak (and every further week) pays a bonus. `award=False` starts the streak silently (signup).
    """
    now = timezone.now()
    today = timezone.localdate(now)
    previous_streak = user.streak_days or 0
    if user.last_active is None:
        new_streak = 1
    else:
        delta_days = (today - timezone.localdate(user.last_active)).days
        if delta_days <= 0 and previous_streak >= 1:
            return user
        new_streak = previous_streak + 1 if delta_days == 1 else 1

    user.streak_days = new_streak
    user.last_active = now
    user.save(update_fields=["streak_days", "last_active"])

    if award:
        award_xp(user, "daily_login", XP_RULES["daily_login"], source=f"login:{today.isoformat()}")
        if new_streak % 7 == 0:
            award_xp(user, "streak_week_bonus", XP_RULES["streak_week_bonus"], source=f"streak:{today.isoformat()}")
    check_badges(user)
    return user
