import {
  buildReportPictureUrl,
  type ReportPictureData,
  type TypedCopyData,
} from '@/api/reports/getReport'
import { ListPictureDivision } from '@/components/reports/ListPictureDivision'
import { TableTypedCopy } from '@/components/reports/TableTypedCopy'
import { TextPictureSource } from '@/components/reports/TextPictureSource'
import { TextTypedCopy } from '@/components/reports/TextTypedCopy'
import { PictureKind } from '@/constants/reports/enums'

interface RowPictureProps {
  reportSlug: string
  picture: ReportPictureData
  hasColumnMarkers: boolean
}

const PICTURE_ALT = 'Picture printed in the record'

function renderTypedCopy(kind: PictureKind, typedCopy: TypedCopyData) {
  if (kind === PictureKind.TABLE) {
    return typedCopy.tables.map((table, index) => (
      <TableTypedCopy key={index} table={table} />
    ))
  }
  if (kind === PictureKind.DIVISION_LIST) {
    return <ListPictureDivision groups={typedCopy.tables} />
  }
  if (kind === PictureKind.TEXT) {
    return typedCopy.tables.flatMap((table) =>
      table.body_rows.map((row, index) => (
        <p key={index} className="mt-2 text-xs leading-5">
          <TextTypedCopy text={row[0]} />
        </p>
      ))
    )
  }
  return null
}

export function RowPicture({
  reportSlug,
  picture,
  hasColumnMarkers,
}: RowPictureProps) {
  const pictureUrl = buildReportPictureUrl(reportSlug, picture.sha256)
  const { typed_copy: typedCopy } = picture

  return (
    <div className="mt-4 flex flex-col sm:flex-row sm:gap-2">
      {hasColumnMarkers && (
        <div className="hidden in-data-[columns=show]:block sm:w-16 sm:shrink-0" />
      )}
      <div className="max-w-[70ch] min-w-0 in-data-[width=wide]:max-w-none sm:flex-1">
        {typedCopy === null ? (
          <img
            src={pictureUrl}
            alt={PICTURE_ALT}
            loading="lazy"
            className="block h-auto max-w-full"
          />
        ) : (
          <>
            {typedCopy.heading !== '' && (
              <p className="text-sm leading-5">
                <TextTypedCopy text={typedCopy.heading} />
              </p>
            )}
            {renderTypedCopy(picture.kind, typedCopy)}
            <TextPictureSource href={pictureUrl} />
          </>
        )}
      </div>
    </div>
  )
}
