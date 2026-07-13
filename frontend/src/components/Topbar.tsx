import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { translateRole } from '../lib/utils'
import { cn } from '../lib/utils'
import {
  PanelLeftClose,
  PanelLeft,
  Bell,
  Calendar as CalendarIcon,
  User,
  Settings,
  LogOut,
  ChevronDown,
} from 'lucide-react'
import api from '../services/api'

interface TopbarProps {
  collapsed: boolean
  onToggleCollapse: () => void
}

const pageTitles: Record<string, string> = {
  '/dashboard': 'Tableau de bord',
  '/employees': 'Employés',
  '/departments': 'Départements',
  '/leave': 'Congés',
  '/my-planning': 'Mon planning',
  '/my-campaign': 'Ma programmation annuelle',
  '/leave-campaigns': 'Campagnes de congés',
  '/internal-events': 'Événements internes',
  '/calendar': 'Calendrier',
  '/leave-planning': 'Planification',
  '/permissions': 'Permissions',
  '/users': 'Utilisateurs',
  '/account': 'Mon compte',
  '/account/security': 'Sécurité',
  '/notifications': 'Notifications',
  '/change-password': 'Changement de mot de passe',
}

function formatDate(): string {
  return new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function Topbar({ collapsed, onToggleCollapse }: TopbarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [notifCount, setNotifCount] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const roleName = user?.role?.name || ''
  const userEmail = user?.email || ''
  const currentPath = location.pathname
  const pageTitle = pageTitles[currentPath] || 'Tableau de bord'
  const breadcrumb = currentPath === '/dashboard' ? '' : pageTitle

  useEffect(() => {
    const fetchCount = () => {
      api.get('/notifications/unread/count').then((res) => {
        setNotifCount(res.data.count ?? res.data ?? 0)
      }).catch(() => {})
    }
    fetchCount()
    const interval = setInterval(fetchCount, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    setDropdownOpen(false)
    logout()
    navigate('/login')
  }

  const today = formatDate()

  return (
    <header className="h-[72px] shrink-0 bg-white border-b border-gray-200 shadow-sm sticky top-0 z-20">
      <div className="flex items-center h-full px-6 gap-4">
        {/* Left: collapse + title + breadcrumb */}
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={onToggleCollapse}
            className="flex items-center justify-center h-9 w-9 rounded-xl text-gray-400 hover:text-primary hover:bg-blue-50 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            title={collapsed ? 'Déplier' : 'Replier'}
          >
            {collapsed ? (
              <PanelLeft className="size-5" />
            ) : (
              <PanelLeftClose className="size-5" />
            )}
          </button>

          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-foreground leading-tight truncate">
              {pageTitle}
            </h1>
            {breadcrumb && (
              <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                <span>Accueil</span>
                <span className="text-gray-300 select-none">/</span>
                <span className="truncate">{breadcrumb}</span>
              </nav>
            )}
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Spacer */}
        <div className="flex-1 hidden sm:block" />

        {/* Right: notifications, date, user */}
        <div className="flex items-center gap-3">
          {/* Notifications bell */}
          <button
            onClick={() => navigate('/notifications')}
            className="relative flex items-center justify-center h-9 w-9 rounded-xl text-gray-400 hover:text-primary hover:bg-blue-50 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            title="Notifications"
          >
            <Bell className="size-5" />
            {notifCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-destructive text-white text-[10px] font-bold rounded-full h-4.5 min-w-[18px] px-1 flex items-center justify-center leading-none shadow-sm">
                {notifCount > 99 ? '99+' : notifCount}
              </span>
            )}
          </button>

          {/* Date */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 text-xs text-muted-foreground">
            <CalendarIcon className="size-3.5 shrink-0" />
            <span className="whitespace-nowrap capitalize">{today}</span>
          </div>

          {/* User dropdown */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <img src="/images/Avatar.png" alt="" className="w-8 h-8 rounded-full shrink-0 object-cover" />
              <div className="hidden lg:block text-left min-w-0">
                <p className="text-sm font-medium text-foreground leading-tight truncate max-w-[120px]">
                  {userEmail}
                </p>
                <p className="text-[11px] text-muted-foreground leading-tight truncate max-w-[120px]">
                  {translateRole(roleName)}
                </p>
              </div>
              <ChevronDown
                className={cn(
                  'size-4 text-gray-400 shrink-0 transition-transform duration-200',
                  dropdownOpen && 'rotate-180',
                )}
              />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-1.5 animate-scale-in z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-foreground truncate">{userEmail}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{translateRole(roleName)}</p>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => { setDropdownOpen(false); navigate('/account') }}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-primary transition-colors duration-100"
                  >
                    <User className="size-4 shrink-0" />
                    Mon compte
                  </button>
                  <button
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-primary transition-colors duration-100"
                  >
                    <Settings className="size-4 shrink-0" />
                    Paramètres
                  </button>
                </div>

                <div className="border-t border-gray-100 pt-1">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 hover:text-destructive transition-colors duration-100"
                  >
                    <LogOut className="size-4 shrink-0" />
                    Déconnexion
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
