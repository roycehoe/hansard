import { DOCUMENT_TITLE_SEPARATOR, SITE_NAME } from '@/constants/constants'
import { useEffect } from 'react'

export function useDocumentTitle(...pageTitleParts: (string | undefined)[]) {
  const isTitleKnown = pageTitleParts.every((part) => part !== undefined)
  const documentTitle = [...pageTitleParts, SITE_NAME].join(
    DOCUMENT_TITLE_SEPARATOR
  )

  useEffect(
    function syncDocumentTitle() {
      if (!isTitleKnown) return
      document.title = documentTitle
      return function resetDocumentTitle() {
        document.title = SITE_NAME
      }
    },
    [isTitleKnown, documentTitle]
  )
}
