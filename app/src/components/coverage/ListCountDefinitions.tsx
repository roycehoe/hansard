import { COUNT_DEFINITIONS } from '@/constants/coverage/constants'

export function ListCountDefinitions() {
  return (
    <dl className="max-w-prose space-y-3 text-sm">
      {COUNT_DEFINITIONS.map((entry) => (
        <div key={entry.term} className="space-y-1">
          <dt className="font-medium">{entry.term}</dt>
          <dd className="text-muted-foreground">{entry.definition}</dd>
        </div>
      ))}
    </dl>
  )
}
