import { CONTACT_EMAIL } from '@/constants/constants'

const LINK_CLASS_NAME =
  'text-primary hover:text-primary-hover focus-visible:ring-ring focus-visible:ring-offset-background rounded-sm outline-hidden hover:underline focus-visible:ring-2 focus-visible:ring-offset-2'

export function SectionArchiveBuild() {
  return (
    <section aria-labelledby="build-heading" className="space-y-4">
      <h2 id="build-heading" className="font-serif text-xl lg:text-2xl">
        How the archive is built
      </h2>
      <p>
        The archive is built from the Official Report on the Parliament of
        Singapore&apos;s website. The text of each report is converted from the
        published page and split into speeches at each speaker label, and each
        label is matched to a person where the archive can tell who it is.
      </p>
      <p>The data is not available for download.</p>
      {CONTACT_EMAIL && (
        <p>
          Found an error? Email{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className={LINK_CLASS_NAME}>
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      )}
    </section>
  )
}
