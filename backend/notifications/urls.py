from django.urls import path

from .views import NotificationListAPIView, NotificationMarkReadAPIView, NotificationReadAllAPIView, UnreadNotificationCountAPIView

urlpatterns = [
    path("notifications/", NotificationListAPIView.as_view(), name="notifications"),
    path("notifications/<int:id>/read/", NotificationMarkReadAPIView.as_view(), name="notification-read"),
    path("notifications/read-all/", NotificationReadAllAPIView.as_view(), name="notifications-read-all"),
    path("notifications/unread-count/", UnreadNotificationCountAPIView.as_view(), name="notifications-unread-count"),
]
