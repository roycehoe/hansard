import { Button } from '@/components/ui/button'
import { Link2 } from 'lucide-react'
import { toast } from 'sonner'

interface ButtonCopySpeechLinkProps {
  reportSlug: string
  ordinal: number
  describedById?: string
}

export function ButtonCopySpeechLink({
  reportSlug,
  ordinal,
  describedById,
}: ButtonCopySpeechLinkProps) {
  async function copySpeechLink() {
    const speechLink = `${window.location.origin}/reports/${encodeURIComponent(reportSlug)}#s${ordinal}`
    try {
      await navigator.clipboard.writeText(speechLink)
      toast(
        'Link copied. Speech links are best-effort and may move after a re-parse.'
      )
    } catch {
      toast.error("Couldn't copy the link.")
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={copySpeechLink}
      aria-describedby={describedById}
    >
      <Link2 aria-hidden="true" />
      Copy link
    </Button>
  )
}
