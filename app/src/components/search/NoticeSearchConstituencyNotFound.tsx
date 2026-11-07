import { NoticeEmpty } from '@/components/layout/NoticeEmpty'
import { Button } from '@/components/ui/button'
import { Link } from '@tanstack/react-router'
import { SearchX } from 'lucide-react'

interface NoticeSearchConstituencyNotFoundProps {
  constituency: string
}

export function NoticeSearchConstituencyNotFound({
  constituency,
}: NoticeSearchConstituencyNotFoundProps) {
  return (
    <div role="status">
      <NoticeEmpty
        icon={SearchX}
        title={`No constituency called ${constituency}`}
        description="Check the spelling. A constituency can be listed under another name after its boundaries change."
        action={
          <Button variant="outline" asChild>
            <Link to="/people" search={{ constituency }}>
              Find the constituency under People
            </Link>
          </Button>
        }
      />
    </div>
  )
}
