import { NoticeEmpty } from '@/components/layout/NoticeEmpty'
import { SearchX } from 'lucide-react'

interface NoticeSearchActNotFoundProps {
  act: string
}

export function NoticeSearchActNotFound({ act }: NoticeSearchActNotFoundProps) {
  return (
    <div role="status">
      <NoticeEmpty
        icon={SearchX}
        title={`No Act has the code ${act}`}
        description="Check the address, or find the Act in the list of Acts."
      />
    </div>
  )
}
