import React, { lazy, Suspense } from 'react'
import {
  createBrowserRouter,
  Navigate,
  Outlet,
  useLocation,
} from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { Navbar, Footer, AppShell, AuthLayout } from './components/layout'
import { PageLoader } from './components/ui'
import { MarketingLayout } from './components/landing/MarketingLayout'

const lazyPage = (title) =>
  lazy(() =>
    import('./pages/PlaceholderPage').then(({ PlaceholderPage }) => ({
      default: () => <PlaceholderPage title={title} />,
    })),
  )
const page = (title) => lazyPage(title)
// Public marketing pages share a consistent layout.
const LandingPage = lazy(() =>
  import('./pages/Landing').then((m) => ({ default: m.Landing })),
)

const HowItWorksPage = lazy(() => import('./pages/HowItWorksPage.jsx'))
const FeaturesPage = lazy(() => import('./pages/FeaturesPage.jsx'))
const CommunityOverview = lazy(() => import('./pages/CommunityOverview.jsx'))
const About = lazy(() => import('./pages/About.jsx'))
const Pricing = lazy(() => import('./pages/Pricing.jsx'))
const Terms = lazy(() => import('./pages/Terms.jsx'))
const Privacy = lazy(() => import('./pages/Privacy.jsx'))
const Contact = lazy(() => import('./pages/Contact.jsx'))
const Placeholder = (title) => page(title)
const PublicProfile = lazy(() => import('./pages/PublicProfile.jsx'))
const NotFound = lazy(() => import('./pages/NotFound.jsx'))
const Login = lazy(() => import('./pages/auth/Login.jsx'))
const Signup = lazy(() => import('./pages/auth/Signup.jsx'))
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword.jsx'))
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword.jsx'))
const AuthCallback = lazy(() => import('./pages/auth/AuthCallback.jsx'))
const Onboarding = lazy(() => import('./pages/Onboarding.jsx'))
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'))
const Messages = lazy(() => import('./pages/Messages.jsx'))
const BookCatalog = lazy(() => import('./pages/BookCatalog.jsx'))
const PublicBook = () => (
  <div className="container py-10">
    <LazyView Component={Book} />
  </div>
)
const Library = lazy(() => import('./pages/Library.jsx'))
const Book = lazy(() => import('./pages/BookDetail.jsx'))
const Reader = lazy(() => import('./pages/Reader.jsx'))
const Projects = lazy(() => import('./pages/Projects.jsx'))
const NewProject = lazy(() => import('./pages/CreateProject.jsx'))
const Project = lazy(() => import('./pages/ProjectDetail.jsx'))
const Workspace = lazy(() => import('./pages/ProjectWorkspace.jsx'))
const People = lazy(() => import('./pages/People.jsx'))
const Community = lazy(() => import('./pages/Community.jsx'))
const CommunityDetail = lazy(() => import('./pages/ThreadDetail.jsx'))
const NewCommunity = lazy(() => import('./pages/NewThread.jsx'))
const Leaderboard = lazy(() => import('./pages/Leaderboard.jsx'))
const Badges = lazy(() => import('./pages/Badges.jsx'))
const Notifications = lazy(() => import('./pages/Notifications.jsx'))
const Settings = lazy(() => import('./pages/Settings.jsx'))
const Search = lazy(() => import('./pages/Search.jsx'))
const Admin = lazy(() => import('./pages/admin/Overview.jsx'))
const AdminUsers = lazy(() => import('./pages/admin/Users.jsx'))
const AdminBooks = lazy(() => import('./pages/admin/Books.jsx'))
const AdminProjects = lazy(() => import('./pages/admin/Projects.jsx'))
const AdminReports = lazy(() => import('./pages/admin/Reports.jsx'))

function LazyView({ Component }) {
  return (
    <Suspense fallback={<PageLoader message="Loading Colearn..." />}>
      <Component />
    </Suspense>
  )
}

function PublicLayout() {
  return (
    <>
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  )
}

function ProtectedRoute() {
  const location = useLocation()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  if (!isAuthenticated)
    return (
      <Navigate
        to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    )
  return <Outlet />
}

// "/profile" is the signed-in user's own page: send them to their public profile/portfolio.
function MyProfileRedirect() {
  const username = useAuthStore((state) => state.user?.username)
  return <Navigate to={username ? `/u/${username}` : '/settings'} replace />
}

function AdminRoute() {
  const user = useAuthStore((state) => state.user)
  // isStaff is what the backend's admin endpoints enforce (IsAdminUser); role is only a display label.
  if (!user?.isStaff) return <LazyView Component={NotFound} />
  return <Outlet />
}

const view = (Component) => <LazyView Component={Component} />

export const router = createBrowserRouter([
  {
    element: <MarketingLayout />,
    children: [
      { path: '/', element: view(LandingPage) },
      { path: '/how-it-works', element: view(HowItWorksPage) },
      { path: '/features', element: view(FeaturesPage) },
      { path: '/our-community', element: view(CommunityOverview) },
      { path: '/about', element: view(About) },
      { path: '/books', element: view(BookCatalog) },
      { path: '/books/:slug', element: <PublicBook /> },
      { path: '/pricing', element: view(Pricing) },
      { path: '/contact', element: view(Contact) },
      { path: '/terms', element: view(Terms) },
      { path: '/privacy', element: view(Privacy) },
    ],
  },
  { path: '/u/:username', element: view(PublicProfile) },
  {
    element: <PublicLayout />,
    children: [
      { path: '/cookies', element: view(Placeholder('Cookie Policy')) },
      { path: '/accessibility', element: view(Placeholder('Accessibility')) },
      { path: '/blog', element: view(Placeholder('Blog')) },
      { path: '/careers', element: view(Placeholder('Careers')) },
      { path: '/changelog', element: view(Placeholder('Changelog')) },
      { path: '*', element: view(NotFound) },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: view(Login) },
      { path: '/signup', element: view(Signup) },
      { path: '/forgot-password', element: view(ForgotPassword) },
      { path: '/reset-password/:token', element: view(ResetPassword) },
      { path: '/reset-password', element: view(ResetPassword) },
      { path: '/auth/callback', element: view(AuthCallback) },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/onboarding', element: view(Onboarding) },
          { path: '/dashboard', element: view(Dashboard) },
          { path: '/messages', element: view(Messages) },
          { path: '/library', element: view(Library) },
          { path: '/library/:slug', element: view(Book) },
          { path: '/projects', element: view(Projects) },
          { path: '/projects/new', element: view(NewProject) },
          { path: '/projects/:slug', element: view(Project) },
          { path: '/projects/:slug/workspace', element: view(Workspace) },
          { path: '/people', element: view(People) },
          { path: '/community', element: view(Community) },
          { path: '/community/new', element: view(NewCommunity) },
          { path: '/community/:slug', element: view(CommunityDetail) },
          { path: '/leaderboard', element: view(Leaderboard) },
          { path: '/badges', element: view(Badges) },
          { path: '/notifications', element: view(Notifications) },
          { path: '/profile', element: <MyProfileRedirect /> },
          { path: '/settings', element: view(Settings) },
          { path: '/search', element: view(Search) },
        ],
      },
      { path: '/read/:slug', element: view(Reader) },
      { path: '/books/:slug/read', element: view(Reader) },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AdminRoute />,
        children: [
          {
            element: <AppShell />,
            children: [
              { path: '/admin', element: view(Admin) },
              { path: '/admin/users', element: view(AdminUsers) },
              { path: '/admin/books', element: view(AdminBooks) },
              { path: '/admin/projects', element: view(AdminProjects) },
              { path: '/admin/reports', element: view(AdminReports) },
            ],
          },
        ],
      },
    ],
  },
])

export default router
