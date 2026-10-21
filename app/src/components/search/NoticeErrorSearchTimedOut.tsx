import { Button } from '@/components/ui/button'
import { Link } from '@tanstack/react-router'
import { ChevronLeft, TriangleAlert } from 'lucide-react'

export function NoticeErrorSearchTimedOut() {
  return (
    <div
      role="alert"
      className="flex w-full flex-col items-center justify-center gap-12 py-24"
    >
      <div className="flex flex-col items-center justify-center gap-3 text-center">
        <TriangleAlert
          size={40}
          aria-hidden="true"
          className="text-destructive"
        />
        <h2 className="text-foreground text-base font-semibold">
          The search took too long
        </h2>
        <p className="text-muted-foreground max-w-100 text-sm">
          Narrow it with a Parliament, a type or a date range, then search
          again.
        </p>
      </div>
      <Button variant="outline" asChild>
        <Link to="/">
          <ChevronLeft />
          Back to home
        </Link>
      </Button>
    </div>
  )
}
