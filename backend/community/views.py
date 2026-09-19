import re

from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.db.models import Count, F, IntegerField, OuterRef, Q, Subquery, Sum
from django.db.models.functions import Coalesce
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from core.models import Report
from gamification.models import XPEvent
from gamification.services import XP_RULES, award_xp
from notifications.services import create_notification
from .models import Comment, Tag, Thread, ThreadView, Vote
from .serializers import CommentSerializer, TagSerializer, ThreadSerializer, ThreadWriteSerializer

User = get_user_model()

MAX_COMMENT_LENGTH = 5000
MAX_REPORT_REASON = 255
THREAD_XP_PER_DAY = 5  # XP is paid for the first few threads each day, so spamming threads can't farm it
HELPFUL_SCORE = 5  # net votes a comment needs before its author earns "helpful comment" XP
MENTION_PATTERN = re.compile(r"@([A-Za-z0-9_.\-]+)")


def _content_type(model):
    return ContentType.objects.get_for_model(model)


def vote_total(obj):
    return Vote.objects.filter(content_type=_content_type(obj), object_id=obj.id).aggregate(total=Sum("value"))["total"] or 0


def user_vote_for(user, obj):
    if not user or not user.is_authenticated:
        return 0
    vote = Vote.objects.filter(user=user, content_type=_content_type(obj), object_id=obj.id).first()
    return int(vote.value) if vote else 0


def _with_vote_annotations(queryset, model, user):
    """Vote score and the viewer's own vote, computed inside the main query (no per-row queries)."""
    ct = _content_type(model)
    votes = Vote.objects.filter(content_type=ct, object_id=OuterRef("pk"))
    score = votes.values("object_id").annotate(total=Sum("value")).values("total")[:1]
    queryset = queryset.annotate(vote_score=Coalesce(Subquery(score, output_field=IntegerField()), 0))
    if user and user.is_authenticated:
        mine = votes.filter(user=user).values("value")[:1]
        queryset = queryset.annotate(user_vote=Coalesce(Subquery(mine, output_field=IntegerField()), 0))
    return queryset


def _with_comment_count(queryset):
    counts = Comment.objects.filter(thread=OuterRef("pk")).values("thread").annotate(total=Count("pk")).values("total")[:1]
    return queryset.annotate(comment_count=Coalesce(Subquery(counts, output_field=IntegerField()), 0))


def _require_text(value, field, max_length):
    text = str(value or "").strip()
    if not text:
        raise ValidationError({field: ["This field may not be blank."]})
    if len(text) > max_length:
        raise ValidationError({field: [f"Ensure this field has no more than {max_length} characters."]})
    return text


def _get_target(name, object_id):
    models = {"thread": Thread, "comment": Comment}
    if name not in models:
        raise ValidationError({"content_type": ["Must be 'thread' or 'comment'."]})
    try:
        object_id = int(object_id)
    except (TypeError, ValueError):
        raise ValidationError({"object_id": ["A whole number is required."]})
    return get_object_or_404(models[name], id=object_id)


class ThreadListAPIView(APIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get(self, request, *args, **kwargs):
        queryset = Thread.objects.select_related("author").prefetch_related("tags")
        queryset = _with_comment_count(_with_vote_annotations(queryset, Thread, request.user))

        if category := request.query_params.get("category"):
            queryset = queryset.filter(category__iexact=category)
        if tag := request.query_params.get("tag"):
            queryset = queryset.filter(tags__slug__iexact=tag)
        if request.query_params.get("mine") in {"1", "true", "yes"} and request.user.is_authenticated:
            queryset = queryset.filter(author=request.user)
        answered = request.query_params.get("answered")
        if answered is not None:
            queryset = queryset.filter(comment_count__gt=0) if str(answered).lower() in {"1", "true", "yes"} else queryset.filter(comment_count=0)
        if search := (request.query_params.get("search") or request.query_params.get("q")):
            queryset = queryset.filter(Q(title__icontains=search) | Q(body__icontains=search))

        ordering = request.query_params.get("ordering", "latest")
        if ordering == "top":
            queryset = queryset.order_by("-is_pinned", "-vote_score", "-created_at")
        elif ordering == "unanswered":
            queryset = queryset.order_by("-is_pinned", "comment_count", "-created_at")
        else:
            queryset = queryset.order_by("-is_pinned", "-created_at")

        return Response(ThreadSerializer(queryset.distinct(), many=True, context={"request": request}).data, status=status.HTTP_200_OK)

    def post(self, request, *args, **kwargs):
        serializer = ThreadWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        thread = serializer.save(author=request.user)

        today = timezone.localdate()
        paid_today = XPEvent.objects.filter(user=request.user, reason="thread_create", created_at__date=today).count()
        xp_awarded = 0
        if paid_today < THREAD_XP_PER_DAY:
            event = award_xp(request.user, "thread_create", XP_RULES["thread_create"], source=f"thread:{thread.id}")
            xp_awarded = event.amount if event else 0

        payload = ThreadSerializer(thread, context={"request": request}).data
        payload["xp_awarded"] = xp_awarded
        return Response(payload, status=status.HTTP_201_CREATED)


class ThreadDetailAPIView(APIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get(self, request, slug, *args, **kwargs):
        thread = get_object_or_404(Thread.objects.select_related("author").prefetch_related("tags"), slug=slug)

        if request.user.is_authenticated:
            _, created = ThreadView.objects.get_or_create(thread=thread, user=request.user, viewed_on=timezone.localdate())
            if created:
                Thread.objects.filter(pk=thread.pk).update(views=F("views") + 1)

        comments = _with_vote_annotations(Comment.objects.filter(thread=thread).select_related("author"), Comment, request.user)
        roots, replies_by_parent = [], {}
        for comment in comments.order_by("created_at"):
            if comment.parent_id is None:
                roots.append(comment)
            else:
                replies_by_parent.setdefault(comment.parent_id, []).append(comment)
        for root in roots:
            root.reply_list = CommentSerializer(replies_by_parent.get(root.id, []), many=True, context={"request": request}).data
        roots.reverse()  # newest discussion first; replies read oldest to newest

        thread = _with_comment_count(_with_vote_annotations(Thread.objects.filter(pk=thread.pk), Thread, request.user)).get()
        payload = ThreadSerializer(thread, context={"request": request}).data
        payload["comments"] = CommentSerializer(roots, many=True, context={"request": request}).data
        return Response(payload, status=status.HTTP_200_OK)

    def patch(self, request, slug, *args, **kwargs):
        thread = get_object_or_404(Thread, slug=slug)
        if request.user != thread.author and not request.user.is_staff:
            raise PermissionDenied("You can only edit your own thread.")
        serializer = ThreadWriteSerializer(thread, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated = serializer.save()
        return Response(ThreadSerializer(updated, context={"request": request}).data, status=status.HTTP_200_OK)

    def delete(self, request, slug, *args, **kwargs):
        thread = get_object_or_404(Thread, slug=slug)
        if request.user != thread.author and not request.user.is_staff:
            raise PermissionDenied("You can only delete your own thread.")
        thread.delete()
        return Response({"detail": "Thread deleted."}, status=status.HTTP_200_OK)


class ThreadCommentCreateAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, slug, *args, **kwargs):
        thread = get_object_or_404(Thread, slug=slug)
        body = _require_text(request.data.get("body"), "body", MAX_COMMENT_LENGTH)

        # Replies are shown one level deep. A reply to a reply is attached to the top-level comment
        # (otherwise it would exist but never appear), while the notification still goes to the person replied to.
        replied_to = None
        if request.data.get("parent_id"):
            try:
                parent_id = int(request.data["parent_id"])
            except (TypeError, ValueError):
                raise ValidationError({"parent_id": ["A whole number is required."]})
            replied_to = get_object_or_404(Comment, id=parent_id, thread=thread)
        parent = (replied_to.parent or replied_to) if replied_to else None

        comment = Comment.objects.create(thread=thread, author=request.user, parent=parent, body=body)

        notified = {request.user.id}

        def notify(user, verb):
            if user.id not in notified:
                notified.add(user.id)
                create_notification(user, request.user, verb, comment)

        if replied_to:
            notify(replied_to.author, "replied_to_comment")
        notify(thread.author, "commented_on_thread")
        for username in sorted(set(MENTION_PATTERN.findall(body))):
            mentioned = User.objects.filter(username__iexact=username, is_active=True).first()
            if mentioned:
                notify(mentioned, "mentioned_you")

        return Response(CommentSerializer(comment, context={"request": request}).data, status=status.HTTP_201_CREATED)


class CommentDetailAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, id, *args, **kwargs):
        comment = get_object_or_404(Comment, id=id)
        if request.user != comment.author and not request.user.is_staff:
            raise PermissionDenied("You can only edit your own comment.")
        comment.body = _require_text(request.data.get("body"), "body", MAX_COMMENT_LENGTH)
        comment.save(update_fields=["body", "updated_at"])
        return Response(CommentSerializer(comment, context={"request": request}).data, status=status.HTTP_200_OK)

    def delete(self, request, id, *args, **kwargs):
        comment = get_object_or_404(Comment, id=id)
        if request.user != comment.author and not request.user.is_staff:
            raise PermissionDenied("You can only delete your own comment.")
        comment.delete()
        return Response({"detail": "Comment deleted."}, status=status.HTTP_200_OK)


class VoteAPIView(APIView):
    """body: {"content_type": "thread"|"comment", "object_id": <id>, "value": 1|-1|0}.

    Sending the vote you already have (or 0) removes it. Returns the new score and the viewer's vote.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        content_type = str(request.data.get("content_type") or "").lower()
        try:
            value = int(request.data.get("value"))
        except (TypeError, ValueError):
            raise ValidationError({"value": ["Must be 1, -1 or 0."]})
        if value not in {-1, 0, 1}:
            raise ValidationError({"value": ["Must be 1, -1 or 0."]})

        target = _get_target(content_type, request.data.get("object_id"))
        if target.author_id == request.user.id:
            raise ValidationError({"object_id": ["You can't vote on your own post."]})

        ct = _content_type(target)
        existing = Vote.objects.filter(user=request.user, content_type=ct, object_id=target.id).first()
        if existing and (value == 0 or existing.value == value):
            existing.delete()
        elif value != 0:
            Vote.objects.update_or_create(user=request.user, content_type=ct, object_id=target.id, defaults={"value": value})

        total = int(vote_total(target))
        payload = {"content_type": content_type, "object_id": target.id, "score": total, "user_vote": user_vote_for(request.user, target), "xp_awarded": 0}

        if content_type == "comment" and total >= HELPFUL_SCORE and not target.xp_awarded:
            event = award_xp(target.author, "helpful_comment", XP_RULES["helpful_comment"], source=f"comment:{target.id}")
            Comment.objects.filter(pk=target.pk).update(xp_awarded=True)
            # The XP goes to the comment's author, not to the person voting.
            payload["author_xp_awarded"] = event.amount if event else 0
        return Response(payload, status=status.HTTP_200_OK)


class TagListAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        tags = Tag.objects.annotate(thread_count=Count("threads", distinct=True)).filter(thread_count__gt=0).order_by("-thread_count", "name")
        return Response(TagSerializer(tags, many=True, context={"request": request}).data, status=status.HTTP_200_OK)


class ReportAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        content_type_name = str(request.data.get("content_type") or "").lower()
        target = _get_target(content_type_name, request.data.get("object_id"))
        reason = str(request.data.get("reason") or "").strip() or "Inappropriate content"
        if len(reason) > MAX_REPORT_REASON:
            raise ValidationError({"reason": [f"Ensure this field has no more than {MAX_REPORT_REASON} characters."]})

        ct = _content_type(target)
        # One open report per person per item: repeats return the existing one instead of stacking up.
        report = Report.objects.filter(reporter=request.user, content_type=ct, object_id=target.id).exclude(status__in=["resolved", "dismissed"]).first()
        created = report is None
        if created:
            report = Report.objects.create(reporter=request.user, content_type=ct, object_id=target.id, reason=reason)
        return Response(
            {"id": report.id, "status": report.status, "content_type": content_type_name, "object_id": target.id, "already_reported": not created},
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )
