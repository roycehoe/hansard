import { NoticeEmpty } from '@/components/layout/NoticeEmpty'
import { FileText } from 'lucide-react'

export function NoticeTextNotPublished() {
  return (
    <NoticeEmpty
      icon={FileText}
      title="Published without text"
      description="The Parliament website publishes this type of report without text."
    />
  )
}
