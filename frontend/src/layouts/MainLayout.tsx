import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NotificationsBadge from '../components/NotificationsBadge';

const navItems = [
  { label: 'Tableau de bord', path: '/dashboard', roles: ['ADMIN', 'HR', 'DIRECTOR', 'EMPLOYEE'] },
  { label: 'Départements', path: '/departments', roles: ['ADMIN'] },
  { label: 'Employés', path: '/employees', roles: ['ADMIN', 'HR'] },
  { label: 'Congés', path: '/leave', roles: ['EMPLOYEE', 'HR', 'DIRECTOR', 'ADMIN'] },
  { label: 'Mon planning', path: '/my-planning', roles: ['EMPLOYEE'] },
  { label: 'Planification', path: '/leave-planning', roles: ['HR', 'ADMIN'] },
  { label: 'Permissions', path: '/permissions', roles: ['EMPLOYEE', 'HR', 'DIRECTOR', 'ADMIN'] },
  { label: 'Utilisateurs', path: '/users', roles: ['ADMIN'] },
  { label: 'Notifications', path: '/notifications', roles: ['ADMIN', 'HR', 'DIRECTOR', 'EMPLOYEE'] },
];

export default function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const roleName = user?.role?.name || '';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-white shadow-md flex flex-col">
        <div className="p-4 border-b">
          <h2 className="font-bold text-lg text-gray-800">Gestion Congés</h2>
          <p className="text-xs text-gray-500 capitalize">{roleName.toLowerCase()}</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems
            .filter((item) => item.roles.includes(roleName))
            .map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 rounded text-sm transition ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                {item.label}
                {item.path === '/notifications' && <NotificationsBadge />}
              </NavLink>
            ))}
        </nav>

        <div className="p-4 border-t">
          <p className="text-sm text-gray-600 truncate">{user?.email}</p>
          <button
            onClick={handleLogout}
            className="mt-2 text-sm text-red-600 hover:text-red-800"
          >
            Déconnexion
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
