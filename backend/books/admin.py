from django.contrib import admin

from .models import Book, Bookmark, Chapter, Note, ReadingProgress


class ChapterInline(admin.TabularInline):
    model = Chapter
    extra = 1
    fields = ("chapter_number", "title", "slug", "content")


@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ("title", "author", "category", "difficulty", "is_featured", "created_at")
    list_filter = ("category", "difficulty", "is_featured")
    search_fields = ("title", "author", "category")
    prepopulated_fields = {"slug": ("title",)}
    inlines = [ChapterInline]


@admin.register(Chapter)
class ChapterAdmin(admin.ModelAdmin):
    list_display = ("book", "chapter_number", "title", "slug", "created_at")
    list_filter = ("book",)
    search_fields = ("title", "book__title")
    raw_id_fields = ("book",)
    prepopulated_fields = {"slug": ("title",)}


@admin.register(ReadingProgress)
class ReadingProgressAdmin(admin.ModelAdmin):
    list_display = ("user", "book", "progress_percent", "completed", "last_read_at")
    list_filter = ("completed",)
    search_fields = ("user__email", "book__title")
    raw_id_fields = ("user", "book", "chapter")


@admin.register(Bookmark)
class BookmarkAdmin(admin.ModelAdmin):
    list_display = ("user", "book", "chapter", "page", "created_at")
    list_filter = ("book", "chapter")
    search_fields = ("user__email", "book__title", "note")
    raw_id_fields = ("user", "book", "chapter")


@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    list_display = ("user", "chapter", "created_at")
    list_filter = ("chapter",)
    search_fields = ("user__email", "content")
    raw_id_fields = ("user", "chapter")
