import { useSyncExternalStore } from 'react'
import { Moon, Sun } from 'lucide-react'

const key = 'colearn:theme'
const snapshot = () =>
  document.documentElement.classList.contains('dark') ? 'dark' : 'light'
function apply(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', theme === 'dark' ? '#0d1523' : '#256bd4')
}
function subscribe(listener) {
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  const system = () => {
    try {
      if (localStorage.getItem(key)) return
    } catch {
      /* No browser storage. */
    }
    apply(media.matches ? 'dark' : 'light')
    listener()
  }
  const storage = (event) => {
    if (event.key !== key && event.key !== null) return
    apply(
      event.newValue === 'dark' || (event.newValue !== 'light' && media.matches)
        ? 'dark'
        : 'light',
    )
    listener()
  }
  window.addEventListener('colearn:theme', listener)
  window.addEventListener('storage', storage)
  media.addEventListener('change', system)
  return () => {
    window.removeEventListener('colearn:theme', listener)
    window.removeEventListener('storage', storage)
    media.removeEventListener('change', system)
  }
}
export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, snapshot, () => 'light')
  const label = `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-c-text-muted transition-colors hover:bg-c-blue-soft hover:text-c-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-c-blue"
      onClick={() => {
        const next = theme === 'dark' ? 'light' : 'dark'
        apply(next)
        try {
          localStorage.setItem(key, next)
        } catch {
          /* Theme still works for this visit. */
        }
        window.dispatchEvent(new Event('colearn:theme'))
      }}
    >
      {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
    </button>
  )
}
