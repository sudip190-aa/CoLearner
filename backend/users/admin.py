from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Connection, CustomUser, Skill, UserSkill


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ("email", "username", "full_name", "role", "is_verified", "is_staff")
    list_filter = ("role", "is_verified", "is_staff", "is_active")
    search_fields = ("email", "username", "full_name")
    ordering = ("email",)
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        (
            "Profile",
            {
                "fields": (
                    "username",
                    "full_name",
                    "avatar",
                    "bio",
                    "headline",
                    "location",
                    "role",
                    "availability",
                    "interests",
                    "onboarding_completed",
                )
            },
        ),
        ("Social", {"fields": ("github", "linkedin", "website")}),
        ("Progress", {"fields": ("xp", "level", "streak_days", "last_active", "is_verified")}),
        (
            "Permissions",
            {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")},
        ),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "email",
                    "username",
                    "full_name",
                    "password1",
                    "password2",
                    "role",
                ),
            },
        ),
    )


@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "slug", "created_at")
    list_filter = ("category",)
    search_fields = ("name", "category", "slug")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(UserSkill)
class UserSkillAdmin(admin.ModelAdmin):
    list_display = ("user", "skill", "level", "is_verified", "created_at")
    list_filter = ("level", "is_verified")
    search_fields = ("user__email", "user__username", "skill__name")
    raw_id_fields = ("user", "skill")


@admin.register(Connection)
class ConnectionAdmin(admin.ModelAdmin):
    list_display = ("from_user", "to_user", "status", "created_at")
    list_filter = ("status",)
    search_fields = ("from_user__email", "to_user__email")
    raw_id_fields = ("from_user", "to_user")
