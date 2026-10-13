import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/design')({
  component: () => (
    <div className="space-y-12">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-serif text-3xl font-semibold">Design</h1>
          <p className="text-muted-foreground">
            Every primitive and layout piece, in every variant and size. Use the
            toggle to check both themes.
          </p>
        </div>
        <ThemeToggle />
      </div>
    </div>
  ),
})
