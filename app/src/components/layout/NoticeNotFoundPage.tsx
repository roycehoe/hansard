import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { Link } from '@tanstack/react-router'
import { ChevronLeft } from 'lucide-react'

const NOT_FOUND_PAGE_TITLE = 'Page not found'

export function NoticeNotFoundPage() {
  useDocumentTitle(NOT_FOUND_PAGE_TITLE)

  return (
    <div className="space-y-8">
      <PageHeader
        title={NOT_FOUND_PAGE_TITLE}
        description="No page has this address. Check it for a typo, or start again from the home page."
      />
      <Button variant="outline" asChild>
        <Link to="/">
          <ChevronLeft />
          Back to home
        </Link>
      </Button>
    </div>
  )
}
