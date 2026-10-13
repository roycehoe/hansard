import { SiteFooter } from '@/components/layout/SiteFooter'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

export const Route = createRootRoute({
  component: () => (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="bg-background text-primary focus-visible:ring-ring focus-visible:ring-offset-background sr-only rounded-sm px-4 py-2 focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main
        id="main"
        className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6"
      >
        <Outlet />
      </main>
      <SiteFooter />
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </div>
  ),
})
