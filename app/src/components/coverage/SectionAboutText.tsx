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
        The text here is derived from the Official Report and can differ from
        it. The Official Report is the authority. Before a court filing or
        formal citation, check the passage in the Official Report.
      </p>
      <p>
        <LinkOfficialReportSearch />
      </p>
      <p>
        A speech link (such as #s12) can lead to a different speech after the
        archive is rebuilt. Report and sitting addresses do not change.
      </p>
    </section>
  )
}
