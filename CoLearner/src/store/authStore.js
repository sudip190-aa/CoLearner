import { create } from 'zustand'
import { supabase, session } from '../services/supabase/client'
import { auth } from '../services/api'
import { useNotificationStore } from './notificationStore'
import {
  clearStoredTokens,
  getStoredTokens,
  setStoredTokens,
} from '../services/client'

let identityEpoch = 0
let hydrationRequest = 0
let signingOut = false
const normalizeUser = (user = null) => {
  if (!user) return null

  return {
    ...user,
    id: String(user.id ?? user.userId ?? 'unknown'),
    name: user.name || user.fullName || user.username || 'Colearn user',
    fullName: user.fullName || user.name || user.username || 'Colearn user',
    username: user.username || '',
    role: user.role || 'learner',
    onboardingCompleted:
      user.onboardingCompleted ?? user.onboarding_completed ?? false,
    onboardingComplete:
      user.onboardingComplete ??
      user.onboarding_completed ??
      user.onboardingCompleted ??
      false,
  }
}

export const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isHydrated: false,

  setSession: (user, access = null, refresh = null) => {
    const normalizedUser = normalizeUser(user)
    const storedTokens = getStoredTokens()
    const nextAccess =
      access ?? storedTokens.access ?? get().accessToken ?? null
    const nextRefresh = refresh ?? storedTokens.refresh ?? null

    if (nextAccess) {
      setStoredTokens({ access: nextAccess, refresh: nextRefresh })
    } else {
      clearStoredTokens()
    }

    set({
      user: normalizedUser,
      accessToken: nextAccess,
      isAuthenticated: Boolean(normalizedUser),
    })

    return normalizedUser
  },

  // Replace the signed-in user with a fresh server copy (after a profile edit, onboarding, ...).
  setUser: (user) => {
    const normalizedUser = normalizeUser(user)
    set({ user: normalizedUser, isAuthenticated: Boolean(normalizedUser) })
    return normalizedUser
  },

  clearAuth: () => {
    identityEpoch += 1
    useNotificationStore.getState().reset()
    clearStoredTokens()
    set({ user: null, accessToken: null, isAuthenticated: false })
  },

  hydrate: async () => {
    if (signingOut) return false
    const epoch = identityEpoch
    const request = ++hydrationRequest
    const isCurrent = () =>
      epoch === identityEpoch && request === hydrationRequest
    let current
    try {
      current = await session()
    } catch {
      if (!isCurrent()) return false
      get().clearAuth()
      set({ isHydrated: true })
      return false
    }
    if (!isCurrent()) return false
    const accessToken = current?.access_token || null
    if (current)
      setStoredTokens({
        access: current.access_token,
        refresh: current.refresh_token,
      })

    if (!accessToken) {
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isHydrated: true,
      })
      return false
    }

    try {
      const response = await auth.getMe()
      const user = normalizeUser(response?.user ?? response)
      if (!isCurrent()) return false
      const latest = await session()
      if (
        !isCurrent() ||
        latest?.user?.id !== current.user.id ||
        user?.id !== current.user.id
      )
        return false
      set({
        user,
        accessToken,
        isAuthenticated: Boolean(user),
        isHydrated: true,
      })
      return Boolean(user)
    } catch {
      if (!isCurrent()) return false
      get().clearAuth()
      set({ isHydrated: true })
      return false
    }
  },

  login: async (email, password) => {
    if (!email || !password) {
      throw new Error('Email and password are required.')
    }

    const result = await auth.login({ email, password })
    const user = normalizeUser(result?.user ?? result)
    const nextAccess = result?.token ?? result?.access ?? null
    const nextRefresh = result?.refresh ?? getStoredTokens().refresh ?? null
    return get().setSession(user, nextAccess, nextRefresh)
  },

  signup: async (data = {}) => {
    if (!data?.email || !data?.password) {
      throw new Error('Email and password are required.')
    }

    const result = await auth.signup({
      ...data,
      name: data.name || data.fullName,
    })
    if (result.confirmationRequired) return { confirmationRequired: true }
    const user = normalizeUser(result?.user ?? result)
    const nextAccess = result?.token ?? result?.access ?? null
    const nextRefresh = result?.refresh ?? getStoredTokens().refresh ?? null
    return get().setSession(user, nextAccess, nextRefresh)
  },

  logout: async () => {
    signingOut = true
    identityEpoch += 1
    try {
      await auth.logout()
    } catch {
      // no-op: backend may already have rejected an expired token
    }
    get().clearAuth()
    signingOut = false
  },

  updateUser: (updates = {}) =>
    set((state) => {
      const user = state.user ? { ...state.user, ...updates } : null
      return {
        user,
        isAuthenticated: Boolean(user),
      }
    }),
}))

export default useAuthStore

// Defer profile fetches outside the Auth callback to avoid holding its session lock.
supabase.auth.onAuthStateChange((event, current) => {
  if (event === 'SIGNED_OUT') useAuthStore.getState().clearAuth()
  if (current) {
    const previous = useAuthStore.getState().user?.id
    if (previous && previous !== current.user.id)
      useAuthStore.getState().clearAuth()
    setStoredTokens({
      access: current.access_token,
      refresh: current.refresh_token,
    })
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')
      setTimeout(() => {
        void useAuthStore.getState().hydrate()
      }, 0)
  }
})
