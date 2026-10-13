import { Example, Section } from '@/components/design/Section'
import { NoticeEmpty } from '@/components/layout/NoticeEmpty'
import { NoticeError } from '@/components/layout/NoticeError'
import { PageHeader } from '@/components/layout/PageHeader'
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

export function SectionLayout() {
  return (
    <Section
      id="layout"
      title="Layout"
      description="Page header and page-level notices."
    >
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
      <p className="text-muted-foreground text-sm font-medium">
        NoticeEmpty without an action
      </p>
      <NoticeEmpty
        icon={SearchX}
        title="No speeches found"
        description="Nothing matches this search. Try a different word or a wider date range."
      />
      <p className="text-muted-foreground text-sm font-medium">
        NoticeEmpty with an action
      </p>
      <NoticeEmpty
        icon={SearchX}
        title="No speeches found"
        description="Nothing matches this search. Try a different word or a wider date range."
        action={<Button variant="outline">Clear filters</Button>}
      />
      <p className="text-muted-foreground text-sm font-medium">NoticeError</p>
      <NoticeError
        title="Couldn't load the speeches"
        description="The speeches did not load. Check your connection and try again."
        onRetry={noop}
        isRetrying={false}
      />
    </Section>
  )
}
