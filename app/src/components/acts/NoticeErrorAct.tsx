import { NoticeError } from '@/components/layout/NoticeError'

interface NoticeErrorActProps {
  onRetry: () => void
  isRetrying: boolean
}

export function NoticeErrorAct({ onRetry, isRetrying }: NoticeErrorActProps) {
  return (
    <NoticeError
      title="Couldn't load the Act"
      description="Try again in a moment."
      onRetry={onRetry}
      isRetrying={isRetrying}
    />
  )
}
