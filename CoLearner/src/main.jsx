import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.jsx'
import './styles/globals.css'
import { ToastProvider } from './components/ui'
import { useAuthStore } from './store/authStore'
import router from './routes'

const subscribeToRoute = (listener) => router.subscribe(listener)
const currentPath = () => router.state.location.pathname

function AccountQueries({ children }) {
  const identity = useAuthStore((state) => state.user?.id || 'guest')
  const pathname = React.useSyncExternalStore(subscribeToRoute, currentPath)
  // Callback/reset forms must finish after their own sign-in or sign-out.
  // Leaving an auth page or changing accounts elsewhere resets mounted state.
  const onAuthPage =
    /^\/(login|signup|forgot-password|reset-password|auth\/callback)(\/|$)/.test(
      pathname,
    )
  const queryClient = React.useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            meta: { identity },
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
    [identity],
  )
  return (
    <QueryClientProvider
      key={onAuthPage ? 'authentication' : identity}
      client={queryClient}
    >
      {children}
    </QueryClientProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AccountQueries>
      <ToastProvider>
        <App />
      </ToastProvider>
    </AccountQueries>
  </React.StrictMode>,
)
