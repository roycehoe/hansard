import { Button } from '@/components/ui/button'
import { Quote } from 'lucide-react'
import { toast } from 'sonner'

interface ButtonCopyCitationProps {
  citation: string
  describedById?: string
  variant?: 'outline' | 'quiet'
}

export function ButtonCopyCitation({
  citation,
  describedById,
  variant = 'outline',
}: ButtonCopyCitationProps) {
  async function copyCitation() {
    try {
      await navigator.clipboard.writeText(citation)
      toast('Citation copied')
    } catch {
      toast.error("Couldn't copy the citation")
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size="sm"
      onClick={copyCitation}
      aria-describedby={describedById}
    >
      <Quote aria-hidden="true" />
      Copy citation
    </Button>
  )
}
