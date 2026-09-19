import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  supabase,
  result,
  session,
  action,
} from '../../services/supabase/client'
import { useAuthStore } from '../../store/authStore'

export default function AuthCallback() {
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const verification = useRef(null)
  useEffect(() => {
    let active = true
    async function finish() {
      try {
        const params = new URLSearchParams(location.search)
        const fragment = new URLSearchParams(location.hash.slice(1))
        if (params.get('error') || fragment.get('error'))
          throw new Error(
            params.get('error_description') ||
              fragment.get('error_description') ||
              'Sign-in was not completed.',
          )
        // Surface a failed PKCE exchange even if an older session is still stored.
        const { error: initializationError } = await supabase.auth.initialize()
        if (
          initializationError ||
          new URLSearchParams(location.search).has('code')
        )
          throw new Error(
            'This sign-in link could not be verified. Open it in the browser where you started, or request a new link.',
          )
        // Email templates use token hashes so links also work on another device.
        const tokenHash = params.get('token_hash')
        const type = params.get('type')
        if (tokenHash && !['signup', 'recovery', 'email'].includes(type))
          throw new Error(
            'This email link is not supported. Please request a new link.',
          )
        if (tokenHash && ['signup', 'recovery', 'email'].includes(type)) {
          verification.current ||= result(
            supabase.auth.verifyOtp({ token_hash: tokenHash, type }),
          )
          await verification.current
        }
        // OAuth PKCE codes are exchanged once by the client during initialization.
        const current = await session()
        if (!current)
          throw new Error(
            'This link has expired. Please sign in or request a new email.',
          )
        const attempt = JSON.parse(
          sessionStorage.getItem('colearn:oauth-attempt') || 'null',
        )
        if (
          !tokenHash &&
          attempt &&
          (!current.user.identities?.some(
            (identity) => identity.provider === attempt.provider,
          ) ||
            Date.now() - attempt.startedAt > 20 * 60 * 1000)
        )
          throw new Error(
            'This sign-in could not be matched to your provider. Please start again.',
          )
        const verified = await result(supabase.auth.getUser())
        if (verified.user.id !== current.user.id)
          throw new Error('Your account changed. Please sign in again.')
        sessionStorage.removeItem('colearn:oauth-attempt')
        if (sessionStorage.getItem('colearn:accept-policies') === 'true') {
          await action('accept_policies')
          sessionStorage.removeItem('colearn:accept-policies')
        }
        if (!(await useAuthStore.getState().hydrate()))
          throw new Error(
            'Unable to load your account. Please try signing in again.',
          )
        const next =
          type === 'recovery' || params.get('next') === '/reset-password'
            ? '/reset-password'
            : useAuthStore.getState().user?.onboardingCompleted
              ? '/dashboard'
              : '/onboarding'
        if (active) navigate(next, { replace: true })
      } catch (e) {
        if (active) setError(e.message)
      }
    }
    void finish()
    return () => {
      active = false
    }
  }, [navigate])
  return (
    <div>
      <h1 className="text-2xl font-bold">
        {error ? 'Unable to continue' : 'Completing sign-in…'}
      </h1>
      {error && (
        <>
          <p role="alert" className="mt-3 text-sm text-c-danger">
            {error}
          </p>
          <Link className="mt-5 inline-block text-c-blue" to="/login">
            Return to sign in
          </Link>
          <Link className="mt-3 block text-c-blue" to="/forgot-password">
            Request a new password reset link
          </Link>
        </>
      )}
    </div>
  )
}
