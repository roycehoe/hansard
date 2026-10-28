import { PopoverAppearance } from '@/components/layout/PopoverAppearance'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { NAV_ITEMS } from '@/constants/layout/constants'
import { Link } from '@tanstack/react-router'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'

export function SheetSiteMenu() {
  const [isOpen, setIsOpen] = useState<boolean>(false)

  function closeMenu() {
    setIsOpen(false)
  }

  function keepFocusOnNewPage(event: Event) {
    if (document.activeElement !== document.body) event.preventDefault()
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon-touch"
          aria-label="Menu"
        >
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        showCloseButton={false}
        onCloseAutoFocus={keepFocusOnNewPage}
        className="px-5"
      >
        <SheetHeader className="flex-row items-center justify-between border-b-0 px-0">
          <SheetTitle>Menu</SheetTitle>
          <SheetDescription hidden />
          <SheetClose asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-touch"
              aria-label="Close"
            >
              <X />
            </Button>
          </SheetClose>
        </SheetHeader>
        <nav aria-label="Main">
          <ul>
            {NAV_ITEMS.map((item) => (
              <li key={item.label} className="border-separator border-b">
                <Link
                  to={item.to}
                  onClick={closeMenu}
                  className="text-primary hover:text-primary-hover focus-visible:ring-ring flex min-h-11 items-center rounded-sm text-base outline-hidden hover:underline focus-visible:ring-2 focus-visible:ring-inset data-[status=active]:font-medium"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex min-h-11 items-center justify-between">
          <span aria-hidden="true">Appearance</span>
          <PopoverAppearance />
        </div>
      </SheetContent>
    </Sheet>
  )
}
