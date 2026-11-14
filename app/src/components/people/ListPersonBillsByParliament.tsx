import { NoticeEmpty } from '@/components/layout/NoticeEmpty'
import { ListPersonBills } from '@/components/people/ListPersonBills'
import { formatParliament } from '@/lib/format'
import type { PersonBillGroup } from '@/lib/personBills'
import { getPersonBillsAnchorId } from '@/lib/personBills'
import { scrollAgainWhenFontsLoad } from '@/lib/scrollAgain'
import { useLocation } from '@tanstack/react-router'
import { FileText } from 'lucide-react'
import { useEffect } from 'react'

interface ListPersonBillsByParliamentProps {
  groups: PersonBillGroup[]
  personName: string
}

export function ListPersonBillsByParliament({
  groups,
  personName,
}: ListPersonBillsByParliamentProps) {
  const hash = useLocation({ select: (location) => location.hash })
  const hasLinkedGroup = groups.some(
    (group) => getPersonBillsAnchorId(group.parliamentNumber) === hash
  )

  useEffect(
    function scrollToLinkedParliament() {
      if (!hasLinkedGroup) return
      const heading = document.getElementById(hash)
      if (heading === null) return
      heading.scrollIntoView()
      heading.focus({ preventScroll: true })
      return scrollAgainWhenFontsLoad({
        fontsReady: document.fonts.ready,
        getScrollY: () => window.scrollY,
        scroll: () => heading.scrollIntoView(),
      })
    },
    [hash, hasLinkedGroup]
  )

  if (groups.length === 0) {
    return (
      <NoticeEmpty
        icon={FileText}
        title="No Bills spoken on"
        description={`The archive has no Bills that ${personName} spoke on.`}
      />
    )
  }

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <div key={group.parliamentNumber} className="space-y-2">
          <h3
            id={getPersonBillsAnchorId(group.parliamentNumber)}
            tabIndex={-1}
            className="scroll-mt-4 font-serif text-lg outline-hidden lg:text-xl"
          >
            {formatParliament(group.parliamentNumber)}
          </h3>
          <ListPersonBills bills={group.bills} />
        </div>
      ))}
    </div>
  )
}
