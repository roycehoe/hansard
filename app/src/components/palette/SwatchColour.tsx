import type { Colour } from '@/palette/palette'

interface SwatchColourProps {
  colour: Colour
}

const SWATCH_CLASSES = 'border-border block size-10 shrink-0 rounded-md border'

export function SwatchColour({ colour }: SwatchColourProps) {
  return (
    <span
      role="img"
      aria-label={`Swatch of ${colour.name}`}
      className={SWATCH_CLASSES}
      style={{ backgroundColor: colour.hex }}
    />
  )
}
