import {
  SEARCH_HELP_EXAMPLES,
  SEARCH_HELP_FILTERS_TEXT,
} from '@/constants/search/constants'

export function TextSearchHelp() {
  return (
    <>
      <dl className="flex flex-col gap-3 xl:grid xl:grid-cols-[max-content_1fr] xl:gap-x-6 xl:gap-y-2">
        {SEARCH_HELP_EXAMPLES.map((example) => (
          <div key={example.query} className="xl:contents">
            <dt>
              <code className="font-mono">{example.query}</code>
            </dt>
            <dd className="text-muted-foreground">{example.meaning}</dd>
          </div>
        ))}
      </dl>
      <p className="text-muted-foreground border-separator mt-3 border-t pt-3">
        {SEARCH_HELP_FILTERS_TEXT}
      </p>
    </>
  )
}
