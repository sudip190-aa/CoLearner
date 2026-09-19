from django.contrib import admin

from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("user", "actor", "verb", "is_read", "created_at")
    list_filter = ("is_read", "verb")
    search_fields = ("user__email", "actor__email", "verb")
    raw_id_fields = ("user", "actor", "target_content_type")
