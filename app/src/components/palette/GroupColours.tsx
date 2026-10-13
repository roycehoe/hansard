import type { PaletteGroup } from '@/types/palette/interfaces'
import { CardColour } from './CardColour'
import { TableColoursGroup } from './TableColoursGroup'

interface GroupColoursProps {
  group: PaletteGroup
  flavourTitle?: string
}

export function GroupColours({ group, flavourTitle }: GroupColoursProps) {
  return (
    <>
      <div className="hidden xl:block">
        <TableColoursGroup group={group} flavourTitle={flavourTitle} />
      </div>
      <div className="space-y-4 xl:hidden">
        {group.rows.map((row) => (
          <CardColour key={row.colour.name} row={row} />
        ))}
      </div>
    </>
  )
}
