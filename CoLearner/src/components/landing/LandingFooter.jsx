import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Loader2 } from 'lucide-react'
import { Logo } from '../ui'
import { contact } from '../../services/api'

const columns = [
  [
    'Explore',
    [
      ['Features', '/features'],
      ['Pricing', '/pricing'],
      ['How it works', '/how-it-works'],
      ['Community', '/our-community'],
    ],
  ],
  [
    'CoLearn',
    [
      ['About us', '/about'],
      ['Contact', '/contact'],
      ['Get started', '/signup'],
    ],
  ],
  [
    'Legal',
    [
      ['Privacy policy', '/privacy'],
      ['Terms and Conditions', '/terms'],
    ],
  ],
]

export const LandingFooter = () => {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const subscribe = async (event) => {
    event.preventDefault()
    if (status === 'pending') return
    setStatus('pending')
    setError('')
    try {
      await contact.send({
        name: 'Newsletter subscriber',
        email: email.trim(),
        subject: 'Newsletter subscription request',
        message:
          'Please subscribe this email address to CoLearn news, learning resources, and product updates. Consent submitted through the website newsletter form.',
      })
      setStatus('success')
      setEmail('')
    } catch (err) {
      setStatus('idle')
      setError(
        err?.message || 'We could not save your request. Please try again.',
      )
    }
  }
  return (
    <footer className="bg-c-blue-wash pb-8 pt-12 sm:pt-16">
      <div className="container">
        <section
          aria-labelledby="newsletter-title"
          className="grid items-center gap-8 rounded-[28px] bg-c-blue-hover px-6 py-10 sm:p-12 lg:grid-cols-[1.1fr_1fr] lg:gap-20 lg:px-14 lg:py-14"
        >
          <div>
            <h2
              id="newsletter-title"
              className="text-3xl font-medium leading-tight tracking-tight text-white sm:text-4xl"
            >
              Subscribe to our
              <br />
              newsletter.
            </h2>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-white">
              Fresh learning resources, community stories, and the latest from
              CoLearn. A little inspiration for your next step.
            </p>
          </div>
          <div>
            {status === 'success' ? (
              <div
                role="status"
                className="rounded-2xl border border-white/20 bg-white/5 p-6 text-white"
              >
                <Check
                  size={24}
                  className="mb-3 text-c-yellow"
                  aria-hidden="true"
                />
                <p className="font-medium">Thanks for your interest.</p>
                <p className="mt-2 text-sm leading-relaxed text-white">
                  Your newsletter subscription request has been received.
                </p>
              </div>
            ) : (
              <form
                onSubmit={subscribe}
                aria-label="Newsletter subscription"
                aria-busy={status === 'pending'}
              >
                <label
                  htmlFor="newsletter-email"
                  className="mb-3 block text-sm text-white"
                >
                  Stay up to date
                </label>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    id="newsletter-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    maxLength={254}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Enter your email"
                    disabled={status === 'pending'}
                    aria-describedby={
                      error
                        ? 'newsletter-error newsletter-consent'
                        : 'newsletter-consent'
                    }
                    className="min-w-0 flex-1 rounded-full border border-transparent bg-white px-5 py-3.5 text-sm text-c-text placeholder:text-c-text-muted focus:border-c-yellow focus:outline-none focus:ring-2 focus:ring-c-yellow/40 disabled:opacity-60"
                  />
                  <button
                    type="submit"
                    disabled={status === 'pending'}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-c-yellow px-7 py-3.5 text-sm font-semibold text-c-text transition-colors hover:bg-c-yellow-soft focus-visible:outline-c-yellow disabled:cursor-wait disabled:opacity-70"
                  >
                    {status === 'pending' && (
                      <Loader2
                        size={16}
                        className="animate-spin"
                        aria-hidden="true"
                      />
                    )}
                    {status === 'pending' ? 'Submitting...' : 'Subscribe'}
                  </button>
                </div>
                <p
                  id="newsletter-consent"
                  className="mt-4 text-xs leading-relaxed text-white"
                >
                  By subscribing, you agree to receive CoLearn updates. See our{' '}
                  <Link
                    to="/privacy"
                    className="underline underline-offset-2 hover:text-white"
                  >
                    Privacy Policy
                  </Link>
                  .
                </p>
                {error && (
                  <p
                    id="newsletter-error"
                    role="alert"
                    className="mt-3 text-sm text-c-yellow-soft"
                  >
                    {error}
                  </p>
                )}
              </form>
            )}
          </div>
        </section>
        <div className="grid gap-10 py-12 sm:grid-cols-[1.2fr_2fr] md:py-16 lg:grid-cols-[1.5fr_2fr]">
          <div>
            <Logo to="/" size="md" />
            <p className="mt-5 max-w-[210px] text-sm leading-relaxed text-c-text-muted">
              Learn with purpose.
              <br />
              Build something that matters.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4 sm:gap-6">
            {columns.map(([title, links]) => (
              <nav key={title} aria-label={`${title} footer links`}>
                <h3 className="mb-5 text-sm font-semibold text-c-text">
                  {title}
                </h3>
                <ul className="space-y-3">
                  {links.map(([label, to]) => (
                    <li key={to}>
                      <Link
                        to={to}
                        className="text-xs leading-relaxed text-c-text-muted transition-colors hover:text-c-blue sm:text-sm"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-c-border pt-6 text-xs text-c-text-muted">
          <p>© {new Date().getFullYear()} CoLearn. All rights reserved.</p>
          <p>Learn. Build. Prove.</p>
        </div>
      </div>
    </footer>
  )
}
