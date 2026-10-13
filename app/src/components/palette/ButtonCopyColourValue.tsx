import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface ButtonCopyColourValueProps {
  format: string
  value: string
}

export function ButtonCopyColourValue({
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
      aria-label={`Copy ${format} ${value}`}
      onClick={copyValue}
      className="font-mono text-xs"
    >
      {value}
    </Button>
  )
}
