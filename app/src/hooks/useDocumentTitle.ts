import { DOCUMENT_TITLE_SEPARATOR, SITE_NAME } from '@/constants/constants'
import { useEffect } from 'react'

export function useDocumentTitle(...pageTitleParts: string[]) {
  const documentTitle = [...pageTitleParts, SITE_NAME].join(
    DOCUMENT_TITLE_SEPARATOR
  )

  useEffect(
    function syncDocumentTitle() {
      document.title = documentTitle
      return function resetDocumentTitle() {
        document.title = SITE_NAME
      }
    },
    [documentTitle]
  )
}
