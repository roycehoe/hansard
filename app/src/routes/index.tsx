import { PageHeader } from '@/components/layout/PageHeader'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { createFileRoute, Link } from '@tanstack/react-router'

const HOME_LINKS = [
  {
    title: 'Sittings',
    description: 'Browse by Parliament, session or volume, and date.',
    to: '/sittings',
  },
  {
    title: 'People',
    description: 'Every person who spoke, with their memberships and speeches.',
    to: '/people',
  },
  {
    title: 'Coverage',
    description: 'What the archive holds and where the gaps are.',
    to: '/coverage',
  },
] as const

export const Route = createFileRoute('/')({
  component: function PageHome() {
    useDocumentTitle()
    return (
      <div className="space-y-8">
        <PageHeader
          title="Singapore's parliamentary debates since 1955"
          description="Organised by person and by sitting, with citation-ready links."
        />
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
