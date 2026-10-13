import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: () => (
    <div>
      <h1>Hansard</h1>
      <p>Search and read the Singapore Parliament record.</p>
    </div>
  ),
})
