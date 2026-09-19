from django.urls import path

from .views import (
    CommentDetailAPIView,
    ReportAPIView,
    TagListAPIView,
    ThreadCommentCreateAPIView,
    ThreadDetailAPIView,
    ThreadListAPIView,
    VoteAPIView,
)

urlpatterns = [
    path("threads/", ThreadListAPIView.as_view(), name="thread-list"),
    path("threads/<slug:slug>/", ThreadDetailAPIView.as_view(), name="thread-detail"),
    path("threads/<slug:slug>/comments/", ThreadCommentCreateAPIView.as_view(), name="thread-comments"),
    path("comments/<int:id>/", CommentDetailAPIView.as_view(), name="comment-detail"),
    path("vote/", VoteAPIView.as_view(), name="vote"),
    path("tags/", TagListAPIView.as_view(), name="tag-list"),
    path("report/", ReportAPIView.as_view(), name="report"),
]
