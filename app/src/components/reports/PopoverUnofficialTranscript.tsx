import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Link } from '@tanstack/react-router'
import { ChevronDown } from 'lucide-react'
import { useId } from 'react'

interface PopoverUnofficialTranscriptProps {
  officialRecordUrl: string
}

const LINK_CLASS_NAME =
  'text-primary hover:text-primary-hover focus-visible:ring-ring focus-visible:ring-offset-background w-fit rounded-sm text-sm outline-hidden hover:underline focus-visible:ring-2 focus-visible:ring-offset-2'

export function PopoverUnofficialTranscript({
  officialRecordUrl,
}: PopoverUnofficialTranscriptProps) {
  const explanationId = useId()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="xs">
          Unofficial transcript
          <ChevronDown aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        aria-label="Unofficial transcript"
        aria-describedby={explanationId}
        className="space-y-3"
      >
        <p id={explanationId} className="text-sm">
          This transcript is derived from the Official Report. The Official
          Report is the authority.
        </p>
        <div className="flex flex-col gap-2">
          <a
            href={officialRecordUrl}
            target="_blank"
            rel="noreferrer"
            className={LINK_CLASS_NAME}
          >
            Read on the official record
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          <Link
            to="/coverage/methods"
            hash="citing-and-linking"
            className={LINK_CLASS_NAME}
          >
            Citing and linking
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}
