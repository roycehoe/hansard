import { KNOWN_GAP_GROUPS } from '@/constants/coverage/constants'

export function SectionKnownGapsFull() {
  return (
    <section aria-labelledby="gaps-heading" className="space-y-4">
      <h2 id="gaps-heading" className="font-serif text-xl lg:text-2xl">
        Known gaps
      </h2>
      {KNOWN_GAP_GROUPS.map((group) => (
        <div key={group.heading} className="space-y-2">
          <h3 className="font-serif text-lg lg:text-xl">
            {group.heading}
            <span className="sr-only">: known gaps</span>
          </h3>
          <ul className="list-disc space-y-2 pl-5 text-sm">
            {group.gaps.map((gap) => (
              <li key={gap}>{gap}</li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  )
}
