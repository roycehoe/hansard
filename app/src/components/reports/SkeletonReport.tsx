import { Skeleton } from '@/components/ui/skeleton'
import {
  REPORT_HEADER_ACTION_CLASS_NAME,
  REPORT_HEADER_CLASS_NAME,
  REPORT_HEADER_MAIN_CLASS_NAME,
  REPORT_HEADER_TRAIL_CLASS_NAME,
} from '@/constants/reports/constants'
import { cn } from '@/lib/utils'

const METADATA_FACT_WIDTHS = ['w-24', 'w-20', 'w-16']

const SPEECH_COUNT = 4

export function SkeletonReport() {
  return (
    <div className="min-h-screen space-y-6">
      <div className={REPORT_HEADER_CLASS_NAME}>
        <Skeleton
          className={cn(
            REPORT_HEADER_TRAIL_CLASS_NAME,
            'h-5 w-32 sm:h-4 sm:w-48'
          )}
        />
        <div className={REPORT_HEADER_MAIN_CLASS_NAME}>
          <Skeleton className="mb-0.5 h-6 w-40" />
          <Skeleton className="h-8 w-full max-w-md lg:h-9" />
          <Skeleton className="h-5 w-64" />
          <div className="mt-2 flex flex-wrap gap-x-5">
            {METADATA_FACT_WIDTHS.map((factWidth, factIndex) => (
              <Skeleton key={factIndex} className={cn('h-5', factWidth)} />
            ))}
          </div>
        </div>
        <Skeleton className={cn(REPORT_HEADER_ACTION_CLASS_NAME, 'h-8 w-32')} />
      </div>
      <div className="max-w-[70ch] space-y-6 in-data-[width=wide]:max-w-none">
        {Array.from({ length: SPEECH_COUNT }, (_, speechIndex) => (
          <div key={speechIndex} className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  )
}
