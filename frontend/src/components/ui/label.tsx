import { cn } from '@/lib/utils'
import type { LabelHTMLAttributes, ReactNode } from 'react'

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  children: ReactNode
}

export function Label({ children, className, ...props }: LabelProps) {
  return (
    <label
      className={cn(
        'block text-sm font-medium text-foreground mb-1.5',
        className
      )}
      {...props}
    >
      {children}
    </label>
  )
}

export default Label
