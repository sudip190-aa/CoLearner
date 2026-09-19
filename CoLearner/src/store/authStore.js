import { create } from 'zustand'
import { auth } from '../services/api'
import { clearStoredTokens, getStoredTokens, setStoredTokens } from '../services/client'

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
    const nextAccess = access ?? storedTokens.access ?? get().accessToken ?? null
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
    clearStoredTokens()
    set({ user: null, accessToken: null, isAuthenticated: false })
  },

  hydrate: async () => {
    const stored = getStoredTokens()
    const accessToken = stored.access || null

    if (!accessToken) {
      set({ user: null, accessToken: null, isAuthenticated: false, isHydrated: true })
      return false
    }

    try {
      const response = await auth.getMe()
      const user = normalizeUser(response?.user ?? response)
      set({
        user,
        accessToken,
        isAuthenticated: Boolean(user),
        isHydrated: true,
      })
      return Boolean(user)
    } catch {
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
    const user = normalizeUser(result?.user ?? result)
    const nextAccess = result?.token ?? result?.access ?? null
    const nextRefresh = result?.refresh ?? getStoredTokens().refresh ?? null
    return get().setSession(user, nextAccess, nextRefresh)
  },

  logout: async () => {
    try {
      await auth.logout()
    } catch {
      // no-op: backend may already have rejected an expired token
    }
    get().clearAuth()
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
