import { Example, Section } from '@/components/design/Section'
import { TableIndexSittingSpeeches } from '@/components/design/tableSittingSpeeches/TableIndexSittingSpeeches'
import type { SittingSpeech } from '@/components/design/tableSittingSpeeches/useTableColumnsSittingSpeeches'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Skeleton } from '@/components/ui/skeleton'
import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react'

const SITTING_SPEECHES: SittingSpeech[] = [
  {
    id: 'r1',
    sittingDate: '2024-01-09',
    parliament: 14,
    title: 'Motion on the Government Budget Statement for Financial Year 2024',
    speaker: 'Lawrence Wong',
    speechCount: 14,
  },
  {
    id: 'r2',
    sittingDate: '2024-02-05',
    parliament: 14,
    title: 'Committee of Supply: Ministry of Education',
    speaker: 'Chan Chun Sing',
    speechCount: 9,
  },
  {
    id: 'r3',
    sittingDate: '2023-11-06',
    parliament: 14,
    title: 'Written answer on the supply of public rental flats',
    speaker: 'Desmond Lee',
    speechCount: 1,
  },
  {
    id: 'r4',
    sittingDate: '2023-09-18',
    parliament: 14,
    title: 'Oral answer on cost of living support for lower-income households',
    speaker: 'Tan See Leng',
    speechCount: 6,
  },
  {
    id: 'r5',
    sittingDate: '2022-10-04',
    parliament: 14,
    title:
      'Second reading of the Online Safety (Miscellaneous Amendments) Bill',
    speaker: 'Josephine Teo',
    speechCount: 22,
  },
  {
    id: 'r6',
    sittingDate: '2020-08-24',
    parliament: 14,
    title: 'Debate on the President’s Address',
    speaker: 'Pritam Singh',
    speechCount: 18,
  },
  {
    id: 'r7',
    sittingDate: '2019-05-07',
    parliament: 13,
    title:
      'Second reading of the Protection from Online Falsehoods and Manipulation Bill',
    speaker: 'K Shanmugam',
    speechCount: 31,
  },
  {
    id: 'r8',
    sittingDate: '2017-02-06',
    parliament: 13,
    title: 'Committee of Supply: Ministry of Health',
    speaker: 'Gan Kim Yong',
    speechCount: 12,
  },
  {
    id: 'r9',
    sittingDate: '2015-08-18',
    parliament: 13,
    title: 'Motion of thanks to the President for his Address',
    speaker: 'Lee Hsien Loong',
    speechCount: 5,
  },
  {
    id: 'r10',
    sittingDate: '2013-01-28',
    parliament: 12,
    title: 'White Paper on A Sustainable Population for a Dynamic Singapore',
    speaker: 'Teo Chee Hean',
    speechCount: 27,
  },
  {
    id: 'r11',
    sittingDate: '2009-03-02',
    parliament: 11,
    title: 'Oral answer on the Jobs Credit Scheme',
    speaker: 'Lim Hng Kiang',
    speechCount: 4,
  },
  {
    id: 'r12',
    sittingDate: '2005-04-18',
    parliament: 10,
    title: 'Bill for the Integrated Resorts, second reading',
    speaker: 'Lee Hsien Loong',
    speechCount: 16,
  },
]

const ALERTS = [
  {
    variant: 'default',
    icon: Info,
    title: 'Default alert',
    description: 'Neutral information that needs no particular attention.',
  },
  {
    variant: 'destructive',
    icon: CircleAlert,
    title: 'Destructive alert',
    description: 'The search could not be completed. Try again in a moment.',
  },
  {
    variant: 'success',
    icon: CircleCheck,
    title: 'Success alert',
    description: 'The citation has been copied.',
  },
  {
    variant: 'warning',
    icon: TriangleAlert,
    title: 'Warning alert',
    description: 'Speech links can change when a report is re-parsed.',
  },
  {
    variant: 'info',
    icon: Info,
    title: 'Info alert',
    description:
      'Speaker names are matched to the member roster automatically.',
  },
] as const

const BADGE_VARIANTS = [
  'default',
  'secondary',
  'destructive',
  'outline',
  'success',
  'warning',
  'info',
  'tag',
] as const

export function SectionData() {
  return (
    <Section
      id="data"
      title="Data"
      description="Tables, pagination, badges, alerts, skeletons and cards."
    >
      <Example label="Table, sortable with pagination (click a header to sort)">
        <TableIndexSittingSpeeches
          caption="Reports by sitting date, ten per page"
          data={SITTING_SPEECHES}
        />
      </Example>
      <Example label="Table, empty">
        <TableIndexSittingSpeeches
          caption="Reports matching the search"
          data={[]}
        />
      </Example>

      <Example label="Pagination, many pages with an ellipsis">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink aria-label="Go to page 1">1</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink aria-label="Go to page 5" isActive>
                5
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink aria-label="Go to page 6">6</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink aria-label="Go to page 20">20</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </Example>

      <Example label="Badge, all variants">
        {BADGE_VARIANTS.map((variant) => (
          <Badge key={variant} variant={variant}>
            {variant}
          </Badge>
        ))}
      </Example>

      <Example label="Alert, all variants">
        <div className="flex w-full flex-col gap-4">
          {ALERTS.map(({ variant, icon: Icon, title, description }) => (
            <Alert key={variant} variant={variant}>
              <Icon />
              <AlertTitle>{title}</AlertTitle>
              <AlertDescription>{description}</AlertDescription>
            </Alert>
          ))}
        </div>
      </Example>

      <Example label="Skeleton, text lines">
        <div className="flex w-full max-w-sm flex-col gap-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </Example>
      <Example label="Skeleton, avatar circle">
        <div className="flex items-center gap-4">
          <Skeleton className="size-12 rounded-full" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
      </Example>
      <Example label="Skeleton, card">
        <div className="flex w-full max-w-sm flex-col gap-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </Example>

      <Example label="Card, header and content with description">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Committee of Supply</CardTitle>
            <CardDescription>
              Ministry of Education, 5 February 2024
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">Nine speeches by Chan Chun Sing.</p>
          </CardContent>
        </Card>
      </Example>
      <Example label="Card, without description">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Sitting of 9 January 2024</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">14 speeches across 3 reports.</p>
          </CardContent>
        </Card>
      </Example>
      <Example label="Card, with footer and action button">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Debate on President's Address</CardTitle>
            <CardDescription>16 May 2018, Parliament 13</CardDescription>
            <CardAction>
              <Button variant="outline" size="sm">
                Copy citation
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="text-sm">112 speeches.</p>
          </CardContent>
          <CardFooter className="justify-end gap-2">
            <Button variant="ghost" size="sm">
              Copy link
            </Button>
            <Button size="sm">Read report</Button>
          </CardFooter>
        </Card>
      </Example>
    </Section>
  )
}
