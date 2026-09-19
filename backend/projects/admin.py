from django.contrib import admin

from .models import JoinRequest, Milestone, Project, ProjectMember, ProjectUpdate, Task


class TaskInline(admin.TabularInline):
    model = Task
    extra = 1
    fields = ("title", "status", "priority", "assignee", "due_date")


class ProjectMemberInline(admin.TabularInline):
    model = ProjectMember
    extra = 1
    fields = ("user", "role")


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("title", "owner", "status", "is_public", "max_members", "created_at")
    list_filter = ("status", "is_public")
    search_fields = ("title", "summary", "owner__email")
    raw_id_fields = ("owner",)
    inlines = [ProjectMemberInline, TaskInline]
    prepopulated_fields = {"slug": ("title",)}


@admin.register(ProjectMember)
class ProjectMemberAdmin(admin.ModelAdmin):
    list_display = ("project", "user", "role", "joined_at")
    list_filter = ("role",)
    search_fields = ("project__title", "user__email")
    raw_id_fields = ("project", "user")


@admin.register(JoinRequest)
class JoinRequestAdmin(admin.ModelAdmin):
    list_display = ("project", "user", "status", "created_at")
    list_filter = ("status",)
    search_fields = ("project__title", "user__email", "message")
    raw_id_fields = ("project", "user")


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ("project", "title", "status", "priority", "assignee", "due_date")
    list_filter = ("status", "priority", "project")
    search_fields = ("title", "description", "project__title")
    raw_id_fields = ("project", "assignee")


@admin.register(Milestone)
class MilestoneAdmin(admin.ModelAdmin):
    list_display = ("project", "title", "status", "due_date")
    list_filter = ("status", "project")
    search_fields = ("title", "project__title")
    raw_id_fields = ("project",)


@admin.register(ProjectUpdate)
class ProjectUpdateAdmin(admin.ModelAdmin):
    list_display = ("project", "author", "created_at")
    list_filter = ("project",)
    search_fields = ("project__title", "author__email", "body")
    raw_id_fields = ("project", "author")
