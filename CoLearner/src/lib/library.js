export const DEFAULT_PREFERENCES = {
  goal: 'explore',
  topics: [],
  level: 'all',
  session_minutes: 30,
}
export const STUDY_GOALS = [
  { value: 'explore', label: 'Explore something new' },
  { value: 'fundamentals', label: 'Build my foundations' },
  { value: 'projects', label: 'Apply it to a project' },
  { value: 'exams', label: 'Revise for coursework & exams' },
  { value: 'career', label: 'Prepare for internships' },
]
export const LEVELS = [
  { value: 'all', label: 'Any level' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
]

// Use the next unfinished chapter's real reading estimate, not the whole book's
// marketing duration. Completed books use their first chapter for review.
export function nextChapter(book) {
  const chapters = book.chapters || []
  if (book.finished) return chapters[0]
  return (
    chapters.find(
      (c) => String(c.id) === String(book.currentChapterId) && !c.isCompleted,
    ) ||
    chapters.find((c) => !c.isCompleted) ||
    chapters[0]
  )
}
export function sessionMinutes(book) {
  const chapter = nextChapter(book)
  return chapter ? Math.max(1, Number(chapter.estMinutes) || 1) : null
}
export function readingLink(book) {
  const chapter = nextChapter(book)
  return chapter
    ? `/read/${book.slug}?chapter=${chapter.order}`
    : `/library/${book.slug}`
}
export function recommendationScore(book, preferences) {
  const text =
    `${book.title} ${book.description} ${book.category} ${(book.tags || []).join(' ')}`.toLowerCase()
  let score = preferences.topics.includes(book.category) ? 8 : 0
  if (preferences.level !== 'all' && book.difficulty === preferences.level)
    score += 4
  if (
    sessionMinutes(book) !== null &&
    sessionMinutes(book) <= preferences.session_minutes
  )
    score += 1
  if (book.started && !book.finished) score += 2
  if (book.finished) score -= 2
  const terms = {
    explore: [],
    fundamentals: [
      'fundamental',
      'basic',
      'introduction',
      'small steps',
      'mental model',
    ],
    projects: ['build', 'practical', 'shipping', 'design', 'testing'],
    exams: ['algorithm', 'system', 'database', 'concept', 'explain'],
    career: ['algorithm', 'interview', 'product', 'testing', 'confidence'],
  }
  score += (terms[preferences.goal] || []).filter((word) =>
    text.includes(word),
  ).length
  if (preferences.goal === 'fundamentals' && book.difficulty === 'beginner')
    score += 3
  return score
}
export function selectLibraryBooks(
  books,
  {
    query = '',
    category = 'all',
    level = 'all',
    duration = 'all',
    tab = 'all',
    sort = 'newest',
    savedIds = [],
    preferences = DEFAULT_PREFERENCES,
  },
) {
  const saved = new Set(savedIds)
  const search = query.trim().toLowerCase()
  const result = books.filter((book) => {
    const text =
      `${book.title} ${book.author} ${book.description} ${book.category} ${(book.tags || []).join(' ')}`.toLowerCase()
    return (
      (!search || text.includes(search)) &&
      (category === 'all' || book.category === category) &&
      (level === 'all' || book.difficulty === level) &&
      (duration === 'all' ||
        (duration === 'session' &&
          sessionMinutes(book) !== null &&
          sessionMinutes(book) <= preferences.session_minutes) ||
        (duration === 'short' && book.estMinutes <= 180) ||
        (duration === 'long' && book.estMinutes > 180)) &&
      (tab === 'all' ||
        (tab === 'progress' && book.started && !book.finished) ||
        (tab === 'completed' && book.finished) ||
        (tab === 'saved' && saved.has(String(book.id))))
    )
  })
  return result.sort((a, b) => {
    const difference =
      sort === 'for-you'
        ? recommendationScore(b, preferences) -
          recommendationScore(a, preferences)
        : sort === 'shortest'
          ? a.estMinutes - b.estMinutes
          : sort === 'popular'
            ? b.readersCount - a.readersCount
            : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    return difference || a.title.localeCompare(b.title)
  })
}
