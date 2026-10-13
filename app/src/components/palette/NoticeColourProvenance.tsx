import { THUMBNAIL_PATH } from '@/constants/palette/constants'
import type { Colour, Source } from '@/palette/palette'
import { SOURCES } from '@/palette/palette'
import type {
  NoticeSourcePhotoProps,
  NoticeSourceSpecProps,
} from '@/types/palette/interfaces'

interface NoticeColourProvenanceProps {
  colour: Colour
}

const LINK_CLASSES =
  'rounded-sm text-primary underline-offset-4 outline-hidden hover:text-primary-hover hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'

function NoticeSourcePhoto({
  source,
  note,
  sampleBox,
}: NoticeSourcePhotoProps) {
  const caption = (
    <>
      {note && <p>{note}</p>}
      {sampleBox && <p>Sampled at box {sampleBox}.</p>}
      <p>{source.credit}.</p>
      {source.thumbnailBox && <p>Thumbnail shows part of the photo.</p>}
      <p>
        <a href={source.url} className={LINK_CLASSES}>
          {source.title}
        </a>
        ,{' '}
        <a href={source.licenceUrl} className={LINK_CLASSES}>
          {source.licence}
        </a>
        .
      </p>
      {source.isShown === false && <p>Photo not shown: {source.reason}.</p>}
    </>
  )

  if (source.isShown === false) {
    return (
      <div className="text-muted-foreground space-y-1 text-xs whitespace-normal">
        {caption}
      </div>
    )
  }

  return (
    <figure className="flex items-start gap-3">
      <img
        src={`${THUMBNAIL_PATH}/${source.file}`}
        alt={source.description}
        loading="lazy"
        width={source.width}
        height={source.height}
        className="border-border h-auto w-24 shrink-0 rounded-md border"
      />
      <figcaption className="text-muted-foreground space-y-1 text-xs whitespace-normal">
        {caption}
      </figcaption>
    </figure>
  )
}

function NoticeSourceSpec({ source }: NoticeSourceSpecProps) {
  return (
    <div className="text-muted-foreground space-y-1 text-xs whitespace-normal">
      <p>
        <a href={source.url} className={LINK_CLASSES}>
          {source.title}
        </a>
      </p>
      <p>{source.description}.</p>
    </div>
  )
}

export function NoticeColourProvenance({
  colour,
}: NoticeColourProvenanceProps) {
  if (colour.derivedFrom) {
    return (
      <p className="text-muted-foreground text-xs whitespace-normal">
        Derived from{' '}
        <span className="text-foreground font-mono">{colour.derivedFrom}</span>.
        OKLCH {colour.derivation}.
      </p>
    )
  }

  const source: Source = SOURCES[colour.source]
  if (source.kind === 'photo') {
    return (
      <NoticeSourcePhoto
        source={source}
        note={colour.sampled?.note}
        sampleBox={colour.sampled?.box.join(',')}
      />
    )
  }
  return <NoticeSourceSpec source={source} />
}
