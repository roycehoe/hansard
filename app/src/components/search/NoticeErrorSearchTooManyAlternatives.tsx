import { SEARCH_MAX_ALTERNATIVE_COMBINATIONS } from '@/constants/search/constants'
import { TriangleAlert } from 'lucide-react'

export function NoticeErrorSearchTooManyAlternatives() {
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
          Use fewer alternatives
        </h2>
        <p className="text-muted-foreground max-w-100 text-sm">
          Remove some alternatives joined by OR to bring this search within the
          limit of {SEARCH_MAX_ALTERNATIVE_COMBINATIONS} combinations.
        </p>
      </div>
    </div>
  )
}
