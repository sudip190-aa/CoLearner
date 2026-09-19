import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Compass } from 'lucide-react'
import { Button } from '../components/ui'
import { Logo } from '../components/ui/Logo'

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col bg-c-blue-wash px-6 py-8">
      <Logo variant="mark" size="xl" to="/" />
      <div className="mx-auto flex max-w-xl flex-1 flex-col items-center justify-center text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-c-yellow-soft">
          <Compass className="h-10 w-10 text-c-text" />
        </div>
        <p className="mt-7 text-sm font-bold uppercase tracking-[.16em] text-c-blue">
          404
        </p>
        <h1 className="mt-3 text-4xl font-bold text-c-text">
          This page went off to build something else.
        </h1>
        <p className="mt-4 text-base leading-7 text-c-text-muted">
          The link may be outdated, or this page is still waiting for its first
          commit.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button to="/dashboard" icon={ArrowRight} iconPosition="right">
            Dashboard
          </Button>
          <Button to="/community" variant="outline">
            Community
          </Button>
        </div>
        <Link
          to="/"
          className="mt-8 text-sm font-semibold text-c-text-muted hover:text-c-blue"
        >
          Back to Colearn
        </Link>
      </div>
    </main>
  )
}
