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
      description="The report did not load. Check your connection and try again."
      onRetry={onRetry}
      isRetrying={isRetrying}
    />
  )
}
