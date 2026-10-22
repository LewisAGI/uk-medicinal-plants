import { useEffect } from 'react'
import { CHROME } from './chrome'

export function useTitle(title: string) {
  useEffect(() => {
    document.title = title === CHROME.appTitle ? title : `${title} · ${CHROME.appTitle}`
  }, [title])
}
