import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { Colour } from '@/palette/palette'

interface SwatchColourProps {
  colour: Colour
}

export function SwatchColour({ colour }: SwatchColourProps) {
  const swatchClasses = 'border-border block size-10 shrink-0 rounded-md border'
  const swatchLabel = `Swatch of ${colour.name}`

  if (!colour.sampled) {
    return (
      <span
        role="img"
        aria-label={swatchLabel}
        className={swatchClasses}
        style={{ backgroundColor: colour.hex }}
      />
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          role="img"
          tabIndex={0}
          aria-label={swatchLabel}
          className={cn(
            swatchClasses,
            'focus-visible:ring-ring focus-visible:ring-offset-background outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2'
          )}
          style={{ backgroundColor: colour.hex }}
        />
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-64">
        <p>Sample box: {colour.sampled.box.join(', ')}</p>
        <p>{colour.sampled.note}</p>
      </TooltipContent>
    </Tooltip>
  )
}
