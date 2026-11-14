import { NoticeError } from '@/components/layout/NoticeError'

interface NoticeErrorPersonBillsProps {
  onRetry: () => void
  isRetrying: boolean
}

export function NoticeErrorPersonBills({
  onRetry,
  isRetrying,
}: NoticeErrorPersonBillsProps) {
  return (
    <NoticeError
      title="Couldn't load the Bills"
      description="Try again in a moment."
      onRetry={onRetry}
      isRetrying={isRetrying}
    />
  )
}
