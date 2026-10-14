import { NoticeError } from '@/components/layout/NoticeError'

interface NoticeErrorParliamentsProps {
  onRetry: () => void
  isRetrying: boolean
}

export function NoticeErrorParliaments({
  onRetry,
  isRetrying,
}: NoticeErrorParliamentsProps) {
  return (
    <NoticeError
      title="Couldn't load the Parliaments"
      description="The Parliament list did not load. Try again in a moment."
      onRetry={onRetry}
      isRetrying={isRetrying}
    />
  )
}
