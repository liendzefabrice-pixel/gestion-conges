import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'

interface MonthlyDataPoint {
  month: string
  requests: number
}

interface MonthlyChartProps {
  data: MonthlyDataPoint[]
  title?: string
}

const defaultData: MonthlyDataPoint[] = [
  { month: 'Jan', requests: 0 },
  { month: 'Fév', requests: 0 },
  { month: 'Mar', requests: 0 },
  { month: 'Avr', requests: 0 },
  { month: 'Mai', requests: 0 },
  { month: 'Juin', requests: 0 },
  { month: 'Juil', requests: 0 },
  { month: 'Août', requests: 0 },
  { month: 'Sep', requests: 0 },
  { month: 'Oct', requests: 0 },
  { month: 'Nov', requests: 0 },
  { month: 'Déc', requests: 0 },
]

export function MonthlyChart({ data, title = 'Évolution mensuelle' }: MonthlyChartProps) {
  const chartData = data.length > 0 ? data : defaultData
  const hasData = chartData.some((d) => d.requests > 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#94A3B8' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#94A3B8' }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    fontSize: '13px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="requests"
                  stroke="#2563EB"
                  strokeWidth={2.5}
                  dot={{ fill: '#2563EB', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
                  animationBegin={200}
                  animationDuration={800}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-3">
              <svg className="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
              </svg>
            </div>
            <p className="text-sm">Aucune donnée mensuelle</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
