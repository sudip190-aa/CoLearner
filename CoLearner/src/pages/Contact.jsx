import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Mail,
  MessageCircle,
  ArrowUpRight,
  ArrowRight,
  Check,
} from 'lucide-react'
import { Button, Input, Textarea } from '../components/ui'
import { contact } from '../services/api'

const firstMessage = (value) => (Array.isArray(value) ? value[0] : value)

export default function Contact() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const update = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }))
  const submit = async (event) => {
    event.preventDefault()
    if (submitting) return
    if (
      !form.name.trim() ||
      !form.email.includes('@') ||
      !form.subject.trim() ||
      form.message.trim().length < 10
    ) {
      setError(
        'Please complete every field. Your message should be at least 10 characters.',
      )
      return
    }
    setError('')
    setFieldErrors({})
    setSubmitting(true)
    try {
      await contact.send(form)
      setSent(true)
    } catch (submitError) {
      // Field-level messages come straight from the API's validation.
      setFieldErrors(submitError?.fields || {})
      setError(
        submitError?.code === 'throttled'
          ? 'You have sent a few messages already. Please try again later.'
          : submitError?.message || 'We could not send your message.',
      )
    } finally {
      setSubmitting(false)
    }
  }
  return (
    <div className="container py-12 md:py-20">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10 max-w-xl md:mb-14">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-c-blue">
            Contact us
          </p>
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
            Let's talk.
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-c-text-muted">
            Have a question or an idea for CoLearn? We would love to hear it.
          </p>
        </header>
        <div className="grid items-start gap-10 lg:grid-cols-[1fr_280px] lg:gap-14">
          <div className="min-w-0">
            {sent ? (
              <div
                role="status"
                className="rounded-2xl border border-c-blue/20 bg-c-blue-wash p-8"
              >
                <span className="inline-flex rounded-full bg-c-yellow p-3 text-c-on-accent">
                  <Check size={24} aria-hidden="true" />
                </span>
                <h2 className="mt-5 text-2xl font-semibold">
                  Message received.
                </h2>
                <p className="mt-3 break-words text-sm leading-relaxed text-c-text-muted">
                  Thanks for reaching out, {form.name}. We will reply to{' '}
                  {form.email} as soon as we can.
                </p>
                <Button
                  className="mt-6"
                  variant="outline"
                  onClick={() => {
                    setSent(false)
                    setForm({ name: '', email: '', subject: '', message: '' })
                  }}
                >
                  Send another message
                </Button>
              </div>
            ) : (
              <form
                onSubmit={submit}
                aria-label="Contact form"
                aria-busy={submitting}
                className="space-y-5 rounded-2xl border border-c-border bg-c-surface p-6 sm:p-8"
              >
                <div>
                  <h2 className="text-xl font-semibold">Send a message</h2>
                  <p className="mt-2 text-sm text-c-text-muted">
                    All fields are required.
                  </p>
                </div>
                <fieldset disabled={submitting} className="space-y-5">
                  <legend className="sr-only">
                    Your contact details and message
                  </legend>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Input
                      name="name"
                      label="Name"
                      autoComplete="name"
                      placeholder="Your name"
                      value={form.name}
                      onChange={(event) => update('name', event.target.value)}
                      error={firstMessage(fieldErrors.name)}
                      required
                    />
                    <Input
                      name="email"
                      label="Email"
                      autoComplete="email"
                      type="email"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={(event) => update('email', event.target.value)}
                      error={firstMessage(fieldErrors.email)}
                      required
                    />
                  </div>
                  <Input
                    name="subject"
                    label="Subject"
                    placeholder="What can we help with?"
                    value={form.subject}
                    onChange={(event) => update('subject', event.target.value)}
                    error={firstMessage(fieldErrors.subject)}
                    required
                  />
                  <Textarea
                    name="message"
                    label="Message"
                    rows={5}
                    minLength={10}
                    maxLength={5000}
                    placeholder="Tell us a little more..."
                    value={form.message}
                    onChange={(event) => update('message', event.target.value)}
                    error={firstMessage(fieldErrors.message)}
                    required
                  />
                </fieldset>
                {error && (
                  <p
                    role="alert"
                    className="rounded-lg bg-c-danger-soft px-3 py-2 text-sm text-c-danger"
                  >
                    {error}
                  </p>
                )}
                <div className="flex flex-col items-start justify-between gap-4 border-t border-c-border pt-5 sm:flex-row sm:items-center">
                  <p className="max-w-[230px] text-xs leading-relaxed text-c-text-muted">
                    Your details are used to respond to your message.{' '}
                    <Link
                      to="/privacy"
                      className="text-c-blue underline underline-offset-2"
                    >
                      Privacy policy
                    </Link>
                  </p>
                  <Button
                    type="submit"
                    loading={submitting}
                    icon={ArrowRight}
                    iconPosition="right"
                  >
                    Send message
                  </Button>
                </div>
              </form>
            )}
          </div>
          <aside
            className="space-y-8 lg:pt-4"
            aria-label="Other ways to connect"
          >
            <div>
              <Mail size={22} className="mb-4 text-c-blue" aria-hidden="true" />
              <h2 className="text-base font-semibold">Prefer email?</h2>
              <a
                href="mailto:hello@colearn.dev"
                className="mt-2 inline-block text-sm text-c-blue hover:underline"
              >
                hello@colearn.dev
              </a>
              <p className="mt-3 text-sm leading-relaxed text-c-text-muted">
                For questions, feedback, or a conversation about working
                together.
              </p>
            </div>
            <div className="border-t border-c-border pt-8">
              <MessageCircle
                size={22}
                className="mb-4 text-c-blue"
                aria-hidden="true"
              />
              <h2 className="text-base font-semibold">
                Learn with the community
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-c-text-muted">
                Exchange ideas and find people working through the same
                challenges.
              </p>
              <Link
                to="/our-community"
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-c-blue hover:underline"
              >
                Explore the community{' '}
                <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
