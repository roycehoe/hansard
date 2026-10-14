import { NoticeError } from '@/components/layout/NoticeError'

interface NoticeErrorPersonsProps {
  onRetry: () => void
  isRetrying: boolean
}

export function NoticeErrorPersons({
  onRetry,
  isRetrying,
}: NoticeErrorPersonsProps) {
  return (
    <NoticeError
      title="Couldn't load the people"
      description="The people did not load. Try again in a moment."
      onRetry={onRetry}
      isRetrying={isRetrying}
    />
  )
}
