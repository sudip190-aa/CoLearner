import { BookPublishing } from '../../components/books/BookPublishing'
import React, { useState } from 'react'
import { Edit3, Plus, Search, Trash2 } from 'lucide-react'
import {
  Badge,
  Button,
  Checkbox,
  EmptyState,
  Input,
  Modal,
  Select,
  Skeleton,
  Textarea,
  useToast,
} from '../../components/ui'
import { PageHeader } from '../../components/layout/PageHeader'
import {
  ConfirmModal,
  ListError,
  Pager,
  TableShell,
  THead,
  useAdminList,
  useDebounced,
} from '../../components/admin/AdminParts.jsx'
import { admin } from '../../services/api.js'

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced']
const EMPTY_BOOK = {
  title: '',
  author: '',
  category: '',
  difficulty: 'beginner',
  tags: '',
  description: '',
  isFeatured: false,
}

// Server field errors arrive keyed either way depending on the layer; read both.
const fieldError = (errors, name) => {
  const snake = name.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
  return (errors[name] || errors[snake])?.[0]
}

function ChapterForm({ bookId, chapter, nextNumber, onSaved, onCancel }) {
  const toast = useToast()
  const [form, setForm] = useState({
    title: chapter?.title || '',
    chapterNumber: chapter?.chapterNumber ?? nextNumber,
    content: chapter?.content || '',
    description: chapter?.description || '',
    pageStart: chapter?.pageStart || '',
    pageEnd: chapter?.pageEnd || '',
    status: chapter?.status || 'PUBLISHED',
  })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setErrors({})
    try {
      await admin.adminSaveChapter(bookId, chapter?.id || null, {
        title: form.title,
        chapterNumber: Number(form.chapterNumber),
        content: form.content,
        description: form.description,
        pageStart: form.pageStart ? Number(form.pageStart) : null,
        pageEnd: form.pageEnd ? Number(form.pageEnd) : null,
        status: form.status,
      })
      toast.success(chapter ? 'Chapter saved' : 'Chapter added')
      onSaved()
    } catch (error) {
      setErrors(
        error?.fields || {
          form: [error?.message || 'Could not save the chapter'],
        },
      )
    } finally {
      setBusy(false)
    }
  }
  return (
    <form
      onSubmit={submit}
      noValidate
      data-form="chapter"
      className="space-y-3 rounded-brand border border-c-blue/30 bg-c-blue-wash/40 p-4"
    >
      {fieldError(errors, 'form') && (
        <p role="alert" className="text-sm text-c-danger">
          {fieldError(errors, 'form')}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
        <Input
          name="chapterTitle"
          label="Chapter title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          error={fieldError(errors, 'title')}
          required
        />
        <Input
          name="chapterNumber"
          type="number"
          min={1}
          label="Number"
          value={form.chapterNumber}
          onChange={(e) => setForm({ ...form, chapterNumber: e.target.value })}
          error={fieldError(errors, 'chapterNumber')}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Input
          label="PDF start page"
          type="number"
          min={1}
          value={form.pageStart}
          onChange={(e) => setForm({ ...form, pageStart: e.target.value })}
        />
        <Input
          label="PDF end page"
          type="number"
          min={1}
          value={form.pageEnd}
          onChange={(e) => setForm({ ...form, pageEnd: e.target.value })}
        />
        <Select
          label="Chapter status"
          options={['PUBLISHED', 'DRAFT']}
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
        />
      </div>
      <Input
        label="Short description"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
      />
      <Textarea
        name="chapterContent"
        label="Content"
        hint="Separate paragraphs with a blank line. Start a line with > for a quote, or fence code with ```."
        rows={10}
        value={form.content}
        onChange={(e) => setForm({ ...form, content: e.target.value })}
        error={fieldError(errors, 'content')}
      />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm" loading={busy}>
          {chapter ? 'Save chapter' : 'Add chapter'}
        </Button>
      </div>
    </form>
  )
}

function BookEditor({ initial, onClose, onChanged }) {
  const toast = useToast()
  const [book, setBook] = useState(initial)
  const [form, setForm] = useState(
    initial
      ? {
          title: initial.title,
          author: initial.author,
          category: initial.category,
          difficulty: initial.difficulty,
          tags: initial.tags.join(', '),
          description: initial.description,
          isFeatured: initial.isFeatured,
        }
      : EMPTY_BOOK,
  )
  const [cover, setCover] = useState(null)
  const [coverKey, setCoverKey] = useState(0) // remounts the file input so a saved file's name is not left showing
  const [removeCover, setRemoveCover] = useState(false)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [chapterForm, setChapterForm] = useState(null) // null | 'new' | chapter
  const [confirm, setConfirm] = useState(null)

  const set = (name) => (event) =>
    setForm((current) => ({ ...current, [name]: event.target.value }))
  const refresh = async (id = book.id) => {
    const { book: fresh } = await admin.adminGetBook(id)
    setBook(fresh)
    onChanged()
  }

  const save = async (event) => {
    event.preventDefault()
    setBusy(true)
    setErrors({})
    try {
      const { book: saved } = await admin.adminSaveBook(book?.id || null, {
        ...form,
        tags: form.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
        cover,
        removeCover,
      })
      setBook(saved)
      setCover(null)
      setCoverKey((count) => count + 1)
      setRemoveCover(false)
      onChanged()
      toast.success(
        book ? 'Book saved' : 'Book created',
        book ? undefined : 'Now add its chapters below',
      )
    } catch (error) {
      setErrors(
        error?.fields || {
          form: [error?.message || 'Could not save the book'],
        },
      )
    } finally {
      setBusy(false)
    }
  }

  const nextNumber =
    (book?.chapters || []).reduce(
      (max, chapter) => Math.max(max, chapter.chapterNumber),
      0,
    ) + 1

  return (
    <Modal
      isOpen
      onClose={confirm ? undefined : onClose}
      title={book ? `Edit “${book.title}”` : 'Add book'}
      size="xl"
      className="max-h-[calc(100dvh-3rem)] overflow-y-auto"
    >
      <div className="space-y-8">
        <form onSubmit={save} noValidate data-form="book" className="space-y-4">
          {fieldError(errors, 'form') && (
            <p
              role="alert"
              className="rounded-brand bg-red-50 p-3 text-sm text-c-danger"
            >
              {fieldError(errors, 'form')}
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              name="title"
              label="Title"
              value={form.title}
              onChange={set('title')}
              error={fieldError(errors, 'title')}
              required
            />
            <Input
              name="author"
              label="Author"
              value={form.author}
              onChange={set('author')}
              error={fieldError(errors, 'author')}
              required
            />
            <Input
              name="category"
              label="Category"
              value={form.category}
              onChange={set('category')}
              error={fieldError(errors, 'category')}
            />
            <Select
              name="difficulty"
              label="Difficulty"
              value={form.difficulty}
              onChange={set('difficulty')}
              options={DIFFICULTIES}
              error={fieldError(errors, 'difficulty')}
            />
          </div>
          <Input
            name="tags"
            label="Tags"
            hint="Comma separated, up to 15."
            value={form.tags}
            onChange={set('tags')}
            error={fieldError(errors, 'tags')}
          />
          <Textarea
            name="description"
            label="Description"
            rows={3}
            value={form.description}
            onChange={set('description')}
            error={fieldError(errors, 'description')}
          />
          <div className="flex flex-wrap items-center gap-6">
            <Checkbox
              label="Featured"
              checked={form.isFeatured}
              onChange={(event) =>
                setForm({ ...form, isFeatured: event.target.checked })
              }
            />
            <div>
              <label
                htmlFor="book-cover"
                className="text-sm font-medium text-c-text"
              >
                Cover image
              </label>
              <input
                key={coverKey}
                id="book-cover"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => {
                  setCover(event.target.files?.[0] || null)
                  setRemoveCover(false)
                }}
                className="mt-1 block text-sm"
              />
              {fieldError(errors, 'cover') && (
                <p role="alert" className="mt-1 text-xs text-c-danger">
                  {fieldError(errors, 'cover')}
                </p>
              )}
              {book?.cover && !cover && (
                <label className="mt-2 flex items-center gap-2 text-xs text-c-text-muted">
                  <input
                    type="checkbox"
                    checked={removeCover}
                    onChange={(event) => setRemoveCover(event.target.checked)}
                  />
                  Remove the current cover
                </label>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Close
            </Button>
            <Button type="submit" loading={busy}>
              {book ? 'Save book' : 'Create book'}
            </Button>
          </div>
        </form>

        {book && <BookPublishing book={book} onChanged={() => refresh()} />}
        {book && (
          <section data-section="chapters">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h4 className="text-base font-bold text-c-text">Chapters</h4>
                <p className="text-xs text-c-text-muted">
                  {book.chapters.length}{' '}
                  {book.chapters.length === 1 ? 'chapter' : 'chapters'} · about{' '}
                  {book.estMinutes} min to read
                </p>
              </div>
              {chapterForm !== 'new' && (
                <Button
                  size="sm"
                  icon={Plus}
                  onClick={() => setChapterForm('new')}
                >
                  Add chapter
                </Button>
              )}
            </div>
            {chapterForm === 'new' && (
              <ChapterForm
                bookId={book.id}
                nextNumber={nextNumber}
                onCancel={() => setChapterForm(null)}
                onSaved={async () => {
                  setChapterForm(null)
                  await refresh()
                }}
              />
            )}
            <ul className="mt-3 divide-y divide-c-border rounded-brand border border-c-border">
              {book.chapters.length === 0 && chapterForm !== 'new' && (
                <li className="p-4 text-sm text-c-text-muted">
                  No chapters yet. Readers see an empty book until you add some.
                </li>
              )}
              {book.chapters.map((chapter) => (
                <li
                  key={chapter.id}
                  data-chapter={chapter.chapterNumber}
                  className="p-3"
                >
                  {chapterForm?.id === chapter.id ? (
                    <ChapterForm
                      bookId={book.id}
                      chapter={chapter}
                      onCancel={() => setChapterForm(null)}
                      onSaved={async () => {
                        setChapterForm(null)
                        await refresh()
                      }}
                    />
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="w-8 text-center text-sm font-bold text-c-text-muted">
                        {chapter.chapterNumber}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-c-text">
                          {chapter.title}
                        </p>
                        <p className="text-xs text-c-text-muted">
                          {chapter.estMinutes} min
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={Edit3}
                        onClick={() => setChapterForm(chapter)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={Trash2}
                        aria-label={`Delete chapter ${chapter.title}`}
                        onClick={() =>
                          setConfirm({
                            title: `Delete chapter ${chapter.chapterNumber}?`,
                            description: `“${chapter.title}” is removed from the book. Readers' saved progress for it is ignored.`,
                            confirmLabel: 'Delete chapter',
                            danger: true,
                            onConfirm: async () => {
                              await admin.adminDeleteChapter(chapter.id)
                              await refresh()
                              toast.success('Chapter deleted')
                            },
                          })
                        }
                      />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
      <ConfirmModal request={confirm} onClose={() => setConfirm(null)} />
    </Modal>
  )
}

export default function AdminBooks() {
  const toast = useToast()
  const [query, setQuery] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [publicationStatus, setPublicationStatus] = useState('')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState(null) // null | 'new' | book
  const [confirm, setConfirm] = useState(null)
  const q = useDebounced(query)
  const list = useAdminList(admin.adminListBooks, {
    q,
    difficulty,
    status: publicationStatus,
    page,
  })
  const { data } = list

  const openEditor = async (book) => {
    try {
      const { book: full } = await admin.adminGetBook(book.id)
      setEditing(full)
    } catch (error) {
      toast.error(error?.message || 'Could not open the book')
    }
  }

  return (
    <div>
      <PageHeader
        title="Books"
        subtitle="Curate the library that powers the Learn pillar."
        actions={
          <Button icon={Plus} onClick={() => setEditing('new')}>
            Add book
          </Button>
        }
      />
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <Input
          leftIcon={Search}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setPage(1)
          }}
          placeholder="Search title, author or category..."
          aria-label="Search books"
          containerClassName="max-w-md flex-1"
        />
        <Select
          value={difficulty}
          onChange={(event) => {
            setDifficulty(event.target.value)
            setPage(1)
          }}
          aria-label="Filter by difficulty"
          options={[{ value: '', label: 'Any difficulty' }, ...DIFFICULTIES]}
          className="sm:w-48"
        />
      </div>
      <Select
        aria-label="Publication status"
        className="mb-5 max-w-xs"
        value={publicationStatus}
        onChange={(e) => {
          setPublicationStatus(e.target.value)
          setPage(1)
        }}
        options={[
          { value: '', label: 'All publication states' },
          'DRAFT',
          'PENDING_REVIEW',
          'APPROVED',
          'REJECTED',
          'ARCHIVED',
        ]}
      />
      {list.status === 'error' && <ListError onRetry={list.reload} />}
      {list.status === 'loading' ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((n) => (
            <Skeleton key={n} height="56px" />
          ))}
        </div>
      ) : data?.items.length ? (
        <>
          <TableShell minWidth={720}>
            <THead
              columns={[
                ['Book'],
                ['Category'],
                ['Difficulty'],
                ['Chapters'],
                ['Readers'],
                ['Actions', 'right'],
              ]}
            />
            <tbody>
              {data.items.map((book) => (
                <tr
                  key={book.id}
                  data-book={book.slug}
                  className="border-t border-c-border"
                >
                  <td className="px-4 py-4">
                    <p className="font-semibold text-c-text">
                      {book.title}
                      {book.isFeatured && (
                        <Badge variant="warning" size="sm" className="ml-2">
                          Featured
                        </Badge>
                      )}
                    </p>
                    <p className="mt-1 text-xs text-c-text-muted">
                      {book.author} ? {book.status}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-c-text-muted">
                    {book.category || '—'}
                  </td>
                  <td className="px-4 py-4">
                    <Badge variant="blue">{book.difficulty}</Badge>
                  </td>
                  <td className="px-4 py-4 text-c-text-muted">
                    {book.chapterCount}
                  </td>
                  <td className="px-4 py-4 text-c-text-muted">
                    {book.readersCount}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={Edit3}
                        onClick={() => openEditor(book)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={Trash2}
                        aria-label={`Delete ${book.title}`}
                        onClick={() =>
                          setConfirm({
                            title: `Delete “${book.title}”?`,
                            description: `The book, its ${book.chapterCount} chapters and every reader's progress, notes and bookmarks are deleted. This cannot be undone.`,
                            confirmLabel: 'Delete book',
                            danger: true,
                            onConfirm: async () => {
                              await admin.adminDeleteBook(book.id)
                              toast.success('Book deleted')
                              list.reload()
                            },
                          })
                        }
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableShell>
          <Pager data={data} onPage={setPage} />
        </>
      ) : (
        <EmptyState
          title="No books found"
          description="Try a different search, or add the first book."
        />
      )}
      {editing && (
        <BookEditor
          initial={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onChanged={list.reload}
        />
      )}
      <ConfirmModal request={confirm} onClose={() => setConfirm(null)} />
    </div>
  )
}
