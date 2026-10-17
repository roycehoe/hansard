import { NoticeEmpty } from '@/components/layout/NoticeEmpty'
import { TEXT_NOT_IN_ARCHIVE_LABEL } from '@/constants/constants'
import { FileText } from 'lucide-react'

export function NoticeTextUnavailable() {
  return (
    <NoticeEmpty
      icon={FileText}
      title={TEXT_NOT_IN_ARCHIVE_LABEL}
      description="Only the title and details of this report are in the archive so far."
    />
  )
}
