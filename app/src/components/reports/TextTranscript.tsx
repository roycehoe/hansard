import { TextHighlighted } from '@/components/reports/TextHighlighted'
import { TranscriptSegmentKind } from '@/constants/reports/enums'
import { parseTranscriptInline } from '@/lib/transcript'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface TextTranscriptProps {
  transcript: string
  label?: ReactNode
  isProcedural?: boolean
  highlightPattern?: RegExp
}

export function TextTranscript({
  transcript,
  label,
  isProcedural = false,
  highlightPattern,
}: TextTranscriptProps) {
  const segments = parseTranscriptInline(transcript)

  return (
    <p
      className={cn(
        'font-serif leading-7',
        isProcedural ? 'text-muted-foreground text-sm italic' : 'text-base'
      )}
    >
      {label}
      {segments.map((segment, index) => {
        const text = (
          <TextHighlighted text={segment.text} pattern={highlightPattern} />
        )
        if (segment.kind === TranscriptSegmentKind.BOLD) {
          return <strong key={index}>{text}</strong>
        }
        if (segment.kind === TranscriptSegmentKind.ITALIC) {
          return <em key={index}>{text}</em>
        }
        return <span key={index}>{text}</span>
      })}
    </p>
  )
}
