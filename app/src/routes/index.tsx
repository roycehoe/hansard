import { PageHeader } from '@/components/layout/PageHeader'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { createFileRoute, Link } from '@tanstack/react-router'

const HOME_LINKS = [
  {
    title: "Read a day's debates",
    description:
      'Choose a Parliament and date to read the reports and see who attended.',
    to: '/sittings',
  },
  {
    title: 'Look up a person',
    description:
      'Search by name or constituency to find their speeches and attendance.',
    to: '/people',
  },
  {
    title: 'See what the archive covers',
    description: 'Check the years, counts and gaps in the archive.',
    to: '/coverage',
  },
] as const

export const Route = createFileRoute('/')({
  component: function PageHome() {
    useDocumentTitle()
    return (
      <div className="space-y-8">
        <PageHeader title="Search Singapore's parliamentary debates since 1955" />
        <ul>
          {HOME_LINKS.map((item) => (
            <li
              key={item.title}
              className="border-separator border-b last:border-b-0"
            >
              <Link
                to={item.to}
                className="group hover:bg-muted focus-visible:outline-ring block space-y-1 rounded-sm px-2 py-4 outline-hidden transition-colors duration-150 focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-solid"
              >
                <h2 className="text-link font-serif text-lg font-semibold group-hover:underline">
                  {item.title}
                </h2>
                <p className="text-muted-foreground text-sm">
                  {item.description}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    )
  },
})
