import { useEffect, useRef, useState } from 'react'
import { bookLearning } from '../services/bookLearning'

export function useReadingPosition(
  chapterId,
  contentRef,
  pdfPage,
  setPdfPage,
  reportError,
  citationPage,
) {
  const [loadedChapter, setLoadedChapter] = useState(null)
  const ready = useRef(false)
  const pageRef = useRef(pdfPage)
  useEffect(() => {
    pageRef.current = pdfPage
  }, [pdfPage])
  useEffect(() => {
    if (!chapterId) return
    const previousRestoration = window.history.scrollRestoration
    window.history.scrollRestoration = 'manual'
    let active = true,
      timer
    ready.current = false
    let position = 0
    const save = () => {
      if (ready.current)
        bookLearning
          .savePosition(chapterId, position, pageRef.current || null)
          .catch(() =>
            reportError(
              'Your reading position could not be saved. Check your connection.',
            ),
          )
    }
    const scroll = () => {
      if (!ready.current || !contentRef.current) return
      const el = contentRef.current
      position = Math.min(
        100,
        Math.max(
          0,
          ((window.scrollY - (el.offsetTop - 96)) /
            Math.max(1, el.scrollHeight - window.innerHeight + 220)) *
            100,
        ),
      )
      clearTimeout(timer)
      timer = setTimeout(save, 700)
    }
    bookLearning
      .position(chapterId)
      .then((saved) => {
        if (!active) return
        const requestedPage = citationPage?.current
        if (requestedPage) {
          setPdfPage(requestedPage)
          citationPage.current = null
        } else if (saved?.last_page) setPdfPage(saved.last_page)
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            if (!active) return
            position = requestedPage ? 0 : Number(saved?.position_percent || 0)
            const el = contentRef.current
            if (el && position > 0)
              window.scrollTo({
                top:
                  el.offsetTop -
                  96 +
                  (position / 100) *
                    Math.max(1, el.scrollHeight - window.innerHeight + 220),
                behavior: 'instant',
              })
            ready.current = true
            setLoadedChapter(chapterId)
          }),
        )
      })
      .catch(() => {
        if (active) {
          ready.current = true
          setLoadedChapter(chapterId)
          reportError('Your saved position could not be loaded.')
        }
      })
    window.addEventListener('scroll', scroll, { passive: true })
    const visibility = () => {
      if (document.visibilityState === 'hidden') save()
    }
    document.addEventListener('visibilitychange', visibility)
    return () => {
      active = false
      clearTimeout(timer)
      save()
      ready.current = false
      window.removeEventListener('scroll', scroll)
      document.removeEventListener('visibilitychange', visibility)
      window.history.scrollRestoration = previousRestoration
    }
  }, [chapterId, contentRef, setPdfPage, reportError, citationPage])
  useEffect(() => {
    if (ready.current && chapterId && pdfPage)
      bookLearning
        .savePosition(chapterId, 0, pdfPage)
        .catch(() => reportError('Your PDF page could not be saved.'))
  }, [pdfPage, chapterId, reportError])
  return Boolean(chapterId) && loadedChapter === chapterId
}
