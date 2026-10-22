import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { CHROME } from './chrome'
import { IconControl } from './iconControl'

export function Sheet({ label, onClose, children }: { label: string; onClose: () => void; children: ReactNode }) {
  const titleId = useId()
  const panel = useRef<HTMLDivElement>(null)
  const previous = useRef<HTMLElement | null>(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    previous.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    document.body.classList.add('sheet-open')
    panel.current?.focus()

    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeRef.current()
        return
      }
      if (event.key !== 'Tab' || !panel.current) return
      const items = [...panel.current.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter(
        (element) => !element.hasAttribute('disabled'),
      )
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (!first || !last) return
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.classList.remove('sheet-open')
      previous.current?.focus()
    }
  }, [])

  return createPortal(
    <div className="backdrop" onClick={() => closeRef.current()}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        ref={panel}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sheet-head">
          <h2 id={titleId}>{label}</h2>
          <IconControl label={CHROME.close} icon="close" onClick={() => closeRef.current()} />
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}
