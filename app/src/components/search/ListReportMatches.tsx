import type { ReportMatchData } from '@/api/search/getSearchReports'
import { NoticeEmpty } from '@/components/layout/NoticeEmpty'
import { CardReportMatch } from '@/components/search/CardReportMatch'
import { SearchX } from 'lucide-react'

interface ListReportMatchesProps {
  results: ReportMatchData[]
}

export function ListReportMatches({ results }: ListReportMatchesProps) {
  return (
    <section aria-labelledby="title-matches-heading" className="space-y-4">
      <h2 id="title-matches-heading" className="font-serif text-xl lg:text-2xl">
        Title matches
      </h2>
      {results.length === 0 ? (
        <div role="status">
          <NoticeEmpty
            icon={SearchX}
            title="No title matches"
            description='Nothing matches these words. Common words such as "the" are ignored. Try different words or a wider date range.'
          />
        </div>
      ) : (
        <>
          <p role="status" className="sr-only">
            {results.length} title matches on this page
          </p>
          <ol className="space-y-4">
            {results.map((result) => (
              <li key={result.report_slug}>
                <CardReportMatch result={result} />
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  )
}
