import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: ReactNode
}

const variants: Record<string, string> = {
  primary: 'bg-primary text-primary-foreground hover:brightness-90 focus:ring-primary/20',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-accent focus:ring-accent/20',
  outline: 'bg-transparent text-foreground border border-input hover:bg-accent focus:ring-accent/20',
  danger: 'bg-destructive text-destructive-foreground hover:brightness-90 focus:ring-destructive/20',
  ghost: 'text-muted-foreground hover:bg-accent hover:text-foreground focus:ring-accent/20',
}

const sizes: Record<string, string> = {
  sm: 'h-9 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2.5',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, children, className, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150',
          'focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-background',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
          'select-none',
          variants[variant],
          sizes[size],
          className,
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        <span className={cn(loading && 'opacity-0 absolute')}>{children}</span>
      </button>
    )
  },
)
Button.displayName = 'Button'

export default Button
