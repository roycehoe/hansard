import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { COLUMN_MARKER_APPEARANCE_CLASS_NAME } from '@/constants/appearance/constants'
import {
  COLUMN_NOTE_LABELS,
  COLUMN_NOTE_TOOLTIP_DELAY_MS,
} from '@/constants/reports/constants'
import { ColumnNote } from '@/constants/reports/enums'
import { cn } from '@/lib/utils'
import type { MouseEvent } from 'react'
import { useState } from 'react'

const TRIGGER_CLASS_NAME =
  'text-muted-foreground hover:text-foreground focus-visible:ring-ring focus-visible:ring-offset-background cursor-help rounded-sm text-xs leading-7 tabular-nums underline decoration-dotted underline-offset-2 outline-hidden transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-offset-2'

interface TooltipColumnNoteProps {
  columnStart: number
  columnNote: ColumnNote
  columnSuggested: number | null
}

function buildColumnNoteText(
  columnStart: number,
  columnNote: ColumnNote,
  columnSuggested: number | null
): string {
  switch (columnNote) {
    case ColumnNote.LIKELY_MISPRINT:
      return columnSuggested === null
        ? `The record prints column ${columnStart} here. It is likely a misprint, out of step with the columns around it.`
        : `The record prints column ${columnStart} here. It is likely a misprint: the columns around it suggest ${columnSuggested}.`
    case ColumnNote.SPEAKER_NAMED_IN_COLUMN_BEFORE:
      return `The record names the speaker at the end of column ${columnStart}, and the speech starts in the next column. The archive cites the column where the speaker is named.`
    case ColumnNote.PRINTED_WITH_L_FOR_1:
      return 'The record prints this column number with a letter l in place of a 1.'
  }
}

export function TooltipColumnNote({
  columnStart,
  columnNote,
  columnSuggested,
}: TooltipColumnNoteProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false)

  function openOnClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    setIsOpen(true)
  }

  return (
    <Tooltip
      open={isOpen}
      onOpenChange={setIsOpen}
      delayDuration={COLUMN_NOTE_TOOLTIP_DELAY_MS}
    >
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            TRIGGER_CLASS_NAME,
            COLUMN_MARKER_APPEARANCE_CLASS_NAME
          )}
          onClick={openOnClick}
        >
          col. {columnStart}
          <span className="sr-only">, {COLUMN_NOTE_LABELS[columnNote]}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-72">
        {buildColumnNoteText(columnStart, columnNote, columnSuggested)}
      </TooltipContent>
    </Tooltip>
  )
}
