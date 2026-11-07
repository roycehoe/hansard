import { NoticeError } from '@/components/layout/NoticeError'

interface NoticeErrorPersonReportsProps {
  onRetry: () => void
  isRetrying: boolean
}

export function NoticeErrorPersonReports({
  onRetry,
  isRetrying,
}: NoticeErrorPersonReportsProps) {
  return (
    <NoticeError
      title="Couldn't load the reports"
      description="Try again in a moment."
      onRetry={onRetry}
      isRetrying={isRetrying}
    />
  )
}
