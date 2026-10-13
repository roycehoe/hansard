import { Button } from '@/components/ui/button'
import { Quote } from 'lucide-react'
import { toast } from 'sonner'

interface ButtonCopyCitationProps {
  citation: string
  describedById?: string
}

export function ButtonCopyCitation({
  citation,
  describedById,
}: ButtonCopyCitationProps) {
  async function copyCitation() {
    try {
      await navigator.clipboard.writeText(citation)
      toast(
        'Citation copied. The column number will be added once the archive has it.'
      )
    } catch {
      toast.error("Couldn't copy the citation.")
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={copyCitation}
      aria-describedby={describedById}
    >
      <Quote aria-hidden="true" />
      Copy citation
    </Button>
  )
}
