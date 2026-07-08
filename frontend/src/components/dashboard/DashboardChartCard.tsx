import type { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { ArrowUpRight } from 'lucide-react'

interface DashboardChartCardProps {
  title: string
  subtitle?: string
  children: ReactNode
  className?: string
}

export function DashboardChartCard({ title, subtitle, children, className }: DashboardChartCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
        <Button variant="ghost" size="sm" className="shrink-0 gap-1">
          Voir plus
          <ArrowUpRight className="size-3.5" />
        </Button>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  )
}

export default DashboardChartCard
