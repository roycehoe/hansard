import {
  DEFINED_TERM_CLASS_NAME,
  PopoverDefinition,
} from '@/components/layout/PopoverDefinition'
import { QUESTION_CREDIT_LINK_LABEL } from '@/constants/reports/constants'

interface PopoverReadOutByProps {
  printedName: string
  readerName: string
}

export function PopoverReadOutBy({
  printedName,
  readerName,
}: PopoverReadOutByProps) {
  return (
    <PopoverDefinition
      definition={`The record lists this question under ${printedName}, and ${readerName} asked it on their behalf.`}
      termsLinkLabel={QUESTION_CREDIT_LINK_LABEL}
    >
      <span className={DEFINED_TERM_CLASS_NAME}>
        (read out by {readerName})
      </span>
    </PopoverDefinition>
  )
}
