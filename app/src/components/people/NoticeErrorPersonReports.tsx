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
      description="The reports did not load. Check your connection and try again."
      onRetry={onRetry}
      isRetrying={isRetrying}
    />
  )
}
