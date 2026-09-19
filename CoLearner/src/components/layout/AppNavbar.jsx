import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Bell,
  ChevronDown,
  LogOut,
  Settings,
  ShieldCheck,
  User,
  Briefcase,
} from 'lucide-react'
import { Logo } from '../ui/Logo'
import { SearchBar } from '../ui/SearchBar'
import { Avatar } from '../ui/Avatar'
import { Dropdown, DropdownDivider, DropdownItem } from '../ui/Dropdown'
import Container from './Container'
import { useNotificationStore } from '../../store/notificationStore.js'
import { useNotificationSync } from '../../hooks/useNotificationSync.js'
import { describeNotification } from '../../lib/notifications.js'
import { useAuthStore } from '../../store/authStore.js'
import { formatRelative } from '../../lib/formatters.js'

const roleLabels = {
  learner: 'Learner',
  builder: 'Builder',
  mentor: 'Mentor',
  admin: 'Admin',
}

export function AppNavbar() {
  const navigate = useNavigate()
  const logout = useAuthStore((state) => state.logout)
  const user = useAuthStore((state) => state.user)
  const userName = user?.fullName || user?.username || 'Colearn user'
  const isAdmin = Boolean(user?.isStaff)
  const notifications = useNotificationStore((state) => state.notifications)
  const markRead = useNotificationStore((state) => state.markRead)
  const unreadCount = useNotificationStore((state) => state.unreadCount)
  useNotificationSync()

  const handleLogout = async () => {
    await logout()
    // Full page load: lands on a clean /login (the route guard would add ?next=...) and drops every
    // in-memory copy of this user's data so it can't show up for the next person to sign in.
    window.location.replace('/login')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-c-border bg-white">
      <Container className="flex h-16 items-center gap-4">
        <Link to="/dashboard" className="shrink-0" aria-label="Go to dashboard">
          <span className="hidden min-[768px]:inline-flex">
            <Logo variant="full" size="sm" />
          </span>
          <span className="inline-flex min-[768px]:hidden">
            <Logo variant="mark" size="sm" />
          </span>
        </Link>
        <SearchBar
          containerClassName="mx-auto max-w-md flex-1"
          onSearch={(query) => {
            const text = query.trim()
            if (text) navigate(`/search?q=${encodeURIComponent(text)}`)
          }}
        />
        <div className="flex items-center gap-2">
          <Dropdown
            align="right"
            className="w-80"
            trigger={
              <button
                type="button"
                className="relative rounded-brand p-2 text-c-text-muted hover:bg-c-blue-soft hover:text-c-blue"
                aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-c-danger px-1 text-[9px] font-bold text-white ring-2 ring-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            }
          >
            <div className="flex items-center justify-between border-b border-c-border px-4 py-3">
              <p className="text-sm font-bold text-c-text">Notifications</p>
              <Link
                to="/notifications"
                className="text-xs font-semibold text-c-blue"
              >
                View all
              </Link>
            </div>
            {notifications.length === 0 && (
              <p className="px-4 py-6 text-center text-xs text-c-text-muted">
                You are all caught up.
              </p>
            )}
            {notifications.slice(0, 5).map((notification) => {
              const { actorName, phrase, label, to } =
                describeNotification(notification)
              return (
                <Link
                  key={notification.id}
                  to={to}
                  onClick={() => markRead(notification.id)}
                  className={`flex items-start gap-2.5 border-b border-c-border px-4 py-3 hover:bg-c-blue-wash ${notification.isRead ? 'bg-white' : 'bg-c-blue-soft'}`}
                >
                  <Avatar
                    src={notification.actor?.avatar}
                    name={notification.actor?.fullName || 'Colearn'}
                    size="sm"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs leading-5 text-c-text">
                      {actorName && <strong>{actorName} </strong>}
                      {phrase}
                      {label && <strong> {label}</strong>}
                    </span>
                    <span className="mt-1 block text-[11px] text-c-text-muted">
                      {formatRelative(notification.createdAt)}
                    </span>
                  </span>
                  {!notification.isRead && (
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-c-blue" />
                  )}
                </Link>
              )
            })}
          </Dropdown>
          <Dropdown
            align="right"
            trigger={
              <button
                type="button"
                className="flex items-center gap-2 rounded-brand p-1.5 hover:bg-c-blue-soft"
                aria-label="Open account menu"
              >
                <Avatar src={user?.avatar} name={userName} size="sm" />
                <ChevronDown className="hidden h-4 w-4 text-c-text-muted sm:block" />
              </button>
            }
          >
            <div className="border-b border-c-border px-3.5 py-2">
              <p className="text-sm font-semibold text-c-text">{userName}</p>
              <p className="text-xs text-c-text-muted">
                {roleLabels[user?.role] || 'Learner'} account
              </p>
            </div>
            <DropdownItem icon={User} onClick={() => navigate('/profile')}>
              Profile
            </DropdownItem>
            <DropdownItem icon={Briefcase} onClick={() => navigate('/profile')}>
              Portfolio
            </DropdownItem>
            <DropdownItem icon={Settings} onClick={() => navigate('/settings')}>
              Settings
            </DropdownItem>
            {isAdmin && (
              <DropdownItem icon={ShieldCheck} onClick={() => navigate('/admin')}>
                Admin
              </DropdownItem>
            )}
            <DropdownDivider />
            <DropdownItem icon={LogOut} danger onClick={handleLogout}>
              Log out
            </DropdownItem>
          </Dropdown>
        </div>
      </Container>
    </header>
  )
}

export default AppNavbar
