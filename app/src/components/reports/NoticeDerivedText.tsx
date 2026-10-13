import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Info } from 'lucide-react'

interface NoticeDerivedTextProps {
  officialRecordUrl: string
}

export function NoticeDerivedText({
  officialRecordUrl,
}: NoticeDerivedTextProps) {
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
        <a
          href={officialRecordUrl}
          target="_blank"
          rel="noreferrer"
          className="text-primary hover:text-primary-hover focus-visible:ring-ring focus-visible:ring-offset-background rounded-sm outline-hidden hover:underline focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          Read on the official record (opens in a new tab)
        </a>
      </AlertDescription>
    </Alert>
  )
}
