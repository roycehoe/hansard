import { LinkExternal } from '@/components/layout/LinkExternal'
import { formatSittingDate } from '@/lib/format'

interface TextSourceProps {
  sourceName?: string
  sittingDate: string | null
  officialRecordUrl: string | null
}

const SOURCE_NAME = 'Parliament of Singapore, Official Report'

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
        <LinkExternal href={officialRecordUrl}>{sourceText}</LinkExternal>
      )}
    </p>
  )
}
