import { TriangleAlert } from 'lucide-react'

export function NoticeErrorSearchExcludedWordsOnly() {
  return (
    <div
      role="alert"
      className="flex w-full flex-col items-center justify-center gap-12 py-24"
    >
      <div className="flex flex-col items-center justify-center gap-3 text-center">
        <TriangleAlert
          size={40}
          aria-hidden="true"
          className="text-destructive"
        />
        <h2 className="text-foreground text-base font-semibold">
          Add a word to search for
        </h2>
        <p className="text-muted-foreground max-w-100 text-sm">
          A minus sign only leaves a word out. Add a word to find, or choose a
          person or seat.
        </p>
      </div>
    </div>
  )
}
