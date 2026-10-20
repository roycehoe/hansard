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
import { RESEARCHERS_FORM_URL } from '@/constants/constants'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { createFileRoute, Link, redirect } from '@tanstack/react-router'

const SECTION_HEADING_CLASS_NAME = 'font-serif text-xl lg:text-2xl'

export const Route = createFileRoute('/researchers')({
  beforeLoad: function redirectWhileFormUnset() {
    if (RESEARCHERS_FORM_URL === '') throw redirect({ to: '/' })
  },
  component: function PageResearchers() {
    useDocumentTitle('For researchers')

    return (
      <div className="space-y-8">
        <PageHeader
          title="For researchers"
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
                  <BreadcrumbPage>For researchers</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          }
        />

        <section aria-labelledby="holdings-heading" className="space-y-4">
          <h2 id="holdings-heading" className={SECTION_HEADING_CLASS_NAME}>
            What is here
          </h2>
          <p>
            The archive holds report text from the Official Report, split into
            speeches. Each speech is credited to a person when the speaker label
            is enough to tell who spoke.
          </p>
          <p>
            Reports by year, the sample check and the known gaps are on Data
            quality and methods.
          </p>
        </section>

        <section aria-labelledby="download-heading" className="space-y-4">
          <h2 id="download-heading" className={SECTION_HEADING_CLASS_NAME}>
            No download yet
          </h2>
          <p>
            There is no bulk download. Offering one needs Parliament&apos;s
            permission, and it waits until enough researchers ask for it.
          </p>
        </section>

        <section aria-labelledby="form-heading" className="space-y-4">
          <h2 id="form-heading" className={SECTION_HEADING_CLASS_NAME}>
            Ask for the data
          </h2>
          <p>To ask for a download, fill in the form.</p>
          <Button asChild>
            <a href={RESEARCHERS_FORM_URL} target="_blank" rel="noreferrer">
              Open the form
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </Button>
          <p className="text-muted-foreground text-sm">
            The answers go to Royce Hoe, who maintains the site, and are used
            only to decide whether to offer a download.
          </p>
        </section>
      </div>
    )
  },
})
