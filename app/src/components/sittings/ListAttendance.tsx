import type { AttendanceData } from '@/api/sittings/getSitting'
import { Link } from '@tanstack/react-router'

interface ListAttendanceProps {
  attendance: AttendanceData[]
}

interface ListAttendanceGroupProps {
  headingId: string
  heading: string
  members: AttendanceData[]
  note?: string
}

function ListAttendanceGroup({
  headingId,
  heading,
  members,
  note,
}: ListAttendanceGroupProps) {
  return (
    <section aria-labelledby={headingId} className="space-y-2">
      <h3 id={headingId} className="font-serif text-lg lg:text-xl">
        {heading} ({members.length})
      </h3>
      {note && <p className="text-muted-foreground text-sm">{note}</p>}
      {members.length > 0 && (
        <ul>
          {members.map((member, index) => (
            <li key={`${member.name}-${index}`} className="py-1">
              {member.person_id !== null ? (
                <Link
                  to="/people/$personSlug"
                  params={{
                    personSlug: `${member.person_id}-${member.person_slug}`,
                  }}
                  className="text-primary hover:text-primary-hover focus-visible:ring-ring focus-visible:ring-offset-background rounded-sm outline-hidden hover:underline focus-visible:ring-2 focus-visible:ring-offset-2"
                >
                  {member.name}
                </Link>
              ) : (
                <span>{member.name}</span>
              )}
              {member.constituency !== '' && (
                <span className="text-muted-foreground">
                  {' '}
                  {member.constituency}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export function ListAttendance({ attendance }: ListAttendanceProps) {
  return (
    <div className="space-y-8">
      <ListAttendanceGroup
        headingId="present-heading"
        heading="Present"
        members={attendance.filter((member) => member.is_present)}
      />
      <ListAttendanceGroup
        headingId="absent-heading"
        heading="Absent"
        members={attendance.filter((member) => !member.is_present)}
        note="An absence can have many causes, including leave and official duties."
      />
    </div>
  )
}
