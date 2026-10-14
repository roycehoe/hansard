import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Info } from 'lucide-react'

export function NoticeDerivedText() {
  return (
    <Alert variant="info">
      <Info aria-hidden="true" />
      <AlertTitle>Derived text</AlertTitle>
      <AlertDescription>
        <p>
          This text is derived from the Official Report and can differ from it.
          A speech link can change when the archive is rebuilt. The official
          record is the authority.
        </p>
      </AlertDescription>
    </Alert>
  )
}
