import type { ReactNode } from 'react'

export type IconName = 'search' | 'leaf' | 'book' | 'books' | 'sliders' | 'shield' | 'warning' | 'sort' | 'back' | 'close' | 'info'

const paths: Record<IconName, ReactNode> = {
  search: (
    <>
      <circle cx="11" cy="11" r="6" />
      <path d="M16 16l4.5 4.5" />
    </>
  ),
  leaf: (
    <>
      <path d="M6 20c7 0 14-7 14-14C12 6 6 12 6 20z" />
      <path d="M6 20c4-4 8-9 10-13" />
    </>
  ),
  book: (
    <>
      <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H20v16H7.5A2.5 2.5 0 0 0 5 21.5V5.5z" />
      <path d="M5 5.5A2.5 2.5 0 0 1 7.5 8H20" />
    </>
  ),
  books: (
    <>
      <path d="M4 5h5.5a2 2 0 0 1 2 2V20H6a2 2 0 0 1-2-2V5z" />
      <path d="M12.5 7H18a2 2 0 0 1 2 2v11h-7.5V7z" />
    </>
  ),
  sliders: (
    <>
      <path d="M4 8h3.2M12.2 8H20" />
      <path d="M4 16h8.2M17.2 16H20" />
      <circle cx="9" cy="8" r="2.1" />
      <circle cx="15" cy="16" r="2.1" />
    </>
  ),
  shield: <path d="M12 3.5l7 2.6v5.6c0 4.2-2.8 7.2-7 8.8-4.2-1.6-7-4.6-7-8.8V6.1l7-2.6z" />,
  warning: (
    <>
      <path d="M12 4.5l8 14H4l8-14z" />
      <path d="M12 10v4" />
      <path d="M12 16.5h.01" />
    </>
  ),
  sort: (
    <>
      <path d="M8 6v12" />
      <path d="M4.5 9.5L8 6l3.5 3.5" />
      <path d="M16 18V6" />
      <path d="M12.5 14.5L16 18l3.5-3.5" />
    </>
  ),
  back: <path d="M14.5 5.5L8 12l6.5 6.5" />,
  close: (
    <>
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.25" />
      <path d="M12 11v5" />
      <path d="M12 8h.01" />
    </>
  ),
}

export function Icon({ name }: { name: IconName }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  )
}
