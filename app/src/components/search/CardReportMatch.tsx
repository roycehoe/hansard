import type { ReportMatchData } from '@/api/search/getSearchReports'
import { BadgeReportType } from '@/components/reports/BadgeReportType'
import { SnippetHighlighted } from '@/components/search/SnippetHighlighted'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TEXT_NOT_IN_ARCHIVE_LABEL } from '@/constants/constants'
import { formatParliament, formatSittingDate } from '@/lib/format'
import { Link } from '@tanstack/react-router'

interface CardReportMatchProps {
  result: ReportMatchData
}

export function CardReportMatch({ result }: CardReportMatchProps) {
  return (
    <Card className="gap-3 py-4">
      <CardHeader className="gap-2">
        <CardTitle>
          <Link
            to="/reports/$reportSlug"
            params={{ reportSlug: result.report_slug }}
            className="text-primary hover:text-primary-hover focus-visible:ring-ring focus-visible:ring-offset-background rounded-sm outline-hidden hover:underline focus-visible:ring-2 focus-visible:ring-offset-2"
          >
            {result.title}
          </Link>
        </CardTitle>
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span>{formatSittingDate(result.sitting_date)}</span>
          <span>{formatParliament(result.parliament_number)}</span>
          <BadgeReportType reportType={result.report_type} />
          <Badge variant="outline">Title match</Badge>
          {!result.is_text_available && (
            <span>{TEXT_NOT_IN_ARCHIVE_LABEL}</span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <SnippetHighlighted snippet={result.snippet} />
      </CardContent>
    </Card>
  )
}
