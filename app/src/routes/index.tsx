import { PageHeader } from '@/components/layout/PageHeader'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { createFileRoute, Link } from '@tanstack/react-router'

const HOME_LINKS = [
  {
    title: 'Search Hansard',
    description: 'Speech text and report titles',
    to: '/search',
  },
  {
    title: 'Browse sittings',
    description: 'Reports and attendance',
    to: '/sittings',
  },
  {
    title: 'Find a person',
    description: 'Speeches, questions and offices held',
    to: '/people',
  },
  {
    title: 'Browse Acts',
    description: 'Each Act and the reports on it',
    to: '/acts',
  },
] as const

export const Route = createFileRoute('/')({
  component: function PageHome() {
    useDocumentTitle()
    return (
      <div className="space-y-8">
        <PageHeader title="Singapore's parliamentary archive since 1955" />
        <ul>
          {HOME_LINKS.map((item) => (
            <li
              key={item.title}
              className="border-separator border-b last:border-b-0"
            >
              <Link
                to={item.to}
                className="group hover:bg-muted block space-y-1 rounded-sm px-2 py-4 outline-hidden transition-colors duration-150"
              >
                <h2 className="text-link group-focus-visible:decoration-ring font-serif text-lg font-semibold group-hover:underline group-focus-visible:underline">
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
