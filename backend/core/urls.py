from django.urls import path

from .dashboard import DashboardAPIView
from .search import SearchAPIView
from .views import ContactAPIView, health_check

urlpatterns = [
    path("health/", health_check, name="health-check"),
    path("search/", SearchAPIView.as_view(), name="global-search"),
    path("dashboard/", DashboardAPIView.as_view(), name="dashboard"),
    path("contact/", ContactAPIView.as_view(), name="contact"),
]
