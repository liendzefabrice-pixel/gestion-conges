import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../services/api'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { PageHeader } from '../components/ui/page-header'
import { Button } from '../components/ui/button'
import { cn } from '../lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

const priorityColors: Record<string, string> = {
  FAIBLE: 'bg-gray-200 text-gray-700',
  MOYENNE: 'bg-blue-200 text-blue-800',
  HAUTE: 'bg-amber-200 text-amber-800',
  CRITIQUE: 'bg-red-200 text-red-800',
}

const eventTypeColors: Record<string, string> = {
  SEMINAIRE: 'border-l-4 border-l-purple-500',
  AUDIT: 'border-l-4 border-l-red-500',
  INVENTAIRE: 'border-l-4 border-l-amber-500',
  FORMATION: 'border-l-4 border-l-blue-500',
  REUNION_STRATEGIQUE: 'border-l-4 border-l-indigo-500',
  FERMETURE_ANNUELLE: 'border-l-4 border-l-gray-500',
  MAINTENANCE: 'border-l-4 border-l-cyan-500',
  AUTRE: 'border-l-4 border-l-green-500',
}

const leaveStatusColors: Record<string, string> = {
  APPROUVE: 'bg-green-100 border-green-300 text-green-800',
  EN_ATTENTE_RH: 'bg-yellow-100 border-yellow-300 text-yellow-800',
  EN_ATTENTE_DIRECTION: 'bg-orange-100 border-orange-300 text-orange-800',
}

export default function CalendarPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)

  const { data, isLoading } = useQuery({
    queryKey: ['calendar', month, year],
    queryFn: () => api.get('/calendar', { params: { month, year } }).then((r) => r.data),
  })

  const daysInMonth = new Date(year, month, 0).getDate()
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay()
  const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1

  const days: { day: number; events: any[]; leaves: any[]; holidays: any[] }[] = []

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const dateObj = new Date(year, month - 1, d)

    const dayEvents = (data?.internalEvents || []).filter((e: any) => {
      const s = new Date(e.startDate)
      const en = new Date(e.endDate)
      return dateObj >= s && dateObj <= en
    })

    const dayLeaves = (data?.leaveRequests || []).filter((l: any) => {
      const s = new Date(l.startDate)
      const en = new Date(l.endDate)
      return dateObj >= s && dateObj <= en
    })

    const dayHolidays = (data?.holidays || []).filter((h: any) => {
      const hd = new Date(h.date)
      return hd.toDateString() === dateObj.toDateString()
    })

    days.push({ day: d, events: dayEvents, leaves: dayLeaves, holidays: dayHolidays })
  }

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(year - 1) }
    else { setMonth(month - 1) }
  }

  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(year + 1) }
    else { setMonth(month + 1) }
  }

  return (
    <div>
      <PageHeader
        title="Calendrier"
        description="Visualisez les événements, congés et jours fériés"
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={prevMonth}>
                <ChevronLeft className="size-4" />
              </Button>
              <span className="text-lg font-semibold min-w-[200px] text-center">
                {monthNames[month - 1]} {year}
              </span>
              <Button variant="outline" size="sm" onClick={nextMonth}>
                <ChevronRight className="size-4" />
              </Button>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Chargement...</p>
          ) : (
            <>
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-px bg-border rounded-t-lg overflow-hidden">
                {dayNames.map((name) => (
                  <div key={name} className="bg-muted/50 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">
                    {name}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-px bg-border">
                {/* Empty cells before first day */}
                {Array.from({ length: startOffset }).map((_, i) => (
                  <div key={`empty-${i}`} className="bg-white min-h-[100px] p-1" />
                ))}

                {/* Day cells */}
                {days.map((dayData) => {
                  const isToday =
                    dayData.day === now.getDate() && month === now.getMonth() + 1 && year === now.getFullYear()
                  return (
                    <div
                      key={dayData.day}
                      className={cn(
                        'bg-white min-h-[100px] p-1.5 transition-colors duration-150 hover:bg-gray-50',
                        isToday && 'ring-2 ring-primary ring-inset',
                      )}
                    >
                      <div className={cn(
                        'text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full',
                        isToday && 'bg-primary text-white',
                      )}>
                        {dayData.day}
                      </div>

                      {/* Holidays */}
                      {dayData.holidays.map((h: any, i: number) => (
                        <div key={`hol-${i}`} className="text-[10px] px-1 py-0.5 rounded bg-red-100 text-red-700 mb-0.5 truncate">
                          🎉 {h.name}
                        </div>
                      ))}

                      {/* Events */}
                      {dayData.events.map((e: any, i: number) => (
                        <div
                          key={`evt-${i}`}
                          className={cn(
                            'text-[10px] px-1 py-0.5 rounded mb-0.5 truncate cursor-default',
                            eventTypeColors[e.type] || 'border-l-4 border-l-green-500',
                            priorityColors[e.priority] || 'bg-gray-100',
                          )}
                          title={`${e.title} (${e.type})`}
                        >
                          {e.title}
                        </div>
                      ))}

                      {/* Leaves */}
                      {dayData.leaves.slice(0, 2).map((l: any, i: number) => (
                        <div
                          key={`leave-${i}`}
                          className={cn(
                            'text-[10px] px-1 py-0.5 rounded mb-0.5 truncate border',
                            leaveStatusColors[l.status] || 'bg-gray-100',
                          )}
                          title={`${l.employee?.firstName} ${l.employee?.lastName} - ${l.leaveType?.name}`}
                        >
                          {l.employee?.firstName} {l.employee?.lastName?.[0]}.
                        </div>
                      ))}
                      {dayData.leaves.length > 2 && (
                        <div className="text-[10px] text-muted-foreground px-1">
                          +{dayData.leaves.length - 2} autres
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 mt-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-red-100 border border-red-300" />
                  Jour férié
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-amber-100 border border-amber-300" />
                  Événement interne
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-green-100 border border-green-300" />
                  Congé approuvé
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-yellow-100 border border-yellow-300" />
                  Congé en attente
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Événements</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data?.internalEvents?.length ?? 0}</p>
            <p className="text-xs text-muted-foreground">ce mois-ci</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Congés</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data?.leaveRequests?.length ?? 0}</p>
            <p className="text-xs text-muted-foreground">demandes ce mois-ci</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Jours fériés</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data?.holidays?.length ?? 0}</p>
            <p className="text-xs text-muted-foreground">ce mois-ci</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
