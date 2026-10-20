import { NoticeEmpty } from '@/components/layout/NoticeEmpty'
import { Button } from '@/components/ui/button'
import { formatSittingDate } from '@/lib/format'
import { Link } from '@tanstack/react-router'
import { SearchX } from 'lucide-react'

interface NoticeNotFoundSittingProps {
  sittingDate: string
  latestSittingDate: string | null
}

function getSittingNotFoundDescription(
  sittingDate: string,
  latestSittingDate: string | null
): string {
  if (latestSittingDate !== null && sittingDate > latestSittingDate) {
    return `The archive holds sittings up to ${formatSittingDate(latestSittingDate)}.`
  }
  return 'No sitting on this date is in the archive.'
}

export function NoticeNotFoundSitting({
  sittingDate,
  latestSittingDate,
}: NoticeNotFoundSittingProps) {
  return (
    <NoticeEmpty
      icon={SearchX}
      title="Sitting not found"
      description={getSittingNotFoundDescription(
        sittingDate,
        latestSittingDate
      )}
      action={
        <Button variant="outline" asChild>
          <Link to="/">Back to home</Link>
        </Button>
      }
    />
  )
}
