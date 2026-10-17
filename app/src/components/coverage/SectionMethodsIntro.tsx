import { METHODS_LAST_REVISED } from '@/constants/coverage/constants'
import { formatSittingDate } from '@/lib/format'

export function SectionMethodsIntro() {
  return (
    <div className="space-y-2">
      <p>
        This page holds the detail behind the coverage page: how the text was
        gathered, how far the record of who said what can be trusted, the full
        counts and the full wording of every known gap.
      </p>
      <p className="text-muted-foreground text-sm">
        Last revised {formatSittingDate(METHODS_LAST_REVISED)}.
      </p>
    </div>
  )
}
