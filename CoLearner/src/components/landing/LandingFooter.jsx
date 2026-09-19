import React from 'react'
import { Logo } from '../ui'
import { Globe, Link, ExternalLink } from 'lucide-react'
import { Link as RouterLink } from 'react-router-dom'

const footerLinks = {
  Features: '#features',
  'How it works': '#how',
  Pricing: '/pricing',
  Changelog: '/changelog',
  Leaderboard: '/leaderboard',
  Projects: '/projects',
  Threads: '/community',
  Mentors: '/people',
  About: '/about',
  Blog: '/blog',
  Careers: '/careers',
  Contact: '/contact',
  Privacy: '/privacy',
  Terms: '/terms',
  Cookies: '/cookies',
  Accessibility: '/accessibility',
}

export const LandingFooter = () => {
  return (
    <footer className="bg-white border-t border-c-border py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-5 gap-10 mb-12">
          <div className="md:col-span-1">
            <Logo variant="full" size="md" className="mb-4" />
            <p className="text-sm text-c-text-muted leading-relaxed">
              Learn it. Build it. Prove it.
            </p>
            <div className="flex gap-3 mt-4">
              {[
                ['GitHub', Globe, 'https://github.com/'],
                ['LinkedIn', Link, 'https://www.linkedin.com/'],
                ['Website', ExternalLink, 'https://colearn.app/'],
              ].map(([label, Icon, href]) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-md border border-c-border flex items-center justify-center text-c-text-muted hover:text-c-text hover:border-c-text/30 transition-colors"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {[
            {
              label: 'Product',
              links: ['Features', 'How it works', 'Pricing', 'Changelog'],
            },
            {
              label: 'Community',
              links: ['Leaderboard', 'Projects', 'Threads', 'Mentors'],
            },
            {
              label: 'Company',
              links: ['About', 'Blog', 'Careers', 'Contact'],
            },
            {
              label: 'Legal',
              links: ['Privacy', 'Terms', 'Cookies', 'Accessibility'],
            },
          ].map((col) => (
            <div key={col.label}>
              <div className="text-xs font-bold uppercase tracking-wider text-c-text mb-4">
                {col.label}
              </div>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link}>
                    {footerLinks[link].startsWith('#') ? (
                      <a
                        href={footerLinks[link]}
                        className="text-sm text-c-text-muted hover:text-c-text transition-colors"
                      >
                        {link}
                      </a>
                    ) : (
                      <RouterLink
                        to={footerLinks[link]}
                        className="text-sm text-c-text-muted hover:text-c-text transition-colors"
                      >
                        {link}
                      </RouterLink>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-c-border pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-c-text-muted">
            © {new Date().getFullYear()} Colearn. All rights reserved.
          </p>
          <div className="flex gap-6">
            {['Privacy', 'Terms', 'Cookies'].map((link) => (
              <RouterLink
                key={link}
                to={footerLinks[link]}
                className="text-xs text-c-text-muted hover:text-c-text transition-colors"
              >
                {link}
              </RouterLink>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
