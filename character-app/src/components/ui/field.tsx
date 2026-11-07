import type { ComponentProps } from 'react'
import { cva } from 'class-variance-authority'
import type { VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'

function FieldGroup({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="field-group"
      className={cn(
        'group/field-group @container/field-group flex w-full flex-col gap-5 data-[slot=checkbox-group]:gap-3 *:data-[slot=field-group]:gap-4',
        className,
      )}
      {...props}
    />
  )
}

const fieldVariants = cva(
  'group/field flex w-full gap-2 data-[invalid=true]:text-destructive',
  {
    variants: {
      orientation: {
        vertical: 'flex-col *:w-full [&>.sr-only]:w-auto',
        horizontal: 'flex-row items-center has-[>[data-slot=field-content]]:items-start *:data-[slot=field-label]:flex-auto has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px',
        responsive: 'flex-col *:w-full @md/field-group:flex-row @md/field-group:items-center @md/field-group:*:w-auto @md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:*:data-[slot=field-label]:flex-auto [&>.sr-only]:w-auto @md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px',
      },
    },
    defaultVariants: { orientation: 'vertical' },
  },
)

function Field({
  className, orientation = 'vertical', ...props
}: ComponentProps<'div'> & VariantProps<typeof fieldVariants>) {
  return (
    <div role="group" data-slot="field" data-orientation={orientation}
      className={cn(fieldVariants({ orientation }), className)} {...props} />
  )
}

function FieldLabel({ className, ...props }: ComponentProps<typeof Label>) {
  return (
    <Label data-slot="field-label"
      className={cn('group/field-label peer/field-label flex w-fit gap-2 leading-snug group-data-[disabled=true]/field:opacity-50', className)}
      {...props} />
  )
}

function FieldDescription({ className, ...props }: ComponentProps<'p'>) {
  return (
    <p data-slot="field-description"
      className={cn('text-left text-sm leading-normal font-normal text-muted-foreground', className)}
      {...props} />
  )
}

export { Field, FieldGroup, FieldLabel, FieldDescription }
