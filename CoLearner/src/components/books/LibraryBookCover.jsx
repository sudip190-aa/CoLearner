import { BookOpen } from 'lucide-react'

const jackets = [
  'bg-[#18365e] text-white',
  'bg-c-blue text-white',
  'bg-c-yellow-soft text-[#18365e]',
]

// Uploaded covers take priority. The fallback keeps the catalog useful without stock artwork.
export default function LibraryBookCover({
  book,
  className = '',
  compact = false,
  thumbnail = false,
}) {
  if (book.cover) {
    return (
      <img
        src={book.cover}
        alt={`${book.title} cover`}
        loading="lazy"
        className={`object-cover ${className}`}
      />
    )
  }
  const tone =
    [...book.title].reduce((sum, letter) => sum + letter.charCodeAt(0), 0) %
    jackets.length
  return (
    <div
      role="img"
      aria-label={`${book.title} cover`}
      className={`relative flex flex-col overflow-hidden rounded-r-md border-l-[5px] border-black/10 ${jackets[tone]} ${thumbnail ? 'items-center justify-center p-1' : 'justify-between p-2.5'} ${className}`}
    >
      {!thumbnail && (
        <span
          className={`${compact ? 'text-[6px]' : 'text-[8px]'} font-semibold uppercase tracking-[0.2em] opacity-70`}
        >
          CoLearn
        </span>
      )}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-8 top-7 h-28 w-28 rounded-full border-[18px] border-current opacity-[0.07]"
      />
      {!thumbnail && (
        <span
          className={`relative line-clamp-4 break-words font-semibold ${compact ? 'text-[9px] leading-3' : 'text-xs leading-4'}`}
        >
          {book.title}
        </span>
      )}
      <BookOpen
        size={compact ? 12 : 18}
        strokeWidth={1.5}
        className="opacity-65"
        aria-hidden="true"
      />
    </div>
  )
}
