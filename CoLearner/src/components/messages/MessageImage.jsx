import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Modal } from '../ui'
import { supabase, result } from '../../services/supabase/client'
import { useAuthStore } from '../../store/authStore'

export default function MessageImage({ path }) {
  const userId = useAuthStore((state) => state.user?.id)
  const [open, setOpen] = useState(false)
  const image = useQuery({
    queryKey: ['chat-image', userId, path],
    queryFn: async () =>
      (
        await result(
          supabase.storage.from('chat-images').createSignedUrl(path, 300),
        )
      ).signedUrl,
    staleTime: 240000,
    refetchInterval: 240000,
  })
  return (
    <>
      {image.isPending ? (
        <p className="p-4 text-xs">Loading image…</p>
      ) : image.isError ? (
        <button
          className="p-3 text-xs underline"
          onClick={() => image.refetch()}
        >
          Image unavailable. Retry
        </button>
      ) : (
        <button
          type="button"
          aria-label="View message image"
          onClick={() => setOpen(true)}
          className="block overflow-hidden rounded-xl focus-visible:ring-2 focus-visible:ring-c-blue"
        >
          <img
            src={image.data}
            alt="Shared in this conversation"
            loading="lazy"
            className="max-h-64 w-full max-w-xs object-contain"
          />
        </button>
      )}
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Shared image">
        <img
          src={image.data}
          alt="Shared in this conversation"
          className="max-h-[70dvh] w-full object-contain"
        />
      </Modal>
    </>
  )
}
