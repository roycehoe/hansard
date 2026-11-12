import { NoticeError } from '@/components/layout/NoticeError'

interface NoticeErrorPersonTimelineProps {
  onRetry: () => void
  isRetrying: boolean
}

export function NoticeErrorPersonTimeline({
  onRetry,
  isRetrying,
}: NoticeErrorPersonTimelineProps) {
  return (
    <NoticeError
      title="Couldn't load the offices and Bills"
      description="Try again in a moment."
      onRetry={onRetry}
      isRetrying={isRetrying}
    />
  )
}
