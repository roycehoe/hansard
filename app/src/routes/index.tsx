import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import type { FormEvent } from 'react'

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
    const navigate = useNavigate()

    function findMember(event: FormEvent<HTMLFormElement>) {
      event.preventDefault()
      const constituency = String(
        new FormData(event.currentTarget).get('constituency') ?? ''
      ).trim()
      if (constituency === '') return
      void navigate({ to: '/people', search: { constituency } })
    }

    return (
      <div className="space-y-8">
        <PageHeader title="Singapore's parliamentary debates since 1955" />
        <form
          role="search"
          aria-label="Find your MP"
          onSubmit={findMember}
          className="flex max-w-md flex-col gap-2"
        >
          <Label htmlFor="find-member">Find your MP</Label>
          <div className="flex gap-2">
            <Input
              id="find-member"
              type="search"
              name="constituency"
              aria-describedby="find-member-hint"
            />
            <Button type="submit">Find</Button>
          </div>
          <p id="find-member-hint" className="text-muted-foreground text-sm">
            Enter your constituency, such as Ang Mo Kio.
          </p>
        </form>
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
