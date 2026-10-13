import { NoticeEmpty } from '@/components/layout/NoticeEmpty'
import { Button } from '@/components/ui/button'
import { Link } from '@tanstack/react-router'
import { SearchX } from 'lucide-react'

export function NoticeNotFoundSitting() {
  return (
    <NoticeEmpty
      icon={SearchX}
      title="Sitting not found"
      description="No sitting on this date is in the archive."
      action={
        <Button variant="outline" asChild>
          <Link to="/">Back to Home</Link>
        </Button>
      }
    />
  )
}
