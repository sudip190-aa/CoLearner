from django.contrib import admin

from .models import ContactMessage, Report


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ("reporter", "content_object", "reason", "status", "created_at")
    list_filter = ("status", "created_at")
    search_fields = ("reporter__email", "reporter__username", "reason")
    raw_id_fields = ("reporter", "content_type")


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ("subject", "name", "email", "is_resolved", "created_at")
    list_filter = ("is_resolved", "created_at")
    search_fields = ("name", "email", "subject", "message")
    readonly_fields = ("name", "email", "subject", "message", "created_at", "updated_at")
    actions = ["mark_resolved"]

    @admin.action(description="Mark selected messages as resolved")
    def mark_resolved(self, request, queryset):
        queryset.update(is_resolved=True)
