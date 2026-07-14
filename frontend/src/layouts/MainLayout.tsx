import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import NotificationsBadge from '../components/NotificationsBadge'
import Topbar from '../components/Topbar'
import { ToastContainer } from '../components/Toast'
import { translateRole } from '../lib/utils'
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  List,
  Calendar,
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  FileText,
  UserCog,
  User,
  Bell,
  LogOut,
  ChevronLeft,
  Wallet,
  CalendarX,
  Gauge,
} from 'lucide-react'
import { cn } from '../lib/utils'

interface NavItem {
  label: string
  path: string
  icon: typeof LayoutDashboard
  roles: string[]
  badge?: boolean
}

interface NavSection {
  title: string | null
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    title: 'Accueil',
    items: [
      { label: 'Tableau de bord', path: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'HR', 'DIRECTOR', 'EMPLOYEE'] },
    ],
  },
  {
    title: 'Gestion',
    items: [
      { label: 'Employés', path: '/employees', icon: Users, roles: ['ADMIN', 'HR'] },
      { label: 'Départements', path: '/departments', icon: Building2, roles: ['ADMIN'] },
      { label: 'Congés', path: '/leave', icon: Calendar, roles: ['EMPLOYEE', 'HR', 'DIRECTOR', 'ADMIN'] },
      { label: 'Soldes', path: '/soldes', icon: Wallet, roles: ['HR', 'DIRECTOR', 'ADMIN'] },
      { label: 'Mes soldes', path: '/soldes', icon: Wallet, roles: ['EMPLOYEE'] },
      { label: 'Mon planning', path: '/my-planning', icon: CalendarCheck, roles: ['EMPLOYEE'] },
      { label: 'Ma programmation', path: '/my-campaign', icon: CalendarCheck, roles: ['EMPLOYEE'] },
      { label: 'Campagnes', path: '/leave-campaigns', icon: ClipboardList, roles: ['HR', 'ADMIN'] },
      { label: 'Planification', path: '/leave-planning', icon: ClipboardList, roles: ['HR', 'ADMIN'] },
      { label: 'Événements', path: '/internal-events', icon: CalendarX, roles: ['HR', 'ADMIN'] },
      { label: 'Calendrier', path: '/calendar', icon: CalendarDays, roles: ['ADMIN', 'HR', 'DIRECTOR', 'EMPLOYEE'] },
      { label: 'Calendrier RH', path: '/calendar-rh', icon: CalendarDays, roles: ['ADMIN', 'HR'] },
      { label: 'Décision RH', path: '/decision-engine', icon: Gauge, roles: ['ADMIN', 'HR'] },
      { label: 'Permissions', path: '/permissions', icon: FileText, roles: ['EMPLOYEE', 'HR', 'DIRECTOR', 'ADMIN'] },
    ],
  },
  {
    title: 'Administration',
    items: [
      { label: 'Utilisateurs', path: '/users', icon: UserCog, roles: ['ADMIN'] },
      { label: 'Postes', path: '/positions', icon: Briefcase, roles: ['ADMIN'] },
      { label: 'Types de congés', path: '/leave-types', icon: List, roles: ['ADMIN'] },
      { label: 'Jours fériés', path: '/holidays', icon: CalendarX, roles: ['ADMIN'] },
      { label: 'Compétences', path: '/skills', icon: List, roles: ['ADMIN'] },
      { label: 'Notifications', path: '/notifications', icon: Bell, roles: ['ADMIN', 'HR', 'DIRECTOR', 'EMPLOYEE'], badge: true },
    ],
  },
]

export default function MainLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  const roleName = user?.role?.name || ''
  const userEmail = user?.email || ''

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-background">
      <ToastContainer />
      <aside
        className={cn(
          'flex flex-col h-full bg-white border-r border-gray-200 shrink-0 z-30 transition-all duration-200',
          collapsed ? 'w-[72px]' : 'w-[280px]',
        )}
      >
        {/* Logo */}
        <div className={cn('flex items-center h-[72px] shrink-0 gap-3', collapsed ? 'justify-center px-0' : 'px-6')}>
          <img
            src="/images/Logo.png"
            alt="SIAP PHARMA"
            className={cn('shrink-0', collapsed ? 'w-8 h-8' : 'w-10 h-10')}
          />
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-base font-bold text-foreground leading-tight">Gestion Congés</p>
              <p className="text-[11px] font-semibold text-muted-foreground tracking-wider uppercase leading-tight mt-0.5">
                SIAP PHARMA
              </p>
            </div>
          )}
        </div>

        {/* Separator */}
        <div className={cn('h-px bg-gray-100', collapsed ? 'mx-3' : 'mx-5')} />

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 space-y-6">
          {navSections.map((section) => {
            const visibleItems = section.items.filter((item) => item.roles.includes(roleName))
            if (visibleItems.length === 0) return null

            return (
              <div key={section.title}>
                {!collapsed && section.title && (
                  <p className="px-6 mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400 select-none">
                    {section.title}
                  </p>
                )}
                <div className={cn('space-y-0.5', collapsed ? 'px-2' : 'px-3')}>
                  {visibleItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center rounded-xl text-sm font-medium transition-all duration-150',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-1',
                            collapsed
                              ? 'justify-center h-10 w-10 mx-auto'
                              : 'gap-3 px-3 py-2.5',
                            isActive
                              ? 'bg-primary text-white shadow-sm'
                              : 'text-gray-600 hover:bg-green-50 hover:text-primary',
                          )
                        }
                        title={collapsed ? item.label : undefined}
                      >
                        <Icon className="size-5 shrink-0" />
                        {!collapsed && (
                          <>
                            <span className="truncate flex-1">{item.label}</span>
                            {item.badge && <NotificationsBadge />}
                          </>
                        )}
                      </NavLink>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* Mon compte */}
          <div className={collapsed ? 'px-2' : 'px-3'}>
            <NavLink
              to="/account"
              className={({ isActive }) =>
                cn(
                  'flex items-center rounded-xl text-sm font-medium transition-all duration-150',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-1',
                  collapsed
                    ? 'justify-center h-10 w-10 mx-auto'
                    : 'gap-3 px-3 py-2.5',
                  isActive
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-gray-600 hover:bg-green-50 hover:text-primary',
                )
              }
              title={collapsed ? 'Mon compte' : undefined}
            >
              <User className="size-5 shrink-0" />
              {!collapsed && <span className="truncate">Mon compte</span>}
            </NavLink>
          </div>
        </nav>

        {/* Toggle */}
        <div className={cn('shrink-0', collapsed ? 'flex justify-center py-3' : 'px-4 py-1')}>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              'flex items-center justify-center rounded-xl transition-all duration-150 text-gray-400 hover:text-primary hover:bg-blue-50',
              collapsed ? 'h-8 w-8' : 'w-full h-8 gap-2 px-2',
            )}
            title={collapsed ? 'Déplier' : 'Replier'}
          >
            <ChevronLeft className={cn('size-4 transition-transform duration-200', collapsed && 'rotate-180')} />
            {!collapsed && <span className="text-xs font-medium">Replier</span>}
          </button>
        </div>

        {/* Separator */}
        <div className={cn('h-px bg-gray-100', collapsed ? 'mx-3' : 'mx-5')} />

        {/* User card & Logout */}
        <div className="shrink-0 px-4 pb-4 pt-3">
          {collapsed ? (
            <div className="flex flex-col items-center gap-3">
              <img src="/images/Avatar.png" alt="" className="w-10 h-10 rounded-full shrink-0 object-cover" />
              <button
                onClick={handleLogout}
                className="flex items-center justify-center h-9 w-9 rounded-xl text-gray-400 hover:text-destructive hover:bg-red-50 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/30"
                title="Déconnexion"
              >
                <LogOut className="size-4 shrink-0" />
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gray-50 border border-gray-100">
                <img src="/images/Avatar.png" alt="" className="w-10 h-10 rounded-full shrink-0 object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{userEmail}</p>
                  <p className="text-xs text-muted-foreground truncate">{translateRole(roleName)}</p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="mt-2 flex items-center justify-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-destructive hover:bg-red-50 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/30"
              >
                <LogOut className="size-4 shrink-0" />
                <span>Déconnexion</span>
              </button>
            </>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar collapsed={collapsed} onToggleCollapse={() => setCollapsed(!collapsed)} />
        <main className="flex-1 overflow-auto">
          <div className="p-8 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
