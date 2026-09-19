from django.contrib import admin

from .models import Badge, UserBadge, XPEvent


@admin.register(Badge)
class BadgeAdmin(admin.ModelAdmin):
    list_display = ("name", "criteria_key", "xp_reward", "created_at")
    list_filter = ("criteria_key",)
    search_fields = ("name", "description", "criteria_key")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(UserBadge)
class UserBadgeAdmin(admin.ModelAdmin):
    list_display = ("user", "badge", "earned_at")
    list_filter = ("badge",)
    search_fields = ("user__email", "badge__name")
    raw_id_fields = ("user", "badge")


@admin.register(XPEvent)
class XPEventAdmin(admin.ModelAdmin):
    list_display = ("user", "amount", "reason", "source", "created_at")
    list_filter = ("reason", "source")
    search_fields = ("user__email", "reason", "source")
    raw_id_fields = ("user",)
