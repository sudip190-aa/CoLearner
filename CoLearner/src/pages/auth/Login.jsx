import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Code2, Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { Button, Checkbox, Input, Tooltip } from '../../components/ui'
import { useAuthStore } from '../../store/authStore'

// Only follow same-site paths from ?next= (blocks "//evil.com" and absolute URLs).
const safeNextPath = (value) =>
  value && value.startsWith('/') && !value.startsWith('//') ? value : null

const schema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
  remember: z.boolean().optional(),
})

export default function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const login = useAuthStore((state) => state.login)
  const {
    register,
    handleSubmit,
    setError: setFormError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { remember: true },
  })
  const onSubmit = async ({ email, password }) => {
    setError('')
    try {
      const user = await login(email, password)
      const nextPath =
        user?.onboardingCompleted === false ||
        user?.onboardingComplete === false
          ? '/onboarding'
          : safeNextPath(params.get('next')) || '/dashboard'
      navigate(nextPath, { replace: true })
    } catch (submitError) {
      const fieldErrors =
        submitError?.fields || submitError?.error?.fields || {}
      Object.entries(fieldErrors).forEach(([key, value]) => {
        const fieldName = key === 'full_name' ? 'fullName' : key
        const message = Array.isArray(value) ? value[0] : value
        if (fieldName && message) {
          setFormError(fieldName, { type: 'server', message })
        }
      })

      const message = submitError?.message || 'Unable to log in right now.'
      setError(message)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Welcome back</h1>
      <p className="mt-2 text-sm text-c-text-muted">
        Pick up where you left off.
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
        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          leftIcon={Lock}
          rightIcon={showPassword ? EyeOff : Eye}
          onRightIconClick={() => setShowPassword((value) => !value)}
          error={errors.password?.message}
          {...register('password')}
        />
        <div className="flex items-center justify-between">
          <Checkbox label="Remember me" {...register('remember')} />
          <Link
            to="/forgot-password"
            className="text-sm font-semibold text-c-blue hover:text-c-blue-hover"
          >
            Forgot password?
          </Link>
        </div>
        {error && (
          <p className="text-sm font-medium text-c-danger" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" fullWidth loading={isSubmitting}>
          Log in
        </Button>
        <p className="text-center text-xs leading-relaxed text-c-text-muted">
          By continuing, you agree to CoLearn's{' '}
          <Link
            to="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-c-blue underline underline-offset-2"
          >
            Terms and Conditions
          </Link>{' '}
          and acknowledge its{' '}
          <Link
            to="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-c-blue underline underline-offset-2"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </form>
      <div className="my-5 flex items-center gap-3 text-xs text-c-text-muted">
        <span className="h-px flex-1 bg-c-border" />
        or
        <span className="h-px flex-1 bg-c-border" />
      </div>
      <Tooltip content="GitHub sign-in is coming in v2.">
        <span className="block">
          <Button
            type="button"
            variant="outline"
            fullWidth
            disabled
            icon={Code2}
          >
            Continue with GitHub
          </Button>
        </span>
      </Tooltip>
      <p className="mt-6 text-center text-sm text-c-text-muted">
        New to Colearn?{' '}
        <Link
          to="/signup"
          className="font-semibold text-c-blue hover:text-c-blue-hover"
        >
          Sign up
        </Link>
      </p>
    </div>
  )
}
