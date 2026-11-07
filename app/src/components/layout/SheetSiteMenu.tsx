import { SectionAppearance } from '@/components/layout/SectionAppearance'
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
        className="bg-popover text-popover-foreground h-dvh w-[85%] gap-0 overflow-y-auto p-0"
      >
        <SheetHeader className="flex-row items-center justify-between border-b-0 px-5 py-3">
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
        <nav aria-label="Main" className="px-2">
          <ul className="flex flex-col gap-0.5">
            {NAV_ITEMS.map((item) => (
              <li key={item.label}>
                <Link
                  to={item.to}
                  onClick={closeMenu}
                  className="hover:bg-accent active:bg-accent data-[status=active]:bg-accent focus-visible:ring-ring flex min-h-12 items-center rounded-md px-3 text-base outline-hidden focus-visible:ring-2 focus-visible:ring-inset data-[status=active]:font-semibold"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div
          role="group"
          aria-label="Appearance"
          className="border-separator mt-4 border-t px-5 pt-4 pb-5"
        >
          <SectionAppearance isPhone />
        </div>
      </SheetContent>
    </Sheet>
  )
}
