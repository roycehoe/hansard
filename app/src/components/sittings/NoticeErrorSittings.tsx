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
      description="The sittings did not load. Try again in a moment."
      onRetry={onRetry}
      isRetrying={isRetrying}
    />
  )
}
