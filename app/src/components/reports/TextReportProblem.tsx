import { CONTACT_EMAIL } from '@/constants/constants'
import { buildErrorEmailHref } from '@/lib/utils'

interface TextReportProblemProps {
  title: string
}

const LINK_CLASS_NAME =
  'text-link underline underline-offset-4 outline-hidden hover:underline focus-visible:underline focus-visible:decoration-ring'

function buildReportProblemHref(title: string): string {
  return buildErrorEmailHref(
    `Error in ${title}`,
    `${window.location.origin}${window.location.pathname}`
  )
}

export function TextReportProblem({ title }: TextReportProblemProps) {
  return CONTACT_EMAIL ? (
    <p className="text-sm">
      <a href={buildReportProblemHref(title)} className={LINK_CLASS_NAME}>
        Report an error
      </a>
    </p>
  ) : null
}
