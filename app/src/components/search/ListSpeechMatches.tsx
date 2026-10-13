import type { SpeechMatchData } from '@/api/search/getSearchSpeeches'
import { NoticeEmpty } from '@/components/layout/NoticeEmpty'
import { CardSpeechMatch } from '@/components/search/CardSpeechMatch'
import { SearchX } from 'lucide-react'

interface ListSpeechMatchesProps {
  results: SpeechMatchData[]
}

export function ListSpeechMatches({ results }: ListSpeechMatchesProps) {
  return (
    <section aria-labelledby="speech-matches-heading" className="space-y-4">
      <h2
        id="speech-matches-heading"
        className="font-serif text-xl lg:text-2xl"
      >
        Speech matches
      </h2>
      {results.length === 0 ? (
        <div role="status">
          <NoticeEmpty
            icon={SearchX}
            title="No speech matches"
            description='Nothing matches these words. Common words such as "the" are ignored. Try different words or a wider date range.'
          />
        </div>
      ) : (
        <>
          <p role="status" className="sr-only">
            {results.length} speech matches on this page
          </p>
          <ol className="space-y-4">
            {results.map((result) => (
              <li key={`${result.report_slug}-${result.ordinal}`}>
                <CardSpeechMatch result={result} />
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  )
}
