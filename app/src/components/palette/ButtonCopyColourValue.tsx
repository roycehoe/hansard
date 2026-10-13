import { Button } from '@/components/ui/button'
import type { ColourFormat } from '@/constants/palette/enums'
import { toast } from 'sonner'

interface ButtonCopyColourValueProps {
  colourName: string
  format: ColourFormat
  value: string
}

export function ButtonCopyColourValue({
  colourName,
  format,
  value,
}: ButtonCopyColourValueProps) {
  async function copyValue() {
    try {
      await navigator.clipboard.writeText(value)
      toast.success(`Copied ${value}`)
    } catch {
      toast.error(`Could not copy ${value}`)
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-label={`Copy ${colourName} ${format} ${value}`}
      onClick={copyValue}
      className="font-mono text-xs"
    >
      {value}
    </Button>
  )
}
