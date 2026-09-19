from django.urls import path

from .views import (
    InviteAPIView,
    JoinProjectAPIView,
    JoinRequestRespondAPIView,
    JoinRequestsAPIView,
    MemberAPIView,
    MilestoneAPIView,
    MilestoneDetailAPIView,
    ProjectCreateAPIView,
    ProjectDetailAPIView,
    ProjectListAPIView,
    ProjectUpdateAPIView,
    TaskDetailAPIView,
    TaskListAPIView,
)

urlpatterns = [
    path("projects/", ProjectListAPIView.as_view(), name="project-list"),
    path("projects/create/", ProjectCreateAPIView.as_view(), name="project-create"),
    path("projects/<slug:slug>/", ProjectDetailAPIView.as_view(), name="project-detail"),
    path("projects/<slug:slug>/join/", JoinProjectAPIView.as_view(), name="project-join"),
    path("projects/<slug:slug>/invite/", InviteAPIView.as_view(), name="project-invite"),
    path("projects/<slug:slug>/requests/", JoinRequestsAPIView.as_view(), name="project-requests"),
    path("projects/<slug:slug>/members/<int:user_id>/", MemberAPIView.as_view(), name="project-member"),
    path("requests/<int:id>/respond/", JoinRequestRespondAPIView.as_view(), name="request-respond"),
    path("projects/<slug:slug>/tasks/", TaskListAPIView.as_view(), name="project-task-list"),
    path("tasks/<int:id>/", TaskDetailAPIView.as_view(), name="task-detail"),
    path("projects/<slug:slug>/milestones/", MilestoneAPIView.as_view(), name="project-milestones"),
    path("milestones/<int:id>/", MilestoneDetailAPIView.as_view(), name="milestone-detail"),
    path("projects/<slug:slug>/updates/", ProjectUpdateAPIView.as_view(), name="project-updates"),
]
