import type { PersonMembershipData } from '@/api/people/getPerson'
import { useGetPerson } from '@/api/people/getPerson'
import { useGetPersonReports } from '@/api/people/getPersonReports'
import { BadgeSittingMember } from '@/components/people/BadgeSittingMember'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import { Skeleton } from '@/components/ui/skeleton'
import { NUMBER_LOCALE } from '@/constants/constants'
import { formatMembershipParliaments, formatSittingDate } from '@/lib/format'
import { isSittingMember } from '@/lib/utils'
import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'

const OPEN_DELAY_MS = 400

const CLOSE_DELAY_MS = 150

const LINK_CLASS_NAME =
  'text-primary hover:text-primary-hover focus-visible:ring-ring focus-visible:ring-offset-background rounded-sm outline-hidden hover:underline focus-visible:ring-2 focus-visible:ring-offset-2'

interface HoverCardPersonProps {
  children: ReactNode
  personId: number
  personSlug: string
}

export function HoverCardPerson({
  children,
  personId,
  personSlug,
}: HoverCardPersonProps) {
  return (
    <HoverCard openDelay={OPEN_DELAY_MS} closeDelay={CLOSE_DELAY_MS}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent align="start" className="w-72">
        <CardPersonSummary personId={personId} personSlug={personSlug} />
      </HoverCardContent>
    </HoverCard>
  )
}

interface CardPersonSummaryProps {
  personId: number
  personSlug: string
}

function CardPersonSummary({ personId, personSlug }: CardPersonSummaryProps) {
  const person = useGetPerson({ person_id: personId })
  const reports = useGetPersonReports({ person_id: personId })

  if (person.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-4 w-52" />
      </div>
    )
  }
  if (person.isLoadingError || !person.data) {
    return (
      <p className="text-muted-foreground text-sm">The details did not load.</p>
    )
  }

  const { data } = person
  const latestMembership: PersonMembershipData | undefined =
    data.memberships[data.memberships.length - 1]
  const seat = latestMembership?.constituencies.join(', ') ?? ''
  const speechCount = data.parliament_counts.reduce(
    (total, count) => total + count.speech_count,
    0
  )
  const latestReport = reports.data?.pages[0]?.reports[0]

  return (
    <div className="space-y-3 text-sm">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <p className="font-serif text-base font-semibold">
          {data.canonical_name}
        </p>
        {isSittingMember(data.memberships) && <BadgeSittingMember />}
      </div>
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1">
        {latestMembership !== undefined && latestMembership.party !== '' && (
          <>
            <dt className="text-muted-foreground">Party</dt>
            <dd>{latestMembership.party}</dd>
          </>
        )}
        {seat !== '' && (
          <>
            <dt className="text-muted-foreground">Seat</dt>
            <dd>{seat}</dd>
          </>
        )}
        {data.memberships.length > 0 && (
          <>
            <dt className="text-muted-foreground">Served</dt>
            <dd>{formatMembershipParliaments(data.memberships)}</dd>
          </>
        )}
        <dt className="text-muted-foreground">Speeches</dt>
        <dd>{speechCount.toLocaleString(NUMBER_LOCALE)}</dd>
        {latestReport !== undefined && (
          <>
            <dt className="text-muted-foreground">Last spoke</dt>
            <dd>{formatSittingDate(latestReport.sitting_date)}</dd>
          </>
        )}
      </dl>
      <div className="border-separator flex flex-wrap gap-x-4 gap-y-1 border-t pt-2">
        <Link
          to="/people/$personSlug"
          params={{ personSlug: `${personId}-${personSlug}` }}
          className={LINK_CLASS_NAME}
        >
          View profile
        </Link>
        <Link
          to="/search"
          search={{ person: personId }}
          className={LINK_CLASS_NAME}
        >
          Search this person's speeches
        </Link>
      </div>
    </div>
  )
}
