import React, { useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { Logo, Button } from '../ui'

const links = [
  ['How it works', '/how-it-works'],
  ['Features', '/features'],
  ['Community', '/our-community'],
  ['About', '/about'],
]

export const LandingNav = () => {
  const [open, setOpen] = useState(false)
  const toggleRef = useRef(null)
  const closeMenu = () => setOpen(false)
  return (
    <header
      className="sticky inset-x-0 top-0 z-50 border-b border-c-border bg-white/95 backdrop-blur-md"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          closeMenu()
          toggleRef.current?.focus()
        }
      }}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-white focus:p-3"
      >
        Skip to content
      </a>
      <nav
        aria-label="Main navigation"
        className="container flex h-[72px] items-center justify-between gap-3"
      >
        <Logo size="nav" to="/" aria-label="CoLearn home" onClick={closeMenu} />
        <div className="hidden items-center gap-7 text-sm font-medium text-c-text-muted lg:flex">
          {links.map(([label, href]) => (
            <NavLink
              key={href}
              to={href}
              onClick={closeMenu}
              className={({ isActive }) =>
                `transition-colors hover:text-c-blue ${isActive ? 'text-c-blue' : ''}`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            to="/login"
            variant="ghost"
            size="sm"
            className="whitespace-nowrap"
            onClick={closeMenu}
          >
            Sign in
          </Button>
          <Button to="/signup" size="sm" onClick={closeMenu}>
            Get started
          </Button>
          <button
            ref={toggleRef}
            type="button"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="landing-mobile-menu"
            onClick={() => setOpen(!open)}
            className="rounded-lg p-2 hover:bg-c-blue-wash lg:hidden"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>
      {open && (
        <nav
          id="landing-mobile-menu"
          aria-label="Mobile navigation"
          className="absolute inset-x-0 top-full border-b border-c-border bg-white p-4 shadow-md lg:hidden"
        >
          {links.map(([label, href]) => (
            <NavLink
              key={href}
              to={href}
              onClick={closeMenu}
              className={({ isActive }) =>
                `block rounded-lg px-4 py-3 text-sm font-medium hover:bg-c-blue-wash ${isActive ? 'bg-c-blue-wash text-c-blue' : ''}`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  )
}
