import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getColourValues } from '@/lib/colour'
import type { PaletteRow } from '@/types/palette/interfaces'
import { BadgeColourTokens } from './BadgeColourTokens'
import { ButtonCopyColourValue } from './ButtonCopyColourValue'
import { NoticeColourProvenance } from './NoticeColourProvenance'
import { SwatchColour } from './SwatchColour'

interface CardColourProps {
  row: PaletteRow
}

export function CardColour({ row }: CardColourProps) {
  return (
    <Card className="gap-4 py-4">
      <CardHeader className="flex items-center gap-3 px-4">
        <SwatchColour colour={row.colour} />
        <CardTitle className="font-mono break-words">
          {row.colour.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-4">
        <dl className="space-y-1">
          {getColourValues(row.colour.hex).map((entry) => (
            <div
              key={entry.format}
              className="flex flex-wrap items-center gap-x-2"
            >
              <dt className="text-muted-foreground w-14 shrink-0 text-xs">
                {entry.format}
              </dt>
              <dd>
                <ButtonCopyColourValue
                  colourName={row.colour.name}
                  format={entry.format}
                  value={entry.value}
                />
              </dd>
            </div>
          ))}
        </dl>
        <BadgeColourTokens tokens={row.tokens} />
        <NoticeColourProvenance colour={row.colour} />
      </CardContent>
    </Card>
  )
}
