import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ChangeEvent } from 'react'

interface FormFilterActsProps {
  value: string
  onChange: (value: string) => void
}

export function FormFilterActs({ value, onChange }: FormFilterActsProps) {
  function changeTitle(event: ChangeEvent<HTMLInputElement>) {
    onChange(event.target.value)
  }

  return (
    <div
      role="search"
      aria-label="Acts filter"
      className="flex max-w-md flex-col gap-2"
    >
      <Label htmlFor="filter-acts-title">Title or code</Label>
      <Input id="filter-acts-title" value={value} onChange={changeTitle} />
    </div>
  )
}
