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
      title="Couldn't load this person's details"
      description="Try again in a moment."
      onRetry={onRetry}
      isRetrying={isRetrying}
    />
  )
}
