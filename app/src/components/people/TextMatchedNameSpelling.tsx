import type { PersonData } from '@/api/people/getAllPersons'
import { TextHighlighted } from '@/components/reports/TextHighlighted'
import { getMatchedNameSpelling, getOtherNameLabel } from '@/lib/personName'

interface TextMatchedNameSpellingProps {
  typedName: string
  person: PersonData
  namePattern?: RegExp
}

export function TextMatchedNameSpelling({
  typedName,
  person,
  namePattern,
}: TextMatchedNameSpellingProps) {
  const matchedNameSpelling = getMatchedNameSpelling(typedName, person)
  if (matchedNameSpelling === undefined) return null

  return (
    <p className="text-muted-foreground text-sm">
      {getOtherNameLabel(matchedNameSpelling.kind)}{' '}
      <TextHighlighted
        text={matchedNameSpelling.spelling}
        pattern={namePattern}
      />
    </p>
  )
}
