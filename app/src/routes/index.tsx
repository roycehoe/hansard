import { PageHeader } from '@/components/layout/PageHeader'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: () => (
    <PageHeader
      title="Hansard"
      description="Search and read the Singapore Parliament record."
    />
  ),
})
