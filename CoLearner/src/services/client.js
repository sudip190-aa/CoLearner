// Supabase owns session persistence and refresh. These token helpers are compatibility shims.
let tokens = {}
export const getStoredTokens = () => tokens
export const setStoredTokens = (value) => {
  tokens = value
}
export const clearStoredTokens = () => {
  tokens = {}
}
const toSnakeCase = (value) =>
  value.replace(/[A-Z]/g, (char) => `_${char.toLowerCase()}`)
const toCamelCase = (value) =>
  value.replace(/_([a-z0-9])/g, (_, char) => char.toUpperCase())

// Top-level keys only: request bodies are flat, and values (e.g. skill names) must stay untouched.
export const camelToSnakeKeys = (object = {}) =>
  Object.fromEntries(
    Object.entries(object).map(([key, value]) => [toSnakeCase(key), value]),
  )

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

export { default } from './supabase/adapter'
