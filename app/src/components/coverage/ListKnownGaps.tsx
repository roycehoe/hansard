import { KNOWN_GAPS } from '@/constants/coverage/constants'

export function ListKnownGaps() {
  return (
    <ul className="list-disc space-y-2 pl-5 text-sm">
      {KNOWN_GAPS.map((gap) => (
        <li key={gap}>{gap}</li>
      ))}
    </ul>
  )
}
