from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from rest_framework import serializers

from .models import Skill, UserSkill

User = get_user_model()


class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ("id", "name", "slug", "category")


class UserMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "full_name", "avatar", "level")


class UserSerializer(serializers.ModelSerializer):
    skills = serializers.SerializerMethodField()
    badges = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "full_name",
            "avatar",
            "headline",
            "location",
            "role",
            "xp",
            "level",
            "streak_days",
            "is_verified",
            "skills",
            "badges",
        )
        # Progress and verification are earned server-side; clients must never be able to write them.
        read_only_fields = ("id", "xp", "level", "streak_days", "is_verified")

    def validate_role(self, value):
        # 'admin' is granted by staff only. Keeping an existing admin role on a profile edit is fine.
        current = self.instance.role if self.instance is not None else None
        if value == User.ROLE_ADMIN and current != User.ROLE_ADMIN:
            raise serializers.ValidationError("This role cannot be self-assigned.")
        return value

    def get_skills(self, obj):
        user_skills = obj.skills.select_related("skill").all()
        return [
            {"id": item.skill.id, "name": item.skill.name, "level": item.level}
            for item in user_skills
        ]

    def get_badges(self, obj):
        return [
            {"id": item.badge.id, "name": item.badge.name, "slug": item.badge.slug}
            for item in obj.badges.select_related("badge").all()
        ]


class UserDetailSerializer(UserSerializer):
    stats = serializers.SerializerMethodField()
    is_staff = serializers.BooleanField(read_only=True)

    # Only the account owner and staff may see these; public listings and other users' profiles must not.
    PRIVATE_FIELDS = ("email", "is_staff")

    class Meta(UserSerializer.Meta):
        fields = UserSerializer.Meta.fields + (
            "email",
            "is_staff",
            "bio",
            "github",
            "linkedin",
            "website",
            "availability",
            "interests",
            "onboarding_completed",
            "last_active",
            "created_at",
            "updated_at",
            "stats",
        )
        read_only_fields = UserSerializer.Meta.read_only_fields + (
            "onboarding_completed",
            "last_active",
            "created_at",
            "updated_at",
        )

    def _viewer(self):
        viewer = self.context.get("viewer")
        if viewer is None:
            request = self.context.get("request")
            # Some callers pass a user object as "request"; accept both.
            viewer = getattr(request, "user", request)
        return viewer

    def to_representation(self, instance):
        data = super().to_representation(instance)
        viewer = self._viewer()
        can_see_private = bool(
            viewer is not None
            and getattr(viewer, "is_authenticated", False)
            and (viewer.pk == instance.pk or viewer.is_staff)
        )
        if not can_see_private:
            for field in self.PRIVATE_FIELDS:
                data.pop(field, None)
        return data

    def get_stats(self, obj):
        return {
            "xp": obj.xp,
            "level": obj.level,
            "streak_days": obj.streak_days,
            "is_verified": obj.is_verified,
        }


class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ("email", "username", "full_name", "password", "password2")

    def validate(self, attrs):
        password = attrs.get("password")
        password2 = attrs.get("password2")

        if password and password2 and password != password2:
            raise serializers.ValidationError({"password2": "Passwords do not match."})

        validate_password(password)

        if User.objects.filter(email__iexact=attrs.get("email")).exists():
            raise serializers.ValidationError({"email": "A user with that email already exists."})

        if User.objects.filter(username__iexact=attrs.get("username")).exists():
            raise serializers.ValidationError({"username": "A user with that username already exists."})

        return attrs

    def create(self, validated_data):
        validated_data.pop("password2")
        password = validated_data.pop("password")
        return User.objects.create_user(password=password, **validated_data)


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")

        user = User.objects.filter(email__iexact=email).first()
        # One generic message for unknown email, wrong password and deactivated accounts (no account probing).
        if user is None or not user.is_active or not user.check_password(password):
            raise serializers.ValidationError("Invalid email or password.")

        attrs["user"] = user
        return attrs


class PasswordForgotSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        user = User.objects.filter(email__iexact=value).first()
        if user is not None:
            self.context["user"] = user
        return value


class PasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField()
    token = serializers.CharField()
    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True, min_length=8)

    def validate(self, attrs):
        password = attrs.get("password")
        password2 = attrs.get("password2")

        if password != password2:
            raise serializers.ValidationError({"password2": "Passwords do not match."})

        user = User.objects.filter(email__iexact=attrs.get("email")).first()
        if user is None:
            raise serializers.ValidationError({"email": "No account was found for this email."})

        token_generator = PasswordResetTokenGenerator()
        if not token_generator.check_token(user, attrs.get("token")):
            raise serializers.ValidationError({"token": "The reset token is invalid or expired."})

        validate_password(password)
        attrs["user"] = user
        return attrs

    def save(self, **kwargs):
        user = self.validated_data["user"]
        user.set_password(self.validated_data["password"])
        user.save(update_fields=["password"])
        return user


class OnboardingSerializer(serializers.Serializer):
    role = serializers.ChoiceField(
        choices=[choice for choice in User.ROLE_CHOICES if choice[0] != User.ROLE_ADMIN],
        required=False,
    )
    skills = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    interests = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    bio = serializers.CharField(required=False, allow_blank=True)
    headline = serializers.CharField(required=False, allow_blank=True)
    location = serializers.CharField(required=False, allow_blank=True)
    availability = serializers.CharField(required=False, allow_blank=True)
    github = serializers.URLField(required=False, allow_blank=True)
    linkedin = serializers.URLField(required=False, allow_blank=True)
    website = serializers.URLField(required=False, allow_blank=True)

    def update(self, instance, validated_data):
        role = validated_data.get("role")
        if role:
            instance.role = role

        for field_name in ("bio", "headline", "location", "availability", "github", "linkedin", "website"):
            if field_name in validated_data:
                setattr(instance, field_name, validated_data[field_name])

        if "interests" in validated_data:
            instance.interests = validated_data["interests"]

        for skill_name in validated_data.get("skills", []):
            if skill_name.strip():
                UserSkill.objects.get_or_create(user=instance, skill=get_or_create_skill(skill_name), defaults={"level": "beginner"})

        # The +50 XP for finishing the profile is awarded by the view through the XP ledger (not by editing xp here).
        instance.onboarding_completed = True
        instance.save()
        return instance


class SkillsSyncSerializer(serializers.Serializer):
    """Replace the user's skill list. Each item is a name or {"name": ..., "level": ...}."""

    skills = serializers.ListField(child=serializers.JSONField(), max_length=50)

    def validate_skills(self, items):
        levels = {choice[0] for choice in UserSkill.LEVEL_CHOICES}
        cleaned = {}
        for item in items:
            name, level = (item, "beginner") if isinstance(item, str) else (item.get("name", ""), item.get("level", "beginner"))
            name = str(name).strip()
            if not name or len(name) > 100:
                raise serializers.ValidationError("Each skill needs a name of up to 100 characters.")
            if level not in levels:
                raise serializers.ValidationError(f"Level must be one of: {', '.join(sorted(levels))}.")
            cleaned[name.lower()] = (name, level)
        return list(cleaned.values())

    def save(self, user):
        wanted = {}
        for name, level in self.validated_data["skills"]:
            wanted[get_or_create_skill(name).pk] = level
        user.skills.exclude(skill_id__in=wanted).delete()
        for skill_id, level in wanted.items():
            UserSkill.objects.update_or_create(user=user, skill_id=skill_id, defaults={"level": level})
        return user


class PasswordChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
    new_password2 = serializers.CharField(write_only=True, min_length=8)

    def validate(self, attrs):
        user = self.context["request"].user
        if not user.check_password(attrs["current_password"]):
            raise serializers.ValidationError({"current_password": "Current password is incorrect."})
        if attrs["new_password"] != attrs["new_password2"]:
            raise serializers.ValidationError({"new_password2": "Passwords do not match."})
        validate_password(attrs["new_password"], user)
        return attrs

    def save(self, **kwargs):
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=["password"])
        return user


def get_or_create_skill(name):
    """Case-insensitive lookup so 'python' and 'Python' never become two skills."""
    name = name.strip()
    return Skill.objects.filter(name__iexact=name).first() or Skill.objects.create(name=name)
