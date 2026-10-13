import { TOKEN_GROUP_TITLES } from '@/constants/palette/constants'
import type { Flavour } from '@/constants/palette/enums'
import { cn } from '@/lib/utils'
import { buildPaletteGroups } from './buildPaletteGroups'
import { CardColour } from './CardColour'
import { TableColoursGroup } from './TableColoursGroup'

interface SectionFlavourProps {
  flavour: Flavour
  title: string
}

export function SectionFlavour({ flavour, title }: SectionFlavourProps) {
  const headingId = `flavour-${flavour}`

  return (
    <section
      aria-labelledby={headingId}
      className={cn(
        flavour,
        'bg-background text-foreground border-separator space-y-8 rounded-xl border p-4 sm:p-6'
      )}
    >
      <h2 id={headingId} className="font-serif text-2xl font-semibold">
        {title}
      </h2>
      {buildPaletteGroups(flavour).map((group) => (
        <div key={group.group} className="space-y-4">
          <h3 className="font-serif text-xl font-semibold">
            {TOKEN_GROUP_TITLES[group.group]}
          </h3>
          <div className="hidden sm:block">
            <TableColoursGroup group={group} flavourTitle={title} />
          </div>
          <div className="space-y-4 sm:hidden">
            {group.rows.map((row) => (
              <CardColour key={row.colour.name} row={row} />
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}
