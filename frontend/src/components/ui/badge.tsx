import { cn } from '@/lib/utils'
import type { ReactNode, HTMLAttributes } from 'react'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline'
  children: ReactNode
}

const variants: Record<string, string> = {
  default: 'bg-primary/10 text-primary border-transparent',
  success: 'bg-success/10 text-success border-transparent',
  warning: 'bg-warning/10 text-warning border-transparent',
  danger: 'bg-destructive/10 text-destructive border-transparent',
  info: 'bg-blue-100 text-blue-700 border-transparent',
  outline: 'bg-transparent text-muted-foreground border-border',
}

export function Badge({ variant = 'default', children, className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap',
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}

export { Badge as default }
