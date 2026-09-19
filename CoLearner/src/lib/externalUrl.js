export function externalUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return null
  try {
    const url = new URL(value.trim())
    return ['https:', 'http:'].includes(url.protocol) &&
      !url.username &&
      !url.password
      ? value.trim()
      : null
  } catch {
    return null
  }
}
