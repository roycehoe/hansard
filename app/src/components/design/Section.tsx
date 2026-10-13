import type { ReactNode } from 'react'

interface SectionProps {
  id: string
  title: string
  description?: string
  children: ReactNode
}

export function Section({ id, title, description, children }: SectionProps) {
  return (
    <section id={id} className="scroll-mt-24 space-y-6">
      <div className="border-separator space-y-1 border-b pb-3">
        <h2 className="font-serif text-2xl font-semibold">{title}</h2>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>
      <div className="space-y-8">{children}</div>
    </section>
  )
}

interface ExampleProps {
  label: string
  children: ReactNode
}

export function Example({ label, children }: ExampleProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-muted-foreground text-sm font-medium">{label}</h3>
      <div className="flex flex-wrap items-center gap-4">{children}</div>
    </div>
  )
}
