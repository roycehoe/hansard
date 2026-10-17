import { HAND_CHECK_LINKED_SPEECH_COUNT } from '@/constants/coverage/constants'

export function SectionImportantPoints() {
  return (
    <section aria-labelledby="important-points-heading" className="space-y-4">
      <h2
        id="important-points-heading"
        className="font-serif text-xl lg:text-2xl"
      >
        Important points
      </h2>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          {HAND_CHECK_LINKED_SPEECH_COUNT} paragraphs from before 10 September
          2012 were read by hand, and none was credited to the wrong person.
        </li>
        <li>
          Paragraphs from 10 September 2012 on have not been checked by hand.
        </li>
        <li>
          The credited figures count paragraphs that carry a link to a person.
          They do not show whether the link is right.
        </li>
        <li>
          The text of most reports is in the archive. The counts below show how
          many reports have none.
        </li>
      </ul>
    </section>
  )
}
