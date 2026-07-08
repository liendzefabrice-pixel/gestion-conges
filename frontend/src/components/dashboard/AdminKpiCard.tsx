import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'
import { TrendingUp } from 'lucide-react'

interface AdminKpiCardProps {
  icon: ReactNode
  title: string
  value: number | string
  subtitle: string
  color: string
  evolution?: string
  className?: string
}

const colorVariants: Record<string, string> = {
  blue: 'from-blue-500/10 to-blue-500/5 border-blue-200/50 [&_.kpi-icon]:bg-blue-500/10 [&_.kpi-icon_svg]:text-blue-600',
  emerald: 'from-emerald-500/10 to-emerald-500/5 border-emerald-200/50 [&_.kpi-icon]:bg-emerald-500/10 [&_.kpi-icon_svg]:text-emerald-600',
  orange: 'from-orange-500/10 to-orange-500/5 border-orange-200/50 [&_.kpi-icon]:bg-orange-500/10 [&_.kpi-icon_svg]:text-orange-600',
  red: 'from-red-500/10 to-red-500/5 border-red-200/50 [&_.kpi-icon]:bg-red-500/10 [&_.kpi-icon_svg]:text-red-600',
  purple: 'from-purple-500/10 to-purple-500/5 border-purple-200/50 [&_.kpi-icon]:bg-purple-500/10 [&_.kpi-icon_svg]:text-purple-600',
  indigo: 'from-indigo-500/10 to-indigo-500/5 border-indigo-200/50 [&_.kpi-icon]:bg-indigo-500/10 [&_.kpi-icon_svg]:text-indigo-600',
  amber: 'from-amber-500/10 to-amber-500/5 border-amber-200/50 [&_.kpi-icon]:bg-amber-500/10 [&_.kpi-icon_svg]:text-amber-600',
  rose: 'from-rose-500/10 to-rose-500/5 border-rose-200/50 [&_.kpi-icon]:bg-rose-500/10 [&_.kpi-icon_svg]:text-rose-600',
}

export function AdminKpiCard({ icon, title, value, subtitle, color = 'blue', evolution, className }: AdminKpiCardProps) {
  const gradient = colorVariants[color] || colorVariants.blue

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 transition-all duration-200',
        'hover:shadow-lg hover:-translate-y-1 hover:scale-[1.02]',
        'animate-fade-in',
        gradient,
        className,
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="kpi-icon flex items-center justify-center w-10 h-10 rounded-full">
          {icon}
        </div>
      </div>

      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
      <p className="text-2xl font-bold text-foreground tracking-tight mt-1">{value}</p>

      <div className="flex items-center justify-between mt-2">
        <p className="text-xs text-muted-foreground">{subtitle}</p>
        {evolution && (
          <div className="flex items-center gap-1 text-xs font-medium text-emerald-600">
            <TrendingUp className="size-3" />
            <span>{evolution}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminKpiCard
