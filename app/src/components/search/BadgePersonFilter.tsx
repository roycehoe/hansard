import { useGetPerson } from '@/api/people/getPerson'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { X } from 'lucide-react'

const PERSON_NAME_FALLBACK = 'this person'

interface BadgePersonFilterProps {
  personId: number
}

export function BadgePersonFilter({ personId }: BadgePersonFilterProps) {
  const navigate = useNavigate()
  const search = useSearch({ from: '/search' })
  const { data } = useGetPerson({ person_id: personId })
  const name = data?.canonical_name ?? PERSON_NAME_FALLBACK

  function removePersonFilter() {
    void navigate({
      to: '/search',
      search: {
        ...search,
        person: undefined,
        page: undefined,
        title_page: undefined,
      },
    })
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant="secondary">Within speeches by {name}</Badge>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Remove the person filter"
        onClick={removePersonFilter}
      >
        <X />
      </Button>
    </div>
  )
}
