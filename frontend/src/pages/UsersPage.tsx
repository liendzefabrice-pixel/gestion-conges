import { useEffect, useState } from 'react';
import api from '../services/api';
import type { User } from '../types';
import { translateRole } from '../lib/utils';

export default function UsersPage() {
  const [users, setUsers] = useState<(User & { employee?: { firstName: string; lastName: string }; isActive: boolean; mustChangePassword?: boolean })[]>([]);
  const [roles, setRoles] = useState<{ id: number; name: string }[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState('');
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadUsers = () => api.get('/users').then((res) => setUsers(res.data));
  const loadRoles = () => api.get('/users/roles').then((res) => setRoles(res.data));

  useEffect(() => { loadUsers(); loadRoles(); }, []);

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/users', { email, password: password || email, roleId: Number(roleId) });
      setTempPassword(password || email);
      setEmail('');
      setPassword('');
      setRoleId('');
      loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur');
    }
  };

  const toggleActive = async (id: number, isActive: boolean) => {
    await api.patch(`/users/${id}`, { isActive: !isActive });
    loadUsers();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Utilisateurs</h1>
        <button onClick={() => setShowCreate(!showCreate)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Créer un utilisateur
        </button>
      </div>

      {showCreate && (
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-3">Nouvel utilisateur</h2>
          {error && <p className="text-red-600 bg-red-50 p-3 rounded mb-4 text-sm">{error}</p>}
          <form onSubmit={createUser} className="space-y-3">
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required type="email" className="w-full px-3 py-2 border rounded" />
            <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mot de passe (laisser vide = identique à l'email)" className="w-full px-3 py-2 border rounded" />
            <select value={roleId} onChange={(e) => setRoleId(e.target.value)} required className="w-full px-3 py-2 border rounded">
              <option value="">Sélectionner un rôle</option>
              {roles.filter((r) => r.name !== 'ADMIN').map((r) => (
                <option key={r.id} value={r.id}>{translateRole(r.name)}</option>
              ))}
            </select>
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Créer</button>
          </form>

          {tempPassword && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="font-semibold text-sm">Mot de passe temporaire :</p>
              <p className="text-lg font-mono font-bold text-yellow-800">{tempPassword}</p>
              <p className="text-xs text-gray-500 mt-1">L'utilisateur devra changer son mot de passe à la première connexion.</p>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="p-3 text-sm font-medium">Email</th>
              <th className="p-3 text-sm font-medium">Employé</th>
              <th className="p-3 text-sm font-medium">Rôle</th>
              <th className="p-3 text-sm font-medium">Statut</th>
              <th className="p-3 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="p-3">{u.email}</td>
                <td className="p-3 text-gray-500">
                  {u.employee ? `${u.employee.firstName} ${u.employee.lastName}` : '-'}
                </td>
                <td className="p-3">{translateRole(u.role?.name || '')}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${u.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {u.isActive ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td className="p-3">
                  <button onClick={() => toggleActive(u.id, u.isActive)} className={`text-sm ${u.isActive ? 'text-red-600' : 'text-green-600'} hover:underline`}>
                    {u.isActive ? 'Désactiver' : 'Activer'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
