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
import { LinkIcon, SettingsIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

const SHEET_SIDES = ['top', 'right', 'bottom', 'left'] as const

function showSuccessToast() {
  toast.success('Citation copied')
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
  toast.loading('Copying citation…')
}

function showPromiseToast() {
  toast.promise(new Promise((resolve) => setTimeout(resolve, 1500)), {
    loading: 'Copying citation…',
    success: 'Citation copied',
    error: 'Failed to save changes.',
  })
}

function showRestoredToast() {
  toast.success('Person filter restored')
}

function showActionToast() {
  toast('Person filter removed', {
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
            <Button variant="outline">Filter by person</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Filter by person</DialogTitle>
              <DialogDescription>
                Show only speeches by one person in the search results.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="overlays-person-name">Person</Label>
              <Input id="overlays-person-name" defaultValue="Lee Hsien Loong" />
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
            <Button variant="destructive">Remove person filter</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove this person filter?</AlertDialogTitle>
              <AlertDialogDescription>
                The search shows speeches by everyone again. The speeches
                themselves are not affected.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction variant="destructive">
                Remove
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
            <DropdownMenuLabel>Report</DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuItem>Copy citation</DropdownMenuItem>
              <DropdownMenuItem>Copy link</DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Copy as</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem>Plain text</DropdownMenuItem>
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
            <Button variant="outline">Copy citation</Button>
          </TooltipTrigger>
          <TooltipContent>Copy the citation for this report</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Copy link">
              <LinkIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy link</TooltipContent>
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
