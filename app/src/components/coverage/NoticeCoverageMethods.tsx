import { Link } from '@tanstack/react-router'

const LINK_CLASS_NAME =
  'text-primary hover:text-primary-hover focus-visible:ring-ring focus-visible:ring-offset-background rounded-sm outline-hidden hover:underline focus-visible:ring-2 focus-visible:ring-offset-2'

export function NoticeCoverageMethods() {
  return (
    <p>
      <Link to="/coverage/methods" className={LINK_CLASS_NAME}>
        Data quality and methods
      </Link>{' '}
      has the hand check in full, how the credited figures are measured, the
      full counts, reports by year and the full wording of each gap.
    </p>
  )
}
