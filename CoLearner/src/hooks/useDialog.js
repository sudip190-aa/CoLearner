import { useEffect, useRef } from 'react'

// Dialogs currently open, oldest first. Only the top one reacts to Escape / traps Tab, and the page
// scroll stays locked until the *last* one closes (independent of the order they unmount in).
const stack = []
let savedOverflow = ''

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

const focusables = (node) =>
  Array.from(node.querySelectorAll(FOCUSABLE)).filter((el) => el.offsetParent !== null || el === document.activeElement)

/**
 * Shared behaviour for Modal and Drawer: Escape closes the top-most dialog, Tab stays inside it,
 * focus moves in on open and returns to whatever opened it, and body scroll is locked once.
 */
export function useDialog(isOpen, ref, onClose) {
  const closeRef = useRef(onClose)
  useEffect(() => {
    closeRef.current = onClose
  })

  useEffect(() => {
    if (!isOpen) return undefined
    const token = {}
    const opener = document.activeElement
    if (!stack.length) {
      savedOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
    }
    stack.push(token)

    const node = ref.current
    if (node && !node.contains(document.activeElement)) {
      // An input with autoFocus has already claimed focus; otherwise take the first control.
      const [first] = focusables(node)
      ;(first || node).focus({ preventScroll: true })
    }

    const onKeyDown = (event) => {
      if (stack[stack.length - 1] !== token) return
      if (event.key === 'Escape') {
        event.stopPropagation()
        closeRef.current?.()
        return
      }
      if (event.key !== 'Tab' || !node) return
      const items = focusables(node)
      if (!items.length) {
        event.preventDefault()
        node.focus()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && (document.activeElement === first || !node.contains(document.activeElement))) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (document.activeElement === last || !node.contains(document.activeElement))) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      stack.splice(stack.indexOf(token), 1)
      if (!stack.length) document.body.style.overflow = savedOverflow
      if (opener instanceof HTMLElement && document.contains(opener)) opener.focus({ preventScroll: true })
    }
  }, [isOpen, ref])
}
