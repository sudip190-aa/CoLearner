import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { Button, Input } from '../../components/ui'
import { auth } from '../../services/api'
import { emailErrorMessage } from '../../components/auth/emailFeedback'

const schema = z.object({
  email: z.string().email('Enter a valid email address.'),
})

export default function ForgotPassword() {
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async ({ email }) => {
    setError('')
    try {
      await auth.forgotPassword(email)
      setSent(true)
    } catch (submitError) {
      setError(emailErrorMessage(submitError))
    }
  }

  if (sent)
    return (
      <div className="text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-c-success" />
        <h1 className="mt-4 text-2xl font-bold">Check your inbox</h1>
        <p className="mt-2 text-sm leading-6 text-c-text-muted">
          If an account exists for that email, you will receive a password reset
          link. Check your spam folder and open the link in this browser.
        </p>
        <Link
          to="/login"
          className="mt-6 inline-flex text-sm font-semibold text-c-blue"
        >
          Back to log in
        </Link>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-4 block w-full text-sm text-c-text-muted"
        >
          Try another email
        </button>
      </div>
    )
  return (
    <div>
      <h1 className="text-2xl font-bold">Forgot your password?</h1>
      <p className="mt-2 text-sm text-c-text-muted">
        Enter your email and we&apos;ll send a reset link.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <Input
          label="Email"
          type="email"
          leftIcon={Mail}
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />
        {error && (
          <p className="text-sm font-medium text-c-danger" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" fullWidth loading={isSubmitting}>
          Send reset link
        </Button>
      </form>
      <Link
        to="/login"
        className="mt-6 flex items-center justify-center gap-2 text-sm font-semibold text-c-text-muted"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to log in
      </Link>
    </div>
  )
}
