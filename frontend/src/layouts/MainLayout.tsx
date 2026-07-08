import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NotificationsBadge from '../components/NotificationsBadge';
import { translateRole } from '../lib/utils';
import { LayoutDashboard, Building2, Users, Calendar, CalendarCheck, ClipboardList, UserCog, User, Bell, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/utils';

const navItems = [
  { label: 'Tableau de bord', path: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'HR', 'DIRECTOR', 'EMPLOYEE'] },
  { label: 'Départements', path: '/departments', icon: Building2, roles: ['ADMIN'] },
  { label: 'Employés', path: '/employees', icon: Users, roles: ['ADMIN', 'HR'] },
  { label: 'Congés', path: '/leave', icon: Calendar, roles: ['EMPLOYEE', 'HR', 'DIRECTOR', 'ADMIN'] },
  { label: 'Mon planning', path: '/my-planning', icon: CalendarCheck, roles: ['EMPLOYEE'] },
  { label: 'Planification', path: '/leave-planning', icon: ClipboardList, roles: ['HR', 'ADMIN'] },
  { label: 'Permissions', path: '/permissions', icon: ClipboardList, roles: ['EMPLOYEE', 'HR', 'DIRECTOR', 'ADMIN'] },
  { label: 'Utilisateurs', path: '/users', icon: UserCog, roles: ['ADMIN'] },
  { label: 'Mon compte', path: '/account', icon: User, roles: ['ADMIN', 'HR', 'DIRECTOR', 'EMPLOYEE'] },
  { label: 'Notifications', path: '/notifications', icon: Bell, roles: ['ADMIN', 'HR', 'DIRECTOR', 'EMPLOYEE'] },
];

export default function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const roleName = user?.role?.name || '';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const visibleItems = navItems.filter((item) => item.roles.includes(roleName));

  return (
    <div className="flex h-screen bg-background">
      <aside className={cn(
        'flex flex-col bg-card border-r border-border/50 transition-all duration-200 z-30',
        collapsed ? 'w-16' : 'w-64',
      )}>
        <div className={cn(
          'flex items-center gap-3 px-5 h-16 border-b border-border/50 shrink-0',
          collapsed && 'justify-center px-0',
        )}>
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="font-bold text-sm text-foreground truncate">SIAP</p>
              <p className="text-[10px] font-semibold text-muted-foreground truncate tracking-wider uppercase">Gestion des Congés</p>
            </div>
          )}
        </div>

        <nav className="flex-1 py-3 px-3 space-y-1 overflow-y-auto">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                  'hover:bg-accent',
                  collapsed && 'justify-center px-0',
                  isActive
                    ? 'bg-primary/10 text-primary hover:bg-primary/15'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className={cn('size-5 shrink-0', collapsed && 'size-5')} />
                {!collapsed && (
                  <>
                    <span className="truncate">{item.label}</span>
                    {item.path === '/notifications' && <NotificationsBadge />}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border/50">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center w-full py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-150"
          >
            {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          </button>
        </div>

        <div className={cn(
          'px-4 py-4 border-t border-border/50',
          collapsed && 'px-2',
        )}>
          {collapsed ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="size-4 text-primary" />
              </div>
              <button onClick={handleLogout} className="text-muted-foreground hover:text-destructive transition-colors">
                <LogOut className="size-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <User className="size-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{user?.email}</p>
                <p className="text-xs text-muted-foreground">{translateRole(roleName)}</p>
              </div>
              <button onClick={handleLogout} className="text-muted-foreground hover:text-destructive transition-colors shrink-0" title="Déconnexion">
                <LogOut className="size-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
