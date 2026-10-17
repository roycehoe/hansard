import {
  HAND_CHECK_LINKED_SPEECH_COUNT,
  REPAIR_DATE,
} from '@/constants/coverage/constants'
import { formatSittingDate } from '@/lib/format'

export function SectionTrust() {
  return (
    <section aria-labelledby="trust-heading" className="space-y-4">
      <h2 id="trust-heading" className="font-serif text-xl lg:text-2xl">
        How far to trust it
      </h2>
      <p>
        {HAND_CHECK_LINKED_SPEECH_COUNT} paragraphs from before 10 September
        2012 were read by hand, and none was credited to the wrong person.
      </p>
      <p>
        Paragraphs from 10 September 2012 on have not been checked by hand, and
        neither has a repair made on {formatSittingDate(REPAIR_DATE)}.
      </p>
    </section>
  )
}
