import { Button } from '@/components/ui/button'
import { copyTextWithToast } from '@/lib/utils'
import { Quote } from 'lucide-react'

interface ButtonCopyCitationProps {
  citation: string
}

export function ButtonCopyCitation({ citation }: ButtonCopyCitationProps) {
  function copyCitation() {
    return copyTextWithToast(
      citation,
      'Citation copied',
      "Couldn't copy the citation"
    )
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={copyCitation}>
      <Quote aria-hidden="true" />
      Copy citation
    </Button>
  )
}
