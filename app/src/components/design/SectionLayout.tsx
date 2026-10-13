import { Example, Section } from '@/components/design/Section'
import { EmptyState } from '@/components/layout/EmptyState'
import { ErrorState } from '@/components/layout/ErrorState'
import { PageHeader } from '@/components/layout/PageHeader'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { SiteHeader } from '@/components/layout/SiteHeader'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { SearchX } from 'lucide-react'

function noop() {}

const SAMPLE_BREADCRUMB = (
  <Breadcrumb>
    <BreadcrumbList>
      <BreadcrumbItem>
        <BreadcrumbLink href="#">Home</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbLink href="#">Sittings</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbPage>13 October 2026</BreadcrumbPage>
      </BreadcrumbItem>
    </BreadcrumbList>
  </Breadcrumb>
)

export function LayoutSection() {
  return (
    <Section
      id="layout"
      title="Layout"
      description="Site chrome and page-level states."
    >
      <Example label="SiteHeader">
        <div className="border-separator w-full overflow-hidden rounded-md border">
          <SiteHeader />
        </div>
      </Example>
      <Example label="SiteFooter">
        <div className="border-separator w-full overflow-hidden rounded-md border">
          <SiteFooter />
        </div>
      </Example>
      <Example label="PageHeader, title only">
        <div className="w-full">
          <PageHeader title="Sittings" />
        </div>
      </Example>
      <Example label="PageHeader with description, breadcrumb and actions">
        <div className="w-full">
          <PageHeader
            title="Sitting of 13 October 2026"
            description="Debates, questions and statements from this sitting of Parliament."
            breadcrumb={SAMPLE_BREADCRUMB}
            actions={
              <>
                <Button variant="outline">Share</Button>
                <Button>Download</Button>
              </>
            }
          />
        </div>
      </Example>
      <Example label="EmptyState without an action">
        <div className="w-full">
          <EmptyState
            icon={SearchX}
            title="No speeches found"
            description="Nothing matches this search. Try a different word or a wider date range."
          />
        </div>
      </Example>
      <Example label="EmptyState with an action">
        <div className="w-full">
          <EmptyState
            icon={SearchX}
            title="No speeches found"
            description="Nothing matches this search. Try a different word or a wider date range."
            action={<Button variant="outline">Clear filters</Button>}
          />
        </div>
      </Example>
      <Example label="ErrorState">
        <div className="w-full">
          <ErrorState
            title="Couldn't load the speeches"
            description="The speeches did not load. Check your connection and try again."
            onRetry={noop}
            isRetrying={false}
          />
        </div>
      </Example>
    </Section>
  )
}
