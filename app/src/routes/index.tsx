import { PageHeader } from '@/components/layout/PageHeader'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { createFileRoute, Link } from '@tanstack/react-router'

const HOME_LINKS = [
  {
    title: "Read a day's debates",
    description:
      "Pick a Parliament, then a date, to read that day's reports and see who attended.",
    to: '/sittings',
  },
  {
    title: 'Look up a person',
    description:
      'Find a person by name or constituency to read their speeches and see their attendance.',
    to: '/people',
  },
  {
    title: 'See what the archive covers',
    description: 'The years and counts it holds, and where the gaps are.',
    to: '/coverage',
  },
] as const

export const Route = createFileRoute('/')({
  component: function PageHome() {
    useDocumentTitle()
    return (
      <div className="space-y-8">
        <PageHeader title="Find what an MP said in Singapore's Parliament since 1955" />
        <ul>
          {HOME_LINKS.map((item) => (
            <li
              key={item.title}
              className="border-separator border-b last:border-b-0"
            >
              <Link
                to={item.to}
                className="group hover:bg-muted focus-visible:ring-ring focus-visible:ring-offset-background block space-y-1 rounded-sm px-2 py-4 outline-hidden transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-offset-2"
              >
                <h2 className="text-primary group-hover:text-primary-hover font-serif text-lg font-semibold group-hover:underline">
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
