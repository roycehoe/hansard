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
      description="The search did not finish. Check your connection and try again."
      onRetry={onRetry}
      isRetrying={isRetrying}
    />
  )
}
