import { NoticeError } from '@/components/layout/NoticeError'

interface NoticeErrorSittingsProps {
  onRetry: () => void
  isRetrying: boolean
}

export function NoticeErrorSittings({
  onRetry,
  isRetrying,
}: NoticeErrorSittingsProps) {
  return (
    <NoticeError
      title="Couldn't load the sittings"
      description="Try again in a moment."
      onRetry={onRetry}
      isRetrying={isRetrying}
    />
  )
}
