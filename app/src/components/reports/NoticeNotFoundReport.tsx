import { NoticeEmpty } from '@/components/layout/NoticeEmpty'
import { Button } from '@/components/ui/button'
import { Link } from '@tanstack/react-router'
import { SearchX } from 'lucide-react'

export function NoticeNotFoundReport() {
  return (
    <NoticeEmpty
      icon={SearchX}
      title="Report not found"
      description="No report has this address."
      action={
        <Button variant="outline" asChild>
          <Link to="/">Back to home</Link>
        </Button>
      }
    />
  )
}
