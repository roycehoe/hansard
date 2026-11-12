import { NoticeError } from '@/components/layout/NoticeError'

interface NoticeErrorActsProps {
  onRetry: () => void
  isRetrying: boolean
}

export function NoticeErrorActs({ onRetry, isRetrying }: NoticeErrorActsProps) {
  return (
    <NoticeError
      title="Couldn't load the Acts"
      description="Try again in a moment."
      onRetry={onRetry}
      isRetrying={isRetrying}
    />
  )
}
