import test from 'node:test'
import assert from 'node:assert/strict'
import {
  DEFAULT_PREFERENCES,
  selectLibraryBooks,
  readingLink,
  sessionMinutes,
} from './library.js'

const makeBook = (id, extra = {}) => ({
  id: String(id),
  slug: `book-${id}`,
  title: `Book ${id}`,
  category: 'Web',
  description: '',
  tags: [],
  author: 'Author',
  difficulty: 'beginner',
  estMinutes: 200,
  chapterCount: 2,
  chapters: [
    { id: 10, order: 1, estMinutes: 20, isCompleted: true },
    { id: 11, order: 2, estMinutes: 12, isCompleted: false },
  ],
  started: true,
  finished: false,
  currentChapterId: 10,
  readersCount: 0,
  createdAt: '2026-09-01',
  ...extra,
})

test('continue skips an already completed current chapter; review starts from chapter one', () => {
  assert.equal(readingLink(makeBook(1)), '/read/book-1?chapter=2')
  assert.equal(
    readingLink(makeBook(1, { finished: true })),
    '/read/book-1?chapter=1',
  )
  assert.equal(readingLink(makeBook(1, { chapters: [] })), '/library/book-1')
})
test('short-session filtering measures the next chapter, not the full book', () => {
  const book = makeBook(1)
  assert.equal(sessionMinutes(book), 12)
  assert.equal(
    selectLibraryBooks([book], {
      duration: 'session',
      preferences: { ...DEFAULT_PREFERENCES, session_minutes: 15 },
    }).length,
    1,
  )
  assert.equal(
    selectLibraryBooks([makeBook(2, { chapters: [] })], { duration: 'session' })
      .length,
    0,
  )
})
test('progress, completed and saved collections remain distinct', () => {
  const books = [
    makeBook(1),
    makeBook(2, { finished: true }),
    makeBook(3, { started: false }),
  ]
  assert.deepEqual(
    selectLibraryBooks(books, { tab: 'progress' }).map((b) => b.id),
    ['1'],
  )
  assert.deepEqual(
    selectLibraryBooks(books, { tab: 'completed' }).map((b) => b.id),
    ['2'],
  )
  assert.deepEqual(
    selectLibraryBooks(books, { tab: 'saved', savedIds: ['3'] }).map(
      (b) => b.id,
    ),
    ['3'],
  )
})
test('search includes categories and tags and combines with level filters', () => {
  const books = [
    makeBook(1, { tags: ['internships'] }),
    makeBook(2, { difficulty: 'advanced', tags: ['internships'] }),
  ]
  assert.deepEqual(
    selectLibraryBooks(books, {
      query: ' INTERNSHIPS ',
      level: 'advanced',
    }).map((b) => b.id),
    ['2'],
  )
  assert.equal(selectLibraryBooks(books, { query: 'Web' }).length, 2)
})
test('preferences rank relevant books without hiding the rest or mutating the input', () => {
  const books = [
    makeBook(1),
    makeBook(2, { category: 'Databases', difficulty: 'advanced' }),
  ]
  const result = selectLibraryBooks(books, {
    sort: 'for-you',
    preferences: {
      ...DEFAULT_PREFERENCES,
      topics: ['Databases'],
      level: 'advanced',
    },
  })
  assert.deepEqual(
    result.map((b) => b.id),
    ['2', '1'],
  )
  assert.deepEqual(
    books.map((b) => b.id),
    ['1', '2'],
  )
})
