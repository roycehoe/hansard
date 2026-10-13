import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'
import * as React from 'react'

const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-colors duration-150 outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background [&>svg]:pointer-events-none [&>svg]:size-3',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground [a&]:hover:bg-primary-hover',
        secondary:
          'bg-secondary text-secondary-foreground [a&]:hover:bg-secondary-hover',
        destructive:
          'bg-destructive text-destructive-foreground [a&]:hover:bg-destructive-hover',
        outline:
          'border-border text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
        success: 'bg-success text-success-foreground',
        warning: 'bg-warning text-warning-foreground',
        info: 'bg-info text-info-foreground',
        tag: 'border-tag-border bg-tag text-tag-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

function Badge({
  className,
  variant = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'span'

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
