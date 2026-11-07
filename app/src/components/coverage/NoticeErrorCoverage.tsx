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
      description="Try again in a moment."
      onRetry={onRetry}
      isRetrying={isRetrying}
    />
  )
}
