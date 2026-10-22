import { useId, useRef, useState, type MouseEvent } from 'react'
import { NavLink } from 'react-router-dom'
import { Icon, type IconName } from './icons'

type Props = {
  label: string
  icon: IconName
  to?: string
  end?: boolean
  onClick?: () => void
  pressed?: boolean
  expanded?: boolean
  haspopup?: 'dialog'
}

export function IconControl({ label, icon, to, end, onClick, pressed, expanded, haspopup }: Props) {
  const [open, setOpen] = useState(false)
  const tipId = useId()
  const timer = useRef<number | null>(null)
  const suppress = useRef(false)

  function clearTimer() {
    if (timer.current != null) {
      window.clearTimeout(timer.current)
      timer.current = null
    }
  }

  function onClickInternal(event: MouseEvent) {
    setOpen(false)
    if (suppress.current) {
      suppress.current = false
      event.preventDefault()
      event.stopPropagation()
      return
    }
    onClick?.()
  }

  const handlers = {
    onMouseEnter: () => setOpen(true),
    onMouseLeave: () => setOpen(false),
    onFocus: () => setOpen(true),
    onBlur: () => setOpen(false),
    onContextMenu: (event: MouseEvent) => {
      event.preventDefault()
      setOpen(true)
    },
    onTouchStart: () => {
      clearTimer()
      timer.current = window.setTimeout(() => {
        suppress.current = true
        setOpen(true)
      }, 450)
    },
    onTouchEnd: () => {
      clearTimer()
      window.setTimeout(() => setOpen(false), 900)
    },
    onTouchCancel: () => {
      clearTimer()
      suppress.current = false
      setOpen(false)
    },
    onClick: onClickInternal,
  }

  const aria = {
    'aria-label': label,
    'aria-describedby': open ? tipId : undefined,
    ...(pressed === undefined ? {} : { 'aria-pressed': pressed }),
    ...(expanded === undefined ? {} : { 'aria-expanded': expanded }),
    ...(haspopup ? { 'aria-haspopup': haspopup } : {}),
  }

  const body = (
    <>
      <Icon name={icon} />
      {open ? (
        <span role="tooltip" id={tipId} className="tip">
          {label}
        </span>
      ) : null}
    </>
  )

  if (to) {
    return (
      <NavLink to={to} end={end} className="icon-control" {...aria} {...handlers}>
        {body}
      </NavLink>
    )
  }

  return (
    <button type="button" className="icon-control" {...aria} {...handlers}>
      {body}
    </button>
  )
}
