import { PageHeader } from '@/components/layout/PageHeader'
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
              className="border-separator space-y-1 border-b py-4 last:border-b-0"
            >
              <h2 className="font-serif text-lg font-semibold">
                <Link
                  to={item.to}
                  className="text-primary hover:text-primary-hover focus-visible:ring-ring focus-visible:ring-offset-background rounded-sm outline-hidden hover:underline focus-visible:ring-2 focus-visible:ring-offset-2"
                >
                  {item.title}
                </Link>
              </h2>
              <p className="text-muted-foreground text-sm">
                {item.description}
              </p>
            </li>
          ))}
        </ul>
      </div>
    )
  },
})
