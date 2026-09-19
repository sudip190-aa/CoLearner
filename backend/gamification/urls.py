from django.urls import path

from .views import BadgeListAPIView, LeaderboardAPIView, MeBadgesAPIView, MeXPHistoryAPIView

urlpatterns = [
    path("leaderboard/", LeaderboardAPIView.as_view(), name="leaderboard"),
    path("badges/", BadgeListAPIView.as_view(), name="badges"),
    path("me/badges/", MeBadgesAPIView.as_view(), name="me-badges"),
    path("me/xp-history/", MeXPHistoryAPIView.as_view(), name="me-xp-history"),
]
