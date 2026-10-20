import { CONTACT_EMAIL } from '@/constants/constants'
import { buildErrorEmailHref } from '@/lib/utils'

interface TextReportProblemProps {
  title: string
}

const LINK_CLASS_NAME =
  'text-primary hover:text-primary-hover focus-visible:ring-ring focus-visible:ring-offset-background rounded-sm outline-hidden hover:underline focus-visible:ring-2 focus-visible:ring-offset-2'

function buildReportProblemHref(title: string): string {
  return buildErrorEmailHref(
    `Problem on ${title}`,
    `${window.location.origin}${window.location.pathname}`
  )
}

export function TextReportProblem({ title }: TextReportProblemProps) {
  if (!CONTACT_EMAIL) return null

  return (
    <p className="text-sm">
      <a href={buildReportProblemHref(title)} className={LINK_CLASS_NAME}>
        Report a problem with this report
      </a>
    </p>
  )
}
