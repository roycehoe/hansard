import { parseTranscriptInline, TranscriptSegmentKind } from '@/lib/transcript'

interface TextTranscriptProps {
  transcript: string
}

export function TextTranscript({ transcript }: TextTranscriptProps) {
  const segments = parseTranscriptInline(transcript)

  return (
    <p className="font-serif text-base leading-7">
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
