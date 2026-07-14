import { useEffect, useState, useMemo } from 'react';
import api from '../services/api';
import type { Employee, Department, Position, LeaveBalance } from '../types';
import { translateRole } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { PasswordInput } from '../components/ui/password-input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
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
import { Badge } from '../components/ui/badge';
import { X, Search } from 'lucide-react';

function computeSeniority(hireDate: string): string {
  const now = new Date();
  const hire = new Date(hireDate);
  const diff = now.getTime() - hire.getTime();
  const years = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
  return `${years} an${years > 1 ? 's' : ''}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR');
}

type ModalMode = 'create' | 'edit' | null;

export default function EmployeesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role?.name === 'ADMIN';

  const [employees, setEmployees] = useState<(Employee & { seniority?: string })[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [roles, setRoles] = useState<{ id: number; name: string }[]>([]);
  const [balances, setBalances] = useState<Record<number, number>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);

  const [showDetail, setShowDetail] = useState(false);
  const [detailEmployee, setDetailEmployee] = useState<any>(null);
  const [allSkills, setAllSkills] = useState<{ id: number; name: string }[]>([]);
  const [editSkillsMode, setEditSkillsMode] = useState(false);
  const [selectedSkillIds, setSelectedSkillIds] = useState<number[]>([]);
  const [editReplMode, setEditReplMode] = useState(false);
  const [selectedReplIds, setSelectedReplIds] = useState<number[]>([]);
  const [eligibleReplacements, setEligibleReplacements] = useState<Employee[]>([]);

  const initForm = () => ({
    matricule: '', firstName: '', lastName: '', email: '', password: '',
    position: '', positionId: '', hireDate: '', departmentId: '',
  });
  const [form, setForm] = useState(initForm());
  const [editForm, setEditForm] = useState({
    matricule: '', firstName: '', lastName: '', position: '', positionId: '', hireDate: '', departmentId: '', roleId: '',
  });

  const load = () => {
    api.get('/employees').then((res) => {
      const list = res.data.map((e: Employee) => ({ ...e, seniority: computeSeniority(e.hireDate) }));
      setEmployees(list);
    });
    api.get('/departments').then((res) => setDepartments(res.data));
    api.get('/positions/active').then((res) => setPositions(res.data));
    api.get('/users/roles').then((res) => setRoles(res.data));
    api.get('/leave-balances').then((res) => {
      const map: Record<number, number> = {};
      for (const item of res.data) {
        const annual = item.balances.find((b: LeaveBalance & { leaveType: { name: string } }) =>
          b.leaveType?.name?.toLowerCase().includes('annuel') ||
          b.leaveType?.name?.toLowerCase().includes('annual')
        );
        if (annual) map[item.employee.id] = annual.remaining;
      }
      setBalances(map);
    }).catch(() => {});
    api.get('/skills').then((res) => setAllSkills(res.data)).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const createEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/employees', {
        matricule: form.matricule,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password || form.email,
        positionId: form.positionId ? Number(form.positionId) : undefined,
        position: form.position || undefined,
        hireDate: form.hireDate,
        departmentId: Number(form.departmentId),
      });
      setForm(initForm());
      setShowCreate(false);
      load();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la création');
    }
  };

  const openEdit = (emp: any) => {
    setModalMode('edit');
    setEditingEmployee(emp);
    setEditForm({
      matricule: emp.matricule || '',
      firstName: emp.firstName || '',
      lastName: emp.lastName || '',
      position: emp.position || '',
      positionId: emp.positionId ? String(emp.positionId) : '',
      hireDate: emp.hireDate ? emp.hireDate.split('T')[0] : '',
      departmentId: emp.department?.id ? String(emp.department.id) : '',
      roleId: emp.user?.role?.id ? String(emp.user.role.id) : '',
    });
    setError('');
    setSuccess('');
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingEmployee(null);
    setError('');
    setSuccess('');
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!editingEmployee) return;

    try {
      const patchBody: Record<string, any> = {
        matricule: editForm.matricule,
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        positionId: editForm.positionId ? Number(editForm.positionId) : null,
        position: editForm.position || undefined,
        hireDate: editForm.hireDate,
        departmentId: Number(editForm.departmentId),
      };
      if (editForm.roleId) patchBody.roleId = Number(editForm.roleId);
      await api.patch(`/employees/${editingEmployee.id}`, patchBody);
      setSuccess('Employé modifié avec succès');
      setModalMode(null);
      setEditingEmployee(null);
      load();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la modification');
    }
  };

  const toggleActive = async (emp: any) => {
    try {
      await api.patch(`/users/${emp.user.id}`, { isActive: !emp.user.isActive });
      load();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur');
    }
  };

  const openDetail = async (emp: any) => {
    setDetailEmployee(emp);
    setEditSkillsMode(false);
    setEditReplMode(false);
    try {
      const replRes = await api.get(`/employees/${emp.id}/replacements`);
      setDetailEmployee((prev: any) => ({ ...prev, replacements: replRes.data.asEmployee || [] }));
    } catch {
      setDetailEmployee((prev: any) => ({ ...prev, replacements: [] }));
    }
    try {
      const eligibleRes = await api.get(`/employees/${emp.id}/eligible-replacements`);
      setEligibleReplacements(eligibleRes.data);
    } catch {
      setEligibleReplacements([]);
    }
    setShowDetail(true);
  };

  const closeDetail = () => {
    setShowDetail(false);
    setDetailEmployee(null);
    setEditSkillsMode(false);
    setEditReplMode(false);
  };

  const handleSaveSkills = async () => {
    if (!detailEmployee) return;
    try {
      await api.post(`/employees/${detailEmployee.id}/skills`, { skillIds: selectedSkillIds });
      const updated = await api.get(`/employees/${detailEmployee.id}`);
      setDetailEmployee(updated.data);
      setEditSkillsMode(false);
      load();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la sauvegarde des compétences');
    }
  };

  const handleSaveReplacements = async () => {
    if (!detailEmployee) return;
    try {
      await api.post(`/employees/${detailEmployee.id}/replacements`, { replacementIds: selectedReplIds });
      const replRes = await api.get(`/employees/${detailEmployee.id}/replacements`);
      setDetailEmployee((prev: any) => ({ ...prev, replacements: replRes.data.asEmployee || [] }));
      setEditReplMode(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la sauvegarde des remplaçants');
    }
  };

  const colCount = isAdmin ? 11 : 10;

  const filteredEmployees = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return employees;
    return employees.filter(
      (e) =>
        e.firstName.toLowerCase().includes(q) ||
        e.lastName.toLowerCase().includes(q) ||
        e.matricule.toLowerCase().includes(q) ||
        (e.positionRef?.name || e.position || '').toLowerCase().includes(q) ||
        e.department?.name.toLowerCase().includes(q) ||
        e.user?.email.toLowerCase().includes(q),
    );
  }, [employees, search]);

  return (
    <div>
      <PageHeader
        title="Employés"
        description="Gérez les employés de l'entreprise"
        actions={
          <Button onClick={() => setShowCreate(!showCreate)}>
            Nouvel employé
          </Button>
        }
      />

      {success && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="p-3 text-sm text-emerald-700 bg-emerald-50 rounded-lg border border-emerald-200">{success}</div>
          </CardContent>
        </Card>
      )}

      {showCreate && (
        <Card className="mb-6 animate-fade-in">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Nouvel employé</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)}>
                <X className="size-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {error && <div className="p-3 text-sm text-red-700 bg-red-50 rounded-lg mb-4 border border-red-200">{error}</div>}
            <form onSubmit={createEmployee} className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Matricule</Label>
                <Input value={form.matricule} onChange={(e) => handleChange('matricule', e.target.value)} placeholder="Matricule" required />
              </div>
              <div className="space-y-2">
                <Label>Prénom</Label>
                <Input value={form.firstName} onChange={(e) => handleChange('firstName', e.target.value)} placeholder="Prénom" required />
              </div>
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input value={form.lastName} onChange={(e) => handleChange('lastName', e.target.value)} placeholder="Nom" required />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={form.email} onChange={(e) => handleChange('email', e.target.value)} placeholder="Email" required type="email" />
              </div>
              <div className="space-y-2">
                <Label>Mot de passe</Label>
                <PasswordInput value={form.password} onChange={(e) => handleChange('password', e.target.value)} placeholder="Optionnel" />
              </div>
              <div className="space-y-2">
                <Label>Poste</Label>
                <Select value={form.positionId || null} onValueChange={(v) => { handleChange('positionId', v || ''); const pos = positions.find(p => p.id === Number(v)); handleChange('position', pos?.name || ''); }}>
                  <SelectTrigger>
                    <span className="flex flex-1 text-left">
                      {form.positionId
                        ? positions.find(p => p.id === Number(form.positionId))?.name || ''
                        : <span className="text-muted-foreground">Sélectionner un poste</span>
                      }
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {positions.filter(p => !form.departmentId || p.departmentId === Number(form.departmentId)).map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date d'embauche</Label>
                <Input value={form.hireDate} onChange={(e) => handleChange('hireDate', e.target.value)} required type="date" />
              </div>
              <div className="space-y-2">
                <Label>Département</Label>
                <Select value={form.departmentId || null} onValueChange={(v) => handleChange('departmentId', v || '')}>
                  <SelectTrigger>
                    <span className="flex flex-1 text-left">
                      {form.departmentId
                        ? departments.find(d => d.id === Number(form.departmentId))?.name || ''
                        : <span className="text-muted-foreground">Département</span>
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
              <div className="col-span-2 pt-2">
                <Button type="submit">Créer l'employé</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Dialog open={modalMode === 'edit'} onOpenChange={(open) => { if (!open) closeModal(); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifier l'employé</DialogTitle>
            <DialogDescription>Modifiez les informations de l'employé</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            {error && <div className="p-3 text-sm text-red-700 bg-red-50 rounded-lg mb-4 border border-red-200">{error}</div>}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Matricule</Label>
                <Input value={editForm.matricule} onChange={(e) => setEditForm(p => ({ ...p, matricule: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>Prénom</Label>
                <Input value={editForm.firstName} onChange={(e) => setEditForm(p => ({ ...p, firstName: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input value={editForm.lastName} onChange={(e) => setEditForm(p => ({ ...p, lastName: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>Poste</Label>
                <Select value={editForm.positionId || null} onValueChange={(v) => setEditForm(p => ({ ...p, positionId: v || '', position: v ? positions.find(pos => pos.id === Number(v))?.name || '' : '' }))}>
                  <SelectTrigger>
                    <span className="flex flex-1 text-left">
                      {editForm.positionId
                        ? positions.find(p => p.id === Number(editForm.positionId))?.name || ''
                        : <span className="text-muted-foreground">Sélectionner un poste</span>
                      }
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {positions.filter(p => !editForm.departmentId || p.departmentId === Number(editForm.departmentId)).map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date d'embauche</Label>
                <Input value={editForm.hireDate} onChange={(e) => setEditForm(p => ({ ...p, hireDate: e.target.value }))} required type="date" />
              </div>
              <div className="space-y-2">
                <Label>Département</Label>
                <Select value={editForm.departmentId || null} onValueChange={(v) => setEditForm(p => ({ ...p, departmentId: v || '' }))}>
                  <SelectTrigger>
                    <span className="flex flex-1 text-left">
                      {editForm.departmentId
                        ? departments.find(d => d.id === Number(editForm.departmentId))?.name || ''
                        : <span className="text-muted-foreground">Département</span>
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
              <div className="space-y-2">
                <Label>Rôle</Label>
                <Select value={editForm.roleId || null} onValueChange={(v) => setEditForm(p => ({ ...p, roleId: v || '' }))}>
                  <SelectTrigger>
                    <span className="flex flex-1 text-left">
                      {editForm.roleId
                        ? translateRole(roles.find(r => r.id === Number(editForm.roleId))?.name || '')
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
            <DialogFooter showCloseButton className="mt-6">
              <Button type="submit">Enregistrer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showDetail} onOpenChange={(open) => { if (!open) closeDetail(); }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {detailEmployee?.firstName} {detailEmployee?.lastName}
            </DialogTitle>
            <DialogDescription>
              {detailEmployee?.matricule} &mdash; {detailEmployee?.user?.email}
            </DialogDescription>
          </DialogHeader>

          {/* Compétences */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold">Compétences</h4>
              {!editSkillsMode && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const existing = (detailEmployee?.skills || []).map((s: any) =>
                      s.skill ? s.skill.id : s.id
                    );
                    setSelectedSkillIds(existing);
                    setEditSkillsMode(true);
                  }}
                >
                  Modifier
                </Button>
              )}
            </div>
            {editSkillsMode ? (
              <div className="border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                {allSkills.length === 0 && (
                  <p className="text-sm text-muted-foreground">Aucune compétence disponible</p>
                )}
                {allSkills.map((skill) => (
                  <label key={skill.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedSkillIds.includes(skill.id)}
                      onChange={(e) => {
                        setSelectedSkillIds((prev) =>
                          e.target.checked
                            ? [...prev, skill.id]
                            : prev.filter((id) => id !== skill.id)
                        );
                      }}
                      className="rounded border-gray-300"
                    />
                    {skill.name}
                  </label>
                ))}
                <div className="flex gap-2 pt-2">
                  <Button size="sm" onClick={handleSaveSkills}>Enregistrer</Button>
                  <Button variant="outline" size="sm" onClick={() => setEditSkillsMode(false)}>Annuler</Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {(!detailEmployee?.skills || detailEmployee.skills.length === 0) ? (
                  <span className="text-sm text-muted-foreground">Aucune compétence</span>
                ) : (
                  detailEmployee.skills.map((s: any) => (
                    <Badge key={s.id} variant="info">
                      {s.skill?.name || s.name}
                    </Badge>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Remplaçants possibles */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold">Remplaçants possibles</h4>
              {!editReplMode && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const existing = (detailEmployee?.replacements || []).map((r: any) =>
                      r.replacement?.id || r.replacementId || r.id
                    );
                    setSelectedReplIds(existing);
                    setEditReplMode(true);
                  }}
                >
                  Gérer
                </Button>
              )}
            </div>
            {editReplMode ? (
              <div className="border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                {eligibleReplacements.length === 0 && (
                  <p className="text-sm text-muted-foreground">Aucun employé éligible</p>
                )}
                {eligibleReplacements.map((emp) => (
                  <label key={emp.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedReplIds.includes(emp.id)}
                      onChange={(e) => {
                        setSelectedReplIds((prev) =>
                          e.target.checked
                            ? [...prev, emp.id]
                            : prev.filter((id) => id !== emp.id)
                        );
                      }}
                      className="rounded border-gray-300"
                    />
                    {emp.lastName} {emp.firstName} — {emp.positionRef?.name || emp.position || '—'}
                  </label>
                ))}
                <div className="flex gap-2 pt-2">
                  <Button size="sm" onClick={handleSaveReplacements}>Enregistrer</Button>
                  <Button variant="outline" size="sm" onClick={() => setEditReplMode(false)}>Annuler</Button>
                </div>
              </div>
            ) : (
              <div>
                {(!detailEmployee?.replacements || detailEmployee.replacements.length === 0) ? (
                  <span className="text-sm text-muted-foreground">Aucun remplaçant défini</span>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead>Prénom</TableHead>
                        <TableHead>Poste</TableHead>
                        <TableHead>Département</TableHead>
                        <TableHead>Confiance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detailEmployee.replacements.map((r: any) => {
                        const repl = r.replacement || r;
                        const conf = r.confidence || 'MOYEN';
                        const confLabel: Record<string, string> = {
                          EXCELLENT: '🟢 Excellent',
                          BON: '🟡 Bon',
                          MOYEN: '🟠 Moyen',
                          FAIBLE: '🔴 Faible',
                        };
                        const confVariant: Record<string, string> = {
                          EXCELLENT: 'success',
                          BON: 'warning',
                          MOYEN: 'default',
                          FAIBLE: 'danger',
                        };
                        return (
                          <TableRow key={r.id}>
                            <TableCell>{repl.lastName}</TableCell>
                            <TableCell>{repl.firstName}</TableCell>
                            <TableCell className="text-muted-foreground">{repl.positionRef?.name || repl.position || '—'}</TableCell>
                            <TableCell className="text-muted-foreground">{repl.department?.name}</TableCell>
                            <TableCell>
                              <Badge variant={(confVariant[conf] || 'default') as any}>
                                {confLabel[conf] || conf}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </div>
            )}
          </div>

          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>

      {/* Search */}
      <div className="relative max-w-sm mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un employé..."
          className="pl-9"
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Matricule</TableHead>
            <TableHead>Nom</TableHead>
            <TableHead>Prénom</TableHead>
            <TableHead>Poste</TableHead>
            <TableHead>Département</TableHead>
            <TableHead>Rôle</TableHead>
            <TableHead>Compétences</TableHead>
            <TableHead>Date d'embauche</TableHead>
            <TableHead>Ancienneté</TableHead>
            <TableHead>Solde annuel</TableHead>
            {isAdmin && <TableHead className="text-right">ACTIONS</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredEmployees.map((e) => (
            <TableRow key={e.id}>
              <TableCell className="font-mono text-sm">{e.matricule}</TableCell>
              <TableCell className="font-medium">{e.lastName}</TableCell>
              <TableCell>{e.firstName}</TableCell>
              <TableCell className="text-muted-foreground">{e.positionRef?.name || e.position || '—'}</TableCell>
              <TableCell className="text-muted-foreground">{e.department?.name}</TableCell>
              <TableCell>{translateRole(e.user?.role?.name || '')}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1 max-w-[160px]">
                  {(!(e as any).skills || (e as any).skills.length === 0) ? (
                    <span className="text-muted-foreground text-xs">—</span>
                  ) : (
                    (e as any).skills.slice(0, 3).map((s: any) => (
                      <Badge key={s.id} variant="info" className="text-[10px]">
                        {s.skill?.name || s.name}
                      </Badge>
                    ))
                  )}
                  {(e as any).skills?.length > 3 && (
                    <Badge variant="outline" className="text-[10px]">+{(e as any).skills.length - 3}</Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">{formatDate(e.hireDate)}</TableCell>
              <TableCell className="text-muted-foreground">{e.seniority}</TableCell>
              <TableCell className="font-medium text-primary">{balances[e.id] !== undefined ? `${balances[e.id]} jours` : '—'}</TableCell>
              {isAdmin && (
                <TableCell className="text-right">
                  <div className="flex flex-col items-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto py-1"
                      onClick={() => openEdit(e)}
                    >
                      Modifier
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto py-1"
                      onClick={() => openDetail(e)}
                    >
                      Détails
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-auto py-1 ${e.user?.isActive ? 'text-destructive hover:text-destructive' : 'text-success hover:text-success'}`}
                      onClick={() => toggleActive(e)}
                    >
                      {e.user?.isActive ? 'Désactiver' : 'Activer'}
                    </Button>
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
          {filteredEmployees.length === 0 && (
            <TableRow>
              <TableCell colSpan={colCount} className="text-center text-muted-foreground">
                {search ? 'Aucun employé ne correspond à votre recherche' : 'Aucun employé'}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
