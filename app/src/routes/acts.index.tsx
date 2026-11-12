import type { ActSummaryData } from '@/api/acts/getAllActs'
import { useGetAllActs } from '@/api/acts/getAllActs'
import { FormFilterActs } from '@/components/acts/FormFilterActs'
import { ListActs } from '@/components/acts/ListActs'
import { NoticeErrorActs } from '@/components/acts/NoticeErrorActs'
import { SkeletonActs } from '@/components/acts/SkeletonActs'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { isEveryWordMatched, splitIntoWords } from '@/lib/utils'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { z } from 'zod'

const actsSearchSchema = z.object({
  title: z.string().optional(),
})

function filterActsByTitle(
  acts: ActSummaryData[],
  typedTitle: string
): ActSummaryData[] {
  const typedWords = splitIntoWords(typedTitle)
  return acts.filter((act) =>
    isEveryWordMatched(typedWords, splitIntoWords(act.title))
  )
}

export const Route = createFileRoute('/acts/')({
  validateSearch: actsSearchSchema,
  component: function PageActs() {
    useDocumentTitle('Acts')
    const { title } = Route.useSearch()
    const navigate = useNavigate()
    const acts = useGetAllActs({})
    const [typedTitle, setTypedTitle] = useState<string>(title ?? '')

    function retryActs() {
      void acts.refetch()
    }

    function changeTitle(nextTitle: string) {
      setTypedTitle(nextTitle)
      void navigate({
        to: '/acts',
        search: { title: nextTitle.trim() === '' ? undefined : nextTitle },
        replace: true,
      })
    }

    function renderBody() {
      if (acts.isLoading) return <SkeletonActs />
      if (acts.isLoadingError || !acts.data) {
        return (
          <NoticeErrorActs onRetry={retryActs} isRetrying={acts.isRefetching} />
        )
      }
      return (
        <div className="space-y-6">
          <FormFilterActs value={typedTitle} onChange={changeTitle} />
          <ListActs acts={filterActsByTitle(acts.data.acts, typedTitle)} />
        </div>
      )
    }

    return (
      <div className="space-y-8">
        <PageHeader
          title="Acts"
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
                  <BreadcrumbPage>Acts</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          }
        />
        {renderBody()}
      </div>
    )
  },
})
