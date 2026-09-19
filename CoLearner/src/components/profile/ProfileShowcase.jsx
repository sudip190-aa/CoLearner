import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Code2,
  ExternalLink,
  ImagePlus,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
import { Button, Input, Modal, Skeleton, Textarea, useToast } from '../ui'
import { showcases } from '../../services/showcases'

function ShowcaseEditor({ item, onClose, onSaved }) {
  const [draft, setDraft] = useState(() => ({
    id: item?.id || crypto.randomUUID(),
    title: item?.title || '',
    description: item?.description || '',
    live_url: item?.live_url || '',
    repository_url: item?.repository_url || '',
    removeImage: false,
  }))
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])
  const field = (name) => ({
    value: draft[name],
    onChange: (event) =>
      setDraft((current) => ({ ...current, [name]: event.target.value })),
  })
  const image = file ? preview : !draft.removeImage && item?.imageUrl
  async function save(event) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
      for (const link of [draft.live_url, draft.repository_url].filter(
        Boolean,
      )) {
        const url = new URL(link.trim())
        if (
          !['https:', 'http:'].includes(url.protocol) ||
          url.username ||
          url.password
        )
          throw new Error(
            'Use a complete http or https link without embedded credentials.',
          )
      }
      await showcases.save(draft, file, item)
      await onSaved()
    } catch (e) {
      setError(e.message || 'Could not save your showcase. Please try again.')
      setBusy(false)
    }
  }
  return (
    <Modal
      isOpen
      onClose={() => {
        if (!busy) onClose()
      }}
      title={item ? 'Edit showcase project' : 'Add showcase project'}
      description="Personal work for your public profile. This does not create a team project."
    >
      <form onSubmit={save} className="space-y-5">
        <Input
          label="Project title"
          {...field('title')}
          maxLength={120}
          required
        />
        <Textarea
          label="Description"
          {...field('description')}
          maxLength={3000}
          rows={3}
        />
        <div>
          {image && (
            <img
              src={image}
              alt="Showcase preview"
              className="mb-3 aspect-video w-full rounded-xl border border-c-border object-cover"
            />
          )}
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-c-border bg-c-blue-wash px-4 py-4 text-sm font-medium text-c-blue">
            <ImagePlus size={18} />
            {image ? 'Change image' : 'Add project image'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              aria-label="Showcase image"
              className="sr-only"
              disabled={busy}
              onChange={(event) => {
                const selected = event.target.files?.[0]
                if (
                  selected &&
                  (!['image/jpeg', 'image/png', 'image/webp'].includes(
                    selected.type,
                  ) ||
                    selected.size > 5 * 1024 * 1024)
                ) {
                  setError('Choose one JPEG, PNG or WebP image under 5 MB.')
                  event.target.value = ''
                  return
                }
                if (selected) {
                  setFile(selected)
                  setPreview(URL.createObjectURL(selected))
                  setError('')
                }
              }}
            />
          </label>
          {image && (
            <button
              type="button"
              className="mt-2 text-xs text-c-text-muted hover:text-c-danger"
              onClick={() => {
                setFile(null)
                setPreview('')
                setDraft((current) => ({ ...current, removeImage: true }))
              }}
            >
              Remove image
            </button>
          )}
          <p className="mt-2 text-xs text-c-text-muted">
            JPEG, PNG or WebP, up to 5 MB.
          </p>
        </div>
        <Input
          label="Live / demo link"
          type="url"
          placeholder="https://your-project.com"
          {...field('live_url')}
          maxLength={2048}
        />
        <Input
          label="Repository link"
          type="url"
          placeholder="https://github.com/you/project"
          {...field('repository_url')}
          maxLength={2048}
        />
        {error && (
          <p role="alert" className="text-sm text-c-danger">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-3">
          <Button variant="ghost" disabled={busy} onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={busy} disabled={!draft.title.trim()}>
            Save showcase
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default function ProfileShowcase({ userId, editable }) {
  const cache = useQueryClient(),
    toast = useToast()
  const [editor, setEditor] = useState(null),
    [removing, setRemoving] = useState(null),
    [busy, setBusy] = useState(false)
  const query = useQuery({
    queryKey: ['profile-showcases', userId],
    queryFn: () => showcases.list(userId),
    staleTime: 30000,
    refetchInterval: 900000,
  })
  const refresh = () =>
    cache.invalidateQueries({ queryKey: ['profile-showcases', userId] })
  async function remove() {
    setBusy(true)
    try {
      await showcases.remove(removing)
      await refresh()
      setRemoving(null)
      toast.success('Showcase project removed')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <section
      aria-label="Profile showcase"
      className="public-section border-t border-c-border py-12"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-c-blue">
            Selected work
          </p>
          <h2 className="mt-2 !text-2xl !font-semibold">Profile showcase</h2>
        </div>
        {editable && (
          <Button size="sm" icon={Plus} onClick={() => setEditor({})}>
            Add showcase
          </Button>
        )}
      </div>
      {query.isPending ? (
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Skeleton height="250px" />
          <Skeleton height="250px" />
        </div>
      ) : query.isError ? (
        <div role="alert" className="mt-6 text-sm text-c-danger">
          Could not load the showcase.{' '}
          <button className="underline" onClick={() => query.refetch()}>
            Try again
          </button>
        </div>
      ) : query.data.length ? (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {query.data.map((item) => (
            <article
              key={item.id}
              data-showcase-id={item.id}
              className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-c-border bg-c-surface"
            >
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  loading="lazy"
                  className="aspect-[16/10] w-full bg-c-blue-wash object-cover"
                />
              ) : (
                <div className="flex aspect-[16/10] items-center justify-center bg-c-blue-wash text-c-blue">
                  <Code2 size={38} strokeWidth={1.4} />
                </div>
              )}
              <div className="flex flex-1 flex-col p-5">
                <h3 className="break-words !text-lg !font-semibold">
                  {item.title}
                </h3>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-c-text-muted">
                  {item.description}
                </p>
                <div className="mt-auto flex flex-wrap items-center gap-4 pt-5">
                  {item.live_url && (
                    <a
                      href={item.live_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-c-blue"
                    >
                      View demo <ExternalLink size={14} />
                    </a>
                  )}
                  {item.repository_url && (
                    <a
                      href={item.repository_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-c-text-muted"
                    >
                      Code <Code2 size={15} />
                    </a>
                  )}
                  {editable && (
                    <div className="ml-auto flex gap-1">
                      <button
                        type="button"
                        aria-label={`Edit ${item.title}`}
                        onClick={() => setEditor(item)}
                        className="rounded-lg p-2 text-c-text-muted hover:bg-c-blue-wash hover:text-c-blue"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        aria-label={`Remove ${item.title}`}
                        onClick={() => setRemoving(item)}
                        className="rounded-lg p-2 text-c-text-muted hover:bg-c-danger-soft hover:text-c-danger"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-c-border bg-c-blue-wash p-6 text-sm leading-6 text-c-text-muted">
          {editable
            ? 'Share something you have built. Add an image, a short description, and a link to try it.'
            : 'No showcase projects yet.'}
        </div>
      )}
      {editor && (
        <ShowcaseEditor
          item={editor.id ? editor : null}
          onClose={() => setEditor(null)}
          onSaved={async () => {
            await refresh()
            setEditor(null)
            toast.success('Showcase saved')
          }}
        />
      )}
      <Modal
        isOpen={!!removing}
        onClose={() => {
          if (!busy) setRemoving(null)
        }}
        title="Remove showcase project?"
        description={`Remove ${removing?.title || 'this project'} from your profile? Your collaborative projects stay unchanged.`}
      >
        <div className="flex justify-end gap-3">
          <Button
            variant="ghost"
            disabled={busy}
            onClick={() => setRemoving(null)}
          >
            Cancel
          </Button>
          <Button variant="danger" loading={busy} onClick={remove}>
            Remove showcase
          </Button>
        </div>
      </Modal>
    </section>
  )
}
