import { NoticeEmpty } from '@/components/layout/NoticeEmpty'
import { Button } from '@/components/ui/button'
import { Link } from '@tanstack/react-router'
import { SearchX } from 'lucide-react'

export function NoticeRemovedReport() {
  return (
    <NoticeEmpty
      icon={SearchX}
      title="Report removed"
      description="This report is no longer on this site."
      action={
        <Button variant="outline" asChild>
          <Link to="/">Back to home</Link>
        </Button>
      }
    />
  )
}
