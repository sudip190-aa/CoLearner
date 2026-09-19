import { useRef, useState } from 'react'
import { useMessageInbox } from '../../hooks/useMessages'
import { Textarea } from '../ui'

export default function MentionTextarea({
  value,
  onChange,
  maxLength = 5000,
  ...props
}) {
  const friends = useMessageInbox()
  const input = useRef(null)
  const [caret, setCaret] = useState(0)
  const [closed, setClosed] = useState(false)
  const [active, setActive] = useState(0)
  const match = value.slice(0, caret).match(/(?:^|\s)@([\w.-]*)$/)
  const choices =
    !closed && match
      ? (friends.data || [])
          .filter((person) =>
            `${person.full_name} ${person.username}`
              .toLowerCase()
              .includes(match[1].toLowerCase()),
          )
          .slice(0, 5)
      : []
  function choose(person) {
    const start = caret - match[1].length - 1,
      next = `${value.slice(0, start)}@${person.username} ${value.slice(caret)}`
    onChange({ target: { value: next } })
    setClosed(true)
    requestAnimationFrame(() => {
      const position = start + person.username.length + 2
      input.current?.focus()
      input.current?.setSelectionRange(position, position)
      setCaret(position)
    })
  }
  return (
    <div className="relative">
      <Textarea
        {...props}
        ref={input}
        value={value}
        maxLength={maxLength}
        onChange={(event) => {
          onChange(event)
          setCaret(event.target.selectionStart)
          setClosed(false)
          setActive(0)
        }}
        onClick={(event) => setCaret(event.target.selectionStart)}
        aria-autocomplete="list"
        aria-expanded={choices.length > 0}
        onKeyDown={(event) => {
          if (!choices.length) return
          if (event.key === 'Escape') {
            event.preventDefault()
            setClosed(true)
          }
          if (event.key === 'ArrowDown') {
            event.preventDefault()
            setActive((index) => (index + 1) % choices.length)
          }
          if (event.key === 'ArrowUp') {
            event.preventDefault()
            setActive((index) => (index + choices.length - 1) % choices.length)
          }
          if (event.key === 'Enter') {
            event.preventDefault()
            choose(choices[active % choices.length])
          }
        }}
      />
      {!!choices.length && (
        <div
          role="listbox"
          aria-label="Mention a connection"
          className="absolute bottom-full z-20 mb-2 w-full max-w-sm overflow-hidden rounded-xl border border-c-border bg-c-surface p-1 shadow-lg"
        >
          {choices.map((person, index) => (
            <button
              type="button"
              role="option"
              aria-selected={active === index}
              key={person.id}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(person)}
              className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm ${active === index ? 'bg-c-blue-wash text-c-blue' : 'hover:bg-c-blue-wash'}`}
            >
              <span className="truncate font-medium">{person.full_name}</span>
              <span className="truncate text-xs text-c-text-muted">
                @{person.username}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
