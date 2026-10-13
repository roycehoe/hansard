import { DataSection } from '@/components/design/DataSection'
import { FormsSection } from '@/components/design/FormsSection'
import { LayoutSection } from '@/components/design/LayoutSection'
import { NavigationSection } from '@/components/design/NavigationSection'
import { OverlaysSection } from '@/components/design/OverlaysSection'
import { PageHeader } from '@/components/layout/PageHeader'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { createFileRoute } from '@tanstack/react-router'

const SECTIONS = [
  { id: 'forms', label: 'Forms' },
  { id: 'overlays', label: 'Overlays' },
  { id: 'data', label: 'Data' },
  { id: 'navigation', label: 'Navigation' },
  { id: 'layout', label: 'Layout' },
]

export const Route = createFileRoute('/design')({
  component: () => (
    <div className="space-y-16 py-8">
      <PageHeader
        title="Design"
        description="Every primitive and layout piece, in every variant and size. Use the toggle to check both themes."
        actions={<ThemeToggle />}
      />
      <nav aria-label="Sections" className="flex flex-wrap gap-4 text-sm">
        {SECTIONS.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className="text-primary hover:text-primary-hover hover:underline"
          >
            {section.label}
          </a>
        ))}
      </nav>
      <FormsSection />
      <OverlaysSection />
      <DataSection />
      <NavigationSection />
      <LayoutSection />
    </div>
  ),
})
