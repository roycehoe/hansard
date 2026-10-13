import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/design')({
  component: () => <h1>Design</h1>,
})
