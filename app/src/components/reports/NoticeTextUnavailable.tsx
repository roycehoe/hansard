import { NoticeEmpty } from '@/components/layout/NoticeEmpty'
import { Button } from '@/components/ui/button'
import { TEXT_NOT_IN_ARCHIVE_LABEL } from '@/constants/constants'
import { FileText } from 'lucide-react'

interface NoticeTextUnavailableProps {
  officialRecordUrl: string
}

export function NoticeTextUnavailable({
  officialRecordUrl,
}: NoticeTextUnavailableProps) {
  return (
    <NoticeEmpty
      icon={FileText}
      title={TEXT_NOT_IN_ARCHIVE_LABEL}
      description="Parliament's site did not give this archive the report's text, so only its title and details are here."
      action={
        <Button variant="outline" asChild>
          <a href={officialRecordUrl} target="_blank" rel="noreferrer">
            Open on Parliament&apos;s site
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </Button>
      }
    />
  )
}
