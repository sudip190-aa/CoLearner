import { edge } from './supabase/client'

export async function voiceIce(scope) {
  const configuration = await edge('voice-ice', scope, 12000)
  if (
    !Array.isArray(configuration.iceServers) ||
    !configuration.iceServers.length
  )
    throw new Error('Calling is temporarily unavailable. Please try again.')
  return {
    ...configuration,
    expiresAt: Date.now() + (configuration.expiresIn || 600) * 1000,
  }
}
