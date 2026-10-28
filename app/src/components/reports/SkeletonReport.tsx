import { SkeletonPageHeader } from '@/components/layout/SkeletonPageHeader'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const METADATA_FACT_WIDTHS = ['w-20', 'w-14', 'w-14']

const SPEECH_COUNT = 4

export function SkeletonReport() {
  return (
    <div className="min-h-screen space-y-8">
      <SkeletonPageHeader
        hasDescription={false}
        aboveTitle={<Skeleton className="h-6 w-40" />}
        actions={<Skeleton className="h-9 w-36" />}
      />
      <div className="flex flex-wrap gap-x-10 gap-y-3">
        {METADATA_FACT_WIDTHS.map((factWidth, factIndex) => (
          <div key={factIndex} className="flex flex-col gap-0.5">
            <Skeleton className={cn('h-5', factWidth)} />
            <Skeleton className="h-7 w-10" />
          </div>
        ))}
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
