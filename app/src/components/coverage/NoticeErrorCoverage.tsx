import { NoticeError } from '@/components/layout/NoticeError'

interface NoticeErrorCoverageProps {
  onRetry: () => void
  isRetrying: boolean
}

export function NoticeErrorCoverage({
  onRetry,
  isRetrying,
}: NoticeErrorCoverageProps) {
  return (
    <NoticeError
      title="Couldn't load the coverage figures"
      description="The coverage figures did not load. Check your connection and try again."
      onRetry={onRetry}
      isRetrying={isRetrying}
    />
  )
}
