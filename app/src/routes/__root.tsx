import { SiteFooter } from '@/components/layout/SiteFooter'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { TooltipProvider } from '@/components/ui/tooltip'
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

export const Route = createRootRoute({
  component: () => (
    <TooltipProvider>
      <div className="flex min-h-screen flex-col">
        <a
          href="#main"
          className="bg-background text-primary focus-visible:ring-ring focus-visible:ring-offset-background sr-only rounded-sm px-4 py-2 focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main
          id="main"
          className="max-w-page-xl mx-auto w-full flex-1 px-5 py-8 sm:px-6 md:px-7"
        >
          <Outlet />
        </main>
        <SiteFooter />
        {import.meta.env.DEV && <TanStackRouterDevtools />}
      </div>
    </TooltipProvider>
  ),
})
