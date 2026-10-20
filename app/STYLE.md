# STYLE.md

Personal coding idioms for this codebase. Follow these when writing or reviewing code.
This document only contains things a contributor would get wrong without being told — not standard React/TypeScript conventions, and not patterns already covered in `CLAUDE.md`.

**Automated enforcement:** ESLint via `pnpm lint`. Everything else is code-review only.

**Rule strength:** All rules are hard requirements unless marked **Preference**.

## API Hooks

### Folder Structure

API files are grouped by feature subfolder. `client.ts` is the only file that lives at the root of `src/api/` — every hook file goes in a subfolder matching its domain:

```
api/
├── client.ts          # HTTP client — the only root-level file
├── sittings/
├── speeches/
├── speakers/
├── searches/
├── common/
└── ...
```

When adding a new endpoint, place it in the subfolder for its domain. If no appropriate subfolder exists, create one rather than dropping the file at the root.

### File and Hook Naming

One file per endpoint, one exported hook per file. Both follow the same verb-resource pattern:

|               | Pattern               | Example                                         |
| ------------- | --------------------- | ----------------------------------------------- |
| File          | `{verb}{Resource}.ts` | `getSittingMetadata.ts`, `deleteSavedSearch.ts` |
| Query hook    | `use{Verb}{Resource}` | `useGetSittingMetadata`                         |
| Mutation hook | `use{Verb}{Resource}` | `useDeleteSavedSearch`, `useCreateSavedSearch`  |

### File Structure

**Query (GET):**

```typescript
// Private — never exported
async function getSittingMetadataResponse(
  request: GetSittingMetadataRequest
): Promise<GetSittingMetadataResponse> {
  return apiGet<GetSittingMetadataResponse>(`/sittings/${request.sitting_id}`)
}

export function useGetSittingMetadata(request: GetSittingMetadataRequest) {
  return useQuery({
    queryKey: ['sittings', request.sitting_id],
    queryFn: () => getSittingMetadataResponse(request),
  })
}
```

**Mutation (POST / PUT / DELETE):**

```typescript
// Private — never exported
async function createSavedSearch(
  request: CreateSavedSearchRequest
): Promise<CreateSavedSearchResponse> {
  return apiPost<CreateSavedSearchResponse>('/searches', request)
}

export function useCreateSavedSearch() {
  return useMutation({
    mutationFn: createSavedSearch,
  })
}
```

### Query Keys

Use a resource hierarchy, never the function name. This enables prefix-based cache invalidation — `queryClient.invalidateQueries({ queryKey: ['sittings'] })` clears all sitting queries at once.

```typescript
// Good — resource hierarchy
queryKey: ['sittings']
queryKey: ['sittings', sitting_id]
queryKey: ['searches', 'list']
queryKey: ['searches', 'item', search_id]

// Bad — function name as key, cannot be prefix-invalidated meaningfully
queryKey: ['getSittings']
queryKey: ['getSittingMetadata', sitting_id]
```

Include dynamic values at the end of the key in the order they appear in the URL path. Optional filter params come last:

```typescript
queryKey: ['searches', 'list', request?.report_types]
```

### Request and Response Interfaces

Both `Request` and `Response` interfaces live in the same file as the hook. Export `Request` interfaces — callers need them to type their form values and handler arguments. Export `Response` interfaces — callers need them to type variables holding query data.

```typescript
export interface GetSittingMetadataRequest {
  sitting_id: number
}

export interface GetSittingMetadataResponse {
  sitting_id: number
  sitting_date: string
}
```

Always PascalCase — `GetSittingMetadataRequest`, not `getSittingMetadataRequest`.

### Response Unwrapping

The `apiGet` / `apiPost` wrappers in `@/api/client` already return the parsed JSON body typed as `T`. Return that value directly from the async function, and pass the response interface as the type argument. Never wrap the body in another `data` property of your own, and never reshape it via `select` in the hook — the hook's `data` should be immediately the right type without an extra transformation step.

```typescript
// Good — the wrapper returns the body, typed
async function getSittingsResponse(): Promise<GetSittingsResponse> {
  return apiGet<GetSittingsResponse>('/sittings')
}

// Bad — body typed as a { data } envelope the API does not send, select needed in the hook
async function getSittingsResponse(): Promise<{ data: GetSittingsResponse }> {
  return apiGet<{ data: GetSittingsResponse }>('/sittings')
}

export function useGetSittings() {
  return useQuery({
    queryFn: getSittingsResponse,
    select: (res) => res.data, // shouldn't be needed
  })
}
```

### Cache Invalidation

`invalidateQueries` always belongs in the component or form, never inside the hook. The hook doesn't know what else needs refreshing after a mutation — the caller does.

```typescript
// Good — invalidation in the component
const { mutate } = useCreateSavedSearch()

mutate(request, {
  onSuccess: () => {
    queryClient.invalidateQueries({
      queryKey: ['searches', 'list'],
    })
  },
})

// Bad — hook pre-emptively invalidates
export function useCreateSavedSearch() {
  return useMutation({
    mutationFn: createSavedSearch,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['searches', 'list'],
      })
    },
  })
}
```

### Conditional Queries

Use `enabled: !!param` to prevent a query from firing until its required parameter exists. Always `!!`, not `Boolean()` or an explicit null check.

The one exception is a parameter whose valid values include `0`, such as a Parliament number (Parliament 0 is the Legislative Assembly). There `!!` would disable the query for a real value, so the check is `param !== undefined`, and the hook says so by that comparison alone.

```typescript
export function useGetSavedSearch(request: GetSavedSearchRequest) {
  return useQuery({
    queryKey: ['searches', 'item', request.search_id],
    queryFn: () => getSavedSearchResponse(request),
    enabled: !!request.search_id,
  })
}
```

### HTTP Client

Always use the typed `fetch` wrapper from `@/api/client` (`apiGet<T>`, `apiPost<T>` and the rest) — never call `fetch` directly and never add another HTTP library. The wrapper resolves the base URL from `VITE_API_URL`, parses the JSON body as `T`, and throws an `ApiError` (with `status` and `body`) on any non-2xx response. Code that bypasses it loses all of that silently.

### `mutationKey`

Only add `mutationKey` when the mutation needs to be referenced from outside — for example, a query that polls differently while the mutation is running. Do not add it by default.

```typescript
// Only when needed externally
useMutation({
  mutationKey: ['searches', 'export'],
  mutationFn: ...,
})

// Reading it elsewhere
queryClient.isMutating({ mutationKey: ['searches', 'export'] }) > 0
```

---

## Page Loading States

Use `isLoading` (not `isFetching`) to gate a full-page loading screen. `isFetching` is also true during background refetches — using it would flash a full-page spinner over already-rendered content whenever a query silently revalidates (e.g. polling).

A page loader has the shape of the page it stands in for: the header, headings, rows and fields in their real places and rough widths, so nothing jumps when the data arrives. A single box the size of the page tells the reader nothing about what is coming. Build it from `<Skeleton />` bars in a `Skeleton<Name>` component in the feature folder, such as `SkeletonPerson` or `SkeletonSittingsGrouped`, and reuse the shared pieces: `SkeletonPageHeader` for a page that renders `PageHeader`, `SkeletonReportRows` for a list of reports, `SkeletonSearchResults` for search results. Keep it coarse: bars for each line of text, no icons, no copy. When a page's layout changes, change its skeleton in the same commit. Never inline your own spinner wrapper; a `<Spinner />` belongs inside a button, not in place of a page.

```typescript
// Good
const { data, isLoading, isError } = useGetPerson({ person_slug })

if (isLoading) return <SkeletonPerson />
```

```typescript
// Bad — isFetching triggers on background refetches
if (isFetching) return <SkeletonPerson />

// Bad — one box with nothing of the page's shape
if (isLoading) return <Skeleton className="h-96 w-full" />

// Bad — inline spinner wrapper
if (isLoading) return (
  <div className="flex w-full flex-col items-center justify-center py-48">
    <Spinner />
  </div>
)
```

When a page depends on multiple queries, combine their `isLoading` flags:

```typescript
const { data: metadata, isLoading: isLoadingMetadata } = useGetSittingMetadata({ sitting_id })
const { data: speeches, isLoading: isLoadingSpeeches } = useGetSittingSpeeches({ sitting_id })

if (isLoadingMetadata || isLoadingSpeeches) return <SkeletonSitting />
```

---

## File and Folder Naming

| Thing                 | Convention        | Example                                                 |
| --------------------- | ----------------- | ------------------------------------------------------- |
| Folders               | `camelCase`       | `sittings/`, `tableSittingSpeeches/`                    |
| Component files       | `PascalCase.tsx`  | `FormSearchSpeeches.tsx`, `DialogDeleteSavedSearch.tsx` |
| Hook files            | `useCamelCase.ts` | `useHover.ts`, `useTheme.ts`                            |
| All other `.ts` files | `camelCase.ts`    | `getSittings.ts`, `interfaces.ts`                       |

Route files (`routes/`) use `kebab-case` and shadcn UI files (`components/ui/`) use their own conventions — both are exceptions driven by external tooling, not project rules.

## Component Naming

Components follow `[Category][Context].tsx`. The category is a prefix that describes what kind of component it is. The context is the specific subject it operates on — add as much as needed to disambiguate within the folder, but no more.

| Category          | Used for                                       | Example                                  |
| ----------------- | ---------------------------------------------- | ---------------------------------------- |
| `Index`           | Entry point for a feature folder               | `Index.tsx`                              |
| `Form`            | Form components                                | `FormSearchSpeeches.tsx`                 |
| `Dialog`          | Modal dialogs                                  | `DialogDeleteSavedSearch.tsx`            |
| `Table`           | Table renderers                                | `TableSittingSpeeches.tsx`               |
| `TableIndex`      | Table state owner + orchestrator               | `TableIndexSittingSpeeches.tsx`          |
| `TableFilters`    | Table filter controls                          | `TableFiltersSittingSpeeches.tsx`        |
| `TablePagination` | Table pagination wrapper                       | `TablePaginationSittingSpeeches.tsx`     |
| `TableColumns`    | Column definitions (hook file)                 | `useTableColumnsSittingSpeeches.tsx`     |
| `Button`          | Standalone button components                   | `ButtonCopyCitation.tsx`                 |
| `Card`            | Card display components                        | `CardSittingSummary.tsx`                 |
| `Badge`           | Status badges                                  | `BadgeReportType.tsx`                    |
| `Notice`          | Empty states and informational blocks          | `NoticeEmptySpeeches.tsx`                |
| `Popover`         | A trigger with its popover                     | `PopoverUnofficialTranscript.tsx`        |
| `Row`             | One record rendered as a block in a list       | `RowSpeech.tsx`                          |
| `ActionBar`       | A group of actions on one record               | `ActionBarSpeechCopy.tsx`                |
| `Skeleton`        | A page or section's loading shape             | `SkeletonPerson.tsx`                     |
| `Icon`            | Icon wrapper components                        | `IconReportType.tsx`                     |
| `Section`         | A titled block of a page                       | `SectionForms.tsx`                       |
| `Swatch`          | A colour sample                                | `SwatchColour.tsx`                       |
| `Group`           | A titled list inside a section                 | `GroupColours.tsx`                       |
| `List`            | A list of records rendered as `ul` or `ol`     | `ListSpeeches.tsx`, `ListAttendance.tsx` |
| `Text`            | A text renderer with inline markup             | `TextTranscript.tsx`                     |
| `Snippet`         | A short excerpt with matches marked            | `SnippetHighlighted.tsx`                 |
| `Pagination`      | A shared pager (lives in `components/layout/`) | `PaginationPrevNext.tsx`                 |

When the category alone is self-explanatory within the folder, the context suffix can be omitted — e.g. `ActionBar.tsx` in a folder that only has one action bar. Add context when disambiguation is needed — e.g. `ActionBarSpeechCopy.tsx` when multiple action bars exist in the same folder.

`Index.tsx` in `routes/` stays lowercase (`index.tsx`) — that is a TanStack Router requirement, not a project convention.

---

## Function Naming

Function names reflect their specific use in context — never a generic description of the operation in the abstract.

```typescript
// Good — name tied to the specific domain operation
filterSpeechesBySpeaker(speeches: Speech[], speaker: string)
validateSearchTermAsync(term: string)

// Bad — generic, could apply anywhere
filterList(speeches: Speech[], speaker: string)
```

Functions read as verbs (`validateSearchTermAsync`), not nouns or class names (`SearchTermValidator`). If a name reads like a class, rename it to the action it performs.

---

## General Conventions

- Never write comments or JSDoc — names must be self-documenting. The only exception is a non-obvious business constraint that cannot be expressed in the name.
- Always use `import type` for type-only imports — makes the compile-time boundary explicit and keeps module evaluation clean.
- Never wrap a single element in a fragment — only use fragments when returning multiple siblings with no container element needed.
- Never leave `console.log` in production code. If an error needs surfacing, display a user-readable message — see [Error Display](#error-display).
- Shared helper functions used in more than one place belong in `src/lib/utils.ts`. Don't duplicate utilities across components.

```typescript
// Good
import type { Speaker } from '@/types/interfaces'
import type { ColumnDef } from '@tanstack/react-table'

// Bad
import { Speaker } from '@/types/interfaces'
import { ColumnDef } from '@tanstack/react-table'
```

## Navigation and Menu Items

Define nav and menu items as a typed constant array and map over them in JSX. Never hardcode items inline — a constant array makes the list easy to extend without touching render logic.

```tsx
// Good
const NAV_ITEMS = [
  { label: 'Home', to: '/' },
  { label: 'Design', to: '/design' },
] as const

{NAV_ITEMS.map((item) => (
  <NavButton key={item.label} to={item.to}>
    {item.label}
  </NavButton>
))}

// Bad — items hardcoded inline
<NavButton to="/">Home</NavButton>
<NavButton to="/design">Design</NavButton>
```

## Named Handlers

Extract event handlers as named functions rather than inlining anonymous functions in JSX. Inline handlers make JSX harder to scan and the logic harder to reuse.

```tsx
// Good
function toggleSpeechSearch() {
  setIsSearching((prev) => !prev)
}

<button onClick={toggleSpeechSearch}>Search</button>

// Bad — anonymous handler inline
<button onClick={() => setIsSearching((prev) => !prev)}>Search</button>
```

## Boolean Naming

Boolean variables always use an `is`/`can`/`has` prefix — `isSubmitted`, `canSubmit`, `hasSpeeches`. A plain noun or verb without the prefix doesn't read as a boolean predicate at the call site.

```typescript
// Good
const isSubmitted = true
const canSubmit = false
const isViewingAttendance = true

// Bad — not immediately readable as a boolean
const submitStatus = true
const viewingAttendance = false
```

## State Typing

Always pass an explicit type parameter to `useState`. When the initial value is `false`, `0`, or `''`, TypeScript infers the primitive type and loses the domain type — be explicit.

```typescript
// Good
const [sortOrder, setSortOrder] = useState<SortOrder>(SortOrder.NEWEST)
const [dateRange, setDateRange] = useState<DateRangeFilterValue>(
  DateRangeFilterValue.ALL
)
const [isOpen, setIsOpen] = useState<boolean>(false)

// Bad — loose typing, domain type lost
const [sortOrder, setSortOrder] = useState('newest')
const [isOpen, setIsOpen] = useState(false)
```

## Enum State Machines

When a UI component can be in more than two mutually exclusive states, model it as an enum rather than multiple boolean flags. Boolean flags compound — two flags give four possible states, most of which are invalid.

```typescript
// Good — enum state machine, one valid state at a time
enum SittingView {
  TRANSCRIPT = 'Transcript',
  ATTENDANCE = 'Attendance',
}

const [view, setView] = useState<SittingView>(SittingView.TRANSCRIPT)

if (view === SittingView.TRANSCRIPT) return <Transcript />
if (view === SittingView.ATTENDANCE) return <Attendance />

// Bad — two flags, three invalid combinations possible
const [isViewingTranscript, setIsViewingTranscript] = useState(true)
const [isViewingAttendance, setIsViewingAttendance] = useState(false)
```

## Hook Return Shape

Custom hooks always return a named object, never a tuple — positional unpacking breaks silently when a hook grows a new value.

```typescript
// Good
const { customRef, hovering } = useHover()
const { theme, setTheme } = useTheme()

// Bad
const [customRef, hovering] = useHover()
```

## Dialogs

### State Ownership

Use the self-contained pattern by default — the dialog owns its own `open` state and embeds a `DialogTrigger`. This keeps the trigger and the dialog co-located and minimises boilerplate at the call site.

```tsx
export function DialogDeleteSavedSearch({ searchId }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button onClick={(e) => e.stopPropagation()}>
          <Trash2 size={20} />
        </button>
      </DialogTrigger>
      <DialogContent>...</DialogContent>
    </Dialog>
  )
}
```

Use the parent-controlled pattern only when the dialog needs to be opened without a dedicated trigger button, or from more than one place:

```tsx
// Dialog — no DialogTrigger, state comes from outside
export function DialogRenameSavedSearch({ isOpen, setIsOpen, ...props }: Props) {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>...</DialogContent>
    </Dialog>
  )
}

// Parent controls when it opens
const [isOpen, setIsOpen] = useState(false)
<DialogRenameSavedSearch isOpen={isOpen} setIsOpen={setIsOpen} ... />
```

### `DialogTrigger` inside clickable containers

When the trigger sits inside a clickable parent (e.g. a table row), always call `e.stopPropagation()` on the trigger to prevent the row click from firing as well:

```tsx
<DialogTrigger asChild>
  <button onClick={(e) => e.stopPropagation()}>
    <Trash2 size={20} />
  </button>
</DialogTrigger>
```

### Structure

Every dialog follows this structure:

```tsx
<DialogContent className="bg-background flex flex-col gap-8 p-8">
  <DialogHeader>
    <DialogTitle>Title</DialogTitle>
    <DialogDescription hidden />
  </DialogHeader>

  {/* Body content */}

  {/* Action buttons */}
  {errorMessage && (
    <div className="flex flex-row gap-4">
      <TriangleAlert className="text-destructive" />
      <p className="text-destructive">{errorMessage}</p>
    </div>
  )}
</DialogContent>
```

`<DialogDescription hidden />` is always required — Radix emits an accessibility warning without it.

### Cancel button

Always use `DialogClose` to wrap the cancel button so Radix handles closing. Never call `setOpen(false)` manually for cancel:

```tsx
// Good
<DialogClose asChild>
  <Button variant="outline">Cancel</Button>
</DialogClose>

// Bad
<Button onClick={() => setOpen(false)}>Cancel</Button>
```

## Error Display

Render inline errors with `TriangleAlert` and the message text, both in `text-destructive`. Place the error below the main content and above any action buttons so it is conspicuous without obscuring the content.

```tsx
{
  errorMessage && (
    <div className="flex flex-row gap-4">
      <TriangleAlert className="text-destructive" />
      <p className="text-destructive">{errorMessage}</p>
    </div>
  )
}
```

Any user action that could resolve the error must clear it first — see [Mutation Error Pattern](#mutation-error-pattern) for the clearing behaviour.

The `TriangleAlert` + `text-destructive` treatment above is for **inline** errors — a failed mutation inside a form or dialog. A **failed page-level fetch** (a query's `isError`) uses an error notice instead — see [Error Notices](#error-notices).

## Error Notices

When a page-level query fails (`isError`), render a dedicated `Notice{Error}{Feature}` component — never inline the fallback JSX in the page/`Index` component, and never reuse the inline [Error Display](#error-display) treatment for a full-page state. The error notice is a sibling to the feature's empty-state notice (e.g. `NoticeErrorSpeeches` next to `NoticeEmptySpeeches`) and shares its centred layout, so the error and empty states sit identically in the page.

The page component owns the query and branches on its flags — the notice only renders and reports intent back up:

```tsx
const { data, isLoading, isError, refetch, isRefetching } =
  useGetSittingSpeeches({ sitting_id })

if (isLoading) return <SkeletonSitting />
if (isError) {
  return (
    <NoticeErrorSpeeches onRetry={() => refetch()} isRetrying={isRefetching} />
  )
}
```

**Retry is the primary action.** A failed fetch is usually transient, so the notice must let the user recover in place rather than only navigating away. Expose retry via an `onRetry: () => void` prop wired to the query's `refetch`, and an `isRetrying: boolean` prop wired to `isRefetching` — the notice never calls the API hook itself, exactly as a form receives mutation state from its parent.

The anatomy is fixed:

- **Container** — centred column, owning its own vertical rhythm: `flex w-full flex-col items-center justify-center gap-12 py-24`. Never wrap the notice in an `h-[100vh]` / `h-screen` shell — `py-24` is the standard, matching the empty-state notice.
- **Icon** — `TriangleAlert` at `size={40}` in `text-destructive`. Red is reserved for the icon; it is the only red element.
- **Headline** — one short line, `text-base font-semibold text-foreground`. States what failed, not how (e.g. "Couldn't load the speeches").
- **Body** — muted supporting copy, `max-w-100 text-sm text-muted-foreground`. Explains the failure and suggests trying again.
- **Actions** — a row with the secondary escape as `variant="outline"` (e.g. "Back to home") and retry as the primary `variant="default"`. The retry button follows [Button Pending State](#button-pending-state) — disabled while `isRetrying`, `Spinner` + progressive label ("Retrying…").

When the failure carries detail worth showing, read it from the `ApiError` thrown by `@/api/client` (`error.status`, `error.body`) rather than from the raw error object. The notice itself still receives only `onRetry` and `isRetrying`.

```tsx
interface NoticeErrorSpeechesProps {
  onRetry: () => void
  isRetrying: boolean
}

export function NoticeErrorSpeeches({
  onRetry,
  isRetrying,
}: NoticeErrorSpeechesProps) {
  const navigate = useNavigate()

  return (
    <div className="flex w-full flex-col items-center justify-center gap-12 py-24">
      <div className="flex flex-col items-center justify-center gap-3 text-center">
        <TriangleAlert size={40} className="text-destructive" />
        <p className="text-foreground text-base font-semibold">
          Couldn't load the speeches
        </p>
        <p className="text-muted-foreground max-w-100 text-sm">
          The speeches did not load. Try again in a moment.
        </p>
      </div>

      <div className="flex flex-row items-center gap-4">
        <Button variant="outline" onClick={() => navigate({ to: '/' })}>
          <ChevronLeft className="h-4 w-4" />
          Back to home
        </Button>
        <Button variant="default" disabled={isRetrying} onClick={onRetry}>
          {isRetrying ? (
            <>
              <Spinner />
              Retrying…
            </>
          ) : (
            <>
              <RotateCw className="h-4 w-4" />
              Try again
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
```

## Mutation Error Pattern

Always clear `errorMessage` to `''` before calling `mutate`, then set it in `onError`. Setting it only in `onError` leaves a stale error from the previous attempt visible while a new attempt is in flight.

`onError` receives the `ApiError` thrown by `@/api/client`. Pick the user-facing message from `error.status` when the status matters; never render `error.body` straight into the UI.

```typescript
// Good
const onSubmit = (values: FormValues) => {
  setErrorMessage('')
  mutate(values, {
    onSuccess: () => {
      /* ... */
    },
    onError: (error: ApiError) =>
      setErrorMessage(
        error.status === 422
          ? 'Check the form and try again.'
          : 'Failed to save changes.'
      ),
  })
}

// Bad — previous error stays on screen during new attempt
const onSubmit = (values: FormValues) => {
  mutate(values, {
    onError: () => setErrorMessage('Failed to save changes.'),
  })
}
```

## Button Pending State

Loading buttons always: disable on `isPending`, render `Spinner`, and change the label to the progressive verb form. Never use a generic "Loading…" label. The `Button` component's `gap-2` base class handles spacing between the spinner and label automatically.

```tsx
// Good
<Button disabled={isPending} type="submit">
  {isPending ? (
    <>
      <Spinner />
      Saving…
    </>
  ) : (
    'Save'
  )}
</Button>
```

`Spinner` draws in the current text colour, so it matches the button variant without a colour prop. The `Button` base class sizes child icons to `size-4`, so do not pass a size.

## Form Character Limits

Character limits must be defined as named constants at function scope, never inlined at the display site.

```typescript
// Good
const SEARCH_NAME_CHAR_LIMIT = 256

<p>{name.length} / {SEARCH_NAME_CHAR_LIMIT} Characters</p>

// Bad
<p>{name.length} / 256 Characters</p>
```

## Forms

### File Placement

Forms live in their component's folder by default. Move a form to `src/forms/` only when it is used in more than one place — the shared location signals that it is intentionally reusable.

### Schema Co-location

The Zod schema always lives in the same file as the form component. Never extract a schema into a separate file — if a schema needs to be shared, that means the form itself should be shared and moved to `src/forms/`.

```typescript
const formSchema = z.object({
  name: z.string().min(1, { error: 'Name is required.' }),
  export_format: z.enum(ExportFormat),
})

export function FormExportSpeeches(...) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', export_format: ExportFormat.CSV },
  })
}
```

### Static Constants at Module Scope

Define `formSchema` and other static constants at module scope, not inside the component function. A constant defined inside a component is recreated on every render — if it does not close over props or state, it belongs outside.

```typescript
// Good — defined once at module scope
const formSchema = z.object({
  name: z.string().min(1, { error: 'Name is required.' }),
})

export function FormCreateSavedSearch() {
  const form = useForm<z.infer<typeof formSchema>>({ ... })
}

// Bad — recreated on every render
export function FormCreateSavedSearch() {
  const formSchema = z.object({
    name: z.string().min(1, { error: 'Name is required.' }),
  })
  const form = useForm<z.infer<typeof formSchema>>({ ... })
}
```

This applies to any constant that doesn't depend on component state or props — option arrays, config objects, default values, and similar static data.

### Validation Error Messages

Validation error messages belong in the Zod schema, not rendered manually in JSX. This keeps validation logic and its messaging co-located.

```typescript
// Good
const formSchema = z.object({
  query: z.string().min(1, { error: 'Enter a search term.' }),
})

// Bad
{!queryValue && <p className="text-destructive">Enter a search term.</p>}
```

### Enum Fields

Always use `z.enum()` with the TypeScript enum to validate enum-typed fields — never `z.string()` for a field whose values come from an enum.

```typescript
// Good
const formSchema = z.object({
  sort_order: z.enum(SortOrder),
  export_format: z.enum(ExportFormat),
})

// Bad — string allows any value, loses type safety
const formSchema = z.object({
  sort_order: z.string(),
})
```

### Mutation Ownership

By default, a form owns its mutation internally — it calls the hook, calls `mutate()` in `onSubmit`, and manages `isPending` and `errorMessage` itself.

Pass mutation state as props (`onSubmit`, `isPending`, `errorMessage`) only when the parent needs to observe the pending state for UI outside the form — for example, a loading indicator in a results list while the form submits.

```typescript
// Default — form owns the mutation
export function FormRenameSavedSearch({ searchId }: Props) {
  const { mutate, isPending } = useRenameSavedSearch()
  const [errorMessage, setErrorMessage] = useState('')
  // ...
}

// Exception — parent owns mutation because pending state drives external UI
export function FormRefineSearch({ onSubmit, isPending, errorMessage }: Props) {
  // form handles field state only
}
```

### Pre-populating Edit Forms

Edit forms receive existing data as props from a parent that has already resolved the query. Pass the data directly into `defaultValues` — never use `useEffect` + `form.reset()` to populate after mount.

The parent gates rendering behind `isLoading` so the form always initialises with real data.

```typescript
// Parent
if (isLoading) return <SkeletonFormEditSavedSearch />
return <FormEditSavedSearch description={data.description} />

// Form
export function FormEditSavedSearch({ description }: Props) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { description },
  })
}
```

### Reset

Call `form.reset()` in `onSuccess` after a successful submission. Do not reset on close or cancel — a failed or abandoned form preserves its state.

```typescript
mutate(values, {
  onSuccess: () => {
    form.reset()
    setIsOpen(false)
  },
  onError: () => setErrorMessage('Failed to save changes.'),
})
```

### Pending State

Disable all form inputs while `isPending` — not just the submit button. This prevents the user from editing fields mid-submission.

```typescript
<Input {...field} disabled={isPending} />
<Select disabled={isPending}>...</Select>
<Button type="submit" disabled={isPending}>...</Button>
```

---

## Buttons

### Variants and Sizes

Always use a defined variant and size from `button.tsx`. Never use `className` to override button colours, dimensions, or spacing — if the right variant or size doesn't exist, add it to `button.tsx`.

### Naming New Variants and Sizes

When adding a new variant or size to `button.tsx`:

- **Variants** describe visual role and hierarchy — not where the button is used. Use names like `default`, `secondary`, `outline`, `ghost`, `link`, `destructive`.
- **Sizes** describe dimensions — not where the button is used. Use names like `sm`, `default`, `lg`, `icon`.

### Button States

Every variant in `button.tsx` must define all three states using the corresponding semantic tokens, e.g. `bg-primary hover:bg-primary-hover active:bg-primary-active`:

| State   | Tailwind prefix | Token pattern                     |
| ------- | --------------- | --------------------------------- |
| Default | —               | variant's base bg and text tokens |
| Hover   | `hover:`        | `{variant}-hover` token           |
| Pressed | `active:`       | `{variant}-active` token          |

The disabled state is handled globally in the base class — do not override it per variant unless the variant requires a transparent background when disabled (e.g. `ghost` variants).

Recorded exception: `outline`, `ghost` and `quiet` have no fill of their own, so they use the shared `accent` surface for hover (`hover:bg-accent hover:text-accent-foreground`) and `secondary-active` for pressed. `quiet` is a ghost button with muted text for small actions repeated on every item in a list, such as the per-speech copy buttons. `link` has no background in any state; its hover is the underline only.

---

## Conditional Branching

Use `if` for rendering UI — early returns for loading/error states and enum-driven JSX. Always include a final fallback return to make exhaustive intent visible and catch enum additions at review time.

```typescript
// Good
if (isFetching) return <Spinner />
if (error) return <ErrorDisplay />

if (view === SittingView.TRANSCRIPT) return <Transcript />
if (view === SittingView.ATTENDANCE) return <Attendance />
if (view === SittingView.SUMMARY) return <Summary />
return <UnknownView />
```

Use `switch` for longer non-rendering logic chains — filter functions, value mappings, and similar pure computations.

```typescript
// Good
filterFn: (row, columnId, filterDate) => {
  switch (filterDate) {
    case DateRangeFilterValue.ALL:
      return true
    case DateRangeFilterValue.TODAY:
      return isToday(rowDateValue)
    case DateRangeFilterValue.LAST_7_DAYS:
      return isWithinLastNDays(rowDateValue, 7)
    case DateRangeFilterValue.LAST_30_DAYS:
      return isWithinLastNDays(rowDateValue, 30)
    default:
      return false
  }
}
```

When there is a single positive condition, return it directly rather than splitting into two `return` statements:

```typescript
// Good — single condition, returned directly
return isPending ? <Spinner /> : null

// Bad — unnecessary early-return split for a single condition
if (isPending) return <Spinner />
return null
```

The early-return style is for multiple guard clauses (loading, error, enum branches) — not for a single binary condition.

## Styling

### Colours

Always use the named semantic tokens generated into `src/palette.css` — never raw Tailwind palette names, arbitrary hex values, colour-named tokens like `text-crimson`, or the named source colours through arbitrary-value syntax (`bg-(--panelling)`):

```tsx
// Good
<div className="bg-background text-foreground border-border" />
<p className="text-destructive" />

// Bad — raw palette name
<div className="bg-white text-black border-gray-300" />

// Bad — arbitrary hex
<div className="text-[#FFFFFF]" />

// Bad — colour-named token, not semantic
<p className="text-crimson" />
```

If a colour is needed that doesn't exist as a token yet, add it — don't inline it:

- Add a named source colour (or reuse one) and a semantic token that points at it for light and dark in `src/palette/palette.ts`, run `pnpm palette` to regenerate `src/palette.css`, then register the token in the `@theme inline` block in `index.css` as `--color-<name>`
- Theme-invariant tokens still get both a light and a dark entry in `palette.ts`, pointing at the same named colour

Never use opacity utilities to lighten a colour. The on-screen colour is a composite of the token and whatever is behind it — it will differ across backgrounds and between light and dark mode. Define a dedicated lighter token instead.

```tsx
// Good — dedicated token at the right lightness
<p className="text-muted-foreground" />

// Bad — opacity-derived colour, varies by background
<p className="text-foreground opacity-50" />
<p className="text-foreground/50" />
```

The one exception is when opacity is _necessary_ to show what sits behind the coloured element — a semi-transparent overlay or scrim, where seeing through to the content underneath is the point. Even then, the base colour is still a semantic token, never a raw palette name.

```tsx
// Good — scrim over the page, opacity is intentional so the content shows through
<div className="absolute inset-0 bg-overlay/60" />

// Bad — same intent, but raw palette name instead of a token
<div className="absolute inset-0 bg-black/60" />
```

### Animations

**Loading indicators** always use `Spinner` from `@/components/ui` — never a custom `div` spinner or a bare `Loader2`. Size to context with a `size-*` class:

```tsx
// Good
<Spinner />   // inside a button, sized by the Button base class
<Spinner className="size-6" />  // standalone inline indicator

// Bad — custom div spinner
<div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />

// Bad — Loader2
<Loader2 className="h-4 w-4 animate-spin" />
```

**No decorative animation.** Motion answers a user action (open, close, expand, hover) or shows real progress. Nothing moves on its own: no entrance fades, no scroll reveals, no pulsing status dot, no bounce easing. The app is a read-only record with no background process to signal. If an animation is needed, define it in `src/index.css` with an `--animate-*` variable in the `@theme` block and the matching `@keyframes`, and never inline `style={{ animation: ... }}`. Built-in animations from `tw-animate-css` are fine to use as they are.

**Transitions** name the property they animate and follow standard durations by context. Never use `transition-all`, which animates layout properties nobody asked for. Primitives in `components/ui/` keep the classes shadcn ships with.

| Context                 | Classes                                                              |
| ----------------------- | -------------------------------------------------------------------- |
| Hover (colour, opacity) | `transition-colors duration-150` / `transition-opacity duration-150` |
| Expand/collapse content | `transition-[grid-template-rows] duration-300 ease-in-out`           |
| Drawer / sidebar        | `transition-transform duration-200 ease-out`                         |

For expand/collapse, put the transition on a grid wrapper that moves between `grid-rows-[0fr]` and `grid-rows-[1fr]`. Use `transition-[height]` instead when the open height is fixed.

Hover never scales (`hover:scale-*`). It is a colour or background step.

Do not use `duration-1000` or similar long durations to simulate a progress bar. If a real progress value is unavailable, use a `Spinner`.

### Custom CSS (`index.css`)

`index.css` is only for things that genuinely cannot be expressed in a Tailwind `className` — Radix `data-state` attribute selectors, scrollbar overrides, and global resets. All other styling belongs in `className`. The Tailwind import, the `@import` of the generated `palette.css` and the `@theme inline` block are the other permitted contents. `palette.css` is generated; never edit it by hand.

```css
/* Good — data-state selector not expressible in Tailwind */
.accordion-trigger[data-state='open'] {
  background-color: var(--color-accent);
}

/* Bad — this belongs in className */
.my-button {
  background-color: var(--color-primary);
  padding: 1rem;
}
```

### `className` Strings

Use a plain string for `className` when the value is static. Never wrap it in `{}` or a template literal unnecessarily.

```tsx
// Good
<div className="flex flex-col gap-4" />

// Bad — unnecessary JSX expression
<div className={"flex flex-col gap-4"} />

// Bad — unnecessary template literal
<div className={`flex flex-col gap-4`} />
```

Only reach for `{}` when the value is actually dynamic — and then use `cn()`.

### Conditional classes

Always use `cn()` for conditional classes — never string interpolation or raw ternaries in `className`. `cn()` handles class deduplication and merge conflicts that string interpolation cannot.

```tsx
// Good
<div className={cn('base-class', isActive && 'bg-muted', isDisabled && 'opacity-50 cursor-not-allowed')} />

// Bad
<div className={`base-class ${isActive ? 'bg-muted' : ''} ${isDisabled ? 'opacity-50' : ''}`} />
```

## Visual design

Most of this app is written by Claude, and Claude's defaults with shadcn and Tailwind produce AI tells. An AI tell is a visible pattern that people associate with AI-generated websites. This section lists the AI tells in layout, type, colour, radius, shadow, icons and motion that apply to a record browser. AI tells in copy are in [Copy](#copy). Each symptom below links its source once. The rules come from a review of AI tells run on 14 Oct 2026, and the examples are the changes Royce accepted from it.

**Clear fix or taste proposal.** Fixing an AI tell is a clear fix when the fix removes something broken, fake or non-functional, or brings code into line with a hard rule below. Apply a clear fix without asking. Fixing an AI tell is a taste proposal when the fix changes type, colour, spacing, layout, radius, shadow, icons or component choice beyond what a rule requires, or reverses a pick recorded here. A taste proposal goes to Royce as a before and after screenshot with the AI-look reason, and nothing reaches master until he accepts it.

### Symptoms

- **Cards for a list of records** (also: card grid, cards for everything). Search results, reports, sittings and links rendered as a column or grid of bordered cards. Fix: divided rows, `border-separator border-b py-4 last:border-b-0` on each `<li>`, as on every list page. Card is for a self-contained object shown side by side, such as a `/palette` colour swatch, never for a list item. [Impeccable](https://www.impeccable.style/slop).
  Before: home as three equal cards in `grid gap-4 md:grid-cols-3`, and search results as 20 shadowed cards. After: full-width row links (`routes/index.tsx`) and divided rows (`ListReportMatches.tsx`).
- **Stat grid** (also: hero metric, big number with small label). A grid of large figures with captions above any real content. Fix: a table with a "Measure" and a "Count" column, [Numeric Columns](#numeric-columns) rules, and figures at body weight. [Anthropic, frontend-design](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md).
  Before: nine big serif numbers in `grid sm:grid-cols-2 lg:grid-cols-3` on `/coverage`, a full screen at 375 px. After: `TableCoverageCounts`.
- **Stacked elevation** (also: elevation soup). A border and a shadow on the same element, or a ring on top of both. Fix: a border for anything on the page. A shadow is only for a layer that floats above the page (popover, dropdown, tooltip, sheet, dialog), and those primitives already set it in `components/ui/`. [Impeccable](https://www.impeccable.style/slop).
  Before: `card.tsx` with `border` and `shadow-sm`. After: `border` only.
- **Rounded everything** (also: pills by reflex). `rounded-full`, `rounded-xl` or `rounded-2xl` on tags, controls and sections because it is the default. Fix: SGDS radii from `docs/sgds-tokens.md`. Use `rounded-sm` (4px) for indicators such as badges, `rounded-md` (8px) for interactive and form controls, and `rounded-lg` for a card. `rounded-full` is only for something round, such as an avatar placeholder. [DeSlop](https://github.com/nate-zz/DeSlop).
  Before: `badge.tsx` with `rounded-full`, about 25 pills in one viewport on a sitting page. After: `rounded-sm`.
- **Loud repeated actions.** The same outlined or filled buttons repeated on every item, competing with the content. Fix: per-item actions use the `quiet` button variant (see [Buttons](#buttons)). Only the page-level action is outlined. [Anthropic, frontend-design](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md).
  Before: one ghost and one outline button under every speech, including "Question put, and agreed to." After: `ActionBarSpeechCopy` with `quiet` icon buttons.
- **Decorative effects.** Gradient backgrounds, gradient text (`bg-clip-text`), glassmorphism (`backdrop-blur`), glow shadows, a coloured border stripe wider than 1px on one side of a card, blobs, grain and floating shapes. Fix: delete them. Colour comes from the semantic tokens in [Colours](#colours) and means something. [DeSlop](https://github.com/nate-zz/DeSlop).
  Before (illustrative): `<h1 className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">`. After: `<h1 className="font-serif">`.
- **Template chrome.** A tracked all-caps eyebrow label above a heading, 01/02/03 markers on content that isn't a sequence, one word of a heading in italic or a colour, middle-dot meta strings, "→" appended to link text, an icon in a tinted rounded square above a heading, emoji as icons, and monospace used to look technical. Fix: delete it. A heading needs no label above it, and icons come from `lucide-react` at one size and stroke. [Anthropic, frontend-design](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md).
  Before (illustrative): `<p className="text-xs tracking-wider uppercase">Archive</p>` above `<h1>Sittings</h1>`. After: `<h1>Sittings</h1>`.
- **Scaffold in the product** (also: generator residue). Placeholder `href="#"` links, specimen pages such as `/design` and `/palette` in the primary nav, and the same destination linked twice in one view. Fix: every link goes somewhere real, `/design` is not linked from the site, `/palette` is linked from the footer only, and each destination is linked once per view. [Hallmark](https://github.com/Nutlope/hallmark).
  Before: a header nav of Home, Search, Sittings, People, Coverage, Design and Palette that wrapped to two rows at 375 px, and "Read on the official record" in both the metadata list and the alert below it. After: `NAV_ITEMS` of Search, Sittings, People and Coverage (the wordmark links home), and one official-record link in `ListReportMetadata`.
- **Decorative motion.** See [Animations](#animations): no `transition-all`, no hover scale, nothing that moves on its own. [Hallmark](https://github.com/Nutlope/hallmark).

### Rules for this codebase

- **Records are rows.** Any list of reports, speeches, sittings, people or links is a list of divided rows or a table. This rule has no exceptions outside `/design` and `/palette`.
- **Numbers line up.** Numeric table columns follow [Numeric Columns](#numeric-columns), and counts in prose use `NUMBER_LOCALE`.
- **Check the rendered page.** Open every changed route at 375 px and 1280 px before calling it done. The page has no horizontal scroll, and nav links and buttons don't wrap onto a second line.
- **Every state is designed.** Loading, empty, error and not-found follow [Page Loading States](#page-loading-states), [Error Notices](#error-notices) and the table [Empty State](#empty-state). Test them with real content, such as a long all-caps report title, a person with one speech and a Parliament with no reports.
- **Preference:** one thing per screen is the focal point, and everything around it stays quiet. Spend emphasis (size, weight, the `primary` colour) on that one thing.
- **Preference:** density matches the task. Record lists and tables are compact. Reading pages give the transcript room.
- **Preference:** a new choice of type, colour or layout should have a stated reason other than "it is the default". Avoiding the AI tells listed here and reaching for a different default creates a new AI tell.

### House choices where sources disagree

These choices stay on purpose, even though one or more sources call them AI tells. Don't flag them in review.

- **Inter for UI text.** Hallmark, anti-ai-slop and Impeccable list Inter as the most overused AI font. SGDS v3 sets `--sgds-font-family-brand` to Inter, and Royce kept it after the 14 Oct 2026 review, which compared it with Source Sans 3 (`docs/sgds-tokens.md`). It is paired with Source Serif 4, so it is not the only face.
- **Serif headings and speech text.** Source Serif 4, for a reading product. Since 17 Oct 2026 the background is the chamber's floor-carpet cream (#f8f2dc, chroma 0.03), so the site has two of the three marks of frontend-design's cream, serif and terracotta cluster. The accent is the mahogany panelling #6d3e31, not terracotta. Royce picked it over an orange timber primary to stay out of that cluster (ADR 0005).
- **Lucide icons.** Hallmark calls Lucide a SaaS default. Here Lucide marks functions only (search, copy, theme, retry) and the notice anatomy in [Error Notices](#error-notices), never decoration.
- **shadcn primitives.** anti-ai-slop and Hallmark name the untouched shadcn card as an AI tell. The primitives here carry the overrides in `docs/sgds-tokens.md`, and new overrides are recorded there.
- **The lilac search highlight.** Purple is the most cited AI colour. `--highlight` is a text highlight sampled from the national flower under the insignia palette (`docs/palette.md`), not a purple brand accent or a gradient.
- **Monospace on `/palette`.** It sets hex, RGB and OKLCH values and token names, which is functional.
- **All-caps report titles.** They come from the Official Report source data.

### Review checklist

Run on every diff that touches `app/src`:

- `git diff -U0 -- app/src ':!app/src/components/ui' | rg '^\+' | rg -n 'bg-gradient|bg-linear|bg-radial|bg-clip-text|backdrop-blur|transition-all|hover:scale|rounded-(full|xl|2xl|3xl)|shadow-|uppercase.*tracking|tracking.*uppercase|href="#"'` returns nothing, or each hit is justified by a rule above (an avatar's `rounded-full`, a floating layer's shadow).
- `git diff -U0 -- app/src | rg '^\+' | rg -n '[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]'` returns nothing.
- No list of records is wrapped in `Card`, and no grid holds equal cards.
- Each changed route was opened at 375 px and 1280 px, with no horizontal scroll and no wrapped nav or button text.
- A change that alters type, colour, spacing, layout, radius, shadow, icons or component choice beyond a rule above is a taste proposal with a before and after for Royce.

## Tables

### File Structure

Every table lives in its own folder and is split into exactly four files, each with a single responsibility:

```
tableSittingSpeeches/
├── TableIndexSittingSpeeches.tsx      # State owner + orchestrator
├── TableSittingSpeeches.tsx           # Table renderer (receives table instance)
├── TableFiltersSittingSpeeches.tsx    # Filter controls
├── TablePaginationSittingSpeeches.tsx # Thin wrapper around shared pagination
└── useTableColumnsSittingSpeeches.tsx # Column definitions
```

**`TableIndex`** owns all TanStack state (`columnFilters`, `sorting`, `pagination`), calls `useTable`, and composes the other three components. Nothing else touches state.

**`TableFilters`** receives `columnFilters`, `setColumnFilters`, and `defaultFilters` as props. It defines `getFilterValue` and `setFilterValue` helpers internally. It never owns state.

**`Table`** (the main renderer) receives only the `table` instance as a prop and renders the `<Table>` shell. It handles the empty state and nothing else. The empty-state message says what is empty, for example "No reports match the search."

**`TablePagination`** is a thin wrapper that forwards its props to the shared pagination component built on `@/components/ui/pagination`. Never re-implement pagination logic — always delegate to the shared component.

### State Initialisation

`defaultFilters` must be defined as a named variable in `TableIndex` and passed to both `useState` and `TableFilters` — this is how the reset button knows what "cleared" looks like:

```typescript
const defaultFilters: ColumnFiltersState = []
const [columnFilters, setColumnFilters] =
  useState<ColumnFiltersState>(defaultFilters)
```

Pagination always initialises at page 0, size 10:

```typescript
const [pagination, setPagination] = useState<PaginationState>({
  pageIndex: 0,
  pageSize: 10,
})
```

### Layout

`TableIndex` always wraps its children in `flex w-full flex-col gap-6`. The table itself sits inside a centering wrapper:

```tsx
<div className="flex w-full flex-col gap-6">
  <TableFilters... />
  <div className="flex w-full flex-col items-center justify-center">
    <Table... />
  </div>
  <TablePagination... />
</div>
```

### Empty State

The empty row uses these exact classes — `border-none` removes the bottom divider that would otherwise float in an empty table:

```tsx
<TableRow className="bg-background text-foreground hover:bg-background border-none">
  <TableCell
    colSpan={table.getAllColumns().length}
    className="border-none py-[15px] text-center"
  >
    No reports match the search.
  </TableCell>
</TableRow>
```

The message says what is empty. Never ship the shadcn template default `No Results.`

### Numeric Columns

A column of counts, shares or other figures is right-aligned with `tabular-nums` on every cell, and its head is right-aligned to match, so digits line up by place value. A year or date column stays left-aligned and still takes `tabular-nums`. Format counts with `toLocaleString(NUMBER_LOCALE)`, as described in [Copy](#copy).

```tsx
// Good
<TableHead scope="col" className="text-right">Speeches</TableHead>
<TableCell className="text-right tabular-nums">
  {count.speech_count.toLocaleString(NUMBER_LOCALE)}
</TableCell>

// Bad: proportional figures, left-aligned, no separators, so "1366" and "914" don't line up
<TableCell>{count.speech_count}</TableCell>
```

### Row Classes

Data rows always use this class string:

```tsx
<TableRow
  key={row.id}
  className={cn(
    'h-12 border-b border-separator bg-background py-4 last:border-b-0',
    row.getIsSelected() && 'bg-muted'
  )}
>
```

---

**Always define `getRowId` explicitly.** TanStack Table defaults to array index as row ID, which breaks selection state when rows reorder or the dataset changes.

```typescript
// Good
const table = useTable({
  features,
  columns,
  data,
  getRowId: (row) => row.id.toString(),
  // ...
})
```

**Register features once, at module scope.** TanStack Table v9 exposes an API only when its feature is passed to `tableFeatures()`, and each client row model is a slot in the same call. Define `features` outside the component so it stays stable between renders:

```typescript
const features = tableFeatures({
  columnFilteringFeature,
  rowSortingFeature,
  rowPaginationFeature,
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  filterFns: { includesString: filterFn_includesString },
  sortFns: { alphanumeric: sortFn_alphanumeric },
})

const table = useTable({
  features,
  columns,
  data,
  getRowId: (row) => row.id.toString(),
  state: { columnFilters, sorting, pagination },
  onColumnFiltersChange: setColumnFilters,
  onSortingChange: setSorting,
  onPaginationChange: setPagination,
})
```

Render cells with `flexRender` (or `<table.FlexRender cell={cell} />`). Row selection (`row.getIsSelected()`) needs `rowSelectionFeature` in the same call.

**Column definitions** are exported as `export const columns` when cells are self-contained, or `export function createColumns(...)` when cells need to close over external values such as IDs passed to actions inside cells. Use the simpler constant form by default; only reach for the function form when a cell references something from outside the column definition itself.

```typescript
// Static columns — no external data needed in cells
const columnHelper = createColumnHelper<typeof features, SittingSpeech>()

export const columns = columnHelper.columns([
  columnHelper.accessor('speaker', { ... }),
  columnHelper.accessor('sitting_date', { ... }),
])

// Parameterised columns — cell references sittingId from outside
export function createColumns(sittingId: number) {
  return columnHelper.columns([
    columnHelper.accessor('speaker', { ... }),
    columnHelper.display({
      id: 'actions',
      cell: ({ row }) => (
        <DialogDeleteSavedSearch sitting_id={sittingId} search_id={row.original.search_id} />
      ),
    }),
  ])
}
```

### Long-Text Columns

Columns containing long text — speech transcripts, report titles, free-text fields — must truncate and pair with a tooltip that reveals the full value on hover. Use `delayDuration={500}` and always pass `asChild` to `TooltipTrigger`.

```tsx
cell: (title) => (
  <Tooltip delayDuration={500}>
    <TooltipTrigger asChild>
      <p className="truncate px-4">{title.getValue()}</p>
    </TooltipTrigger>
    <TooltipContent
      side="bottom"
      className="max-w-80 rounded-md bg-muted p-2 text-foreground shadow-lg"
    >
      <p className="p-1 px-2 text-start">{title.getValue()}</p>
    </TooltipContent>
  </Tooltip>
),
```

Plain `truncate` without a tooltip is not sufficient — the truncated content becomes inaccessible.

## Enums and Constants

Never use magic strings or numbers directly in code — promote them to a named constant or enum. The character limit and timeout cases are covered in their own sections; this rule applies everywhere else.

```typescript
// Good
<Select defaultValue={SortOrder.NEWEST}>

// Bad — magic string
<Select defaultValue="newest">
```

### Folder Placement

Place enums and constants in the folder that matches their scope:

- **Used by one feature** → `constants/{feature}/enums.ts` or `constants/{feature}/constants.ts`
- **Used across multiple features** → `constants/enums.ts` or `constants/constants.ts`

If a value starts in the root and later becomes feature-specific (or vice versa), move it. The root files are not a catch-all — they should only contain genuinely shared values.

### `enums.ts` vs `constants.ts`

| File           | Contains                                                                           |
| -------------- | ---------------------------------------------------------------------------------- |
| `enums.ts`     | TypeScript `enum` declarations                                                     |
| `constants.ts` | Everything else — option arrays, string maps, config values, plain named constants |

Enum values and their paired dropdown option arrays always live in separate files:

```typescript
// constants/sittings/enums.ts
export enum SortOrder {
  NEWEST = 'newest',
  OLDEST = 'oldest',
  RELEVANCE = 'relevance',
}

// constants/sittings/constants.ts
export const SORT_ORDER_DROPDOWN_OPTIONS = [
  { value: SortOrder.NEWEST, label: 'Newest' },
  { value: SortOrder.OLDEST, label: 'Oldest' },
  { value: SortOrder.RELEVANCE, label: 'Relevance' },
]
```

### Naming

All constants are `SCREAMING_SNAKE_CASE`. Enums are `PascalCase` with `SCREAMING_SNAKE_CASE` members.

Dropdown option arrays are `SCREAMING_SNAKE_CASE` and always include `_DROPDOWN_OPTIONS` as a suffix — e.g. `SORT_ORDER_DROPDOWN_OPTIONS`, `DATE_RANGE_FILTER_DROPDOWN_OPTIONS`. This makes them immediately distinguishable from plain lists or config arrays, and consistent with all other constants.

### No duplicate enums

Never define the same enum in two places with differing values. If two features need slightly different variants (e.g. one includes an `ALL` option for filtering), name them distinctly — `ReportType` for the core domain values, `ReportTypeFilterValue` for the filter variant that adds `ALL`.

---

## Types

### `interface` vs `type`

Use `interface` for object shapes you write by hand — domain models, API shapes, component props. Use `type` for anything computed or derived from another type.

```typescript
// Good — hand-written object shape
interface Speaker {
  id: number
  name: string
  party: string
}

// Good — derived from Zod schema
type FormValues = z.infer<typeof formSchema>

// Good — union
type Status = 'active' | 'inactive'

// Good — utility type
type SpeakerWithSpeeches = Speaker & { speeches: Speech[] }

// Bad — type used for a plain hand-written object shape
type Speaker = {
  id: number
  name: string
}
```

### Placement

Types follow the same scoping rule as enums and constants:

- **Used by one feature** → `src/types/{feature}/interfaces.ts`
- **Used across multiple features** → `src/types/interfaces.ts`

If a type starts shared and becomes feature-specific (or vice versa), move it. The root file is not a catch-all.

### Co-located Types

Some types always live with the code that defines or owns them, regardless of the above rule:

| Type                            | Lives in                                                        |
| ------------------------------- | --------------------------------------------------------------- |
| API request/response interfaces | Same file as the hook (`src/api/{feature}/{verb}{Resource}.ts`) |
| Zod-derived form value types    | Same file as the form component                                 |
| Hook-scoped types               | Same file as the hook (`src/hooks/`)                            |
| Component prop interfaces       | Same file as the component, when only used there                |

### File Naming

Always `interfaces.ts` — never `interface.ts` (singular).

---

## Timeout Constants

Long-running request timeouts are module-level named constants, never inline numbers. When the value is configurable, derive from the env var with a hard-coded fallback. Pass the timeout to the wrapper as an abort signal.

```typescript
// Good
const REQUEST_TIMEOUT_15_MINUTES = 15 * 60 * 1000
const REQUEST_TIMEOUT =
  Number(import.meta.env.VITE_SEARCH_QUERY_TIMEOUT) ||
  REQUEST_TIMEOUT_15_MINUTES

await apiPost<SearchResponse>('/endpoint', data, {
  signal: AbortSignal.timeout(REQUEST_TIMEOUT),
})

// Bad — magic number buried at the call site
await apiPost<SearchResponse>('/endpoint', data, {
  signal: AbortSignal.timeout(900000),
})
```

## SessionStorage Keys

SessionStorage keys must include the owning resource ID to prevent cross-resource state collisions. Use the pattern `${resourceId}{FeatureName}` with no separator.

```typescript
// Good
sessionStorage.getItem(`${sittingId}SpeechFilters`)

// Bad — key is global, collides across sittings
sessionStorage.getItem('SpeechFilters')
```

## Copy

Every user-facing string in `app/src` follows these rules: buttons, labels, toasts, notices, empty and error states, tooltips, `aria-label` values, `sr-only` text, page and section text, placeholders, meta titles, `/design` and `/palette`, and any API error message the app shows. Copy states a fact the reader needs, in the words the interface already uses. Each symptom below is a way copy fails; the sources are linked once per symptom.

### Symptoms

- **Leaking system internals** (also: developer voice, internal jargon). Words the reader never sees on screen: parse, re-parse, cache, payload, status codes. Fix: say what happened or what to do, or drop it. [NN/g heuristic 2](https://www.nngroup.com/articles/ten-usability-heuristics/).
  Before: `Link copied. Speech links are best-effort and may move after a re-parse.` After: `Link copied`.
- **Hedging** (also: caveat creep, disclaimer stuffing). "May", "might", "best-effort", "typically", "in some cases". Fix: state the fact or the exact condition; if you can't, the caveat belongs on `/coverage/methods`. [Wikipedia, Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing).
  Before: `Links to individual speeches are best-effort, because a re-parse can renumber them.` (`NoticeDerivedText`) After: `A speech link can lead to a different speech after the archive is rebuilt.`
- **Over-explaining** (also: padding). A second sentence that adds a reason, history or mechanism nobody asked for. Fix: cut to the outcome; a confirmation is one short phrase. [Atlassian, success messages](https://atlassian.design/foundations/content/designing-messages/success-messages).
  Before: `Citation copied. The column number will be added once the archive has it.` (`ButtonCopyCitation`) After: `Citation copied`, with the column gap kept in the known gaps on `/coverage/methods`.
- **Unrequested warning on a routine action, wrong surface** (also: toast overload). A caveat attached to a success, or lasting information in a toast that vanishes in seconds. Fix: confirm only; put the warning where the reader decides, or on `/coverage/methods`. [NN/g, indicators, validations and notifications](https://www.nngroup.com/articles/indicators-validations-notifications/).
  Before: the two toasts above carry data gaps that `/coverage/methods` already lists. After: both toasts confirm and nothing else.
- **Redundant confirmation and "successfully"** (also: success filler). "Successfully", "Success!", "Done", "You have copied the link to your clipboard". Fix: noun plus past participle that names the result. [Atlassian, success messages](https://atlassian.design/foundations/content/designing-messages/success-messages).
  Before (illustrative): `Citation was successfully copied to your clipboard!` After: `Citation copied`.
- **Puffery and AI vocabulary** (also: promotional language). "Seamless", "powerful", "robust", "crucial", "serves as", "delve". Fix: delete the adjective and name the capability. [Wikipedia, Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing).
  Before (illustrative): `Seamlessly browse the full parliamentary record.` After: `Browse every report and sitting.`
- **Apologising and "please"** (also: politeness padding, "Oops" voice). "Sorry", "oops", "unfortunately", "please", "kindly". Fix: say what failed and the next step. [GOV.UK error message](https://design-system.service.gov.uk/components/error-message/).
  Before: `There was an issue fetching the speeches. Please try again.` After: `The speeches did not load. Try again in a moment.`
- **Passive or narrated system voice** (also: log-line voice). "Has been", "was processed", a missing actor. Fix: active voice, or a result phrase. A plain agentless failure ("Changes weren't saved") is fine. [GOV.UK A to Z](https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/style-guides/a-to-z-style-guide/).
  Before (illustrative): `Your link has been generated and copied.` After: `Link copied`.
- **Restating the label** (also: echo copy). A tooltip, placeholder or `aria-label` that repeats the visible label, or adds "button" or "icon". Fix: delete it, or say what the label does not. [Microsoft, writing for all abilities](https://learn.microsoft.com/en-us/style-guide/accessibility/writing-all-abilities).
  Before (illustrative): `<Button aria-label="Search button">Search</Button>` After: `<Button>Search</Button>`.
- **Title case** (also: headline capitalisation). Two or more capitalised words in a label that is not a proper noun. Fix: sentence case. "Parliament" and "Legislative Assembly" are proper nouns in this app. [GOV.UK A to Z](https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/style-guides/a-to-z-style-guide/).
  Before (illustrative): `Copy Speech Link` After: `Copy speech link`.
- **Em dashes** (also: the em dash tell). U+2014 in a string where a full stop, comma or colon fits. Fix: split the sentence. [Wikipedia, Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing).
  Before (illustrative): `Couldn't load the speeches` and `try again` joined by U+2014. After: `Couldn't load the speeches. Try again.`
- **Generic action labels** (also: Submit, OK). A button that names no action, or a label that fits any product. Fix: a verb plus the object it acts on. [Anthropic, frontend-design](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md).
  Before (illustrative): `<Button>Submit</Button>` on the search form. After: `<Button>Search</Button>`, or `Copy citation` where the object needs naming.
- **Guessing the cause** (also: blaming the reader). An error that names a cause the app can't know. Fix: say what failed and the next step, and name a cause only when the code knows it. [Impeccable](https://github.com/pbakaus/impeccable).
  Before: `The report did not load. Check your connection and try again.` on a 5xx, where the reader's connection worked (`main.tsx` retries 5xx and network failures alike). After: `The report did not load. Try again in a moment.`
- **Invented figures and claims** (also: fabricated stats, made-up features). A count, date, update cadence or capability that the data doesn't back. Fix: every figure comes from the API or a constant traced to the data, and every claim describes something the app does. [DeSlop](https://github.com/nate-zz/DeSlop).
  Before: `toast.info('Hansard updates after each sitting')` when speech text stops at 8 April 2025. After: a true statement, or nothing.
- **Broken plurals and unformatted counts.** "1 speeches", or "11308" on one page and "1,068,620" on the next. Fix: choose the singular for 1, and format every count with `toLocaleString(NUMBER_LOCALE)` from `@/constants/constants`. [anti-ai-slop](https://github.com/Vinayak-Shukla-03/anti-ai-slop).
  Before: `{report.speech_count} speeches`. After: `{report.speech_count.toLocaleString(NUMBER_LOCALE)} {report.speech_count === 1 ? 'speech' : 'speeches'}`.
- **Template and specimen residue** (also: placeholder content). A shadcn or generator default left in place, or `/design` specimen copy about a feature the app doesn't have. Fix: write the string for this app, and give specimens real Hansard content. [Hallmark](https://github.com/Nutlope/hallmark).
  Before: `No Results.` in a table, and a `/design` card about "saved searches". After: `No reports match the search.`, and a specimen card for "Debate on President's Address" with a `Copy citation` action.

### Rules for this codebase

- **Shorten facts, don't delete them.** A fact cut from a toast or notice moves to the Known gaps section of `/coverage/methods`, written out in `app/src/routes/coverage.methods.tsx`. `/coverage` is for lay readers and carries no caveat list.
- **A confirmation toast is two to four words with no trailing full stop**, such as "Link copied". Info and warning toasts appear only as `/design` samples of the variants. The one error a toast may carry is the failure of the action that would have shown the confirmation, such as "Couldn't copy the link". Every other error uses the inline [Error Display](#error-display) or an [Error Notice](#error-notices).
- **Use the canonical terms**: Person, Membership, Speaker label, Presiding officer, Report, Sitting, Paragraph. A Paragraph is one stored row of a report, and a speech is one or more paragraphs by one person. Never write "Speaker" for a Membership, and never shorten Presiding officer to "Speaker".
- **Accessibility text stays accurate.** An `aria-label` contains the visible label text, ideally at the start ([WCAG 2.5.3, Label in name](https://www.w3.org/WAI/WCAG22/Understanding/label-in-name.html)). Shortening one must not lose what the control does. Icon-only controls are named for their function ("Close", not "X"). "(opens in a new tab)" stays in the accessible name of every link that opens a new tab, as visible text or in `sr-only` text.
- **Sentence case everywhere**, including headings, buttons and page titles. No trailing period on headings, buttons or labels.
- **No em dashes.** Use the real ellipsis character (…), only for an in-progress label such as "Retrying…". Never three dots.
- **House choices where sources disagree:**
  - Contractions are fine ("Couldn't load the speeches"): they match the existing copy and Microsoft's guide, though GOV.UK avoids them.
  - No first person ("we", "I", "our"): state the fact, since the app is a record, not a speaker.
  - No "please" and no "sorry": neither helps the reader fix anything.
  - No exclamation marks: a records site has no routine milestone to celebrate.
  - Dates keep the format the app already uses; don't introduce a second one.

### Review checklist

Run on every diff that touches a string:

- `git diff | rg -n '\x{2014}'` returns nothing in added lines.
- `git diff | rg -n '\.\.\.'` returns nothing in added strings (spread syntax is code, not copy).
- `git diff | rg -ni 'please|sorry|oops|unfortunately|successfully|best-effort|re-parse|seamless'` returns nothing in added strings.
- Every confirmation toast is two to four words, with no "may", no second sentence and no trailing full stop. Every error is inline or a notice, except a failed copy.
- Each caveat cut from a toast or notice is still stated on `/coverage/methods`.
- Each `aria-label` starts with its visible label text, or names the function of an icon-only control.
- Headings, buttons and labels are in sentence case with no trailing period.
- Terms match the canonical list: no "speaker" for a Membership, no "re-parse" or other pipeline word.
- `git diff | rg -n '>(Submit|OK|Click here)<|Check your connection|No Results'` returns nothing in added lines.
- Every added count is formatted with `NUMBER_LOCALE` and has a singular form for 1.
- Every added figure or claim traces to the API, a constant from the data, or something the app does.
