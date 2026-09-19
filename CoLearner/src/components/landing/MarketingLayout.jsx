import React, { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { LandingNav } from './LandingNav'
import { LandingFooter } from './LandingFooter'

const titles = {
  '/': 'CoLearn — Learn. Build. Prove.',
  '/how-it-works': 'How it works — CoLearn',
  '/features': 'Features — CoLearn',
  '/our-community': 'Community — CoLearn',
  '/contact': 'Contact us | CoLearn',
  '/pricing': 'Pricing | CoLearn',
  '/about': 'About — CoLearn',
}

export function MarketingLayout() {
  const { pathname } = useLocation()
  const mainRef = useRef(null)
  const previousPath = useRef(pathname)
  useEffect(() => {
    document.title = titles[pathname] || 'CoLearn'
    window.scrollTo({ top: 0, behavior: 'instant' })
    if (previousPath.current !== pathname)
      mainRef.current?.focus({ preventScroll: true })
    previousPath.current = pathname
  }, [pathname])
  return (
    <div className="min-h-screen bg-white font-sans text-c-text">
      <LandingNav key={pathname} />
      <main
        id="main-content"
        ref={mainRef}
        tabIndex={-1}
        className="focus:outline-none"
      >
        <Outlet />
      </main>
      <LandingFooter />
    </div>
  )
}
