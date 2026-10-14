import { splitByHighlight } from '@/lib/highlight'

interface TextHighlightedProps {
  text: string
  pattern: RegExp | undefined
}

export function TextHighlighted({ text, pattern }: TextHighlightedProps) {
  return splitByHighlight(text, pattern).map((segment, index) =>
    segment.isMarked ? (
      <mark
        key={index}
        className="bg-highlight text-highlight-foreground rounded-xs px-0.5 font-semibold"
      >
        {segment.text}
      </mark>
    ) : (
      <span key={index}>{segment.text}</span>
    )
  )
}
