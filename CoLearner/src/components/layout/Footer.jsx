import React from 'react'
import { Code2, Share2, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Logo } from '../ui/Logo'
import { FOOTER_LINKS } from '../../lib/constants'
import Container from './Container'

const columns = {
  Product: FOOTER_LINKS.product || [],
  Community: FOOTER_LINKS.resources || [],
  Company: FOOTER_LINKS.company || [],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
  ],
}

export function Footer() {
  return (
    <footer className="border-t border-c-border bg-c-blue-wash">
      <Container className="py-14">
        <div className="grid gap-10 lg:grid-cols-[1.5fr_repeat(4,1fr)]">
          <div>
            <Logo variant="full" size="md" to="/" />
            <p className="mt-4 max-w-xs text-sm leading-6 text-c-text-muted">
              Learn skills, build real projects, and prove the work you are
              proud of.
            </p>
            <div className="mt-5 flex items-center gap-2">
              {[
                ['GitHub', Code2, 'https://github.com/'],
                ['LinkedIn', Users, 'https://www.linkedin.com/'],
                ['Twitter', Share2, 'https://x.com/'],
              ].map(([label, Icon, href]) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-brand p-2 text-c-text-muted hover:bg-white hover:text-c-blue"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          {Object.entries(columns).map(([title, links]) => (
            <div key={title}>
              <h2 className="text-sm font-semibold text-c-text">{title}</h2>
              <ul className="mt-4 space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-sm text-c-text-muted hover:text-c-blue"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 border-t border-c-border pt-6 text-sm text-c-text-muted">
          © 2026 Colearn
        </div>
      </Container>
    </footer>
  )
}

export default Footer
