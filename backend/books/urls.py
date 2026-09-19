from django.urls import path

from .views import (
    BookChapterListAPIView,
    BookDetailAPIView,
    BookListAPIView,
    BookProgressAPIView,
    ChapterBookmarkAPIView,
    ChapterDetailAPIView,
    ChapterNoteAPIView,
    UserLibraryAPIView,
)

urlpatterns = [
    path("books/", BookListAPIView.as_view(), name="book-list"),
    path("books/<slug:slug>/", BookDetailAPIView.as_view(), name="book-detail"),
    path("books/<slug:slug>/chapters/", BookChapterListAPIView.as_view(), name="book-chapters"),
    path("books/<slug:slug>/progress/", BookProgressAPIView.as_view(), name="book-progress"),
    path("chapters/<int:pk>/", ChapterDetailAPIView.as_view(), name="chapter-detail"),
    path("chapters/<int:pk>/bookmark/", ChapterBookmarkAPIView.as_view(), name="chapter-bookmark"),
    path("chapters/<int:pk>/notes/", ChapterNoteAPIView.as_view(), name="chapter-notes"),
    path("me/library/", UserLibraryAPIView.as_view(), name="me-library"),
]
