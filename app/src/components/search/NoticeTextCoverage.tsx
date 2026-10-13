import { useGetCoverage } from '@/api/coverage/getCoverage'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { formatSittingDate } from '@/lib/format'
import { Link } from '@tanstack/react-router'
import { Info } from 'lucide-react'

export function NoticeTextCoverage() {
  const { data } = useGetCoverage()
  const first = data?.text_first_sitting_date
  const last = data?.text_last_sitting_date
  if (!first || !last) return null

  return (
    <Alert variant="info">
      <Info aria-hidden="true" />
      <AlertDescription>
        <p>
          Speech text covers {formatSittingDate(first)} to{' '}
          {formatSittingDate(last)}. Later reports can be found by title only.{' '}
          <Link
            to="/coverage"
            className="text-primary hover:text-primary-hover focus-visible:ring-ring focus-visible:ring-offset-background rounded-sm outline-hidden hover:underline focus-visible:ring-2 focus-visible:ring-offset-2"
          >
            See what the archive covers.
          </Link>
        </p>
      </AlertDescription>
    </Alert>
  )
}
