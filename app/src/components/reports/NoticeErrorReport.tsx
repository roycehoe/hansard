import { NoticeError } from '@/components/layout/NoticeError'

interface NoticeErrorReportProps {
  onRetry: () => void
  isRetrying: boolean
}

export function NoticeErrorReport({
  onRetry,
  isRetrying,
}: NoticeErrorReportProps) {
  return (
    <NoticeError
      title="Couldn't load the report"
      description="Try again in a moment."
      onRetry={onRetry}
      isRetrying={isRetrying}
    />
  )
}
