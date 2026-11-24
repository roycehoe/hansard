import {
  CONTACT_EMAIL,
  UNDERLINED_LINK_CLASS_NAME,
} from '@/constants/constants'
import { buildErrorEmailHref } from '@/lib/utils'

interface TextReportProblemProps {
  title: string
}

function buildReportProblemHref(title: string): string {
  return buildErrorEmailHref(
    `Error in ${title}`,
    `${window.location.origin}${window.location.pathname}`
  )
}

export function TextReportProblem({ title }: TextReportProblemProps) {
  return CONTACT_EMAIL ? (
    <p className="text-sm">
      <a
        href={buildReportProblemHref(title)}
        className={UNDERLINED_LINK_CLASS_NAME}
      >
        Report an error
      </a>
    </p>
  ) : null
}
