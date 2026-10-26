import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import type { ErrorComponentProps } from '@tanstack/react-router'
import { Link, useRouter } from '@tanstack/react-router'
import { ChevronLeft, RotateCw } from 'lucide-react'

const ERROR_PAGE_TITLE = 'Page did not load'

export function NoticeErrorPage({ reset }: ErrorComponentProps) {
  const router = useRouter()
  useDocumentTitle(ERROR_PAGE_TITLE)

  function retry() {
    reset()
    void router.invalidate()
  }

  return (
    <div role="alert" className="space-y-8">
      <PageHeader
        title="This page did not load"
        description="Something went wrong on our side. Try again in a moment, or go back to the home page."
      />
      <div className="flex flex-row flex-wrap items-center gap-4">
        <Button variant="outline" asChild>
          <Link to="/">
            <ChevronLeft />
            Back to home
          </Link>
        </Button>
        <Button variant="default" onClick={retry}>
          <RotateCw />
          Try again
        </Button>
      </div>
    </div>
  )
}
