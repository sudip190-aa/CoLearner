import React, { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import clsx from 'clsx'
import { Logo } from '../ui/Logo'
import { Button } from '../ui/Button'
import Container from './Container'

const links = [
  { label: 'Learn', to: '/library' },
  { label: 'Build', to: '/projects' },
  { label: 'Community', to: '/community' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'About', to: '/about' },
]

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [hasScrolled, setHasScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setHasScrolled(window.scrollY > 4)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <header
      className={clsx(
        'sticky top-0 z-40 bg-white transition-shadow',
        hasScrolled && 'border-b border-c-border shadow-sm',
      )}
    >
      <Container className="flex h-16 items-center justify-between gap-6">
        <Logo variant="full" size="lg" to="/" />
        <nav
          className="hidden items-center gap-7 md:flex"
          aria-label="Primary navigation"
        >
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                clsx(
                  'text-sm font-medium transition-colors hover:text-c-blue',
                  isActive ? 'text-c-blue' : 'text-c-text-muted',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden items-center gap-5 md:flex">
          <Link
            to="/login"
            className="text-sm font-semibold text-c-text-muted hover:text-c-blue"
          >
            Log in
          </Link>
          <Button as={Link} to="/signup" size="sm">
            Get started
          </Button>
        </div>
        <button
          type="button"
          className="rounded-brand p-2 text-c-text md:hidden"
          aria-label="Open menu"
          aria-expanded={isOpen}
          onClick={() => setIsOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </button>
      </Container>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex min-h-screen flex-col bg-white md:hidden">
          <Container className="flex h-16 items-center justify-between">
            <Logo variant="full" size="md" to="/" />
            <button
              type="button"
              className="rounded-brand p-2 text-c-text"
              aria-label="Close menu"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </Container>
          <nav
            className="flex flex-1 flex-col gap-1 px-6 pt-8"
            aria-label="Mobile navigation"
          >
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setIsOpen(false)}
                className="border-b border-c-border py-4 text-lg font-semibold text-c-text"
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="space-y-3 px-6 pb-8">
            <Button
              as={Link}
              to="/signup"
              fullWidth
              onClick={() => setIsOpen(false)}
            >
              Get started
            </Button>
            <Link
              to="/login"
              onClick={() => setIsOpen(false)}
              className="block py-2 text-center text-sm font-semibold text-c-text-muted"
            >
              Log in
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}

export default Navbar
