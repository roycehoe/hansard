import { NoticeError } from '@/components/layout/NoticeError'

interface NoticeErrorSearchProps {
  onRetry: () => void
  isRetrying: boolean
}

export function NoticeErrorSearch({
  onRetry,
  isRetrying,
}: NoticeErrorSearchProps) {
  return (
    <NoticeError
      title="Couldn't run the search"
      description="The search did not finish. Try again in a moment."
      onRetry={onRetry}
      isRetrying={isRetrying}
    />
  )
}
