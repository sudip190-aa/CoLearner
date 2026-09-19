import { X } from 'lucide-react'

export const messagePreview = (message) =>
  message?.body ||
  (message?.image_path
    ? 'Image'
    : message?.audio_path
      ? 'Voice message'
      : 'Message unavailable')
export default function ReplyPreview({ name, message, onCancel, onOpen }) {
  const content = (
    <>
      <span className="block text-[11px] font-semibold text-c-blue">
        {onCancel ? `Replying to ${name}` : name}
      </span>
      <span className="mt-1 block truncate text-xs text-c-text-muted">
        {messagePreview(message)}
      </span>
    </>
  )
  return (
    <div className="mb-2 flex min-w-0 items-center gap-3 rounded-lg border-l-2 border-c-blue bg-c-blue-wash px-3 py-2">
      {onOpen ? (
        <button
          type="button"
          className="min-w-0 flex-1 text-left"
          onClick={onOpen}
          aria-label="View original message"
        >
          {content}
        </button>
      ) : (
        <div className="min-w-0 flex-1">{content}</div>
      )}
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cancel reply"
          className="rounded-lg p-2 text-c-text-muted hover:bg-c-blue-soft"
        >
          <X size={16} />
        </button>
      )}
    </div>
  )
}
