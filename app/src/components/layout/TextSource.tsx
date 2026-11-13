import { formatSittingDate } from '@/lib/format'

interface TextSourceProps {
  sourceName?: string
  sittingDate: string | null
  officialRecordUrl: string | null
}

const SOURCE_NAME = 'Parliament of Singapore, Official Report'

const LINK_CLASS_NAME =
  'text-link outline-hidden hover:underline underline underline-offset-4 focus-visible:underline focus-visible:decoration-ring'

export function TextSource({
  sourceName = SOURCE_NAME,
  sittingDate,
  officialRecordUrl,
}: TextSourceProps) {
  const sourceText =
    sittingDate === null
      ? sourceName
      : `${sourceName}, ${formatSittingDate(sittingDate)}`

  return (
    <p className="text-muted-foreground text-sm">
      Source:{' '}
      {officialRecordUrl === null ? (
        sourceText
      ) : (
        <a
          href={officialRecordUrl}
          target="_blank"
          rel="noreferrer"
          className={LINK_CLASS_NAME}
        >
          {sourceText}
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      )}
    </p>
  )
}
