import { NoticeEmpty } from '@/components/layout/NoticeEmpty'
import { Button } from '@/components/ui/button'
import { FileText } from 'lucide-react'

interface NoticeNoSpeechesProps {
  officialRecordUrl: string
}

export function NoticeNoSpeeches({ officialRecordUrl }: NoticeNoSpeechesProps) {
  return (
    <NoticeEmpty
      icon={FileText}
      title="The text couldn't be split into speeches"
      description="The report has text, but it did not split into speeches. Read it on the official record."
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
