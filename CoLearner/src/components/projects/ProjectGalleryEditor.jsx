import { useRef, useState } from 'react'
import { Button } from '../ui'
import { projects } from '../../services/api'
import { upload, supabase } from '../../services/supabase/client'

export default function ProjectGalleryEditor({ project, onChange }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('')
  const input = useRef(null)
  async function add(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setBusy(true)
    setError('')
    let path
    try {
      path = await upload('project-covers', file, project.id)
      const { project: updated } = await projects.updateProject(project.slug, {
        gallery: [...(project.gallery || []), path],
      })
      onChange(updated)
    } catch (e) {
      setError(e.message)
      if (path) await supabase.storage.from('project-covers').remove([path])
    } finally {
      setBusy(false)
    }
  }
  async function remove(path) {
    setBusy(true)
    setError('')
    try {
      const { project: updated } = await projects.updateProject(project.slug, {
        gallery: project.gallery.filter((item) => item !== path),
      })
      onChange(updated)
      await supabase.storage.from('project-covers').remove([path])
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="mt-6 border-t border-c-border pt-6">
      <h3 className="font-semibold">Project gallery</h3>
      <p className="mt-1 text-sm text-c-text-muted">
        Up to six images. Each image follows your project’s visibility.
      </p>
      <div className="my-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {(project.gallery || []).map((path, index) => (
          <div key={path}>
            <img
              src={project.galleryUrls?.[index]}
              alt={`Project image ${index + 1}`}
              className="h-28 w-full rounded-xl object-cover"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => remove(path)}
            >
              Remove image {index + 1}
            </Button>
          </div>
        ))}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        aria-label="Project gallery image"
        className="sr-only"
        onChange={add}
      />
      <Button
        type="button"
        variant="outline"
        loading={busy}
        disabled={(project.gallery || []).length >= 6}
        onClick={() => input.current?.click()}
      >
        Add image
      </Button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-c-danger">
          {error}
        </p>
      )}
    </section>
  )
}
