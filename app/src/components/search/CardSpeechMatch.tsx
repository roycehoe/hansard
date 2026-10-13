import type { SpeechMatchData } from '@/api/search/getSearchSpeeches'
import { BadgeReportType } from '@/components/reports/BadgeReportType'
import { SnippetHighlighted } from '@/components/search/SnippetHighlighted'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatParliament, formatSittingDate } from '@/lib/format'
import { Link } from '@tanstack/react-router'

interface CardSpeechMatchProps {
  result: SpeechMatchData
}

export function CardSpeechMatch({ result }: CardSpeechMatchProps) {
  const hasSpeakerLabel = result.speaker_label !== ''

  return (
    <Card className="gap-3 py-4">
      <CardHeader className="gap-2">
        <CardTitle>
          <Link
            to="/reports/$reportSlug"
            params={{ reportSlug: result.report_slug }}
            hash={`s${result.ordinal}`}
            className="text-primary hover:text-primary-hover focus-visible:ring-ring focus-visible:ring-offset-background rounded-sm outline-hidden hover:underline focus-visible:ring-2 focus-visible:ring-offset-2"
          >
            {result.title}
          </Link>
        </CardTitle>
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span>{formatSittingDate(result.sitting_date)}</span>
          <span>{formatParliament(result.parliament_number)}</span>
          <BadgeReportType reportType={result.report_type} />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {hasSpeakerLabel && (
          <p>
            {result.person_id !== null ? (
              <Link
                to="/people/$personSlug"
                params={{
                  personSlug: `${result.person_id}-${result.person_slug}`,
                }}
                className="text-primary hover:text-primary-hover focus-visible:ring-ring focus-visible:ring-offset-background rounded-sm font-semibold outline-hidden hover:underline focus-visible:ring-2 focus-visible:ring-offset-2"
              >
                {result.speaker_label}
              </Link>
            ) : (
              <span className="font-semibold">{result.speaker_label}</span>
            )}
          </p>
        )}
        <SnippetHighlighted snippet={result.snippet} />
      </CardContent>
    </Card>
  )
}
