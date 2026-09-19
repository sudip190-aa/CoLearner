import React from 'react'
import { Link, Outlet } from 'react-router-dom'
import { Logo } from '../ui/Logo'

export function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-white lg:grid lg:grid-cols-2">
      <main className="flex min-h-screen flex-col items-center justify-center px-6 py-10">
        <Logo variant="full" size="lg" to="/" />
        <div className="mt-8 w-full max-w-md rounded-brand-lg border border-c-border bg-white p-6 shadow-sm sm:p-8">
          {children || <Outlet />}
        </div>
        <nav
          className="mt-6 flex items-center gap-4 text-xs text-c-text-muted"
          aria-label="Auth footer links"
        >
          <Link to="/privacy" className="hover:text-c-blue">
            Privacy
          </Link>
          <Link to="/terms" className="hover:text-c-blue">
            Terms
          </Link>
          <Link to="/contact" className="hover:text-c-blue">
            Help
          </Link>
        </nav>
      </main>
      <aside className="hidden bg-c-blue-wash lg:flex lg:flex-col lg:justify-center lg:px-16 xl:px-24">
        <p className="text-sm font-semibold uppercase tracking-widest text-c-blue">
          Colearn
        </p>
        <h1 className="mt-4 max-w-lg text-4xl font-bold leading-tight text-c-text">
          Learn → Build → Prove → Succeed.
        </h1>
        <ul className="mt-8 space-y-4 text-base text-c-text-muted">
          <li>Learn from curated books and practical paths.</li>
          <li>Build real projects with peers and mentors.</li>
          <li>Prove your progress with a public portfolio.</li>
        </ul>
      </aside>
    </div>
  )
}

export default AuthLayout
