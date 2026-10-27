import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { readSearchQuery } from '@/lib/utils'
import { useNavigate } from '@tanstack/react-router'
import { Search } from 'lucide-react'
import type { FormEvent } from 'react'

interface FormSearchPersonSpeechesProps {
  personId: number
}

export function FormSearchPersonSpeeches({
  personId,
}: FormSearchPersonSpeechesProps) {
  const navigate = useNavigate()

  function submitPersonSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const query = readSearchQuery(event.currentTarget)
    void navigate({
      to: '/search',
      search: { person: personId, q: query === '' ? undefined : query },
    })
  }

  return (
    <form
      role="search"
      aria-label="Search this person's speeches"
      onSubmit={submitPersonSearch}
      className="flex max-w-md items-center gap-2"
    >
      <Label htmlFor="person-search" className="sr-only">
        Search this person's speeches
      </Label>
      <Input
        id="person-search"
        type="search"
        name="q"
        enterKeyHint="search"
        placeholder="Search this person's speeches"
      />
      <Button type="submit" size="icon" aria-label="Search">
        <Search />
      </Button>
    </form>
  )
}
