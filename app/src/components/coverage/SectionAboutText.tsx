import { LinkOfficialReportSearch } from '@/components/coverage/LinkOfficialReportSearch'

export function SectionAboutText() {
  return (
    <section
      id="about-the-text"
      aria-labelledby="about-the-text-heading"
      className="space-y-4"
    >
      <h2
        id="about-the-text-heading"
        className="font-serif text-xl lg:text-2xl"
      >
        About the text
      </h2>
      <p>
        The text here is a converted copy of the Official Report, split into
        speeches. The Official Report is the authority, and the text here can
        differ from it. Before quoting a passage in a court filing, an essay or
        an article, check it in the Official Report.
      </p>
      <p>
        <LinkOfficialReportSearch />
      </p>
      <p>
        Report and sitting addresses do not change. A link to a paragraph (such
        as #s12) can lead to a different paragraph after the archive is rebuilt,
        and a person&apos;s address can change when the archive corrects who is
        who.
      </p>
    </section>
  )
}
