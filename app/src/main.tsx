import { ApiError } from '@/api/client'
import { NoticeErrorPage } from '@/components/layout/NoticeErrorPage'
import { NoticeNotFoundPage } from '@/components/layout/NoticeNotFoundPage'
import { Toaster } from '@/components/ui/sonner'
import {
  DEFAULT_QUERY_RETRY_COUNT,
  HTTP_SERVER_ERROR_MIN,
} from '@/constants/constants'
import { countPageView, loadAnalytics } from '@/lib/analytics'
import {
  moveFocusToPageHeading,
  shouldMoveFocusToPageHeading,
} from '@/lib/navigationFocus'
import { parseSearchParams, stringifySearchParams } from '@/lib/searchParams'
import { isSearchTimedOutError } from '@/lib/utils'
import { routeTree } from '@/routeTree.gen'
import '@fontsource-variable/inter/wght.css'
import '@fontsource-variable/source-serif-4/opsz-italic.css'
import '@fontsource-variable/source-serif-4/opsz.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { RouterEvents } from '@tanstack/react-router'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

function shouldRetryQuery(failureCount: number, error: Error): boolean {
  if (isSearchTimedOutError(error)) return false
  if (error instanceof ApiError && error.status < HTTP_SERVER_ERROR_MIN)
    return false
  return failureCount < DEFAULT_QUERY_RETRY_COUNT
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: shouldRetryQuery } },
})

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  defaultNotFoundComponent: NoticeNotFoundPage,
  defaultErrorComponent: NoticeErrorPage,
  scrollRestoration: true,
  parseSearch: parseSearchParams,
  stringifySearch: stringifySearchParams,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

function countResolvedNavigation(event: RouterEvents['onResolved']): void {
  const { fromLocation, toLocation } = event
  if (fromLocation === undefined) return
  const isSameSearch = toLocation.searchStr === fromLocation.searchStr
  if (!event.pathChanged && isSameSearch) return
  countPageView(toLocation.pathname, toLocation.searchStr)
}

function moveFocusAfterNavigation(event: RouterEvents['onResolved']): void {
  if (event.fromLocation === undefined) return
  const { toLocation } = event
  const shouldMove = shouldMoveFocusToPageHeading({
    pathChanged: event.pathChanged,
    hash: toLocation.hash,
    searchParams: toLocation.search,
  })
  if (shouldMove) requestAnimationFrame(moveFocusToPageHeading)
}

loadAnalytics()
router.subscribe('onResolved', countResolvedNavigation)
router.subscribe('onResolved', moveFocusAfterNavigation)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster />
    </QueryClientProvider>
  </StrictMode>
)
