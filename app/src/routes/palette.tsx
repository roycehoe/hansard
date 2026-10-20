import { PageHeader } from '@/components/layout/PageHeader'
import { SectionFlavour } from '@/components/palette/SectionFlavour'
import { SectionSourceColours } from '@/components/palette/SectionSourceColours'
import { FLAVOUR_SECTIONS } from '@/constants/palette/constants'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/palette')({
  component: function PagePalette() {
    useDocumentTitle('Palette')
    return (
      <div className="space-y-12">
        <PageHeader
          title="Palette"
          description="Every colour is taken from the debating chamber in Parliament House, the grounds outside it, the Speaker's gown or the national insignia. Derived colours are named for their parent plus OKLCH lightness times 100, so panelling-80 is panelling at a lightness of 0.80. A photo with no open licence is linked, not shown."
        />
        <SectionSourceColours />
        {FLAVOUR_SECTIONS.map((section) => (
          <SectionFlavour
            key={section.flavour}
            flavour={section.flavour}
            title={section.title}
          />
        ))}
      </div>
    )
  },
})
