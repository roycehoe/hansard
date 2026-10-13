import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { readSearchQuery } from '@/lib/utils'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import type { FormEvent } from 'react'

const HOME_CARDS = [
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
    const navigate = useNavigate()

    function submitSearch(event: FormEvent<HTMLFormElement>) {
      event.preventDefault()
      const query = readSearchQuery(event.currentTarget)
      if (query === '') return
      void navigate({ to: '/search', search: { q: query } })
    }

    return (
      <div className="space-y-8">
        <PageHeader
          title="Hansard"
          description="The Singapore parliamentary record from 1955, organised by person and by sitting, with citation-ready links."
        />
        <form
          role="search"
          aria-label="Search the record"
          onSubmit={submitSearch}
          className="flex flex-wrap items-end gap-4"
        >
          <div className="flex w-full flex-col gap-2 sm:max-w-md sm:flex-1">
            <Label htmlFor="home-search">Search the record</Label>
            <Input id="home-search" type="search" name="q" />
          </div>
          <Button type="submit">Search</Button>
        </form>
        <ul className="grid gap-4 md:grid-cols-3">
          {HOME_CARDS.map((card) => (
            <li key={card.title}>
              <Link
                to={card.to}
                className="focus-visible:ring-ring focus-visible:ring-offset-background block h-full rounded-lg outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2"
              >
                <Card className="hover:border-primary h-full transition-colors">
                  <CardHeader>
                    <h2 className="font-serif text-lg font-semibold">
                      {card.title}
                    </h2>
                    <CardDescription>{card.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    )
  },
})
