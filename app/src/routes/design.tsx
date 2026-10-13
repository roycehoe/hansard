import { SectionData } from '@/components/design/SectionData'
import { SectionForms } from '@/components/design/SectionForms'
import { SectionLayout } from '@/components/design/SectionLayout'
import { SectionNavigation } from '@/components/design/SectionNavigation'
import { SectionOverlays } from '@/components/design/SectionOverlays'
import { PageHeader } from '@/components/layout/PageHeader'
import { createFileRoute } from '@tanstack/react-router'

const SECTIONS = [
  { id: 'forms', label: 'Forms' },
  { id: 'overlays', label: 'Overlays' },
  { id: 'data', label: 'Data' },
  { id: 'navigation', label: 'Navigation' },
  { id: 'layout', label: 'Layout' },
] as const

export const Route = createFileRoute('/design')({
  component: () => (
    <div className="space-y-16">
      <PageHeader
        title="Design"
        description="Every primitive and layout piece, in every variant and size. Use the theme toggle in the header to check both themes."
      />
      <nav aria-label="Sections" className="flex flex-wrap gap-4 text-sm">
        {SECTIONS.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className="text-primary hover:text-primary-hover focus-visible:ring-ring focus-visible:ring-offset-background rounded-sm outline-hidden hover:underline focus-visible:ring-2 focus-visible:ring-offset-2"
          >
            {section.label}
          </a>
        ))}
      </nav>
      <SectionForms />
      <SectionOverlays />
      <SectionData />
      <SectionNavigation />
      <SectionLayout />
    </div>
  ),
})
