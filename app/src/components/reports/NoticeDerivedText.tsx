import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Info } from 'lucide-react'

export function NoticeDerivedText() {
  return (
    <Alert variant="info">
      <Info aria-hidden="true" />
      <AlertTitle>Derived text</AlertTitle>
      <AlertDescription>
        <p>
          This text was parsed from the Official Report and may differ from it.
          Links to individual speeches are best-effort, because a re-parse can
          renumber them. The official record is the authority.
        </p>
      </AlertDescription>
    </Alert>
  )
}
