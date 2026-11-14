import { PageHeader } from '@/components/layout/PageHeader'
import { SectionFlavour } from '@/components/palette/SectionFlavour'
import { SectionSourceColours } from '@/components/palette/SectionSourceColours'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { FLAVOUR_SECTIONS } from '@/constants/palette/constants'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { createFileRoute, Link } from '@tanstack/react-router'

const PAGE_TITLE = 'Palette'

export const Route = createFileRoute('/about/palette')({
  component: function PagePalette() {
    useDocumentTitle(PAGE_TITLE)
    return (
      <div className="space-y-12">
        <PageHeader
          title={PAGE_TITLE}
          description="Every colour is taken from the debating chamber in Parliament House, the grounds outside it, the Speaker's gown or the national insignia. Derived colours are named for their parent plus OKLCH lightness times 100, so panelling-80 is panelling at a lightness of 0.80. A photo with no open licence is linked, not shown."
          breadcrumb={
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/">Home</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/about">About</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{PAGE_TITLE}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          }
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
