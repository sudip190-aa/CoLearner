import axios from 'axios'

const STORAGE_KEYS = {
  access: 'colearn_token',
  refresh: 'colearn_refresh',
  legacy: 'colearn_tokens',
}

export class AppError extends Error {
  constructor(code = 'UNKNOWN_ERROR', message = 'Something went wrong.', fields = {}) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.fields = fields
  }
}

const toCamelCase = (value) => {
  if (typeof value !== 'string') return value
  // Digits count too, so `signups_30d` becomes `signups30d` (a letter-only pattern left it untouched).
  return value.replace(/_([a-z0-9])/g, (_, char) => char.toUpperCase())
}

export const getStoredTokens = () => {
  try {
    const access = window.localStorage.getItem(STORAGE_KEYS.access)
    const refresh = window.localStorage.getItem(STORAGE_KEYS.refresh)
    if (access || refresh) {
      return { access: access || '', refresh: refresh || '' }
    }

    const legacy = window.localStorage.getItem(STORAGE_KEYS.legacy)
    if (!legacy) return { access: '', refresh: '' }
    const parsed = JSON.parse(legacy)
    return {
      access: parsed.access || '',
      refresh: parsed.refresh || '',
    }
  } catch {
    return { access: '', refresh: '' }
  }
}

export const readStoredTokens = () => getStoredTokens()

export const setStoredTokens = (tokens = {}) => {
  // XSS tradeoff: localStorage is convenient for a client-side SPA and lets us
  // rehydrate on refresh, but it is readable to any script execution in the app.
  // v2 should move these to secure httpOnly cookies and keep the browser session
  // state server-backed instead of client-readable.
  const nextTokens = { ...getStoredTokens(), ...tokens }

  if (nextTokens.access) {
    window.localStorage.setItem(STORAGE_KEYS.access, nextTokens.access)
  } else {
    window.localStorage.removeItem(STORAGE_KEYS.access)
  }

  if (nextTokens.refresh) {
    window.localStorage.setItem(STORAGE_KEYS.refresh, nextTokens.refresh)
  } else {
    window.localStorage.removeItem(STORAGE_KEYS.refresh)
  }

  window.localStorage.removeItem(STORAGE_KEYS.legacy)
  return nextTokens
}

export const clearStoredTokens = () => {
  window.localStorage.removeItem(STORAGE_KEYS.access)
  window.localStorage.removeItem(STORAGE_KEYS.refresh)
  window.localStorage.removeItem(STORAGE_KEYS.legacy)
}

const normalizeErrorPayload = (payload, fallbackMessage) => {
  if (!payload) {
    return new AppError('NETWORK_ERROR', fallbackMessage || 'Request failed.')
  }

  if (typeof payload === 'string') {
    return new AppError('REQUEST_ERROR', payload)
  }

  if (payload.error) {
    const { code, message, fields = {} } = payload.error
    return new AppError(code || 'REQUEST_ERROR', message || fallbackMessage || 'Request failed.', fields)
  }

  if (payload.detail) {
    return new AppError('REQUEST_ERROR', payload.detail)
  }

  if (Array.isArray(payload.non_field_errors) && payload.non_field_errors.length) {
    return new AppError('REQUEST_ERROR', payload.non_field_errors[0])
  }

  const errorFields = payload.fields || payload.field_errors || {}
  const entries = Object.entries(errorFields)
  if (entries.length) {
    const [key, value] = entries[0]
    const message = Array.isArray(value) ? value[0] : typeof value === 'string' ? value : fallbackMessage || 'Request failed.'
    return new AppError(key.toUpperCase(), message, errorFields)
  }

  const firstEntry = Object.entries(payload)[0]
  if (firstEntry) {
    const [key, value] = firstEntry
    const message = Array.isArray(value)
      ? value[0]
      : typeof value === 'string'
        ? value
        : fallbackMessage || 'Request failed.'
    return new AppError(key.toUpperCase(), message, payload)
  }

  return new AppError('REQUEST_ERROR', fallbackMessage || 'Request failed.', payload)
}

const localApiHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost'

const api = axios.create({
  baseURL: import.meta.env?.VITE_API_URL || `http://${localApiHost}:8000/api/v1`,
  timeout: 20000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

let refreshPromise = null

api.interceptors.request.use(
  (config) => {
    const { access } = getStoredTokens()
    if (access && config.headers) {
      config.headers.Authorization = `Bearer ${access}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config || {}
    const payload = error?.response?.data
    const fallbackMessage = error?.message || 'Request failed.'
    const url = originalRequest.url || ''
    const isAuthRequest = /\/auth\/(login|register|refresh|logout)\//.test(url)
    const refreshToken = getStoredTokens().refresh

    if (error?.response?.status === 401 && !originalRequest._retry && !isAuthRequest && refreshToken) {
      if (!refreshPromise) {
        refreshPromise = api
          .post('/auth/refresh/', { refresh: refreshToken })
          .then(({ data }) => {
            const nextAccess = data?.access
            if (!nextAccess) throw new AppError('SESSION_EXPIRED', 'Session expired.')
            setStoredTokens({ access: nextAccess, refresh: refreshToken })
            return nextAccess
          })
          .catch((refreshError) => {
            clearStoredTokens()
            const nextPath = `${window.location.pathname}${window.location.search}`
            window.dispatchEvent(
              new CustomEvent('colearn:session-expired', {
                detail: { next: nextPath },
              }),
            )
            window.location.assign(`/login?next=${encodeURIComponent(nextPath)}`)
            return Promise.reject(refreshError)
          })
          .finally(() => {
            refreshPromise = null
          })
      }

      try {
        const nextAccess = await refreshPromise
        const retryConfig = {
          ...originalRequest,
          _retry: true,
          headers: {
            ...originalRequest.headers,
            Authorization: `Bearer ${nextAccess}`,
          },
        }
        return await api.request(retryConfig)
      } catch (refreshError) {
        return Promise.reject(normalizeErrorPayload(refreshError?.response?.data, 'Session expired.'))
      }
    }

    if (error?.response?.status === 401 && !isAuthRequest) {
      clearStoredTokens()
      const nextPath = `${window.location.pathname}${window.location.search}`
      window.dispatchEvent(
        new CustomEvent('colearn:session-expired', {
          detail: { next: nextPath },
        }),
      )
      window.location.assign(`/login?next=${encodeURIComponent(nextPath)}`)
    }

    return Promise.reject(normalizeErrorPayload(payload, fallbackMessage))
  },
)

const toSnakeCase = (value) => value.replace(/[A-Z]/g, (char) => `_${char.toLowerCase()}`)

// Top-level keys only: request bodies are flat, and values (e.g. skill names) must stay untouched.
export const camelToSnakeKeys = (object = {}) =>
  Object.fromEntries(Object.entries(object).map(([key, value]) => [toSnakeCase(key), value]))

export const snakeToCamel = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => snakeToCamel(item))
  }

  if (value && typeof value === 'object') {
    return Object.entries(value).reduce((result, [key, currentValue]) => {
      const nextKey = toCamelCase(key)
      result[nextKey] = snakeToCamel(currentValue)
      return result
    }, {})
  }

  return value
}

export default api
