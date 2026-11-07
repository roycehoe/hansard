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
            What the archive holds
          </h2>
          <p>
            If you&apos;re following a person&apos;s contributions across
            Parliaments, the archive brings their speeches together. It copies
            text from the Official Report, splits it into speeches and links
            each to a person when the speaker label is enough to tell who spoke.
          </p>
          <p>
            Data quality and methods has the report counts by year, the sample
            check and the known gaps.
          </p>
        </section>

        <section aria-labelledby="download-heading" className="space-y-4">
          <h2 id="download-heading" className={SECTION_HEADING_CLASS_NAME}>
            Bulk data
          </h2>
          <p>
            I&apos;m Royce, and I run the site. There is no bulk download yet,
            but I&apos;ll offer one once enough researchers ask for it.
          </p>
        </section>

        <section aria-labelledby="form-heading" className="space-y-4">
          <h2 id="form-heading" className={SECTION_HEADING_CLASS_NAME}>
            Ask for a download
          </h2>
          <p>
            If you want a download, tell me through the form. Your answers come
            to me, and I use them only to decide whether to offer one.
          </p>
          <Button asChild>
            <a href={RESEARCHERS_FORM_URL} target="_blank" rel="noreferrer">
              Request a download
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </Button>
        </section>
      </div>
    )
  },
})
