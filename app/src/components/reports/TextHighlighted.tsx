import {
  DEFINED_TERM_CLASS_NAME,
  PopoverDefinition,
} from '@/components/layout/PopoverDefinition'
import { MARK_CLASS_NAME } from '@/constants/constants'
import {
  LOST_CHARACTER,
  LOST_CHARACTER_DEFINITION,
} from '@/constants/reports/constants'
import { splitByHighlight } from '@/lib/highlight'

interface TextHighlightedProps {
  text: string
  pattern: RegExp | undefined
}

function renderLostCharacters(text: string) {
  return text.split(LOST_CHARACTER).map((part, index) => (
    <span key={index}>
      {index > 0 && (
        <PopoverDefinition definition={LOST_CHARACTER_DEFINITION}>
          <span className={DEFINED_TERM_CLASS_NAME}>{LOST_CHARACTER}</span>
        </PopoverDefinition>
      )}
      {part}
    </span>
  ))
}

export function TextHighlighted({ text, pattern }: TextHighlightedProps) {
  return splitByHighlight(text, pattern).map((segment, index) =>
    segment.isMarked ? (
      <mark key={index} className={MARK_CLASS_NAME}>
        {segment.text}
      </mark>
    ) : (
      <span key={index}>{renderLostCharacters(segment.text)}</span>
    )
  )
}
