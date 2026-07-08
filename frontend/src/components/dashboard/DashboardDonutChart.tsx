import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

interface DonutData {
  name: string
  value: number
  color: string
}

interface DashboardDonutChartProps {
  data: DonutData[]
  dataKey?: string
  nameKey?: string
  innerRadius?: number
  outerRadius?: number
}

const defaultColors: Record<string, string> = {
  ADMIN: '#3B82F6',
  HR: '#F59E0B',
  DIRECTOR: '#8B5CF6',
  EMPLOYEE: '#10B981',
}

export function DashboardDonutChart({
  data,
  dataKey = 'value',
  nameKey = 'name',
  innerRadius = 60,
  outerRadius = 90,
}: DashboardDonutChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-center">
        <p className="text-sm text-muted-foreground">Aucune donnée disponible</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            dataKey={dataKey}
            nameKey={nameKey}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            strokeWidth={0}
            animationBegin={0}
            animationDuration={800}
            animationEasing="ease-out"
          >
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.color || defaultColors[entry.name] || '#6B7280'}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              fontSize: '13px',
            }}
            formatter={(value: number, name: string) => [`${value}`, name]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-4 mt-2 justify-center">
        {data.map((entry, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ background: entry.color || defaultColors[entry.name] || '#6B7280' }}
            />
            <span>{entry.name}</span>
            <span className="font-medium text-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default DashboardDonutChart
