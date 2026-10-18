import { formatSittingDate } from '@/lib/format'

interface TextSourceProps {
  sittingDate: string | null
  officialRecordUrl: string | null
}

const SOURCE_NAME = 'Parliament of Singapore, Official Report'

const LINK_CLASS_NAME =
  'text-primary hover:text-primary-hover focus-visible:ring-ring focus-visible:ring-offset-background rounded-sm outline-hidden hover:underline focus-visible:ring-2 focus-visible:ring-offset-2'

export function TextSource({
  sittingDate,
  officialRecordUrl,
}: TextSourceProps) {
  const sourceText =
    sittingDate === null
      ? SOURCE_NAME
      : `${SOURCE_NAME}, ${formatSittingDate(sittingDate)}`

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
