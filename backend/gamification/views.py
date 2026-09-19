from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db.models import Count, F, IntegerField, OuterRef, Q, Subquery, Sum
from django.db.models.functions import Coalesce
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from community.serializers import author_payload

from .models import Badge, UserBadge, XPEvent
from .services import BADGE_CATEGORIES, BADGE_THRESHOLDS, badge_progress

User = get_user_model()

LEADERBOARD_DEFAULT_LIMIT = 50
LEADERBOARD_MAX_LIMIT = 100
ROLES = {value for value, _label in User._meta.get_field("role").choices}


def _cutoff(period):
    now = timezone.now()
    if period == "week":
        return now - timedelta(days=7)
    if period == "month":
        return now - timedelta(days=30)
    return None


def _limit(request, default, maximum):
    try:
        return max(1, min(int(request.query_params.get("limit", default)), maximum))
    except (TypeError, ValueError):
        return default


def _badge_payload(badge, **extra):
    return {
        "id": badge.id,
        "name": badge.name,
        "slug": badge.slug,
        "description": badge.description,
        "criteria_key": badge.criteria_key,
        "category": BADGE_CATEGORIES.get(badge.criteria_key, "Other"),
        "xp_reward": badge.xp_reward,
        "icon": badge.icon,
        **extra,
    }


def _entry(user, xp, rank, request):
    return {
        "rank": rank,
        "user": {
            **author_payload(user, request),
            "level": user.level,
            "role": user.role,
            "streak_days": user.streak_days,
            "badge_count": getattr(user, "badge_count", 0),
        },
        "xp": xp,
    }


class LeaderboardAPIView(APIView):
    """Top people by XP earned in a period, ranked in the database, plus the caller's own row with their real rank.

    ?period=week|month|all   ?role=learner|builder|mentor   ?limit=N
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        period = (request.query_params.get("period") or "all").lower()
        if period not in {"week", "month", "all"}:
            period = "all"
        role = request.query_params.get("role") or ""
        cutoff = _cutoff(period)
        limit = _limit(request, LEADERBOARD_DEFAULT_LIMIT, LEADERBOARD_MAX_LIMIT)

        people = User.objects.filter(is_active=True)
        if role in ROLES:
            people = people.filter(role=role)
        if cutoff is None:
            people = people.annotate(score=F("xp"))
        else:
            earned = (
                XPEvent.objects.filter(user=OuterRef("pk"), created_at__gte=cutoff)
                .values("user")
                .annotate(total=Sum("amount"))
                .values("total")
            )
            people = people.annotate(score=Coalesce(Subquery(earned, output_field=IntegerField()), 0))
        people = people.annotate(badge_count=Count("badges", distinct=True)).order_by("-score", "-streak_days", "id")

        rows = list(people.filter(score__gt=0)[:limit] if cutoff else people[:limit])
        entries = [_entry(user, user.score, rank, request) for rank, user in enumerate(rows, start=1)]

        me = request.user if request.user.is_authenticated else None
        if me is not None:
            mine = next((entry for entry in entries if entry["user"]["id"] == me.id), None)
            if mine is not None:
                mine["self"] = True
            elif not role or me.role == role:
                mine_row = people.filter(pk=me.pk).first()
                if mine_row is not None:
                    ahead = people.filter(
                        Q(score__gt=mine_row.score)
                        | Q(score=mine_row.score, streak_days__gt=mine_row.streak_days)
                        | Q(score=mine_row.score, streak_days=mine_row.streak_days, id__lt=mine_row.id)
                    ).count()
                    entries.append({**_entry(mine_row, mine_row.score, ahead + 1, request), "self": True})
        return Response(entries, status=status.HTTP_200_OK)


class BadgeListAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        return Response(
            [_badge_payload(badge, required=BADGE_THRESHOLDS.get(badge.criteria_key, 1)) for badge in Badge.objects.all()],
            status=status.HTTP_200_OK,
        )


class MeBadgesAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        earned_at = dict(UserBadge.objects.filter(user=request.user).values_list("badge_id", "earned_at"))
        earned, locked = [], []
        for badge in Badge.objects.all():
            required = BADGE_THRESHOLDS.get(badge.criteria_key, 1)
            if badge.id in earned_at:
                earned.append(_badge_payload(badge, earned_at=earned_at[badge.id], progress=required, required=required))
            else:
                progress = min(badge_progress(request.user, badge.criteria_key), required)
                locked.append(_badge_payload(badge, progress=progress, required=required))
        earned.sort(key=lambda item: item["earned_at"], reverse=True)
        return Response({"earned": earned, "locked": locked}, status=status.HTTP_200_OK)


class MeXPHistoryAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        limit = _limit(request, 50, 200)
        events = XPEvent.objects.filter(user=request.user).order_by("-created_at", "-id")[:limit]
        return Response(
            [
                {"id": event.id, "amount": event.amount, "reason": event.reason, "source": event.source, "created_at": event.created_at}
                for event in events
            ],
            status=status.HTTP_200_OK,
        )
