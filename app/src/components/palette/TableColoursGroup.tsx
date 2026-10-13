import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { TOKEN_GROUP_TITLES } from '@/constants/palette/constants'
import { ColourFormat } from '@/constants/palette/enums'
import { BadgeColourTokens } from './BadgeColourTokens'
import { ButtonCopyColourValue } from './ButtonCopyColourValue'
import { getColourValues } from './getColourValues'
import type { PaletteGroup } from './interfaces'
import { NoticeColourProvenance } from './NoticeColourProvenance'
import { SwatchColour } from './SwatchColour'

interface TableColoursGroupProps {
  group: PaletteGroup
  flavourTitle: string
}

const VALUE_COLUMNS = Object.values(ColourFormat)

export function TableColoursGroup({
  group,
  flavourTitle,
}: TableColoursGroupProps) {
  return (
    <Table>
      <TableCaption className="sr-only">
        {TOKEN_GROUP_TITLES[group.group]} colours in the {flavourTitle} flavour
      </TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>
            <span className="sr-only">Swatch</span>
          </TableHead>
          <TableHead>Name</TableHead>
          {VALUE_COLUMNS.map((format) => (
            <TableHead key={format}>{format}</TableHead>
          ))}
          <TableHead>Source</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {group.rows.map((row) => (
          <TableRow key={row.colour.name}>
            <TableCell>
              <SwatchColour colour={row.colour} />
            </TableCell>
            <TableCell className="max-w-56 space-y-2 whitespace-normal">
              <p className="font-mono font-medium break-words">
                {row.colour.name}
              </p>
              <BadgeColourTokens tokens={row.tokens} />
            </TableCell>
            {getColourValues(row.colour.hex).map((entry) => (
              <TableCell key={entry.format}>
                <ButtonCopyColourValue
                  format={entry.format}
                  value={entry.value}
                />
              </TableCell>
            ))}
            <TableCell className="min-w-64 whitespace-normal">
              <NoticeColourProvenance colour={row.colour} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
