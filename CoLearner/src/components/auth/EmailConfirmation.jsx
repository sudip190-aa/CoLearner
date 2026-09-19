import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail } from 'lucide-react'
import { Button } from '../ui'
import { supabase, result } from '../../services/supabase/client'
import { emailErrorMessage } from './emailFeedback'

export default function EmailConfirmation({ email }) {
  const [remaining, setRemaining] = useState(60)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  useEffect(() => {
    const timer = setInterval(
      () => setRemaining((value) => Math.max(0, value - 1)),
      1000,
    )
    return () => clearInterval(timer)
  }, [])
  const resend = async () => {
    setBusy(true)
    setError('')
    try {
      await result(
        supabase.auth.resend({
          type: 'signup',
          email,
          options: { emailRedirectTo: `${location.origin}/auth/callback` },
        }),
      )
      setSent(true)
      setRemaining(60)
    } catch (error) {
      setError(emailErrorMessage(error))
    } finally {
      setBusy(false)
    }
  }
  return (
    <div>
      <Mail className="h-10 w-10 text-c-blue" />
      <h1 className="mt-4 text-2xl font-bold">Check your email</h1>
      <p className="mt-3 text-sm leading-6 text-c-text-muted">
        Open the confirmation link sent to <strong>{email}</strong> in this
        browser to finish creating your account. Check your spam folder too.
      </p>
      {sent && (
        <p role="status" className="mt-4 text-sm text-c-success">
          A new confirmation link has been requested.
        </p>
      )}
      {error && (
        <p role="alert" className="mt-4 text-sm text-c-danger">
          {error}
        </p>
      )}
      <Button
        className="mt-5"
        fullWidth
        variant="outline"
        disabled={remaining > 0}
        loading={busy}
        onClick={resend}
      >
        {remaining > 0
          ? `Resend in ${remaining}s`
          : 'Resend confirmation email'}
      </Button>
      <Link
        to="/login"
        className="mt-5 inline-block text-sm font-semibold text-c-blue"
      >
        Back to sign in
      </Link>
    </div>
  )
}
