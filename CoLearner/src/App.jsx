import React, { useEffect, useState, useSyncExternalStore } from 'react'
import { RouterProvider } from 'react-router-dom'
import router from './routes'
import { ErrorBoundary, PageLoader, useToast } from './components/ui'
import { useAuthStore } from './store/authStore'
import { VoiceCallProvider } from './components/calls/VoiceCallProvider'
import NotificationHub from './components/notifications/NotificationHub'

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
    <div className="border-b border-c-warning/30 bg-c-warning-soft px-4 py-2 text-center text-sm font-medium text-c-warning">
      You are offline. Colearn will reconnect automatically when the network is
      back.
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
      window.removeEventListener(
        'colearn:session-expired',
        handleSessionExpired,
      )
    }
  }, [toast])

  return null
}

function App() {
  const pathname = useSyncExternalStore(
    router.subscribe,
    () => router.state.location.pathname,
  )
  const isHydrated = useAuthStore((state) => state.isHydrated)
  const hydrate = useAuthStore((state) => state.hydrate)

  useEffect(() => {
    if (!useAuthStore.getState().isHydrated) void hydrate()
  }, [hydrate])

  if (!isHydrated) {
    return <PageLoader message="Loading Colearn..." />
  }

  return (
    <ErrorBoundary>
      <OfflineBanner />
      <SessionExpiredListener />
      <VoiceCallProvider>
        <NotificationHub
          navigate={(to) => router.navigate(to)}
          conversationOpen={
            pathname === '/messages' || pathname.endsWith('/chat')
          }
        />
        <RouterProvider router={router} />
      </VoiceCallProvider>
    </ErrorBoundary>
  )
}

export default App
