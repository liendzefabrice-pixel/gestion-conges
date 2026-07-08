import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'
import { TrendingUp } from 'lucide-react'

interface KpiCardProps {
  icon: ReactNode
  label: string
  value: number | string
  colorClass: string
  evolution?: string
  className?: string
}

const colorVariants: Record<string, string> = {
  blue: 'from-blue-500/10 to-blue-500/5 border-blue-200/50 [&_.kpi-icon]:bg-blue-500/10 [&_.kpi-icon_svg]:text-blue-600',
  indigo: 'from-indigo-500/10 to-indigo-500/5 border-indigo-200/50 [&_.kpi-icon]:bg-indigo-500/10 [&_.kpi-icon_svg]:text-indigo-600',
  emerald: 'from-emerald-500/10 to-emerald-500/5 border-emerald-200/50 [&_.kpi-icon]:bg-emerald-500/10 [&_.kpi-icon_svg]:text-emerald-600',
  amber: 'from-amber-500/10 to-amber-500/5 border-amber-200/50 [&_.kpi-icon]:bg-amber-500/10 [&_.kpi-icon_svg]:text-amber-600',
  purple: 'from-purple-500/10 to-purple-500/5 border-purple-200/50 [&_.kpi-icon]:bg-purple-500/10 [&_.kpi-icon_svg]:text-purple-600',
  rose: 'from-rose-500/10 to-rose-500/5 border-rose-200/50 [&_.kpi-icon]:bg-rose-500/10 [&_.kpi-icon_svg]:text-rose-600',
  cyan: 'from-cyan-500/10 to-cyan-500/5 border-cyan-200/50 [&_.kpi-icon]:bg-cyan-500/10 [&_.kpi-icon_svg]:text-cyan-600',
  orange: 'from-orange-500/10 to-orange-500/5 border-orange-200/50 [&_.kpi-icon]:bg-orange-500/10 [&_.kpi-icon_svg]:text-orange-600',
}

export function KpiCard({ icon, label, value, colorClass = 'blue', evolution, className }: KpiCardProps) {
  const gradient = colorVariants[colorClass] || colorVariants.blue

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 transition-all duration-200',
        'hover:shadow-md hover:-translate-y-0.5',
        'animate-fade-in',
        gradient,
        className,
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="kpi-icon flex items-center justify-center w-10 h-10 rounded-xl">
          {icon}
        </div>
      </div>

      <p className="text-2xl font-bold text-foreground tracking-tight">{value}</p>
      <p className="text-sm text-muted-foreground mt-0.5">{label}</p>

      {evolution && (
        <div className="flex items-center gap-1 mt-2 text-xs font-medium text-emerald-600">
          <TrendingUp className="size-3" />
          <span>{evolution}</span>
        </div>
      )}
    </div>
  )
}
