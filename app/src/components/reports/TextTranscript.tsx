import { TextHighlighted } from '@/components/reports/TextHighlighted'
import {
  TranscriptSegmentKind,
  TranscriptStyle,
} from '@/constants/reports/enums'
import { parseTranscriptInline } from '@/lib/transcript'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface TextTranscriptProps {
  transcript: string
  label?: ReactNode
  transcriptStyle: TranscriptStyle
  highlightPattern?: RegExp
}

export function TextTranscript({
  transcript,
  label,
  transcriptStyle,
  highlightPattern,
}: TextTranscriptProps) {
  const segments = parseTranscriptInline(transcript)

  const content = (
    <>
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
    </>
  )

  if (transcriptStyle === TranscriptStyle.HEADING) {
    return (
      <h3 className="font-serif text-lg leading-7 font-semibold">{content}</h3>
    )
  }
  return (
    <p
      className={cn(
        'font-serif leading-7',
        transcriptStyle === TranscriptStyle.MUTED &&
          'text-muted-foreground text-sm italic',
        transcriptStyle === TranscriptStyle.BODY && 'text-base',
        transcriptStyle === TranscriptStyle.QUOTED &&
          'border-separator border-l-2 pl-4 text-base'
      )}
    >
      {content}
    </p>
  )
}
