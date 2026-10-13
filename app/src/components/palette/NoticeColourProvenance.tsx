import { THUMBNAIL_PATH, THUMBNAIL_SIZES } from '@/constants/palette/constants'
import type { Colour, Source } from '@/palette/palette'
import { SOURCES } from '@/palette/palette'

interface NoticeColourProvenanceProps {
  colour: Colour
}

const LINK_CLASSES =
  'rounded-sm text-primary underline-offset-4 outline-hidden hover:text-primary-hover hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'

function NoticeSourcePhoto({
  source,
  note,
}: {
  source: Extract<Source, { kind: 'photo' }>
  note?: string
}) {
  const size = THUMBNAIL_SIZES[source.file]
  return (
    <figure className="flex items-start gap-3">
      <img
        src={`${THUMBNAIL_PATH}/${source.file}`}
        alt={source.description}
        loading="lazy"
        width={size.width}
        height={size.height}
        className="border-border h-auto w-24 shrink-0 rounded-md border"
      />
      <figcaption className="text-muted-foreground space-y-1 text-xs whitespace-normal">
        {note && <p>{note}</p>}
        <p>
          Photo by {source.author}, {source.licence}.
        </p>
        <p>
          Source:{' '}
          <a href={source.url} className={LINK_CLASSES}>
            {source.file}
          </a>
        </p>
      </figcaption>
    </figure>
  )
}

function NoticeSourceSpec({
  source,
}: {
  source: Extract<Source, { kind: 'spec' }>
}) {
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
    return <NoticeSourcePhoto source={source} note={colour.sampled?.note} />
  }
  return <NoticeSourceSpec source={source} />
}
