import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Mail, User, AtSign, Lock } from 'lucide-react'
import { Button, Checkbox, Input } from '../../components/ui'
import { auth } from '../../services/api'
import { useAuthStore } from '../../store/authStore'

const schema = z.object({
  fullName: z.string().min(2, 'Enter your full name.'),
  email: z.string().email('Enter a valid email address.'),
  username: z
    .string()
    .min(3, 'Use at least 3 characters.')
    .regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers, and hyphens.'),
  password: z.string().min(8, 'Use at least 8 characters.'),
  terms: z.literal(true, {
    errorMap: () => ({ message: 'Accept the terms to continue.' }),
  }),
})

const isCheckableUsername = (value) =>
  value.length >= 3 && /^[a-z0-9-]+$/.test(value)

const strength = (value = '') =>
  [
    value.length >= 8,
    /[A-Z]/.test(value) || /\d/.test(value),
    /[^A-Za-z0-9]/.test(value),
  ].filter(Boolean).length

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false)
  const [usernameCheck, setUsernameCheck] = useState({ name: '', available: null })
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const signup = useAuthStore((state) => state.signup)
  const {
    register,
    control,
    setValue,
    setError: setFormError,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: { terms: false },
  })
  const password = useWatch({ control, name: 'password', defaultValue: '' })
  const username = useWatch({ control, name: 'username', defaultValue: '' })
  const lowercaseUsername = (event) => {
    setValue('username', event.target.value.toLowerCase(), {
      shouldValidate: true,
    })
  }

  // Live availability comes from the backend (debounced); the server re-validates on submit regardless.
  // The result is tied to the username it was checked for, so a stale answer is never shown for new input.
  const usernameState =
    usernameCheck.name === username ? usernameCheck.available : null
  useEffect(() => {
    if (!isCheckableUsername(username)) return undefined
    let cancelled = false
    const timer = window.setTimeout(async () => {
      let available = null
      try {
        available = await auth.checkUsername(username)
      } catch {
        // Unknown: stay neutral and let the server decide on submit.
      }
      if (!cancelled) setUsernameCheck({ name: username, available })
    }, 400)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [username])

  const onSubmit = async (data) => {
    if (usernameState === false) return

    setError('')
    try {
      const user = await signup({ ...data, name: data.fullName })
      const nextPath =
        user?.onboardingCompleted === false || user?.onboardingComplete === false
          ? '/onboarding'
          : '/dashboard'
      navigate(nextPath, { replace: true })
    } catch (submitError) {
      const fieldErrors = submitError?.fields || submitError?.error?.fields || {}
      Object.entries(fieldErrors).forEach(([key, value]) => {
        const fieldName = key === 'full_name' ? 'fullName' : key
        const message = Array.isArray(value) ? value[0] : value
        if (fieldName && message) {
          setFormError(fieldName, { type: 'server', message })
        }
      })

      const message = submitError?.message || 'Unable to create your account.'
      setError(message)
    }
  }
  return (
    <div>
      <h1 className="text-2xl font-bold">Create your account</h1>
      <p className="mt-2 text-sm text-c-text-muted">
        Start learning, building, and proving your work.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <Input
          label="Full name"
          leftIcon={User}
          placeholder="Maya Chen"
          error={errors.fullName?.message}
          {...register('fullName')}
        />
        <Input
          label="Email"
          type="email"
          leftIcon={Mail}
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Username"
          leftIcon={AtSign}
          placeholder="maya-chen"
          hint={
            usernameState === true
              ? 'Username is available.'
              : usernameState === false
                ? 'That username is already taken.'
                : 'Lowercase letters, numbers, and hyphens.'
          }
          error={
            errors.username?.message ||
            (usernameState === false
              ? 'That username is already taken.'
              : undefined)
          }
          {...register('username', { onChange: lowercaseUsername })}
        />
        <div>
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            leftIcon={Lock}
            rightIcon={showPassword ? EyeOff : Eye}
            onRightIconClick={() => setShowPassword((value) => !value)}
            error={errors.password?.message}
            {...register('password')}
          />
          <div
            className="mt-2 flex gap-1"
            aria-label={`Password strength ${strength(password)} of 3`}
          >
            {[1, 2, 3].map((level) => (
              <span
                key={level}
                className={`h-1.5 flex-1 rounded-full ${strength(password) >= level ? (strength(password) === 3 ? 'bg-c-success' : 'bg-c-yellow') : 'bg-c-border'}`}
              />
            ))}
          </div>
          <p className="mt-1 text-xs text-c-text-muted">
            Use 8+ characters, a number, or a symbol.
          </p>
        </div>
        <Checkbox
          label="I agree to Colearn's terms and privacy policy."
          error={errors.terms?.message}
          {...register('terms')}
        />
        <p className="-mt-2 text-xs text-c-text-muted">
          Read our{' '}
          <Link to="/terms" className="font-medium text-c-blue hover:underline">
            terms
          </Link>{' '}
          and{' '}
          <Link to="/privacy" className="font-medium text-c-blue hover:underline">
            privacy policy
          </Link>
          .
        </p>
        {error && (
          <p className="text-sm font-medium text-c-danger" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" fullWidth loading={isSubmitting}>
          Create account
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-c-text-muted">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-c-blue">
          Log in
        </Link>
      </p>
    </div>
  )
}
