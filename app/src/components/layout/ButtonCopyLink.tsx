import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
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
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="quiet"
          size="icon-sm"
          onClick={copyPageLink}
          aria-label="Copy link"
        >
          <Link2 aria-hidden="true" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Copy link</TooltipContent>
    </Tooltip>
  )
}
