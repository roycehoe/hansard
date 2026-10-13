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

Always render the shared `<Spinner />` or a `<Skeleton />` layout from `@/components/ui` for the loading state — never inline your own spinner wrapper.

```typescript
// Good
const { data, isLoading, isError } = useGetSittingSpeeches({ sitting_id })

if (isLoading) return <Skeleton className="h-96 w-full" />
```

```typescript
// Bad — isFetching triggers on background refetches
if (isFetching) return <Skeleton className="h-96 w-full" />

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

if (isLoadingMetadata || isLoadingSpeeches) return <Skeleton className="h-96 w-full" />
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

| Category          | Used for                              | Example                              |
| ----------------- | ------------------------------------- | ------------------------------------ |
| `Index`           | Entry point for a feature folder      | `Index.tsx`                          |
| `Form`            | Form components                       | `FormSearchSpeeches.tsx`             |
| `Dialog`          | Modal dialogs                         | `DialogDeleteSavedSearch.tsx`        |
| `Table`           | Table renderers                       | `TableSittingSpeeches.tsx`           |
| `TableIndex`      | Table state owner + orchestrator      | `TableIndexSittingSpeeches.tsx`      |
| `TableFilters`    | Table filter controls                 | `TableFiltersSittingSpeeches.tsx`    |
| `TablePagination` | Table pagination wrapper              | `TablePaginationSittingSpeeches.tsx` |
| `TableColumns`    | Column definitions (hook file)        | `useTableColumnsSittingSpeeches.tsx` |
| `Button`          | Standalone button components          | `ButtonCopySpeechLink.tsx`           |
| `Card`            | Card display components               | `CardSittingSummary.tsx`             |
| `Badge`           | Status badges                         | `BadgeReportType.tsx`                |
| `Notice`          | Empty states and informational blocks | `NoticeEmptySpeeches.tsx`            |
| `Skeleton`        | Skeleton loaders                      | `SkeletonFetching.tsx`               |
| `Icon`            | Icon wrapper components               | `IconReportType.tsx`                 |

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

if (isLoading) return <Skeleton className="h-96 w-full" />
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
- **Body** — muted supporting copy, `max-w-[420px] text-sm text-muted-foreground`. Explains the failure and suggests trying again.
- **Actions** — a row with the secondary escape as `variant="outline"` (e.g. "Back to Home") and retry as the primary `variant="default"`. The retry button follows [Button Pending State](#button-pending-state) — disabled while `isRetrying`, `Spinner` + progressive label ("Retrying...").

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
        <p className="text-muted-foreground max-w-[420px] text-sm">
          There was an issue fetching the speeches. Please try again.
        </p>
      </div>

      <div className="flex flex-row items-center gap-4">
        <Button variant="outline" onClick={() => navigate({ to: '/' })}>
          <ChevronLeft className="h-4 w-4" />
          Back to Home
        </Button>
        <Button variant="default" disabled={isRetrying} onClick={onRetry}>
          {isRetrying ? (
            <>
              <Spinner />
              Retrying...
            </>
          ) : (
            <>
              <RotateCw className="h-4 w-4" />
              Try Again
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

Loading buttons always: disable on `isPending`, render `Spinner`, and change the label to the progressive verb form. Never use a generic "Loading..." label. The `Button` component's `gap-2` base class handles spacing between the spinner and label automatically.

```tsx
// Good
<Button disabled={isPending} type="submit">
  {isPending ? (
    <>
      <Spinner />
      Saving...
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
  query: z.string().min(1, { error: 'You cannot submit an empty query.' }),
})

// Bad
{!queryValue && <p className="text-destructive">You cannot submit an empty query.</p>}
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
if (isLoading) return <Skeleton className="h-96 w-full" />
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

Recorded exception: `outline` and `ghost` have no fill of their own, so they use the shared `accent` surface for hover (`hover:bg-accent hover:text-accent-foreground`) and `secondary-active` for pressed. `link` has no background in any state; its hover is the underline only.

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

Always use the named semantic tokens from `src/index.css` — never raw Tailwind palette names, arbitrary hex values, or colour-named tokens like `text-crimson`:

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

- Theme-aware colours (different in light/dark) → add a CSS variable to both `:root` and `.dark` in `index.css`, then register it in the `@theme inline` block in `index.css` as `--color-<name>`
- Theme-invariant colours → add directly to the `@theme inline` block in `index.css` as `--color-<name>` with a semantic name

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

**Decorative animations** are acceptable when used sparingly to communicate that a background process is running (generation, ingestion, long-running tasks). Always use named `animate-*` classes defined in `src/index.css` — never inline `style={{ animation: ... }}`:

```tsx
// Good — named class signals background activity
<div className="animate-pulse-glow" />

// Bad — inline style
<div style={{ animation: 'pulse 2s infinite' }} />
```

If a new animation is needed, define it in `src/index.css` with an `--animate-*` variable in the `@theme` block and the matching `@keyframes`. Built-in animations from `tw-animate-css` are fine to use as they are.

**Transitions** follow standard durations by context — do not vary these arbitrarily:

| Context                 | Classes                                                              |
| ----------------------- | -------------------------------------------------------------------- |
| Hover (colour, opacity) | `transition-colors duration-150` / `transition-opacity duration-150` |
| Expand/collapse content | `transition-all duration-300 ease-in-out`                            |
| Drawer / sidebar        | `transition-all duration-200 ease-out`                               |

Do not use `transition-all duration-1000` or similar long durations to simulate a progress bar. If a real progress value is unavailable, use a `Spinner` or a named decorative animation instead.

### Custom CSS (`index.css`)

`index.css` is only for things that genuinely cannot be expressed in a Tailwind `className` — Radix `data-state` attribute selectors, scrollbar overrides, and global resets. All other styling belongs in `className`. The Tailwind import, the `@theme inline` block and the colour token variables are the other permitted contents.

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

**`Table`** (the main renderer) receives only the `table` instance as a prop and renders the `<Table>` shell. It handles the empty state ("No Results.") and nothing else.

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
    No Results.
  </TableCell>
</TableRow>
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
      className="max-w-[300px] rounded-md bg-muted p-2 text-foreground shadow-2xl"
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
