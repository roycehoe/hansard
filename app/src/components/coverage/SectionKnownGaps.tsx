import { KNOWN_GAP_SUMMARIES } from '@/constants/coverage/constants'

export function SectionKnownGaps() {
  return (
    <section aria-labelledby="gaps-heading" className="space-y-4">
      <h2 id="gaps-heading" className="font-serif text-xl lg:text-2xl">
        Known gaps
      </h2>
      <ul className="list-disc space-y-2 pl-5 text-sm">
        {KNOWN_GAP_SUMMARIES.map((gap) => (
          <li key={gap}>{gap}</li>
        ))}
      </ul>
    </section>
  )
}
