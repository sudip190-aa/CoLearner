import React, { useEffect, useState } from 'react'
import { RouterProvider } from 'react-router-dom'
import router from './routes'
import { ErrorBoundary, PageLoader, useToast } from './components/ui'
import { useAuthStore } from './store/authStore'

function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOnline) return null

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm font-medium text-amber-800">
      You are offline. Colearn will reconnect automatically when the network is back.
    </div>
  )
}

function SessionExpiredListener() {
  const toast = useToast()

  useEffect(() => {
    const handleSessionExpired = () => {
      useAuthStore.getState().clearAuth()
      toast.error('Session expired')
      const nextPath = `${window.location.pathname}${window.location.search}`
      window.location.assign(`/login?next=${encodeURIComponent(nextPath)}`)
    }

    window.addEventListener('colearn:session-expired', handleSessionExpired)
    return () => {
      window.removeEventListener('colearn:session-expired', handleSessionExpired)
    }
  }, [toast])

  return null
}

function App() {
  const isHydrated = useAuthStore((state) => state.isHydrated)
  const hydrate = useAuthStore((state) => state.hydrate)

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  if (!isHydrated) {
    return <PageLoader message="Loading Colearn..." />
  }

  return (
    <ErrorBoundary>
      <OfflineBanner />
      <SessionExpiredListener />
      <RouterProvider router={router} />
    </ErrorBoundary>
  )
}

export default App
