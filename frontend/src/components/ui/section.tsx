import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SectionProps {
  title?: string
  description?: string
  children: ReactNode
  className?: string
  headerClassName?: string
}

export function Section({ title, description, children, className, headerClassName }: SectionProps) {
  return (
    <section className={cn('mb-8', className)}>
      {(title || description) && (
        <div className={cn('mb-4', headerClassName)}>
          {title && <h2 className="text-lg font-semibold text-foreground">{title}</h2>}
          {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
        </div>
      )}
      {children}
    </section>
  )
}

export default Section
