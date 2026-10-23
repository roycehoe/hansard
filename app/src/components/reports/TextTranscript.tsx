import { TextHighlighted } from '@/components/reports/TextHighlighted'
import { TRANSCRIPT_APPEARANCE_CLASS_NAME } from '@/constants/appearance/constants'
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

  const isSizedByAppearance =
    transcriptStyle === TranscriptStyle.BODY ||
    transcriptStyle === TranscriptStyle.QUOTED ||
    transcriptStyle === TranscriptStyle.STAGE_DIRECTION

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
          'text-muted-foreground text-sm italic in-data-[text-size=large]:text-lg in-data-[text-size=large]:leading-8 in-data-[text-size=small]:text-xs in-data-[text-size=small]:leading-6',
        transcriptStyle === TranscriptStyle.STAGE_DIRECTION &&
          'text-muted-foreground pl-12 text-base italic',
        transcriptStyle === TranscriptStyle.FOOTNOTE &&
          'text-muted-foreground before:bg-separator font-sans text-sm leading-5 before:mb-2 before:block before:h-px before:w-12',
        transcriptStyle === TranscriptStyle.BODY && 'text-base',
        transcriptStyle === TranscriptStyle.QUOTED &&
          'border-separator border-l-2 pl-4 text-base',
        isSizedByAppearance && TRANSCRIPT_APPEARANCE_CLASS_NAME
      )}
    >
      {content}
    </p>
  )
}
