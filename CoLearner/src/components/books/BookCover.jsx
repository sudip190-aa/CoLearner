import React from 'react'

const palette = [
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-violet-500 to-purple-600',
  'from-sky-500 to-cyan-600',
]

// Books without an uploaded cover get a generated one (stable colour per title) instead of a broken image.
// `compact` is for thumbnails (a few tens of pixels wide): tighter padding and type so long titles are not clipped.
export function BookCover({ book, className = '', compact = false }) {
  if (book.cover) {
    return (
      <img
        src={book.cover}
        alt={`${book.title} cover`}
        className={`object-cover ${className}`}
      />
    )
  }
  const seed = [...book.title].reduce(
    (sum, char) => sum + char.charCodeAt(0),
    0,
  )
  return (
    <div
      role="img"
      aria-label={`${book.title} cover`}
      className={`flex flex-col justify-between overflow-hidden bg-gradient-to-br text-white ${compact ? 'p-2' : 'p-5'} ${palette[seed % palette.length]} ${className}`}
    >
      <span className={`font-semibold uppercase tracking-widest opacity-80 ${compact ? 'line-clamp-2 text-[8px]' : 'text-[11px]'}`}>
        {book.category}
      </span>
      <span className={`break-words font-bold ${compact ? 'line-clamp-5 text-[11px] leading-[14px]' : 'line-clamp-4 text-lg leading-6'}`}>
        {book.title}
      </span>
    </div>
  )
}

export default BookCover
