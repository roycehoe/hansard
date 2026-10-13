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
      description="The Parliament list did not load. Check your connection and try again."
      onRetry={onRetry}
      isRetrying={isRetrying}
    />
  )
}
