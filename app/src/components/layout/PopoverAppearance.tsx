import { SectionAppearance } from '@/components/layout/SectionAppearance'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { PHONE_MEDIA_QUERY } from '@/constants/constants'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useId } from 'react'

export function PopoverAppearance() {
  const { isMatching: isPhone } = useMediaQuery(PHONE_MEDIA_QUERY)
  const headingId = useId()

  const trigger = (
    <Button
      type="button"
      variant="outline"
      size="icon-touch"
      aria-label="Appearance"
      title="Appearance"
      className="font-serif font-semibold"
    >
      Aa
    </Button>
  )

  if (isPhone) {
    return (
      <Sheet>
        <SheetTrigger asChild>{trigger}</SheetTrigger>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="max-h-[90dvh] rounded-t-lg px-5 pb-7"
        >
          <SheetHeader className="flex-row items-center justify-between border-b-0 px-0">
            <SheetTitle>Appearance</SheetTitle>
            <SheetDescription hidden />
            <SheetClose asChild>
              <Button type="button" variant="quiet" size="xl">
                Done
              </Button>
            </SheetClose>
          </SheetHeader>
          <SectionAppearance isPhone />
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
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
