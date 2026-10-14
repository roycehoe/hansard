import { NoticeEmpty } from '@/components/layout/NoticeEmpty'
import { Button } from '@/components/ui/button'
import { Link } from '@tanstack/react-router'
import { SearchX } from 'lucide-react'

export function NoticeNotFoundPerson() {
  return (
    <NoticeEmpty
      icon={SearchX}
      title="Person not found"
      description="No person has this address. The archive may have renumbered it."
      action={
        <Button variant="outline" asChild>
          <Link to="/">Back to home</Link>
        </Button>
      }
    />
  )
}
