import { Link } from '@tanstack/react-router'

const LINK_CLASS_NAME =
  'text-primary hover:text-primary-hover focus-visible:ring-ring focus-visible:ring-offset-background rounded-sm outline-hidden hover:underline focus-visible:ring-2 focus-visible:ring-offset-2'

export function SectionOpener() {
  return (
    <p>
      This is an unofficial archive of Singapore&apos;s parliamentary debates
      since 1955.{' '}
      <Link to="/search" className={LINK_CLASS_NAME}>
        Search the debates
      </Link>{' '}
      or{' '}
      <Link to="/people" className={LINK_CLASS_NAME}>
        browse the people who spoke
      </Link>
      .
    </p>
  )
}
