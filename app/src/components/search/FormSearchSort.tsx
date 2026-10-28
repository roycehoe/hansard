import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  SEARCH_SORT_DROPDOWN_OPTIONS,
  SEARCH_SORT_WITHOUT_WORDS_DROPDOWN_OPTIONS,
} from '@/constants/search/constants'
import type { SearchSort } from '@/constants/search/enums'
import { cn, getSortWithoutWords } from '@/lib/utils'

interface FormSearchSortProps {
  value: SearchSort
  hasWords: boolean
  onChange: (sort: string) => void
  className: string
}

export function FormSearchSort({
  value,
  hasWords,
  onChange,
  className,
}: FormSearchSortProps) {
  const sortOptions = hasWords
    ? SEARCH_SORT_DROPDOWN_OPTIONS
    : SEARCH_SORT_WITHOUT_WORDS_DROPDOWN_OPTIONS

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Label htmlFor="search-sort">Sort</Label>
      <Select
        value={hasWords ? value : getSortWithoutWords(value)}
        onValueChange={onChange}
      >
        <SelectTrigger id="search-sort" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
