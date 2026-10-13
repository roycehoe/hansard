import { PALETTE_GROUPS_BY_FLAVOUR } from '@/constants/palette/constants'
import type { Flavour } from '@/constants/palette/enums'
import { cn } from '@/lib/utils'
import { GroupColours } from './GroupColours'

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
      <h2
        id={headingId}
        className="font-serif text-xl font-semibold lg:text-2xl"
      >
        {title}
      </h2>
      {PALETTE_GROUPS_BY_FLAVOUR[flavour].map((group) => (
        <div key={group.title} className="space-y-4">
          <h3 className="font-serif text-lg font-semibold lg:text-xl">
            {group.title}
          </h3>
          <GroupColours group={group} flavourTitle={title} />
        </div>
      ))}
    </section>
  )
}
