import { Example, Section } from '@/components/design/Section'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const FAQ_ITEMS = [
  {
    value: 'source',
    question: 'Where does the text come from?',
    answer: 'Reports are parsed from the published Hansard record.',
  },
  {
    value: 'speakers',
    question: 'How are speakers matched?',
    answer: 'Names are matched against the roster for each parliament.',
  },
  {
    value: 'gaps',
    question: 'Why are some speeches missing?',
    answer: 'Some reports do not mark speaker names in a form we can read.',
  },
]

export function NavigationSection() {
  return (
    <Section
      id="navigation"
      title="Navigation"
      description="Tabs, accordion, breadcrumb and separator."
    >
      <Example label="Tabs">
        <Tabs defaultValue="speeches" className="w-full max-w-md">
          <TabsList>
            <TabsTrigger value="speeches">Speeches</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="annexures">Annexures</TabsTrigger>
          </TabsList>
          <TabsContent value="speeches" className="text-sm">
            Every speech recorded for the sitting, in the order given.
          </TabsContent>
          <TabsContent value="attendance" className="text-sm">
            Members present and absent on the day.
          </TabsContent>
          <TabsContent value="annexures" className="text-sm">
            Papers tabled alongside the sitting.
          </TabsContent>
        </Tabs>
      </Example>

      <Example label="Accordion, single">
        <Accordion type="single" collapsible className="w-full max-w-md">
          {FAQ_ITEMS.map(({ value, question, answer }) => (
            <AccordionItem key={value} value={value}>
              <AccordionTrigger>{question}</AccordionTrigger>
              <AccordionContent>{answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Example>
      <Example label="Accordion, multiple">
        <Accordion
          type="multiple"
          defaultValue={['source', 'speakers']}
          className="w-full max-w-md"
        >
          {FAQ_ITEMS.map(({ value, question, answer }) => (
            <AccordionItem key={value} value={value}>
              <AccordionTrigger>{question}</AccordionTrigger>
              <AccordionContent>{answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Example>

      <Example label="Breadcrumb, three levels">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Sittings</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>9 January 2024</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </Example>
      <Example label="Breadcrumb, with an ellipsis">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbEllipsis />
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Committee of Supply</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Ministry of Education</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </Example>

      <Example label="Separator, horizontal">
        <div className="w-full max-w-md space-y-3 text-sm">
          <p>Sittings</p>
          <Separator />
          <p>Speeches</p>
        </div>
      </Example>
      <Example label="Separator, vertical">
        <div className="flex h-5 items-center gap-4 text-sm">
          <span>Sittings</span>
          <Separator orientation="vertical" />
          <span>Speeches</span>
          <Separator orientation="vertical" />
          <span>Speakers</span>
        </div>
      </Example>
    </Section>
  )
}
