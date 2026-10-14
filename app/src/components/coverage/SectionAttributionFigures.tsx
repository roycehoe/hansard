import { TableAttributionParliaments } from '@/components/coverage/TableAttributionParliaments'
import { NUMBER_LOCALE } from '@/constants/constants'
import {
  ATTRIBUTION_FIGURES,
  ATTRIBUTION_MEASURED_ON,
  ATTRIBUTION_MEASUREMENTS,
  HAND_CHECK_CORRECT_SPEECH_COUNT,
  HAND_CHECK_DATE,
  HAND_CHECK_LINKED_SPEECH_COUNT,
  HAND_CHECK_PROCEDURAL_SPEECH_COUNT,
  HAND_CHECK_UNLINKED_SPEECH_COUNT,
  REPAIR_DATE,
  REPAIR_PROCEDURAL_LINE_COUNT,
} from '@/constants/coverage/constants'
import { formatSittingDate } from '@/lib/format'

export function SectionAttributionFigures() {
  return (
    <section aria-labelledby="attribution-heading" className="space-y-4">
      <h2 id="attribution-heading" className="font-serif text-xl lg:text-2xl">
        Who said what
      </h2>
      <p>
        On {formatSittingDate(HAND_CHECK_DATE)},{' '}
        {HAND_CHECK_LINKED_SPEECH_COUNT} speeches from before 10 September 2012
        that are linked to a person were read by hand. None was credited to the
        wrong person. {HAND_CHECK_CORRECT_SPEECH_COUNT} were correct in full. In
        the other {HAND_CHECK_PROCEDURAL_SPEECH_COUNT}, a procedural line or a
        list was credited to the speaker. All {HAND_CHECK_UNLINKED_SPEECH_COUNT}{' '}
        unlinked speeches in the same check were rightly left without a person.
      </p>
      <p>
        A repair on {formatSittingDate(REPAIR_DATE)} removed the speaker from{' '}
        {REPAIR_PROCEDURAL_LINE_COUNT.toLocaleString(NUMBER_LOCALE)} procedural
        lines, editorial notes and stage directions. It has not been checked by
        hand yet. Speeches from 10 September 2012 on have not been checked by
        hand either.
      </p>
      <h3 className="font-serif text-lg lg:text-xl">
        How many speeches carry a name
      </h3>
      <p className="text-muted-foreground text-sm">
        These figures count speeches that carry a link to a person, not whether
        the link is right. They cover the Legislative Assembly to Parliament 11
        and were measured on {formatSittingDate(ATTRIBUTION_MEASURED_ON)}.
      </p>
      <dl className="grid gap-4 lg:grid-cols-3">
        {ATTRIBUTION_FIGURES.map((figure) => (
          <div key={figure.label} className="space-y-1">
            <dt className="text-sm font-medium">{figure.label}</dt>
            <dd className="text-lg font-semibold tabular-nums">
              {figure.value}
            </dd>
          </div>
        ))}
      </dl>
      <TableAttributionParliaments />
      <h3 className="font-serif text-lg lg:text-xl">How these are measured</h3>
      <ul className="list-disc space-y-2 pl-5 text-sm">
        {ATTRIBUTION_MEASUREMENTS.map((measurement) => (
          <li key={measurement}>{measurement}</li>
        ))}
      </ul>
    </section>
  )
}
