import { useAuthStore } from '../../store/authStore'
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Lock, CheckCircle2 } from 'lucide-react'
import { Button, Input } from '../../components/ui'
import { auth } from '../../services/api'

const schema = z
  .object({
    password: z.string().min(8, 'Use at least 8 characters.'),
    confirmPassword: z.string().min(1, 'Confirm your password.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match.',
  })

const firstMessage = (value) => (Array.isArray(value) ? value[0] : value)

export default function ResetPassword() {
  const signedIn = useAuthStore((state) => state.isAuthenticated)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async ({ password, confirmPassword }) => {
    setError('')
    try {
      await auth.resetPassword({ password, confirmPassword })
      setDone(true)
    } catch (submitError) {
      const fields = submitError?.fields || {}
      setError(
        firstMessage(fields.token) ||
          firstMessage(fields.email) ||
          firstMessage(fields.password) ||
          submitError?.message ||
          'Unable to reset your password.',
      )
    }
  }

  if (!signedIn && !done)
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold">This reset link isn&apos;t valid</h1>
        <p className="mt-2 text-sm text-c-text-muted">
          Open the link from your email again, or request a new one.
        </p>
        <Link
          to="/forgot-password"
          className="mt-6 inline-flex text-sm font-semibold text-c-blue"
        >
          Request a new link
        </Link>
      </div>
    )

  if (done)
    return (
      <div className="text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-c-success" />
        <h1 className="mt-4 text-2xl font-bold">Password updated</h1>
        <p className="mt-2 text-sm text-c-text-muted">
          Your new password is ready to use.
        </p>
        <Link
          to="/login"
          className="mt-6 inline-flex text-sm font-semibold text-c-blue"
        >
          Continue to log in
        </Link>
      </div>
    )
  return (
    <div>
      <h1 className="text-2xl font-bold">Set a new password</h1>
      <p className="mt-2 text-sm text-c-text-muted">
        Choose a password you&apos;ll remember.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <Input
          label="New password"
          type="password"
          leftIcon={Lock}
          error={errors.password?.message}
          {...register('password')}
        />
        <Input
          label="Confirm password"
          type="password"
          leftIcon={Lock}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        {error && (
          <p className="text-sm font-medium text-c-danger" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" fullWidth loading={isSubmitting}>
          Update password
        </Button>
      </form>
    </div>
  )
}
