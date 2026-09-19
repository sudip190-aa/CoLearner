import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns'

/**
 * Formats a date into a standard readable string (e.g. 'Oct 24, 2026')
 */
export function formatDate(dateInput, pattern = 'MMM d, yyyy') {
  if (!dateInput) return ''
  const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput
  if (!isValid(date)) return ''
  return format(date, pattern)
}

/**
 * Formats a date as a relative time string (e.g. '2 hours ago')
 */
export function formatRelative(dateInput) {
  if (!dateInput) return ''
  const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput
  if (!isValid(date)) return ''
  return formatDistanceToNow(date, { addSuffix: true })
}

/**
 * Formats numbers with commas or compact notation (e.g. 12500 -> '12,500' or '12.5k')
 */
export function formatNumber(num, compact = false) {
  if (num === null || num === undefined || isNaN(num)) return '0'
  if (compact) {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(num)
  }
  return new Intl.NumberFormat('en-US').format(num)
}

/**
 * Extracts uppercase initials from a full name (e.g. 'Alex Mercer' -> 'AM')
 */
export function initials(name) {
  if (!name || typeof name !== 'string') return ''
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase()
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/**
 * Truncates a string with an ellipsis if it exceeds maxLength
 */
export function truncate(str, maxLength = 100) {
  if (!str || typeof str !== 'string') return ''
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength).trimEnd() + '...'
}

/**
 * Converts a string to a URL-friendly slug
 */
export function slugify(str) {
  if (!str || typeof str !== 'string') return ''
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
