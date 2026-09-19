import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  BarChart3,
  Bell,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Settings,
  Users,
  UserRound,
  FolderKanban,
} from 'lucide-react'
import clsx from 'clsx'

const items = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Library', to: '/library', icon: BookOpen },
  { label: 'Projects', to: '/projects', icon: FolderKanban },
  { label: 'Community', to: '/community', icon: Users },
  { label: 'People', to: '/people', icon: UserRound },
  { label: 'Leaderboard', to: '/leaderboard', icon: BarChart3 },
  { label: 'Notifications', to: '/notifications', icon: Bell },
  { label: 'Settings', to: '/settings', icon: Settings },
]

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  return (
    <>
      <aside
        className={clsx(
          'hidden shrink-0 border-r border-c-border bg-white py-5 transition-[width] duration-200 lg:block',
          isCollapsed ? 'w-20' : 'w-60',
        )}
      >
        <nav className="space-y-1 px-3" aria-label="App navigation">
          {items.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              title={isCollapsed ? label : undefined}
              className={({ isActive }) =>
                clsx(
                  'relative flex h-11 items-center gap-3 rounded-brand px-3 text-sm font-medium transition-colors',
                  isCollapsed && 'justify-center px-0',
                  isActive
                    ? 'bg-c-blue-soft text-c-blue before:absolute before:left-0 before:h-7 before:w-[3px] before:rounded-r-full before:bg-c-blue'
                    : 'text-c-text-muted hover:bg-c-blue-wash hover:text-c-text',
                )
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>
        <button
          type="button"
          onClick={() => setIsCollapsed((value) => !value)}
          className="mx-3 mt-6 flex h-10 w-[calc(100%-1.5rem)] items-center justify-center rounded-brand border border-c-border text-c-text-muted hover:bg-c-blue-soft hover:text-c-blue"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span className="ml-1 text-xs">Collapse</span>
            </>
          )}
        </button>
      </aside>
      <nav
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-c-border bg-white px-2 pb-[env(safe-area-inset-bottom)] lg:hidden"
        aria-label="Mobile app navigation"
      >
        {items.slice(0, 5).map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                'flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium',
                isActive ? 'text-c-blue' : 'text-c-text-muted',
              )
            }
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  )
}

export default Sidebar
