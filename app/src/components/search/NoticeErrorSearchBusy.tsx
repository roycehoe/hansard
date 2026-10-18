import { NoticeError } from '@/components/layout/NoticeError'

interface NoticeErrorSearchBusyProps {
  onRetry: () => void
  isRetrying: boolean
}

export function NoticeErrorSearchBusy({
  onRetry,
  isRetrying,
}: NoticeErrorSearchBusyProps) {
  return (
    <NoticeError
      title="Search is busy"
      description="Too many searches are running. Try again in a moment."
      onRetry={onRetry}
      isRetrying={isRetrying}
    />
  )
}
