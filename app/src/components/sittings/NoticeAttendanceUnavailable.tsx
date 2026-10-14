import { useGetCoverage } from '@/api/coverage/getCoverage'
import { NoticeEmpty } from '@/components/layout/NoticeEmpty'
import { formatSittingDate } from '@/lib/format'
import { Users } from 'lucide-react'

export function NoticeAttendanceUnavailable() {
  const { data } = useGetCoverage()
  const attendanceLastSittingDate = data?.attendance_last_sitting_date

  return (
    <NoticeEmpty
      icon={Users}
      title="Attendance for this sitting isn't in this archive yet"
      description={
        attendanceLastSittingDate
          ? `Attendance lists run up to ${formatSittingDate(attendanceLastSittingDate)}.`
          : undefined
      }
    />
  )
}
