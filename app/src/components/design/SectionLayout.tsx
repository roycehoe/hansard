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
import { Link } from '@tanstack/react-router'
import { SearchX } from 'lucide-react'

function noop() {}

const SAMPLE_BREADCRUMB = (
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
          <Link to="/sittings">Sittings</Link>
        </BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbPage>12 October 1993</BreadcrumbPage>
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
            title="Sitting of 12 October 1993"
            description="Debates, questions and statements from this sitting of Parliament."
            breadcrumb={SAMPLE_BREADCRUMB}
            actions={
              <>
                <Button variant="outline">Copy citation</Button>
                <Button>Read on the official record</Button>
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
        description="The speeches did not load. Try again in a moment."
        onRetry={noop}
        isRetrying={false}
      />
    </Section>
  )
}
