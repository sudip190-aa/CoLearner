from django.contrib import admin

from .models import Comment, Tag, Thread, ThreadView, Vote


@admin.register(Thread)
class ThreadAdmin(admin.ModelAdmin):
    list_display = ("title", "author", "category", "is_pinned", "views", "created_at")
    list_filter = ("category", "is_pinned")
    search_fields = ("title", "body", "author__email")
    raw_id_fields = ("author",)
    prepopulated_fields = {"slug": ("title",)}


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ("thread", "author", "parent", "created_at")
    list_filter = ("thread",)
    search_fields = ("body", "author__email", "thread__title")
    raw_id_fields = ("thread", "author", "parent")


@admin.register(Vote)
class VoteAdmin(admin.ModelAdmin):
    list_display = ("user", "value", "content_object", "created_at")
    list_filter = ("value",)
    search_fields = ("user__email", "content_type__model")
    raw_id_fields = ("user", "content_type")


@admin.register(ThreadView)
class ThreadViewAdmin(admin.ModelAdmin):
    list_display = ("thread", "user", "viewed_on")
    list_filter = ("viewed_on",)
    search_fields = ("thread__title", "user__email")
    raw_id_fields = ("thread", "user")


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "color", "created_at")
    list_filter = ("color",)
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}
