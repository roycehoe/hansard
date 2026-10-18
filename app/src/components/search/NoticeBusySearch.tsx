import { NoticeError } from '@/components/layout/NoticeError'

interface NoticeBusySearchProps {
  onRetry: () => void
  isRetrying: boolean
}

export function NoticeBusySearch({
  onRetry,
  isRetrying,
}: NoticeBusySearchProps) {
  return (
    <NoticeError
      title="Search is busy"
      description="Too many searches are running. Try again in a moment."
      onRetry={onRetry}
      isRetrying={isRetrying}
    />
  )
}
