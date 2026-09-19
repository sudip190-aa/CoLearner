# Phase 1: Project structure audit

Verified repository: CoLearner (Django REST Framework + React/Vite). No HTMX application or server-rendered feature templates are present. Authentication uses JWT for the API and sessions for Django admin.

## Applications, models and views

### core

**Concrete models:** `ContactMessage`, `Report`.

**Abstract bases:** TimeStampedModel, SlugModel.

`backend/core/views.py`: `ContactAPIView`, `health_check`.

`backend/core/dashboard.py`: `DashboardAPIView`.

`backend/core/search.py`: `SearchAPIView`.

**Migrations:** `0001_initial.py`, `0002_contactmessage.py`, `0003_report_dismissed_status.py`.

### users

**Concrete models:** `CustomUser`, `Skill`, `UserSkill`, `Connection`.

`backend/users/views.py`: `RegisterAPIView`, `LoginAPIView`, `LogoutAPIView`, `SafeTokenRefreshView`, `UsernameAvailabilityAPIView`, `MeAPIView`, `MeSkillsAPIView`, `PasswordChangeAPIView`, `PasswordForgotAPIView`, `PasswordResetAPIView`, `OnboardingAPIView`, `UserListAPIView`, `UserDetailAPIView`, `UserPortfolioAPIView`, `ConnectionAPIView`, `SuggestedUsersAPIView`, `SkillListAPIView`.

`backend/users/admin_api.py`: `AdminStatsAPIView`, `AdminUserListAPIView`, `AdminUserDetailAPIView`, `AdminBookListCreateAPIView`, `AdminBookDetailAPIView`, `AdminBookChaptersAPIView`, `AdminChapterDetailAPIView`, `AdminProjectListAPIView`, `AdminProjectDetailAPIView`, `AdminReportsAPIView`, `AdminReportDetailAPIView`.

**Migrations:** `0001_initial.py`, `0002_connection_skill_userskill_customuser_created_at_and_more.py`, `0003_customuser_interests_customuser_onboarding_completed.py`, `0004_alter_customuser_avatar.py`.

### books

**Concrete models:** `Book`, `Chapter`, `ReadingProgress`, `Bookmark`, `Note`.

`backend/books/views.py`: `BookListAPIView`, `BookDetailAPIView`, `BookChapterListAPIView`, `ChapterDetailAPIView`, `BookProgressAPIView`, `UserLibraryAPIView`, `ChapterBookmarkAPIView`, `ChapterNoteAPIView`.

**Migrations:** `0001_initial.py`, `0002_book_est_minutes_book_tags_and_more.py`, `0003_alter_book_cover.py`.

### projects

**Concrete models:** `Project`, `ProjectMember`, `JoinRequest`, `Task`, `Milestone`, `ProjectUpdate`.

`backend/projects/views.py`: `ProjectListAPIView`, `ProjectCreateAPIView`, `ProjectDetailAPIView`, `JoinProjectAPIView`, `JoinRequestsAPIView`, `JoinRequestRespondAPIView`, `InviteAPIView`, `MemberAPIView`, `TaskListAPIView`, `TaskDetailAPIView`, `MilestoneAPIView`, `MilestoneDetailAPIView`, `ProjectUpdateAPIView`.

**Migrations:** `0001_initial.py`, `0002_project_category_project_tech_stack_task_order_and_more.py`, `0003_cover_roles_invites.py`.

### community

**Concrete models:** `Thread`, `Comment`, `Vote`, `Tag`, `ThreadView`.

`backend/community/views.py`: `ThreadListAPIView`, `ThreadDetailAPIView`, `ThreadCommentCreateAPIView`, `CommentDetailAPIView`, `VoteAPIView`, `TagListAPIView`, `ReportAPIView`.

**Migrations:** `0001_initial.py`, `0002_comment_xp_awarded_threadview.py`.

### gamification

**Concrete models:** `Badge`, `UserBadge`, `XPEvent`.

`backend/gamification/views.py`: `LeaderboardAPIView`, `BadgeListAPIView`, `MeBadgesAPIView`, `MeXPHistoryAPIView`.

**Migrations:** `0001_initial.py`, `0002_default_badges.py`.

### notifications

**Concrete models:** `Notification`.

`backend/notifications/views.py`: `NotificationListAPIView`, `NotificationMarkReadAPIView`, `NotificationReadAllAPIView`, `UnreadNotificationCountAPIView`.

**Migrations:** `0001_initial.py`.

## Registered applications

`django.contrib.admin`, `django.contrib.auth`, `django.contrib.contenttypes`, `django.contrib.sessions`, `django.contrib.messages`, `django.contrib.staticfiles`, `corsheaders`, `rest_framework`, `rest_framework_simplejwt.token_blacklist`, `django_filters`, `drf_spectacular`, `django_extensions`, `core`, `users`, `books`, `projects`, `community`, `gamification`, `notifications`.

## Backend URL inventory

All application routes are listed below. `/admin/` includes Django-provided model, login, logout and password-change routes. Static/media development routes are conditional on DEBUG.

| URL | Name | View |
| --- | --- | --- |
| `/admin/` | `admin:*` | Django admin |
| `/api/schema/` | `schema` | `drf_spectacular.views.SpectacularAPIView` |
| `/api/docs/` | `swagger-ui` | `drf_spectacular.views.SpectacularSwaggerView` |
| `/api/redoc/` | `redoc` | `drf_spectacular.views.SpectacularRedocView` |
| `/api/v1/health/` | `health-check` | `core.views.health_check` |
| `/api/v1/search/` | `global-search` | `core.search.SearchAPIView` |
| `/api/v1/dashboard/` | `dashboard` | `core.dashboard.DashboardAPIView` |
| `/api/v1/contact/` | `contact` | `core.views.ContactAPIView` |
| `/api/v1/auth/register/` | `auth-register` | `users.views.RegisterAPIView` |
| `/api/v1/auth/login/` | `auth-login` | `users.views.LoginAPIView` |
| `/api/v1/auth/refresh/` | `auth-refresh` | `users.views.SafeTokenRefreshView` |
| `/api/v1/auth/logout/` | `auth-logout` | `users.views.LogoutAPIView` |
| `/api/v1/auth/me/` | `auth-me` | `users.views.MeAPIView` |
| `/api/v1/auth/me/skills/` | `auth-me-skills` | `users.views.MeSkillsAPIView` |
| `/api/v1/auth/password/change/` | `auth-password-change` | `users.views.PasswordChangeAPIView` |
| `/api/v1/auth/username-available/` | `auth-username-available` | `users.views.UsernameAvailabilityAPIView` |
| `/api/v1/auth/password/forgot/` | `auth-password-forgot` | `users.views.PasswordForgotAPIView` |
| `/api/v1/auth/password/reset/` | `auth-password-reset` | `users.views.PasswordResetAPIView` |
| `/api/v1/auth/onboarding/` | `auth-onboarding` | `users.views.OnboardingAPIView` |
| `/api/v1/users/` | `user-list` | `users.views.UserListAPIView` |
| `/api/v1/users/suggested/` | `user-suggested` | `users.views.SuggestedUsersAPIView` |
| `/api/v1/users/<str:username>/connect/` | `user-connect` | `users.views.ConnectionAPIView` |
| `/api/v1/users/<str:username>/portfolio/` | `user-portfolio` | `users.views.UserPortfolioAPIView` |
| `/api/v1/users/<str:username>/` | `user-detail` | `users.views.UserDetailAPIView` |
| `/api/v1/skills/` | `skill-list` | `users.views.SkillListAPIView` |
| `/api/v1/admin/stats/` | `admin-stats` | `users.admin_api.AdminStatsAPIView` |
| `/api/v1/admin/users/` | `admin-user-list` | `users.admin_api.AdminUserListAPIView` |
| `/api/v1/admin/users/<int:id>/` | `admin-user-detail` | `users.admin_api.AdminUserDetailAPIView` |
| `/api/v1/admin/books/` | `admin-book-list` | `users.admin_api.AdminBookListCreateAPIView` |
| `/api/v1/admin/books/<int:id>/` | `admin-book-detail` | `users.admin_api.AdminBookDetailAPIView` |
| `/api/v1/admin/books/<int:id>/chapters/` | `admin-book-chapters` | `users.admin_api.AdminBookChaptersAPIView` |
| `/api/v1/admin/chapters/<int:id>/` | `admin-chapter-detail` | `users.admin_api.AdminChapterDetailAPIView` |
| `/api/v1/admin/projects/` | `admin-project-list` | `users.admin_api.AdminProjectListAPIView` |
| `/api/v1/admin/projects/<slug:slug>/` | `admin-project-detail` | `users.admin_api.AdminProjectDetailAPIView` |
| `/api/v1/admin/reports/` | `admin-reports` | `users.admin_api.AdminReportsAPIView` |
| `/api/v1/admin/reports/<int:id>/` | `admin-report-detail` | `users.admin_api.AdminReportDetailAPIView` |
| `/api/v1/books/` | `book-list` | `books.views.BookListAPIView` |
| `/api/v1/books/<slug:slug>/` | `book-detail` | `books.views.BookDetailAPIView` |
| `/api/v1/books/<slug:slug>/chapters/` | `book-chapters` | `books.views.BookChapterListAPIView` |
| `/api/v1/books/<slug:slug>/progress/` | `book-progress` | `books.views.BookProgressAPIView` |
| `/api/v1/chapters/<int:pk>/` | `chapter-detail` | `books.views.ChapterDetailAPIView` |
| `/api/v1/chapters/<int:pk>/bookmark/` | `chapter-bookmark` | `books.views.ChapterBookmarkAPIView` |
| `/api/v1/chapters/<int:pk>/notes/` | `chapter-notes` | `books.views.ChapterNoteAPIView` |
| `/api/v1/me/library/` | `me-library` | `books.views.UserLibraryAPIView` |
| `/api/v1/projects/` | `project-list` | `projects.views.ProjectListAPIView` |
| `/api/v1/projects/create/` | `project-create` | `projects.views.ProjectCreateAPIView` |
| `/api/v1/projects/<slug:slug>/` | `project-detail` | `projects.views.ProjectDetailAPIView` |
| `/api/v1/projects/<slug:slug>/join/` | `project-join` | `projects.views.JoinProjectAPIView` |
| `/api/v1/projects/<slug:slug>/invite/` | `project-invite` | `projects.views.InviteAPIView` |
| `/api/v1/projects/<slug:slug>/requests/` | `project-requests` | `projects.views.JoinRequestsAPIView` |
| `/api/v1/projects/<slug:slug>/members/<int:user_id>/` | `project-member` | `projects.views.MemberAPIView` |
| `/api/v1/requests/<int:id>/respond/` | `request-respond` | `projects.views.JoinRequestRespondAPIView` |
| `/api/v1/projects/<slug:slug>/tasks/` | `project-task-list` | `projects.views.TaskListAPIView` |
| `/api/v1/tasks/<int:id>/` | `task-detail` | `projects.views.TaskDetailAPIView` |
| `/api/v1/projects/<slug:slug>/milestones/` | `project-milestones` | `projects.views.MilestoneAPIView` |
| `/api/v1/milestones/<int:id>/` | `milestone-detail` | `projects.views.MilestoneDetailAPIView` |
| `/api/v1/projects/<slug:slug>/updates/` | `project-updates` | `projects.views.ProjectUpdateAPIView` |
| `/api/v1/threads/` | `thread-list` | `community.views.ThreadListAPIView` |
| `/api/v1/threads/<slug:slug>/` | `thread-detail` | `community.views.ThreadDetailAPIView` |
| `/api/v1/threads/<slug:slug>/comments/` | `thread-comments` | `community.views.ThreadCommentCreateAPIView` |
| `/api/v1/comments/<int:id>/` | `comment-detail` | `community.views.CommentDetailAPIView` |
| `/api/v1/vote/` | `vote` | `community.views.VoteAPIView` |
| `/api/v1/tags/` | `tag-list` | `community.views.TagListAPIView` |
| `/api/v1/report/` | `report` | `community.views.ReportAPIView` |
| `/api/v1/leaderboard/` | `leaderboard` | `gamification.views.LeaderboardAPIView` |
| `/api/v1/badges/` | `badges` | `gamification.views.BadgeListAPIView` |
| `/api/v1/me/badges/` | `me-badges` | `gamification.views.MeBadgesAPIView` |
| `/api/v1/me/xp-history/` | `me-xp-history` | `gamification.views.MeXPHistoryAPIView` |
| `/api/v1/notifications/` | `notifications` | `notifications.views.NotificationListAPIView` |
| `/api/v1/notifications/<int:id>/read/` | `notification-read` | `notifications.views.NotificationMarkReadAPIView` |
| `/api/v1/notifications/read-all/` | `notifications-read-all` | `notifications.views.NotificationReadAllAPIView` |
| `/api/v1/notifications/unread-count/` | `notifications-unread-count` | `notifications.views.UnreadNotificationCountAPIView` |
| `/^static/(?P<path>.*)$` | `(unnamed)` | `django.views.static.serve` |
| `/^media/(?P<path>.*)$` | `(unnamed)` | `django.views.static.serve` |

## Templates and frontend pages

Project Django templates: `backend/templates/admin/base_site.html` (extends Django `admin/base.html`). All other admin/DRF templates come from installed packages.

React route definitions: `CoLearner/src/routes.jsx`.

Frontend routes:

- `/`
- `/u/:username`
- `/about`
- `/pricing`
- `/contact`
- `/privacy`
- `/terms`
- `/cookies`
- `/accessibility`
- `/blog`
- `/careers`
- `/changelog`
- `*`
- `/login`
- `/signup`
- `/forgot-password`
- `/reset-password/:token`
- `/onboarding`
- `/dashboard`
- `/library`
- `/library/:slug`
- `/projects`
- `/projects/new`
- `/projects/:slug`
- `/projects/:slug/workspace`
- `/people`
- `/community`
- `/community/new`
- `/community/:slug`
- `/leaderboard`
- `/badges`
- `/notifications`
- `/profile`
- `/settings`
- `/search`
- `/read/:slug`
- `/admin`
- `/admin/users`
- `/admin/books`
- `/admin/projects`
- `/admin/reports`

Frontend page files:

- `CoLearner/src/pages/About.jsx`
- `CoLearner/src/pages/admin/Books.jsx`
- `CoLearner/src/pages/admin/Overview.jsx`
- `CoLearner/src/pages/admin/Projects.jsx`
- `CoLearner/src/pages/admin/Reports.jsx`
- `CoLearner/src/pages/admin/Users.jsx`
- `CoLearner/src/pages/auth/ForgotPassword.jsx`
- `CoLearner/src/pages/auth/Login.jsx`
- `CoLearner/src/pages/auth/ResetPassword.jsx`
- `CoLearner/src/pages/auth/Signup.jsx`
- `CoLearner/src/pages/Badges.jsx`
- `CoLearner/src/pages/BookDetail.jsx`
- `CoLearner/src/pages/Community.jsx`
- `CoLearner/src/pages/Contact.jsx`
- `CoLearner/src/pages/CreateProject.jsx`
- `CoLearner/src/pages/Dashboard.jsx`
- `CoLearner/src/pages/Landing.jsx`
- `CoLearner/src/pages/Leaderboard.jsx`
- `CoLearner/src/pages/Library.jsx`
- `CoLearner/src/pages/NewThread.jsx`
- `CoLearner/src/pages/NotFound.jsx`
- `CoLearner/src/pages/Notifications.jsx`
- `CoLearner/src/pages/Onboarding.jsx`
- `CoLearner/src/pages/People.jsx`
- `CoLearner/src/pages/PlaceholderPage.jsx`
- `CoLearner/src/pages/Pricing.jsx`
- `CoLearner/src/pages/ProjectDetail.jsx`
- `CoLearner/src/pages/Projects.jsx`
- `CoLearner/src/pages/ProjectWorkspace.jsx`
- `CoLearner/src/pages/PublicProfile.jsx`
- `CoLearner/src/pages/Reader.jsx`
- `CoLearner/src/pages/Search.jsx`
- `CoLearner/src/pages/Settings.jsx`
- `CoLearner/src/pages/ThreadDetail.jsx`

## Results and limits

- `makemigrations --check --dry-run`: no model changes; all 48 existing migrations applied in the local SQLite database.
- Application/model loading and URL resolution pass Django checks.
- Production settings now reject the example/weak secret and force DEBUG off. Settings-package import no longer executes development settings on production startup.
- Local example DEBUG is enabled so runserver serves static files and media; frontend/reset-link defaults now match port 5176 in the root README.
- OpenAPI view declarations now identify request serializers, response containers, successful response codes and unique operation IDs. Computed serializer fields have return types. Hand-built response objects remain open JSON objects; these annotations are not a complete field-level API contract.
- Admin report-list PATCH now returns 405 instead of failing for a missing report ID; updates continue through the report-detail route.
- The existing `.venv` is copied from a different computer and cannot run. Verification uses the working `.venv-local` interpreter. The inherited shell DEBUG value is `release`; local checks explicitly set it to `True`.
- The provided Docker/Compose server is development-only. Live production PostgreSQL, TLS, SMTP, static/media hosting and SPA fallback have not been verified; deployment settings checks use temporary synthetic environment values without a database connection.
- Feature correctness, UI/navigation, responsive behavior and browser interactions remain for Phases 2-7. Placeholder public pages are present and require Phase 4/7 review.

## Verification

- `manage.py check`: zero issues.
- Production `check --deploy --fail-level WARNING`: zero issues using temporary audit configuration (covered by `tests/test_structure.py`).
- Four new structure/configuration regression tests pass.
- 52 existing admin, dashboard, search and contact regression tests pass.
- Installed dependencies match every pin in `requirements.txt`; `pip check` passes.
- Test runs use `--basetemp` inside the workspace because the shell's default pytest temporary location raises permission errors.

From `backend`, reproduce the checks in PowerShell:

```powershell
$env:DEBUG = 'True'
$env:PYTHONDONTWRITEBYTECODE = '1'
.\.venv-local\Scripts\python.exe manage.py check
.\.venv-local\Scripts\python.exe manage.py makemigrations --check --dry-run
.\.venv-local\Scripts\python.exe manage.py showmigrations --plan
.\.venv-local\Scripts\python.exe -m pytest tests/test_structure.py tests/test_admin_dashboard_search.py tests/test_contact_and_admin.py --basetemp=.pytest-audit-confirm
```
