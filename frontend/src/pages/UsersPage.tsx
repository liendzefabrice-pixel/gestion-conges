import { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import type { User } from '../types';
import { translateRole } from '../lib/utils';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { PasswordInput } from '../components/ui/password-input';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';
import { PageHeader } from '../components/ui/page-header';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';

type ModalMode = 'create' | 'edit' | null;

export default function UsersPage() {
  const [users, setUsers] = useState<(User & { employee?: { firstName: string; lastName: string }; isActive: boolean; mustChangePassword?: boolean })[]>([]);
  const [roles, setRoles] = useState<{ id: number; name: string }[]>([]);
  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([]);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingUser, setEditingUser] = useState<any>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('');
  const [roleId, setRoleId] = useState('');
  const [isActive, setIsActive] = useState('true');
  const [departmentId, setDepartmentId] = useState('');
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadUsers = useCallback(() => api.get('/users').then((res) => setUsers(res.data)), []);
  const loadRoles = useCallback(() => api.get('/users/roles').then((res) => setRoles(res.data)), []);
  const loadDepartments = useCallback(() => api.get('/departments').then((res) => setDepartments(res.data)), []);

  useEffect(() => { loadUsers(); loadRoles(); loadDepartments(); }, [loadUsers, loadRoles, loadDepartments]);

  const openCreate = () => {
    setModalMode('create');
    setEditingUser(null);
    setEmail('');
    setPassword('');
    setFirstName('');
    setLastName('');
    setGender('');
    setRoleId('');
    setIsActive('true');
    setDepartmentId('');
    setTempPassword(null);
    setError('');
    setSuccess('');
  };

  const openEdit = (u: any) => {
    setModalMode('edit');
    setEditingUser(u);
    setEmail(u.email || '');
    setPassword('');
    setFirstName(u.firstName || '');
    setLastName(u.lastName || '');
    setGender(u.gender || '');
    setRoleId(u.role?.id ? String(u.role.id) : '');
    setIsActive(u.isActive ? 'true' : 'false');
    setTempPassword(null);
    setError('');
    setSuccess('');
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingUser(null);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (modalMode === 'create') {
      try {
        const body: Record<string, any> = {
          email,
          password: password || email,
          firstName,
          lastName,
          gender,
          roleId: Number(roleId),
        };
        if (departmentId) body.departmentId = Number(departmentId);
        await api.post('/users', body);
        setTempPassword(password || email);
        setEmail('');
        setPassword('');
        setFirstName('');
        setLastName('');
        setGender('');
        setRoleId('');
        setModalMode(null);
        loadUsers();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Erreur lors de la création');
      }
    } else if (modalMode === 'edit' && editingUser) {
      try {
        const body: Record<string, any> = {};
        if (email !== editingUser.email) body.email = email;
        if (firstName !== (editingUser.firstName || '')) body.firstName = firstName;
        if (lastName !== (editingUser.lastName || '')) body.lastName = lastName;
        if (gender !== (editingUser.gender || '')) body.gender = gender;
        if (Number(roleId) !== editingUser.role?.id) body.roleId = Number(roleId);
        if ((isActive === 'true') !== editingUser.isActive) body.isActive = isActive === 'true';

        if (Object.keys(body).length > 0) {
          await api.patch(`/users/${editingUser.id}`, body);
        }
        setSuccess('Utilisateur modifié avec succès');
        setModalMode(null);
        setEditingUser(null);
        loadUsers();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Erreur lors de la modification');
      }
    }
  };

  const toggleActive = async (id: number, current: boolean) => {
    await api.patch(`/users/${id}`, { isActive: !current });
    loadUsers();
  };

  const modalTitle = modalMode === 'create' ? 'Nouvel utilisateur' : 'Modifier l\'utilisateur';
  const modalDesc = modalMode === 'create'
    ? 'Créez un nouvel accès à l\'application'
    : 'Modifiez les informations de l\'utilisateur';

  return (
    <div>
      <PageHeader
        title="Utilisateurs"
        description="Gérez les accès à l'application"
        actions={
          <Button onClick={openCreate}>
            Nouvel utilisateur
          </Button>
        }
      />

      {tempPassword && modalMode === null && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <p className="font-semibold text-sm text-yellow-800">Mot de passe temporaire :</p>
              <p className="text-lg font-mono font-bold text-yellow-800 tracking-widest mt-1">{tempPassword}</p>
              <p className="text-xs text-yellow-700 mt-1">L'utilisateur devra changer son mot de passe à la première connexion.</p>
              <Button variant="ghost" size="sm" className="mt-2" onClick={() => setTempPassword(null)}>Fermer</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {success && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="p-3 text-sm text-emerald-700 bg-emerald-50 rounded-lg border border-emerald-200">{success}</div>
          </CardContent>
        </Card>
      )}

      <Dialog open={modalMode !== null} onOpenChange={(open) => { if (!open) closeModal(); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{modalTitle}</DialogTitle>
            <DialogDescription>{modalDesc}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            {error && <div className="p-3 text-sm text-red-700 bg-red-50 rounded-lg mb-4 border border-red-200">{error}</div>}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemple.com" required type="email" />
              </div>
              {modalMode === 'create' && (
                <div className="space-y-2">
                  <Label>Mot de passe</Label>
                  <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Laisser vide = identique à l'email" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Prénom(s)</Label>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Jean" required />
                </div>
                <div className="space-y-2">
                  <Label>Nom(s)</Label>
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Douala" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Sexe</Label>
                  <Select value={gender || null} onValueChange={(v) => setGender(v || '')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Homme">Homme</SelectItem>
                      <SelectItem value="Femme">Femme</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Rôle</Label>
                  <Select value={roleId || null} onValueChange={(v) => setRoleId(v || '')}>
                    <SelectTrigger>
                      <span className="flex flex-1 text-left">
                        {roleId
                          ? translateRole(roles.find(r => r.id === Number(roleId))?.name || '')
                          : <span className="text-muted-foreground">Sélectionner un rôle</span>
                        }
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      {roles.filter((r) => r.name !== 'ADMIN').map((r) => (
                        <SelectItem key={r.id} value={String(r.id)}>{translateRole(r.name)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {modalMode === 'create' && (
                <div className="space-y-2">
                  <Label>Département</Label>
                  <Select value={departmentId || null} onValueChange={(v) => setDepartmentId(v || '')}>
                    <SelectTrigger>
                      <span className="flex flex-1 text-left">
                        {departmentId
                          ? departments.find(d => d.id === Number(departmentId))?.name || ''
                          : <span className="text-muted-foreground">Sélectionner un département</span>
                        }
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {modalMode === 'edit' && (
                <div className="space-y-2">
                  <Label>Statut</Label>
                  <Select value={isActive} onValueChange={setIsActive}>
                    <SelectTrigger>
                      <span className="flex flex-1 text-left">
                        {isActive === 'true' ? 'Actif' : isActive === 'false' ? 'Inactif' : <span className="text-muted-foreground">Sélectionner</span>}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Actif</SelectItem>
                      <SelectItem value="false">Inactif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter showCloseButton className="mt-6">
              <Button type="submit">
                {modalMode === 'create' ? 'Créer l\'utilisateur' : 'Enregistrer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>EMAIL</TableHead>
            <TableHead>NOMS & PRÉNOMS</TableHead>
            <TableHead>SEXE</TableHead>
            <TableHead>RÔLE</TableHead>
            <TableHead>STATUT</TableHead>
            <TableHead className="text-right">ACTIONS</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => {
            const displayName = u.lastName && u.firstName
              ? `${u.lastName} ${u.firstName}`
              : u.employee?.firstName && u.employee?.lastName
                ? `${u.employee.firstName} ${u.employee.lastName}`
                : '—'
            return (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.email}</TableCell>
                <TableCell className="text-muted-foreground">{displayName}</TableCell>
                <TableCell>{u.gender || '—'}</TableCell>
                <TableCell>{translateRole(u.role?.name || '')}</TableCell>
                <TableCell>
                  <Badge variant={u.isActive ? 'success' : 'danger'}>
                    {u.isActive ? 'Actif' : 'Inactif'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-col items-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto py-1"
                      onClick={() => openEdit(u)}
                    >
                      Modifier
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-auto py-1 ${u.isActive ? 'text-destructive hover:text-destructive' : 'text-success hover:text-success'}`}
                      onClick={() => toggleActive(u.id, u.isActive)}
                    >
                      {u.isActive ? 'Désactiver' : 'Activer'}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
          {users.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">Aucun utilisateur</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
