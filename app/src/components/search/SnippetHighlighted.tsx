import {
  SNIPPET_MARK_END,
  SNIPPET_MARK_START,
} from '@/constants/search/constants'

interface SnippetSegment {
  text: string
  isMarked: boolean
}

function parseSnippetSegments(snippet: string): SnippetSegment[] {
  const [leading, ...markedParts] = snippet.split(SNIPPET_MARK_START)
  const segments: SnippetSegment[] = [{ text: leading, isMarked: false }]
  for (const part of markedParts) {
    const [marked, ...rest] = part.split(SNIPPET_MARK_END)
    segments.push({ text: marked, isMarked: true })
    segments.push({ text: rest.join(SNIPPET_MARK_END), isMarked: false })
  }
  return segments.filter((segment) => segment.text !== '')
}

interface SnippetHighlightedProps {
  snippet: string
}

export function SnippetHighlighted({ snippet }: SnippetHighlightedProps) {
  return (
    <p className="text-sm">
      {parseSnippetSegments(snippet).map((segment, index) =>
        segment.isMarked ? (
          <mark
            key={index}
            className="bg-highlight text-highlight-foreground rounded-xs px-0.5"
          >
            {segment.text}
          </mark>
        ) : (
          <span key={index}>{segment.text}</span>
        )
      )}
    </p>
  )
}
