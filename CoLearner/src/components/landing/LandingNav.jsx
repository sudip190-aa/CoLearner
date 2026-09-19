import React, { useEffect, useState } from 'react'
import { Logo, Button } from '../ui'

export const LandingNav = () => {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 16)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-sm border-b border-c-border shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Logo variant="full" size="sm" />
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-c-text-muted">
          <a href="#features" className="hover:text-c-text transition-colors">
            Features
          </a>
          <a href="#how" className="hover:text-c-text transition-colors">
            How it works
          </a>
          <a href="#community" className="hover:text-c-text transition-colors">
            Community
          </a>
        </div>
        <div className="flex items-center gap-3">
          <Button as="Link" to="/login" variant="ghost" size="sm">
            Sign in
          </Button>
          <Button as="Link" to="/signup" size="sm">
            Get started
          </Button>
        </div>
      </div>
    </nav>
  )
}
