import { useState } from 'react'
import { Code2 } from 'lucide-react'
import { Button } from '../ui'
import { supabase } from '../../services/supabase/client'

export default function OAuthButtons({
  disabled = false,
  acceptedPolicies = false,
}) {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')
  const start = async (provider) => {
    setError('')
    setBusy(provider)
    try {
      if (acceptedPolicies)
        sessionStorage.setItem('colearn:accept-policies', 'true')
      else sessionStorage.removeItem('colearn:accept-policies')
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${location.origin}/auth/callback` },
      })
      if (error) throw error
    } catch (error) {
      sessionStorage.removeItem('colearn:accept-policies')
      setError(error.message || 'Unable to connect. Please try again.')
      setBusy('')
    }
  }
  return (
    <div className="mt-5 space-y-3">
      <div className="flex items-center gap-3 text-xs text-c-text-muted">
        <span className="h-px flex-1 bg-c-border" />
        or continue with
        <span className="h-px flex-1 bg-c-border" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={disabled || !!busy}
          loading={busy === 'google'}
          onClick={() => start('google')}
        >
          Google
        </Button>
        <Button
          type="button"
          variant="outline"
          icon={Code2}
          disabled={disabled || !!busy}
          loading={busy === 'github'}
          onClick={() => start('github')}
        >
          GitHub
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-c-danger">
          {error}
        </p>
      )}
    </div>
  )
}
