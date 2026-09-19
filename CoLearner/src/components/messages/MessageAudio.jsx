import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../../store/authStore'
import { result, supabase } from '../../services/supabase/client'
import VoiceMessagePlayer from './VoiceMessagePlayer'

export default function MessageAudio({ path, durationMs }) {
  const userId = useAuthStore((state) => state.user?.id)
  const audio = useQuery({
    queryKey: ['chat-audio', userId, path],
    queryFn: async () =>
      (
        await result(
          supabase.storage.from('chat-audio').createSignedUrl(path, 300),
        )
      ).signedUrl,
    staleTime: 240000,
  })
  if (audio.isPending)
    return <p className="p-3 text-xs">Loading voice message…</p>
  if (audio.isError)
    return (
      <button
        type="button"
        className="p-3 text-xs underline"
        onClick={() => audio.refetch()}
      >
        Voice message unavailable. Retry
      </button>
    )
  return (
    <VoiceMessagePlayer
      src={audio.data}
      durationMs={durationMs}
      onRetry={() => audio.refetch()}
    />
  )
}
