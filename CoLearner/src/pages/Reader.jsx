import ThemeToggle from '../components/ui/ThemeToggle'
import { Inline } from '../components/ui/RichText'
import { BookAssistant } from '../components/books/BookAssistant'
import { BookPdf } from '../components/books/BookPdf'
import { useReadingPosition } from '../hooks/useReadingPosition'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Menu,
  Trash2,
  X,
} from 'lucide-react'
import {
  Badge,
  Button,
  EmptyState,
  Logo,
  Modal,
  ProgressBar,
  Skeleton,
  Textarea,
  useToast,
} from '../components/ui'
import { books, library } from '../services/api.js'
import { formatRelative } from '../lib/formatters.js'
import { parseChapterContent } from '../lib/readerContent.js'
import { useInFlight } from '../hooks/useInFlight.js'

function ReaderSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 py-16">
      <Skeleton width="55%" height="38px" />
      <Skeleton width="35%" height="18px" />
      {[1, 2, 3, 4, 5].map((item) => (
        <Skeleton key={item} width={item % 2 ? '100%' : '92%'} height="22px" />
      ))}
    </div>
  )
}

function ChapterDrawer({ book, currentIndex, onSelect, open, onClose }) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-c-border bg-c-surface p-5 shadow-md transition-transform lg:sticky lg:top-14 lg:z-0 lg:block lg:h-[calc(100vh-3.5rem)] lg:translate-x-0 lg:shadow-none ${open ? 'translate-x-0' : '-translate-x-full'}`}
    >
      <div className="flex items-center justify-between lg:hidden">
        <h2 className="font-bold text-c-text">Chapters</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-brand p-2 text-c-text-muted hover:bg-c-blue-soft"
          aria-label="Close chapter list"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <h2 className="hidden text-sm font-bold uppercase tracking-wide text-c-text-muted lg:block">
        Chapters
      </h2>
      <nav className="mt-5 space-y-1 overflow-y-auto lg:max-h-[calc(100vh-8rem)]">
        {book.chapters.map((chapter, index) => (
          <button
            type="button"
            key={chapter.id}
            onClick={() => {
              onSelect(index)
              onClose()
            }}
            className={`flex w-full items-center gap-3 rounded-brand p-3 text-left text-sm ${index === currentIndex ? 'bg-c-blue-soft text-c-blue' : 'text-c-text-muted hover:bg-c-blue-wash'}`}
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${chapter.isCompleted ? 'bg-c-success-solid text-white' : index === currentIndex ? 'bg-c-action text-white' : 'bg-c-blue-soft text-c-text-muted'}`}
              aria-label={chapter.isCompleted ? 'Completed' : undefined}
            >
              {chapter.isCompleted ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                chapter.order
              )}
            </span>
            <span className="min-w-0 flex-1 truncate">{chapter.title}</span>
            <span className="text-[11px] text-c-text-muted">
              {chapter.estMinutes}m
            </span>
          </button>
        ))}
      </nav>
    </aside>
  )
}

function NotesPanel({ notes, noteText, setNoteText, onAdd, onDelete, saving }) {
  return (
    <aside className="hidden w-64 shrink-0 xl:block">
      <div className="sticky top-24 rounded-brand-lg border border-c-border bg-c-surface p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-c-blue" />
          <h2 className="font-bold text-c-text">Notes</h2>
        </div>
        <form onSubmit={onAdd} className="mt-4 space-y-2">
          <Textarea
            value={noteText}
            onChange={(event) => setNoteText(event.target.value)}
            rows={3}
            placeholder="Add a note about this chapter..."
          />
          <Button
            type="submit"
            size="sm"
            fullWidth
            loading={saving}
            disabled={!noteText.trim()}
          >
            Add note
          </Button>
        </form>
        <div className="mt-5 space-y-3">
          {notes.length ? (
            notes.map((note) => (
              <div key={note.id} className="border-t border-c-border pt-3">
                <div className="flex items-start gap-2">
                  <p className="flex-1 whitespace-pre-line text-sm leading-5 text-c-text">
                    {note.text}
                  </p>
                  <button
                    type="button"
                    onClick={() => onDelete(note.id)}
                    className="text-c-text-muted hover:text-c-danger"
                    aria-label="Delete note"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="mt-1 text-[11px] text-c-text-muted">
                  {formatRelative(note.createdAt)}
                </p>
              </div>
            ))
          ) : (
            <p className="border-t border-c-border pt-3 text-xs leading-5 text-c-text-muted">
              Your notes will appear here as you read.
            </p>
          )}
        </div>
      </div>
    </aside>
  )
}

function ChapterBody({ content }) {
  const blocks = parseChapterContent(content, { keepLineBreaks: true })
  if (!blocks.length)
    return <p className="text-c-text-muted">This chapter has no content yet.</p>
  return blocks.map((block, index) =>
    block.type === 'quote' ? (
      <blockquote key={index}>
        <Inline text={block.text} />
      </blockquote>
    ) : block.type === 'code' ? (
      <pre
        key={index}
        className="overflow-x-auto rounded-brand bg-c-ink p-5 font-mono text-sm leading-6 text-white"
      >
        <code>{block.text}</code>
      </pre>
    ) : /^#{1,6} /.test(block.text) ? (
      <h2 key={index} className="pt-4 text-xl font-semibold leading-7">
        <Inline text={block.text.replace(/^#{1,6} /, '')} />
      </h2>
    ) : /^[-*] /.test(block.text) ? (
      <ul key={index} className="list-disc space-y-2 pl-6">
        {block.text.split('\n').map((line, i) => (
          <li key={i}>
            <Inline text={line.replace(/^[-*] /, '')} />
          </li>
        ))}
      </ul>
    ) : (
      <p key={index} className="whitespace-pre-line break-words">
        <Inline text={block.text} />
      </p>
    ),
  )
}

const errorMessage = (error, fallback) => error?.message || fallback

export default function Reader() {
  const { slug } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const toast = useToast()
  const inFlight = useInFlight()
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [pdfPage, setPdfPage] = useState(null)
  const [positionError, setPositionError] = useState('')
  const [book, setBook] = useState(null)
  const [error, setError] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [chapterData, setChapterData] = useState(null) // { id, content, notes, bookmarked, ... }
  const [chapterError, setChapterError] = useState('')
  const [scrollPosition, setScrollPosition] = useState(0)
  const [fontSize, setFontSize] = useState(18)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [noteSaving, setNoteSaving] = useState(false)
  const [selection, setSelection] = useState(null)
  const [completing, setCompleting] = useState(false)
  const [finish, setFinish] = useState(null) // { xpAwarded, badgesEarned } when a book is finished
  const citationPage = useRef(null)
  const contentRef = useRef(null)
  const positionReady = useReadingPosition(
    chapterData?.id,
    contentRef,
    pdfPage,
    setPdfPage,
    setPositionError,
    citationPage,
  )
  const chapterParam = new URLSearchParams(location.search).get('chapter')

  // Load the book once per slug; pick the starting chapter from ?chapter=N, else where the reader left off.
  useEffect(() => {
    let active = true
    library
      .getBook(slug)
      .then(({ book: result }) => {
        if (!active) return
        setBook(result)
        const byParam = result.chapters.findIndex(
          (chapter) => String(chapter.order) === chapterParam,
        )
        const byResume = result.chapters.findIndex(
          (chapter) => chapter.id === result.currentChapterId,
        )
        setCurrentIndex(Math.max(0, byParam >= 0 ? byParam : byResume))
      })
      .catch((requestError) => {
        if (active)
          setError(
            requestError?.code === 'not_found'
              ? 'This reading material could not be found.'
              : errorMessage(
                  requestError,
                  'This reading material could not be loaded.',
                ),
          )
      })
    return () => {
      active = false
    }
    // chapterParam is only used to choose the first chapter; later chapter changes are driven by state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  const chapter = book?.chapters[currentIndex]
  const chapterId = chapter?.id
  const bookSlug = book?.slug

  // Fetch the chapter text (and this user's notes/bookmark), and move the "continue reading" pointer to it.
  useEffect(() => {
    if (!chapterId) return undefined
    let active = true
    books
      .getChapter(chapterId)
      .then(({ chapter: result }) => {
        if (!active) return
        setChapterData(result)
        setPdfPage(
          result.book?.fileType === 'pdf' || result.book?.file_type === 'pdf'
            ? result.pageStart || 1
            : null,
        )
        setChapterError('')
      })
      .catch((requestError) => {
        if (active)
          setChapterError(
            errorMessage(requestError, 'This chapter could not be loaded.'),
          )
      })
    books.saveProgress(bookSlug, chapterId, { completed: false }).catch(() => {
      setPositionError(
        'Your reading session could not be saved. Check your connection.',
      )
    })
    return () => {
      active = false
    }
  }, [chapterId, bookSlug])

  // Reading position within the chapter: display only. Book progress is decided by completed chapters.
  useEffect(() => {
    const handleScroll = () => {
      const element = contentRef.current
      if (!element) return
      const total = Math.max(1, element.scrollHeight - window.innerHeight + 220)
      setScrollPosition(
        Math.min(
          100,
          Math.max(
            0,
            Math.round(
              ((window.scrollY - (element.offsetTop - 96)) / total) * 100,
            ),
          ),
        ),
      )
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const goToChapter = useCallback(
    (index) => {
      if (!book || completing) return
      const nextIndex = Math.max(0, Math.min(index, book.chapters.length - 1))
      if (nextIndex === currentIndex) return
      setPdfPage(
        book.fileType === 'pdf'
          ? book.chapters[nextIndex].pageStart || 1
          : null,
      )
      setCurrentIndex(nextIndex)
      setChapterData(null)
      setScrollPosition(0)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      navigate(
        `/books/${book.slug}/read?chapter=${book.chapters[nextIndex].order}`,
        {
          replace: true,
        },
      )
    },
    [book, currentIndex, navigate, completing],
  )

  // A toggle sent twice cancels itself out, so a second press while one is pending is dropped.
  const openCitation = (citation) => {
    const next = book.chapters.findIndex(
      (c) => String(c.id) === String(citation.chapterId),
    )
    if (citation.pageStart && next !== currentIndex)
      citationPage.current = citation.pageStart
    if (next >= 0) goToChapter(next)
    if (citation.pageStart) setPdfPage(citation.pageStart)
    setAssistantOpen(false)
  }

  const toggleBookmark = useCallback(
    () =>
      chapterData &&
      inFlight('bookmark', async () => {
        try {
          const { bookmarked } = await books.toggleBookmark(chapterData.id)
          setChapterData((current) => ({ ...current, bookmarked }))
          toast.success(bookmarked ? 'Chapter bookmarked' : 'Bookmark removed')
        } catch (requestError) {
          toast.error(
            errorMessage(requestError, 'Could not update the bookmark'),
          )
        }
      }),
    [chapterData, toast, inFlight],
  )

  useEffect(() => {
    const handleKey = (event) => {
      // Shortcuts are for reading, not for typing, picking from a menu, or browser combos
      // (Alt+Left = back, Ctrl+B = bold...), and Escape must not leave the page under an open dialog.
      if (
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        event.defaultPrevented
      )
        return
      const target = event.target
      if (
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
        target.isContentEditable
      )
        return
      if (event.repeat) return
      if (document.querySelector('[role="dialog"]')) return
      if (event.key === 'ArrowLeft') goToChapter(currentIndex - 1)
      if (event.key === 'ArrowRight') goToChapter(currentIndex + 1)
      if (event.key.toLowerCase() === 'b') toggleBookmark()
      if (event.key === 'Escape') {
        if (drawerOpen) setDrawerOpen(false)
        else navigate('/library')
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [currentIndex, drawerOpen, goToChapter, navigate, toggleBookmark])

  useEffect(() => {
    const handleSelection = () => {
      const value = window.getSelection()?.toString().trim()
      if (
        !value ||
        value.length < 3 ||
        !contentRef.current?.contains(window.getSelection()?.anchorNode)
      ) {
        setSelection(null)
        return
      }
      const range = window.getSelection().getRangeAt(0).getBoundingClientRect()
      setSelection({
        text: value,
        top: range.top + window.scrollY - 44,
        left: Math.min(window.innerWidth - 150, Math.max(12, range.left)),
      })
    }
    document.addEventListener('selectionchange', handleSelection)
    return () =>
      document.removeEventListener('selectionchange', handleSelection)
  }, [])

  const addNote = async (event, text = noteText) => {
    event?.preventDefault()
    if (!text.trim() || !chapterData || noteSaving) return
    setNoteSaving(true)
    try {
      const { note } = await books.addNote(chapterData.id, text.trim())
      setChapterData((current) => ({
        ...current,
        notes: [note, ...current.notes],
      }))
      setNoteText('')
      setSelection(null)
    } catch (requestError) {
      toast.error(errorMessage(requestError, 'Could not save the note'))
    } finally {
      setNoteSaving(false)
    }
  }
  const deleteNote = (noteId) =>
    inFlight(`note-${noteId}`, async () => {
      try {
        await books.deleteNote(chapterData.id, noteId)
        setChapterData((current) => ({
          ...current,
          notes: current.notes.filter((note) => note.id !== noteId),
        }))
      } catch (requestError) {
        toast.error(errorMessage(requestError, 'Could not delete the note'))
      }
    })

  const complete = async () => {
    if (!book || !chapter || completing || chapter.isCompleted) return
    setCompleting(true)
    try {
      const result = await books.saveProgress(book.slug, chapter.id, {
        completed: true,
      })
      const search = new URLSearchParams(location.search)
      search.set('chapter', chapter.order)
      navigate({ search: `?${search}` }, { replace: true })
      // Reflect the server's answer locally: chapter ticks, book percent, resume pointer.
      setBook((current) => ({
        ...current,
        progress: result.progress.progressPercent,
        progressPercent: result.progress.progressPercent,
        started: true,
        finished: result.progress.completed,
        chapters: current.chapters.map((item) =>
          result.progress.completedChapterIds.includes(item.id)
            ? { ...item, isCompleted: true }
            : item,
        ),
      }))
      if (result.chapterCompleted) {
        toast.success(
          result.xpAwarded ? `+${result.xpAwarded} XP` : 'Chapter complete',
          'Chapter complete',
        )
      }
      result.badgesEarned.forEach((badge) =>
        toast.success('Badge earned', badge.name),
      )
      if (result.bookCompleted) {
        setFinish({
          xpAwarded: result.xpAwarded,
          badgesEarned: result.badgesEarned,
        })
      }
    } catch (requestError) {
      toast.error(errorMessage(requestError, 'Could not save your progress'))
    } finally {
      setCompleting(false)
    }
  }

  const chapterNumber = currentIndex + 1
  if (error)
    return (
      <EmptyState
        title="Reader unavailable"
        description={error}
        actionLabel="Back to library"
        actionTo="/library"
      />
    )
  if (!book || !chapter) return <ReaderSkeleton />
  const isLast = currentIndex === book.chapters.length - 1
  return (
    <div data-reader className="min-h-screen bg-c-surface text-c-text">
      <header className="sticky top-0 z-30 border-b border-c-border bg-c-surface">
        <div className="flex h-14 items-center gap-1.5 px-2 sm:gap-3 sm:px-4">
          <Link
            to="/library"
            aria-label="Back to library"
            className="rounded-brand p-2 text-c-text-muted hover:bg-c-blue-soft hover:text-c-blue"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <Logo variant="mark" size="xs" />
          <div className="min-w-0 flex-1">
            <p
              title={book.title}
              className="truncate text-sm font-semibold text-c-text"
            >
              {book.title}
            </p>
            <p className="truncate text-[11px] text-c-text-muted">
              Chapter {chapterNumber} / {book.chapters.length}
              <span className="hidden sm:inline">
                {' '}
                · {book.progress}% complete
              </span>
            </p>
          </div>
          <div className="flex items-center gap-0.5 sm:gap-1">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setFontSize((value) => Math.max(16, value - 1))}
              className="rounded-brand px-2 py-1 text-sm font-semibold text-c-text-muted hover:bg-c-blue-soft"
              aria-label="Decrease font size"
            >
              A-
            </button>
            <button
              type="button"
              onClick={() => setFontSize((value) => Math.min(22, value + 1))}
              className="rounded-brand px-2 py-1 text-lg font-semibold text-c-text-muted hover:bg-c-blue-soft"
              aria-label="Increase font size"
            >
              A+
            </button>
            <button
              type="button"
              onClick={toggleBookmark}
              disabled={!chapterData}
              className="rounded-brand p-2 text-c-text-muted hover:bg-c-blue-soft hover:text-c-blue disabled:opacity-40"
              aria-label={
                chapterData?.bookmarked ? 'Remove bookmark' : 'Bookmark chapter'
              }
            >
              {chapterData?.bookmarked ? (
                <BookmarkCheck className="h-5 w-5 text-c-blue" />
              ) : (
                <Bookmark className="h-5 w-5" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="rounded-brand p-2 text-c-text-muted hover:bg-c-blue-soft lg:hidden"
              aria-label="Open chapter list"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
        <ProgressBar
          value={scrollPosition}
          size="sm"
          className="!space-y-0 [&>div:last-child]:h-1"
        />
      </header>
      <div className="flex">
        <ChapterDrawer
          book={book}
          currentIndex={currentIndex}
          onSelect={goToChapter}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        />
        {drawerOpen && (
          <button
            type="button"
            className="fixed inset-0 z-30 bg-c-ink/20 lg:hidden"
            aria-label="Close chapter list"
            onClick={() => setDrawerOpen(false)}
          />
        )}
        <main className="min-w-0 flex-1 px-5 pb-36 pt-12 sm:px-8">
          <article
            ref={contentRef}
            aria-busy={!chapterData || !positionReady}
            className="mx-auto max-w-[68ch] break-words"
            style={{ fontSize: `${fontSize}px`, lineHeight: 1.8 }}
          >
            <div className="mb-8">
              <Badge variant="blue">Chapter {chapterNumber}</Badge>
              <h1 className="mt-4 text-3xl font-bold leading-tight text-c-text sm:text-4xl">
                {chapter.title}
              </h1>
              <p className="mt-3 flex items-center gap-2 text-sm text-c-text-muted">
                <Clock className="h-4 w-4" />
                {chapter.estMinutes} minute read
                {chapter.isCompleted && (
                  <span className="ml-2 inline-flex items-center gap-1 font-semibold text-c-success">
                    <Check className="h-4 w-4" /> Completed
                  </span>
                )}
              </p>
            </div>
            {chapterError ? (
              <div
                role="alert"
                className="rounded-brand bg-c-danger-soft p-4 text-sm text-c-danger"
              >
                {chapterError}
              </div>
            ) : !chapterData ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((item) => (
                  <Skeleton
                    key={item}
                    width={item % 2 ? '100%' : '90%'}
                    height="22px"
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-6 text-c-text [&_blockquote]:border-l-4 [&_blockquote]:border-c-blue [&_blockquote]:bg-c-blue-wash [&_blockquote]:px-5 [&_blockquote]:py-3 [&_blockquote]:italic [&_code]:font-mono">
                {book.fileType === 'pdf' && (
                  <BookPdf
                    book={book}
                    page={pdfPage || chapter.pageStart || 1}
                    onPage={setPdfPage}
                  />
                )}
                <ChapterBody content={chapterData.content} />
              </div>
            )}
          </article>
        </main>
        <NotesPanel
          notes={chapterData?.notes || []}
          noteText={noteText}
          setNoteText={setNoteText}
          onAdd={addNote}
          onDelete={deleteNote}
          saving={noteSaving}
        />
      </div>
      <nav
        aria-label="Chapter navigation"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-c-border bg-c-surface/95 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:px-6"
      >
        <div className="mx-auto grid max-w-5xl grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-6">
          <Button
            variant="ghost"
            className="min-h-11 justify-self-start !px-2 sm:!px-4"
            icon={ChevronLeft}
            aria-label="Previous chapter"
            onClick={() => goToChapter(currentIndex - 1)}
            disabled={currentIndex === 0 || completing}
          >
            <span className="hidden sm:inline">Previous</span>
          </Button>
          <div className="flex min-w-0 flex-col items-center gap-1.5">
            <span className="text-[10px] font-medium text-c-text-muted">
              Chapter {chapterNumber} of {book.chapters.length}
            </span>
            {chapter.isCompleted ? (
              <span
                role="status"
                aria-label="Chapter completed"
                className="inline-flex min-h-11 min-w-40 items-center justify-center gap-2 rounded-xl border border-c-success/20 bg-c-success-soft px-4 text-sm font-semibold text-c-success"
              >
                <Check className="h-4 w-4" aria-hidden="true" /> Completed
              </span>
            ) : (
              <Button
                className="min-h-11 min-w-40"
                icon={Check}
                onClick={complete}
                loading={completing}
                disabled={!chapterData || !!chapterError}
              >
                {completing ? 'Saving…' : 'Mark complete'}
              </Button>
            )}
          </div>
          <Button
            variant="ghost"
            className="min-h-11 justify-self-end !px-2 sm:!px-4"
            icon={ChevronRight}
            iconPosition="right"
            aria-label="Next chapter"
            onClick={() => goToChapter(currentIndex + 1)}
            disabled={isLast || completing}
          >
            <span className="hidden sm:inline">Next</span>
          </Button>
        </div>
      </nav>
      {selection && (
        <button
          type="button"
          onClick={() => addNote(null, selection.text)}
          className="fixed z-40 rounded-brand bg-c-ink px-3 py-2 text-xs font-semibold text-white shadow-md"
          style={{
            top: `${selection.top - window.scrollY}px`,
            left: `${selection.left}px`,
          }}
        >
          Save as note
        </button>
      )}
      <div className="fixed bottom-[calc(6.5rem+env(safe-area-inset-bottom))] right-4 z-30 sm:right-6">
        <Button size="sm" onClick={() => setAssistantOpen(true)}>
          Ask this book
        </Button>
      </div>
      {positionError && (
        <p
          role="status"
          className="fixed bottom-40 right-4 z-30 max-w-xs rounded-xl bg-c-surface p-3 text-xs shadow"
        >
          {positionError}
        </p>
      )}
      <Modal
        isOpen={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        title="Ask this book"
        size="lg"
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto"
      >
        <BookAssistant
          book={book}
          chapter={chapter}
          onCitation={openCitation}
        />
      </Modal>
      <Modal
        isOpen={Boolean(finish)}
        onClose={() => setFinish(null)}
        title="Book complete"
        description={`You finished ${book.title}.`}
      >
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-c-yellow-soft text-c-text">
            <Check className="h-7 w-7" />
          </div>
          {finish?.xpAwarded > 0 && (
            <h3 className="mt-4 text-xl font-bold text-c-text">
              +{finish.xpAwarded} XP
            </h3>
          )}
          {finish?.badgesEarned.length > 0 && (
            <p className="mt-2 text-sm text-c-text-muted">
              You earned:{' '}
              {finish.badgesEarned.map((badge) => badge.name).join(', ')}.
            </p>
          )}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button as={Link} to="/library" variant="outline">
              Back to library
            </Button>
            <Button as={Link} to="/projects">
              Find a project using this skill
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
