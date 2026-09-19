from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema

import logging
from datetime import timedelta
from urllib.parse import quote

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import update_last_login
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.core.exceptions import ObjectDoesNotExist
from django.core.mail import send_mail
from django.db.models import Count, Q, Sum
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import InvalidToken
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView

from books.models import Book, ReadingProgress
from community.models import Comment, Thread
from gamification.models import Badge, XPEvent
from gamification.services import XP_RULES, award_xp, update_streak
from notifications.models import Notification
from notifications.services import create_notification
from projects.models import Project, ProjectMember

from .models import Connection, Skill, UserSkill
from .serializers import (
    LoginSerializer,
    OnboardingSerializer,
    PasswordChangeSerializer,
    PasswordForgotSerializer,
    PasswordResetSerializer,
    SkillSerializer,
    SkillsSyncSerializer,
    UserDetailSerializer,
    UserRegisterSerializer,
)
from .throttles import AuthIPThrottle

User = get_user_model()
logger = logging.getLogger(__name__)


def _issue_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }


def _update_login_streak(user):
    return update_streak(user)


def _user_skill_names(user):
    if user is None:
        return set()
    return {item.skill.name for item in user.skills.select_related("skill").all()}


def _connection_states(viewer):
    """Map other_user_id -> none/pending_sent/pending_received/accepted from the viewer's point of view."""
    if viewer is None or not viewer.is_authenticated:
        return {}
    states = {}
    for connection in Connection.objects.filter(Q(from_user=viewer) | Q(to_user=viewer)):
        sent = connection.from_user_id == viewer.pk
        other_id = connection.to_user_id if sent else connection.from_user_id
        if connection.status == "accepted":
            states[other_id] = "accepted"
        elif connection.status == "pending":
            states[other_id] = "pending_sent" if sent else "pending_received"
    return states


def _user_summary(user, request, states=None, my_skills=None):
    """Public profile payload. `request` must be the real request (the serializer needs it for absolute URLs)."""
    viewer = request.user if request is not None and request.user.is_authenticated else None
    payload = UserDetailSerializer(user, context={"request": request}).data
    payload["mutual_skills_count"] = 0
    payload["shared_skills"] = []
    payload["connection_status"] = "none"
    if viewer is not None and viewer.pk != user.pk:
        if my_skills is None:
            my_skills = _user_skill_names(viewer)
        mutual = sorted(_user_skill_names(user) & my_skills)
        payload["mutual_skills_count"] = len(mutual)
        payload["shared_skills"] = mutual[:5]
        payload["connection_status"] = (states if states is not None else _connection_states(viewer)).get(user.pk, "none")
    return payload


class RegisterAPIView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AuthIPThrottle]

    @extend_schema(operation_id='users_register_post', request=UserRegisterSerializer, responses={201: OpenApiTypes.OBJECT})
    def post(self, request, *args, **kwargs):
        serializer = UserRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        award_xp(user, "signup", XP_RULES["signup"], source="signup")
        update_streak(user, award=False)
        tokens = _issue_tokens_for_user(user)
        return Response(
            {
                # request.user is still anonymous here, so name the viewer explicitly to include the owner's own email.
                "user": UserDetailSerializer(user, context={"request": request, "viewer": user}).data,
                **tokens,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginAPIView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AuthIPThrottle]

    @extend_schema(operation_id='users_login_post', request=LoginSerializer, responses={200: OpenApiTypes.OBJECT})
    def post(self, request, *args, **kwargs):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        user = _update_login_streak(user)
        update_last_login(None, user)
        tokens = _issue_tokens_for_user(user)
        return Response(
            {
                "user": UserDetailSerializer(user, context={"request": request, "viewer": user}).data,
                **tokens,
            },
            status=status.HTTP_200_OK,
        )


class LogoutAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(operation_id='users_logout_post', request=OpenApiTypes.OBJECT, responses={200: OpenApiTypes.OBJECT})
    def post(self, request, *args, **kwargs):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response({"error": {"code": "invalid_token", "message": "Refresh token is required.", "fields": {}}}, status=status.HTTP_400_BAD_REQUEST)

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except Exception:
            return Response({"error": {"code": "invalid_token", "message": "Invalid refresh token.", "fields": {}}}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"detail": "Logged out successfully."}, status=status.HTTP_200_OK)


class SafeTokenRefreshView(TokenRefreshView):
    """SimpleJWT lets User.DoesNotExist escape (HTTP 500) when a token's user was deleted; that is simply an invalid token."""

    def post(self, request, *args, **kwargs):
        try:
            return super().post(request, *args, **kwargs)
        except ObjectDoesNotExist:
            raise InvalidToken("The account for this token no longer exists.")


class UsernameAvailabilityAPIView(APIView):
    """Live check for the signup form. Usernames are already public, so this reveals nothing new."""

    permission_classes = [permissions.AllowAny]

    @extend_schema(operation_id='users_username_availability_get', responses={200: OpenApiTypes.OBJECT})
    def get(self, request, *args, **kwargs):
        username = (request.query_params.get("username") or "").strip()
        if not username:
            raise ValidationError({"username": ["This field is required."]})
        return Response({"available": not User.objects.filter(username__iexact=username).exists()}, status=status.HTTP_200_OK)


class MeAPIView(generics.RetrieveUpdateAPIView):
    serializer_class = UserDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_object(self):
        # The SPA calls /auth/me/ whenever it opens, so this counts a day of activity for people who stay signed in.
        return update_streak(self.request.user) if self.request.method == "GET" else self.request.user

    def delete(self, request, *args, **kwargs):
        """Permanently delete the signed-in account. Requires the password so a stolen session can't do it."""
        if not request.user.check_password(request.data.get("password") or ""):
            raise ValidationError({"password": ["Password is incorrect."]})
        request.user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeSkillsAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(operation_id='users_me_skills_put', request=SkillsSyncSerializer, responses={200: UserDetailSerializer})
    def put(self, request, *args, **kwargs):
        serializer = SkillsSyncSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(request.user)
        return Response(UserDetailSerializer(request.user, context={"request": request}).data, status=status.HTTP_200_OK)


class PasswordChangeAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [AuthIPThrottle]

    @extend_schema(operation_id='users_password_change_post', request=PasswordChangeSerializer, responses={200: OpenApiTypes.OBJECT})
    def post(self, request, *args, **kwargs):
        serializer = PasswordChangeSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        # Sign every other device out, and hand this one a fresh session.
        for outstanding in OutstandingToken.objects.filter(user=user):
            BlacklistedToken.objects.get_or_create(token=outstanding)
        return Response({"detail": "Password changed.", **_issue_tokens_for_user(user)}, status=status.HTTP_200_OK)


PASSWORD_FORGOT_DETAIL = "If an account exists for that email, a reset link has been sent."


def _send_password_reset_email(user):
    token = PasswordResetTokenGenerator().make_token(user)
    link = f"{settings.FRONTEND_URL.rstrip('/')}/reset-password/{token}?email={quote(user.email)}"
    send_mail(
        subject="Reset your Colearn password",
        message=(
            f"Hi {user.full_name or user.username},\n\n"
            f"Use this link to choose a new password:\n{link}\n\n"
            "If you didn't ask for this, you can ignore this email; your password stays the same."
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
    )


class PasswordForgotAPIView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AuthIPThrottle]

    @extend_schema(operation_id='users_password_forgot_post', request=PasswordForgotSerializer, responses={200: OpenApiTypes.OBJECT})
    def post(self, request, *args, **kwargs):
        serializer = PasswordForgotSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.context.get("user")
        if user is not None and user.is_active:
            try:
                _send_password_reset_email(user)
            except Exception:
                # Never let a mail failure change the response: it would reveal which emails have accounts.
                logger.exception("Could not send password reset email to user id=%s", user.pk)

        # The response is identical whether or not the account exists.
        return Response({"detail": PASSWORD_FORGOT_DETAIL}, status=status.HTTP_200_OK)


class PasswordResetAPIView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AuthIPThrottle]

    @extend_schema(operation_id='users_password_reset_post', request=PasswordResetSerializer, responses={200: OpenApiTypes.OBJECT})
    def post(self, request, *args, **kwargs):
        serializer = PasswordResetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Password reset successful."}, status=status.HTTP_200_OK)


class OnboardingAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(operation_id='users_onboarding_post', request=OnboardingSerializer, responses={200: OpenApiTypes.OBJECT})
    def post(self, request, *args, **kwargs):
        serializer = OnboardingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        first_completion = not request.user.onboarding_completed
        user = serializer.update(request.user, serializer.validated_data)
        if first_completion:
            award_xp(user, "profile_complete", XP_RULES["profile_complete"], source="onboarding")
        return Response(
            {
                "detail": "Onboarding complete.",
                "user": UserDetailSerializer(user, context={"request": request}).data,
            },
            status=status.HTTP_200_OK,
        )


class UserListAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(operation_id='users_user_list_get', responses={200: {'type': 'array', 'items': {'type': 'object'}}})
    def get(self, request, *args, **kwargs):
        # Deactivated/banned accounts never appear in public listings.
        queryset = User.objects.filter(is_active=True).prefetch_related("skills__skill", "badges__badge")
        if request.user.is_authenticated:
            queryset = queryset.exclude(pk=request.user.pk)

        # Selecting several skills means "has all of them"; chained filters on the relation give AND semantics.
        for name in {item.strip() for item in request.query_params.getlist("skills") if item.strip()}:
            queryset = queryset.filter(skills__skill__name__iexact=name)

        role = request.query_params.get("role")
        if role:
            queryset = queryset.filter(role__iexact=role)

        availability = request.query_params.get("availability")
        if availability:
            queryset = queryset.filter(availability__iexact=availability)

        location = request.query_params.get("location")
        if location:
            queryset = queryset.filter(location__icontains=location)

        search = request.query_params.get("search") or request.query_params.get("q") or request.query_params.get("name")
        if search:
            queryset = queryset.filter(Q(full_name__icontains=search) | Q(username__icontains=search) | Q(headline__icontains=search))

        ordering = (request.query_params.get("ordering") or "newest").lower()
        if ordering == "newest":
            queryset = queryset.order_by("-created_at")
        else:  # "xp", "best_match" and anything unknown start from highest XP
            queryset = queryset.order_by("-xp", "-created_at")

        viewer = request.user if request.user.is_authenticated else None
        states = _connection_states(viewer)
        my_skills = _user_skill_names(viewer)
        items = [_user_summary(user, request, states, my_skills) for user in queryset.distinct()]
        if ordering == "best_match":
            # Stable sort keeps the XP order among equal overlaps.
            items.sort(key=lambda item: -item["mutual_skills_count"])
        return Response(items, status=status.HTTP_200_OK)


class UserDetailAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(operation_id='users_user_detail_get', responses={200: OpenApiTypes.OBJECT})
    def get(self, request, username, *args, **kwargs):
        user = get_object_or_404(User, username__iexact=username, is_active=True)
        return Response(_user_summary(user, request), status=status.HTTP_200_OK)


class UserPortfolioAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(operation_id='users_user_portfolio_get', responses={200: OpenApiTypes.OBJECT})
    def get(self, request, username, *args, **kwargs):
        user = get_object_or_404(User, username__iexact=username, is_active=True)
        profile = _user_summary(user, request)
        skills = [
            {"id": item.skill.id, "name": item.skill.name, "level": item.level, "is_verified": item.is_verified}
            for item in user.skills.select_related("skill").all()
        ]

        project_memberships = []
        for project in Project.objects.filter(Q(owner=user) | Q(members__user=user)).distinct().select_related("owner"):
            member = project.members.filter(user=user).first()
            role = member.role if member else ("owner" if project.owner_id == user.id else "member")
            if project.status in {Project.STATUS_ACTIVE, Project.STATUS_COMPLETED, Project.STATUS_IDEA, Project.STATUS_ARCHIVED}:
                project_memberships.append(
                    {
                        "id": project.id,
                        "slug": project.slug,
                        "title": project.title,
                        "status": project.status,
                        "role": role,
                        "summary": project.summary,
                        "category": project.category,
                    }
                )

        badges = [
            {
                "id": item.badge.id,
                "name": item.badge.name,
                "slug": item.badge.slug,
                "description": item.badge.description,
                "icon": item.badge.icon,
                "earned_at": item.earned_at,
            }
            for item in user.badges.select_related("badge").all()
        ]
        books = [
            {
                "id": item.book.id,
                "slug": item.book.slug,
                "title": item.book.title,
                "author": item.book.author,
                "completed_at": item.updated_at,
            }
            for item in ReadingProgress.objects.filter(user=user, completed=True).select_related("book")
        ]

        end = timezone.now()
        heatmap = []
        for week in range(12):
            start = end - timedelta(weeks=12 - week)
            week_start = start - timedelta(days=start.weekday())
            count = XPEvent.objects.filter(user=user, created_at__date__gte=week_start, created_at__date__lt=week_start + timedelta(days=7)).count()
            heatmap.append({"week_start": week_start.date().isoformat(), "activity": count})

        stats = {
            "xp": user.xp,
            "level": user.level,
            "streak_days": user.streak_days,
            "projects_count": len(project_memberships),
            "books_completed": len(books),
            "badges_count": len(badges),
        }

        return Response(
            {
                "profile": profile,
                "skills": skills,
                "projects": project_memberships,
                "badges": badges,
                "books": books,
                "heatmap": heatmap,
                "stats": stats,
            },
            status=status.HTTP_200_OK,
        )


class ConnectionAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(operation_id='users_connection_post', request=OpenApiTypes.OBJECT, responses={200: OpenApiTypes.OBJECT})
    def post(self, request, username, *args, **kwargs):
        target = get_object_or_404(User, username__iexact=username)
        if target.pk == request.user.pk:
            return Response({"error": {"code": "self_connection", "message": "You cannot connect with yourself.", "fields": {}}}, status=status.HTTP_400_BAD_REQUEST)

        action = (request.data.get("action") or "connect").lower()
        existing = Connection.objects.filter(Q(from_user=request.user, to_user=target) | Q(from_user=target, to_user=request.user)).first()

        def respond(http_status=status.HTTP_200_OK):
            state = _connection_states(request.user).get(target.pk, "none")
            connection = Connection.objects.filter(
                Q(from_user=request.user, to_user=target) | Q(from_user=target, to_user=request.user)
            ).first()
            return Response(
                {
                    "status": connection.status if connection else "none",
                    "connection_status": state,
                    "connection": {"id": connection.id, "status": connection.status, "with_user": target.username} if connection else None,
                },
                status=http_status,
            )

        if existing:
            if action == "cancel":  # withdraw a request, decline one, or remove a connection
                existing.delete()
            elif action == "accept" and existing.to_user_id == request.user.id and existing.status == "pending":
                # Only the person who RECEIVED the request may accept it.
                existing.status = "accepted"
                existing.save(update_fields=["status"])
                create_notification(existing.from_user, request.user, "connection_accepted")
            return respond()

        if action == "accept":
            raise ValidationError({"action": ["There is no pending request from this user to accept."]})
        if action == "cancel":
            return respond()

        Connection.objects.create(from_user=request.user, to_user=target, status="pending")
        create_notification(target, request.user, "connection_request")
        return respond(status.HTTP_201_CREATED)


class SuggestedUsersAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(operation_id='users_suggested_users_get', responses={200: {'type': 'array', 'items': {'type': 'object'}}})
    def get(self, request, *args, **kwargs):
        existing = Connection.objects.filter(Q(from_user=request.user) | Q(to_user=request.user)).values_list("from_user_id", "to_user_id")
        excluded_ids = {user_id for pair in existing for user_id in pair}
        excluded_ids.add(request.user.id)

        users = []
        current_skills = _user_skill_names(request.user)
        for user in User.objects.filter(is_active=True).exclude(pk__in=excluded_ids).prefetch_related("skills__skill"):
            mutual = sorted(_user_skill_names(user) & current_skills)
            users.append({"user": user, "mutual": len(mutual), "shared_skills": mutual})

        users.sort(key=lambda item: (-item["mutual"], -item["user"].xp, item["user"].full_name.lower()))
        payload = []
        for item in users[:4]:
            user = item["user"]
            payload.append({
                "id": user.id,
                "username": user.username,
                "full_name": user.full_name,
                "avatar": request.build_absolute_uri(user.avatar.url) if user.avatar else None,
                "headline": user.headline,
                "role": user.role,
                "mutual_skills_count": item["mutual"],
                "shared_skills": item["shared_skills"],
            })
        return Response(payload, status=status.HTTP_200_OK)


class SkillListAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(operation_id='users_skill_list_get', responses={200: SkillSerializer(many=True)})
    def get(self, request, *args, **kwargs):
        skills = Skill.objects.annotate(usage_count=Count("user_skills__user")).order_by("-usage_count", "name")
        serializer = SkillSerializer(skills, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)
