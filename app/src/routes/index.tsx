import { PageHeader } from '@/components/layout/PageHeader'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { createFileRoute, Link } from '@tanstack/react-router'

const HOME_LINKS = [
  { title: 'Sittings', to: '/sittings' },
  { title: 'People', to: '/people' },
  { title: 'Coverage', to: '/coverage' },
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
                className="group hover:bg-muted block rounded-sm px-2 py-4 outline-hidden transition-colors duration-150"
              >
                <h2 className="text-link group-focus-visible:decoration-ring font-serif text-lg font-semibold group-hover:underline group-focus-visible:underline">
                  {item.title}
                </h2>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    )
  },
})
