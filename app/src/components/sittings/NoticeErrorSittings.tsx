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
      description="The sittings did not load. Check your connection and try again."
      onRetry={onRetry}
      isRetrying={isRetrying}
    />
  )
}
