import { Example, Section } from '@/components/design/Section'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { BookmarkIcon, SettingsIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

const SHEET_SIDES = ['top', 'right', 'bottom', 'left'] as const

function showSuccessToast() {
  toast.success('Search saved')
}

function showErrorToast() {
  toast.error('Failed to save changes.')
}

function showInfoToast() {
  toast.info('Citations leave out the column number for now')
}

function showWarningToast() {
  toast.warning('This search returns more than 1,000 speeches')
}

function showLoadingToast() {
  toast.loading('Saving search...')
}

function showPromiseToast() {
  toast.promise(new Promise((resolve) => setTimeout(resolve, 1500)), {
    loading: 'Saving search...',
    success: 'Search saved',
    error: 'Failed to save changes.',
  })
}

function showRestoredToast() {
  toast.success('Search restored')
}

function showActionToast() {
  toast('Search deleted', {
    action: { label: 'Undo', onClick: showRestoredToast },
  })
}

export function SectionOverlays() {
  const [isShowingLineNumbers, setIsShowingLineNumbers] =
    useState<boolean>(true)
  const [isShowingSpeakers, setIsShowingSpeakers] = useState<boolean>(false)
  const [sortOrder, setSortOrder] = useState<string>('newest')

  return (
    <Section
      id="overlays"
      title="Overlays"
      description="Dialogs, sheets, menus, tooltips, popovers and toasts."
    >
      <Example label="Dialog">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Rename search</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rename search</DialogTitle>
              <DialogDescription>
                Give this saved search a name you will recognise later.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="overlays-search-name">Name</Label>
              <Input
                id="overlays-search-name"
                defaultValue="Housing debates, 2015 onwards"
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button>Save</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Example>

      <Example label="Alert dialog">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Delete search</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this search?</AlertDialogTitle>
              <AlertDialogDescription>
                The saved search is removed for good. Speeches it matched are
                not affected.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction variant="destructive">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Example>

      <Example label="Sheet from each side">
        {SHEET_SIDES.map((side) => (
          <Sheet key={side}>
            <SheetTrigger asChild>
              <Button variant="outline" className="capitalize">
                {side}
              </Button>
            </SheetTrigger>
            <SheetContent side={side}>
              <SheetHeader>
                <SheetTitle className="capitalize">{side} sheet</SheetTitle>
                <SheetDescription>
                  Filters for the speeches list.
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-2 px-4">
                <Label htmlFor={`overlays-sheet-speaker-${side}`}>
                  Speaker
                </Label>
                <Input id={`overlays-sheet-speaker-${side}`} />
              </div>
              <SheetFooter>
                <Button>Apply filters</Button>
                <SheetClose asChild>
                  <Button variant="outline">Cancel</Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        ))}
      </Example>

      <Example label="Dropdown menu">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Options</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>Saved search</DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuItem>Rename</DropdownMenuItem>
              <DropdownMenuItem>Duplicate</DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Export as</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem>CSV</DropdownMenuItem>
                  <DropdownMenuItem>Markdown</DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Display</DropdownMenuLabel>
            <DropdownMenuCheckboxItem
              checked={isShowingLineNumbers}
              onCheckedChange={setIsShowingLineNumbers}
            >
              Line numbers
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={isShowingSpeakers}
              onCheckedChange={setIsShowingSpeakers}
            >
              Speaker names
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Sort</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={sortOrder}
              onValueChange={setSortOrder}
            >
              <DropdownMenuRadioItem value="newest">
                Newest first
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="oldest">
                Oldest first
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Example>

      <Example label="Tooltip">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline">Save search</Button>
          </TooltipTrigger>
          <TooltipContent>Keep this search for later</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Bookmark">
              <BookmarkIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Bookmark</TooltipContent>
        </Tooltip>
      </Example>

      <Example label="Popover">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Search settings">
              <SettingsIcon />
            </Button>
          </PopoverTrigger>
          <PopoverContent aria-label="Search settings">
            <PopoverHeader>
              <PopoverTitle>Search settings</PopoverTitle>
              <PopoverDescription>
                Results are ordered by sitting date, newest first.
              </PopoverDescription>
            </PopoverHeader>
          </PopoverContent>
        </Popover>
      </Example>

      <Example label="Toasts">
        <Button variant="outline" onClick={showSuccessToast}>
          Success
        </Button>
        <Button variant="outline" onClick={showErrorToast}>
          Error
        </Button>
        <Button variant="outline" onClick={showInfoToast}>
          Info
        </Button>
        <Button variant="outline" onClick={showWarningToast}>
          Warning
        </Button>
        <Button variant="outline" onClick={showLoadingToast}>
          Loading
        </Button>
        <Button variant="outline" onClick={showPromiseToast}>
          Loading then success
        </Button>
        <Button variant="outline" onClick={showActionToast}>
          With action
        </Button>
      </Example>
    </Section>
  )
}
