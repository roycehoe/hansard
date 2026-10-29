import { NoticeError } from '@/components/layout/NoticeError'
import { AnalyticsEvent } from '@/constants/analytics/enums'
import { countEvent } from '@/lib/analytics'
import { useEffect } from 'react'

interface NoticeErrorSearchBusyProps {
  onRetry: () => void
  isRetrying: boolean
}

export function NoticeErrorSearchBusy({
  onRetry,
  isRetrying,
}: NoticeErrorSearchBusyProps) {
  useEffect(function countSearchBusy() {
    countEvent(AnalyticsEvent.SEARCH_BUSY)
  }, [])
  return (
    <NoticeError
      title="Search is busy"
      description="Too many searches are running. Try again in a moment."
      onRetry={onRetry}
      isRetrying={isRetrying}
    />
  )
}
