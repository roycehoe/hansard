import {
  SEARCH_HELP_EXAMPLES,
  SEARCH_HELP_FILTERS_TEXT,
  SEARCH_HELP_LEGAL_SHORTHAND_EXAMPLES,
  SEARCH_HELP_LEGAL_SHORTHAND_LABEL,
} from '@/constants/search/constants'
import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'

const EXAMPLE_LIST_CLASS_NAME =
  'flex flex-col gap-3 xl:grid xl:grid-cols-[13rem_1fr] xl:gap-x-6 xl:gap-y-2'

export function TextSearchHelp() {
  return (
    <>
      <dl className={EXAMPLE_LIST_CLASS_NAME}>
        {SEARCH_HELP_EXAMPLES.map((example) => (
          <div key={example.query} className="xl:contents">
            <dt>
              <code className="font-mono">{example.query}</code>
            </dt>
            <dd className="text-muted-foreground">{example.meaning}</dd>
          </div>
        ))}
      </dl>
      <details className="group border-separator mt-3 border-t pt-3">
        <summary className="focus-visible:outline-ring flex cursor-pointer list-none items-center justify-between gap-2 rounded-sm outline-hidden focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-solid [&::-webkit-details-marker]:hidden">
          {SEARCH_HELP_LEGAL_SHORTHAND_LABEL}
          <ChevronDown
            aria-hidden="true"
            className="text-muted-foreground size-4 shrink-0 transition-transform duration-200 group-open:rotate-180"
          />
        </summary>
        <dl className={cn(EXAMPLE_LIST_CLASS_NAME, 'mt-3')}>
          {SEARCH_HELP_LEGAL_SHORTHAND_EXAMPLES.map((example) => (
            <div key={example.queries[0]} className="xl:contents">
              <dt className="flex flex-col">
                {example.queries.map((query) => (
                  <code key={query} className="font-mono">
                    {query}
                  </code>
                ))}
              </dt>
              <dd className="text-muted-foreground">{example.meaning}</dd>
            </div>
          ))}
        </dl>
      </details>
      <p className="text-muted-foreground border-separator mt-3 border-t pt-3">
        {SEARCH_HELP_FILTERS_TEXT}
      </p>
    </>
  )
}
