/**
 * Colearn Application Constants
 * Product Name: Colearn (spelled exactly "Colearn" everywhere)
 * Tagline: Learn → Build → Prove → Succeed.
 */

export const APP_NAME = 'Colearn'
export const TAGLINE = 'Learn → Build → Prove → Succeed.'

export const ROLES = {
  LEARNER: 'learner',
  BUILDER: 'builder',
  MENTOR: 'mentor',
  ADMIN: 'admin',
}

export const NAV_LINKS = [
  { label: 'Learn', href: '/library', icon: 'BookOpen' },
  { label: 'Build', href: '/projects', icon: 'Hammer' },
  // "/profile" sends signed-in users to their own portfolio and visitors to log in first.
  { label: 'Prove', href: '/profile', icon: 'Award' },
  { label: 'Community', href: '/community', icon: 'Users' },
]

export const FOOTER_LINKS = {
  product: [
    { label: 'Curated Books', href: '/library' },
    { label: 'Peer Projects', href: '/projects' },
    { label: 'Public Portfolio', href: '/profile' },
    { label: 'Community Leaderboard', href: '/leaderboard' },
  ],
  resources: [
    { label: 'Discussions', href: '/community' },
    { label: 'Find a Mentor', href: '/people' },
    { label: 'Contact Us', href: '/contact' },
  ],
  company: [
    { label: 'About Us', href: '/about' },
    { label: 'Careers', href: '/careers' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
  ],
}

export const PROJECT_STATUSES = {
  PLANNING: 'planning',
  IN_PROGRESS: 'in_progress',
  REVIEW: 'review',
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
}

export const TASK_STATUSES = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  IN_REVIEW: 'in_review',
  DONE: 'done',
}

export const BOOK_CATEGORIES = [
  { id: 'frontend', name: 'Frontend Engineering' },
  { id: 'backend', name: 'Backend & Distributed Systems' },
  { id: 'systems', name: 'Computer Systems & Architecture' },
  { id: 'algorithms', name: 'Algorithms & Data Structures' },
  { id: 'devops', name: 'DevOps & Cloud Infrastructure' },
  { id: 'database', name: 'Database Internals & Design' },
  { id: 'ai-ml', name: 'Applied AI & Machine Learning' },
  { id: 'product', name: 'Product Engineering & Leadership' },
]

// Mirrors XP_RULES in backend/gamification/services.py. Display only: the server decides what is actually awarded.
export const XP_RULES = {
  SIGNUP: 10,
  PROFILE_COMPLETE: 50,
  CHAPTER_COMPLETED: 10,
  BOOK_FINISHED: 100,
  PROJECT_CREATED: 75,
  PROJECT_JOINED: 40,
  TASK_COMPLETED: 15,
  MILESTONE_REACHED: 60,
  THREAD_CREATED: 20,
  HELPFUL_COMMENT: 25,
  DAILY_LOGIN: 5,
  STREAK_WEEK_BONUS: 5,
}
