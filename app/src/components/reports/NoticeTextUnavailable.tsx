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
      description="Only the title and details of this report have been collected so far. Read it on the official record."
      action={
        <Button variant="outline" asChild>
          <a href={officialRecordUrl} target="_blank" rel="noreferrer">
            Read on the official record (opens in a new tab)
          </a>
        </Button>
      }
    />
  )
}
