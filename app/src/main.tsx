import { ApiError } from '@/api/client'
import { Toaster } from '@/components/ui/sonner'
import {
  DEFAULT_QUERY_RETRY_COUNT,
  HTTP_NOT_FOUND,
} from '@/constants/constants'
import { routeTree } from '@/routeTree.gen'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

function shouldRetryQuery(failureCount: number, error: Error): boolean {
  if (error instanceof ApiError && error.status === HTTP_NOT_FOUND) return false
  return failureCount < DEFAULT_QUERY_RETRY_COUNT
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: shouldRetryQuery } },
})

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster />
    </QueryClientProvider>
  </StrictMode>
)
