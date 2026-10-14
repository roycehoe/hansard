import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Link } from '@tanstack/react-router'
import { ChevronDown } from 'lucide-react'

interface PopoverUnofficialTranscriptProps {
  officialRecordUrl: string
}

const LINK_CLASS_NAME =
  'text-primary hover:text-primary-hover focus-visible:ring-ring focus-visible:ring-offset-background w-fit rounded-sm text-sm outline-hidden hover:underline focus-visible:ring-2 focus-visible:ring-offset-2'

export function PopoverUnofficialTranscript({
  officialRecordUrl,
}: PopoverUnofficialTranscriptProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="xs">
          Unofficial transcript
          <ChevronDown aria-hidden="true" className="size-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="space-y-3">
        <p className="text-sm">
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
            Read the official record
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          <Link
            to="/coverage"
            hash="about-the-text"
            className={LINK_CLASS_NAME}
          >
            About this text
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}
