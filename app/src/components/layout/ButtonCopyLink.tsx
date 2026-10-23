import { Button } from '@/components/ui/button'
import { AnalyticsEvent } from '@/constants/analytics/enums'
import { countEvent } from '@/lib/analytics'
import { buildPagePermalink } from '@/lib/citation'
import { copyTextWithToast } from '@/lib/utils'
import { Link2 } from 'lucide-react'

interface ButtonCopyLinkProps {
  path: string
}

export function ButtonCopyLink({ path }: ButtonCopyLinkProps) {
  function copyPageLink() {
    countEvent(AnalyticsEvent.COPY_LINK)
    return copyTextWithToast(
      buildPagePermalink(path),
      'Link copied',
      "Couldn't copy the link"
    )
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={copyPageLink}>
      <Link2 aria-hidden="true" />
      Copy link
    </Button>
  )
}
