import { SkeletonPageHeader } from '@/components/layout/SkeletonPageHeader'
import { Skeleton } from '@/components/ui/skeleton'

const METADATA_VALUE_WIDTHS = ['w-32', 'w-28', 'w-10', 'w-40']

const SPEECH_COUNT = 4

export function SkeletonReport() {
  return (
    <div className="space-y-8">
      <SkeletonPageHeader
        hasDescription={false}
        actions={<Skeleton className="h-9 w-36" />}
      />
      <div className="grid gap-x-8 gap-y-3 sm:grid-cols-[auto_1fr]">
        {METADATA_VALUE_WIDTHS.map((valueWidth) => (
          <div key={valueWidth} className="contents">
            <Skeleton className="h-4 w-20" />
            <Skeleton className={`h-5 ${valueWidth}`} />
          </div>
        ))}
      </div>
      <div className="max-w-[70ch] space-y-6">
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
