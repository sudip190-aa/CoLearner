import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, MessageCircle } from 'lucide-react'
import { Button, Input, Textarea } from '../components/ui'
import { PageHeader } from '../components/layout/PageHeader'
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
    <div>
      <PageHeader
        title="We would love to hear from you"
        subtitle="Questions, ideas, feedback, or a thoughtful hello. There is a real person on the other side of this form."
      />
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div>
          {sent ? (
            <div className="rounded-brand-lg border border-c-success/30 bg-emerald-50 p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-c-success">
                <Mail className="h-6 w-6" />
              </div>
              <h2 className="mt-5 text-2xl font-bold text-c-text">
                Message received.
              </h2>
              <p className="mt-2 max-w-lg text-sm leading-6 text-c-text-muted">
                Thanks for reaching out, {form.name}. We will get back to you at{' '}
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
              className="space-y-5 rounded-brand-lg border border-c-border bg-white p-6 shadow-sm"
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <Input
                  label="Name"
                  value={form.name}
                  onChange={(event) => update('name', event.target.value)}
                  error={firstMessage(fieldErrors.name)}
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(event) => update('email', event.target.value)}
                  error={firstMessage(fieldErrors.email)}
                  required
                />
              </div>
              <Input
                label="Subject"
                value={form.subject}
                onChange={(event) => update('subject', event.target.value)}
                error={firstMessage(fieldErrors.subject)}
                required
              />
              <Textarea
                label="Message"
                rows={8}
                value={form.message}
                onChange={(event) => update('message', event.target.value)}
                error={firstMessage(fieldErrors.message)}
                required
              />
              {error && (
                <p
                  role="alert"
                  className="rounded-brand bg-red-50 px-3 py-2 text-sm text-c-danger"
                >
                  {error}
                </p>
              )}
              <div className="flex justify-end">
                <Button type="submit" loading={submitting}>
                  Send message
                </Button>
              </div>
            </form>
          )}
        </div>
        <aside className="space-y-4">
          <div className="rounded-brand-lg border border-c-border bg-c-blue-wash p-5">
            <Mail className="h-5 w-5 text-c-blue" />
            <h2 className="mt-4 font-bold text-c-text">Email us</h2>
            <a
              href="mailto:hello@colearn.dev"
              className="mt-1 block text-sm text-c-blue hover:underline"
            >
              hello@colearn.dev
            </a>
            <p className="mt-2 text-xs leading-5 text-c-text-muted">
              We usually reply within two working days.
            </p>
          </div>
          <div className="rounded-brand-lg border border-c-border bg-white p-5">
            <MessageCircle className="h-5 w-5 text-c-blue" />
            <h2 className="mt-4 font-bold text-c-text">Ask the community</h2>
            <p className="mt-1 text-sm leading-6 text-c-text-muted">
              For product questions and learning ideas, the community is already
              here.
            </p>
            <Link
              to="/community"
              className="mt-4 inline-block text-sm font-semibold text-c-blue hover:underline"
            >
              Visit community
            </Link>
          </div>
        </aside>
      </div>
    </div>
  )
}
