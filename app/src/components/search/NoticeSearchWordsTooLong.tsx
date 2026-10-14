import { Alert, AlertDescription } from '@/components/ui/alert'
import { SEARCH_WORDS_TOO_LONG_NOTICE } from '@/constants/search/constants'
import { Info } from 'lucide-react'

export function NoticeSearchWordsTooLong() {
  return (
    <Alert variant="info">
      <Info aria-hidden="true" />
      <AlertDescription>
        <p>{SEARCH_WORDS_TOO_LONG_NOTICE}</p>
      </AlertDescription>
    </Alert>
  )
}
