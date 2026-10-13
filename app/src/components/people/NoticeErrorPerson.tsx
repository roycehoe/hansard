import { NoticeError } from '@/components/layout/NoticeError'

interface NoticeErrorPersonProps {
  onRetry: () => void
  isRetrying: boolean
}

export function NoticeErrorPerson({
  onRetry,
  isRetrying,
}: NoticeErrorPersonProps) {
  return (
    <NoticeError
      title="Couldn't load this person"
      description="This person did not load. Check your connection and try again."
      onRetry={onRetry}
      isRetrying={isRetrying}
    />
  )
}
