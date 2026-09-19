from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema

from django.contrib.contenttypes.models import ContentType
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from community.models import Comment
from community.serializers import author_payload
from gamification.models import Badge
from projects.models import Project, Task

from .models import Notification

DEFAULT_LIMIT = 50
MAX_LIMIT = 100


def _describe_targets(notifications):
    """Map notification id -> {type, label, slug, ...} for whatever each one points at, using one query per target type.

    Targets can be gone (a deleted thread or project), and then the value is None so the client can show plain text.
    """
    wanted = {}
    for notification in notifications:
        if notification.target_content_type_id and notification.object_id:
            wanted.setdefault(notification.target_content_type_id, set()).add(notification.object_id)

    lookups = {
        Comment: lambda ids: {c.id: {"type": "comment", "id": c.id, "label": c.thread.title, "slug": c.thread.slug} for c in Comment.objects.filter(id__in=ids).select_related("thread")},
        Project: lambda ids: {p.id: {"type": "project", "id": p.id, "label": p.title, "slug": p.slug} for p in Project.objects.filter(id__in=ids)},
        Task: lambda ids: {t.id: {"type": "project", "id": t.project_id, "label": t.project.title, "slug": t.project.slug} for t in Task.objects.filter(id__in=ids).select_related("project")},
        Badge: lambda ids: {b.id: {"type": "badge", "id": b.id, "label": b.name, "slug": b.slug} for b in Badge.objects.filter(id__in=ids)},
    }
    resolved = {}
    for content_type_id, ids in wanted.items():
        model = ContentType.objects.get_for_id(content_type_id).model_class()
        lookup = lookups.get(model)
        resolved[content_type_id] = lookup(ids) if lookup else {}
    return {
        notification.id: resolved.get(notification.target_content_type_id, {}).get(notification.object_id)
        for notification in notifications
    }


def _payload(notification, target, request):
    return {
        "id": notification.id,
        "verb": notification.verb,
        "actor": author_payload(notification.actor, request) if notification.actor else None,
        "target": target,
        "is_read": notification.is_read,
        "created_at": notification.created_at,
    }


class NotificationListAPIView(APIView):
    """The caller's notifications, newest first. ?unread=1 only unread, ?limit=N (default 50, max 100)."""

    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(operation_id='notifications_notification_list_get', responses={200: {'type': 'array', 'items': {'type': 'object'}}})
    def get(self, request, *args, **kwargs):
        try:
            limit = max(1, min(int(request.query_params.get("limit", DEFAULT_LIMIT)), MAX_LIMIT))
        except (TypeError, ValueError):
            limit = DEFAULT_LIMIT
        queryset = Notification.objects.filter(user=request.user).select_related("actor")
        if str(request.query_params.get("unread", "")).lower() in {"1", "true", "yes"}:
            queryset = queryset.filter(is_read=False)
        items = list(queryset[:limit])
        targets = _describe_targets(items)
        return Response([_payload(item, targets[item.id], request) for item in items], status=status.HTTP_200_OK)


class NotificationMarkReadAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(operation_id='notifications_notification_mark_read_post', request=OpenApiTypes.OBJECT, responses={200: OpenApiTypes.OBJECT})
    def post(self, request, id, *args, **kwargs):
        notification = get_object_or_404(Notification, id=id, user=request.user)
        if not notification.is_read:
            notification.is_read = True
            notification.save(update_fields=["is_read", "updated_at"])
        return Response({"id": notification.id, "is_read": True}, status=status.HTTP_200_OK)


class NotificationReadAllAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(operation_id='notifications_notification_read_all_post', request=OpenApiTypes.OBJECT, responses={200: OpenApiTypes.OBJECT})
    def post(self, request, *args, **kwargs):
        updated = Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({"status": "ok", "updated": updated}, status=status.HTTP_200_OK)


class UnreadNotificationCountAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(operation_id='notifications_unread_notification_count_get', responses={200: OpenApiTypes.OBJECT})
    def get(self, request, *args, **kwargs):
        count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({"unread_count": count}, status=status.HTTP_200_OK)
