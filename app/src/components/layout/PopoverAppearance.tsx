import { SectionAppearance } from '@/components/layout/SectionAppearance'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useId } from 'react'

export function PopoverAppearance() {
  const headingId = useId()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="inverse"
          size="icon-touch"
          aria-label="Appearance"
          title="Appearance"
          className="font-serif font-semibold"
        >
          Aa
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        aria-labelledby={headingId}
        className="flex w-62 flex-col gap-3"
      >
        <h2
          id={headingId}
          className="border-separator border-b pb-2 text-sm font-semibold"
        >
          Appearance
        </h2>
        <SectionAppearance isPhone={false} />
      </PopoverContent>
    </Popover>
  )
}
