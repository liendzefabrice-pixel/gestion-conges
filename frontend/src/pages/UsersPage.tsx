import { useEffect, useState } from 'react';
import api from '../services/api';
import type { User } from '../types';
import { translateRole } from '../lib/utils';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { PasswordInput } from '../components/ui/password-input';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { PageHeader } from '../components/ui/page-header';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';
import { Plus, X } from 'lucide-react';

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
      <PageHeader
        title="Utilisateurs"
        description="Gérez les accès à l'application"
        actions={
          <Button onClick={() => setShowCreate(!showCreate)}>
            <Plus className="size-4" />
            Nouvel utilisateur
          </Button>
        }
      />

      {showCreate && (
        <Card className="mb-6 animate-fade-in">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Nouvel utilisateur</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)}>
                <X className="size-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {error && <div className="p-3 text-sm text-red-700 bg-red-50 rounded-lg mb-4 border border-red-200">{error}</div>}
            <form onSubmit={createUser} className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemple.com" required type="email" />
              </div>
              <div className="space-y-2">
                <Label>Mot de passe</Label>
                <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Laisser vide = identique à l'email" />
              </div>
              <div className="space-y-2">
                <Label>Rôle</Label>
                <Select value={roleId || null} onValueChange={(v) => setRoleId(v || '')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.filter((r) => r.name !== 'ADMIN').map((r) => (
                      <SelectItem key={r.id} value={String(r.id)}>{translateRole(r.name)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit">Créer l'utilisateur</Button>
            </form>

            {tempPassword && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                <p className="font-semibold text-sm text-yellow-800">Mot de passe temporaire :</p>
                <p className="text-lg font-mono font-bold text-yellow-800 tracking-widest mt-1">{tempPassword}</p>
                <p className="text-xs text-yellow-700 mt-1">L'utilisateur devra changer son mot de passe à la première connexion.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>EMAIL</TableHead>
            <TableHead>NOMS & PRÉNOMS</TableHead>
            <TableHead>RÔLE</TableHead>
            <TableHead>STATUT</TableHead>
            <TableHead className="text-right">ACTIONS</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => (
            <TableRow key={u.id}>
              <TableCell className="font-medium">{u.email}</TableCell>
              <TableCell className="text-muted-foreground">
                {u.employee ? `${u.employee.firstName} ${u.employee.lastName}` : '-'}
              </TableCell>
              <TableCell>{translateRole(u.role?.name || '')}</TableCell>
              <TableCell>
                <Badge variant={u.isActive ? 'success' : 'danger'}>
                  {u.isActive ? 'Actif' : 'Inactif'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant={u.isActive ? 'ghost' : 'ghost'}
                  size="sm"
                  onClick={() => toggleActive(u.id, u.isActive)}
                  className={u.isActive ? 'text-destructive hover:text-destructive' : 'text-success hover:text-success'}
                >
                  {u.isActive ? 'Désactiver' : 'Activer'}
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {users.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">Aucun utilisateur</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
