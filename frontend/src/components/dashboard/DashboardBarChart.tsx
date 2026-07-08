import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface BarData {
  [key: string]: string | number
}

interface DashboardBarChartProps {
  data: BarData[]
  dataKey: string
  xAxisKey: string
  color?: string
  layout?: 'vertical' | 'horizontal'
}

export function DashboardBarChart({
  data,
  dataKey,
  xAxisKey,
  color = '#3B82F6',
  layout = 'vertical',
}: DashboardBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-center">
        <p className="text-sm text-muted-foreground">Aucune donnée disponible</p>
      </div>
    )
  }

  const isHorizontal = layout === 'horizontal'

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        data={data}
        layout={isHorizontal ? 'vertical' : 'horizontal'}
        margin={{ top: 8, right: 8, bottom: 0, left: isHorizontal ? 80 : -16 }}
        barCategoryGap={isHorizontal ? 8 : 12}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#F3F4F6"
          vertical={!isHorizontal}
          horizontal={isHorizontal}
        />
        {isHorizontal ? (
          <>
            <XAxis type="number" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
            <YAxis
              type="category"
              dataKey={xAxisKey}
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
              axisLine={false}
              tickLine={false}
              width={70}
            />
          </>
        ) : (
          <>
            <XAxis
              dataKey={xAxisKey}
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
              axisLine={{ stroke: '#F3F4F6' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
          </>
        )}
        <Tooltip
          contentStyle={{
            background: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            fontSize: '13px',
          }}
        />
        <Bar
          dataKey={dataKey}
          fill={color}
          radius={4}
          animationBegin={0}
          animationDuration={800}
          animationEasing="ease-out"
        />
      </BarChart>
    </ResponsiveContainer>
  )
}

export default DashboardBarChart
