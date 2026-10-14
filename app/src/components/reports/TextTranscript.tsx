import { TranscriptSegmentKind } from '@/constants/reports/enums'
import { parseTranscriptInline } from '@/lib/transcript'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface TextTranscriptProps {
  transcript: string
  label?: ReactNode
  isProcedural?: boolean
}

export function TextTranscript({
  transcript,
  label,
  isProcedural = false,
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
        if (segment.kind === TranscriptSegmentKind.BOLD) {
          return <strong key={index}>{segment.text}</strong>
        }
        if (segment.kind === TranscriptSegmentKind.ITALIC) {
          return <em key={index}>{segment.text}</em>
        }
        return <span key={index}>{segment.text}</span>
      })}
    </p>
  )
}
