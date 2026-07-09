import { useEffect, useState } from 'react';
import api from '../services/api';
import type { Employee, Department } from '../types';
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
import { Plus, X } from 'lucide-react';

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
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);

  const initForm = () => ({
    matricule: '', firstName: '', lastName: '', email: '', password: '',
    position: '', hireDate: '', departmentId: '',
  });
  const [form, setForm] = useState(initForm());
  const [editForm, setEditForm] = useState({
    matricule: '', firstName: '', lastName: '', position: '', hireDate: '', departmentId: '',
  });

  const load = () => {
    api.get('/employees').then((res) => {
      const list = res.data.map((e: Employee) => ({ ...e, seniority: computeSeniority(e.hireDate) }));
      setEmployees(list);
    });
    api.get('/departments').then((res) => setDepartments(res.data));
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
        position: form.position,
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
      hireDate: emp.hireDate ? emp.hireDate.split('T')[0] : '',
      departmentId: emp.department?.id ? String(emp.department.id) : '',
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
      await api.patch(`/employees/${editingEmployee.id}`, {
        matricule: editForm.matricule,
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        position: editForm.position,
        hireDate: editForm.hireDate,
        departmentId: Number(editForm.departmentId),
      });
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

  const colCount = isAdmin ? 8 : 7;

  return (
    <div>
      <PageHeader
        title="Employés"
        description="Gérez les employés de l'entreprise"
        actions={
          <Button onClick={() => setShowCreate(!showCreate)}>
            <Plus className="size-4" />
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
                <Input value={form.position} onChange={(e) => handleChange('position', e.target.value)} placeholder="Poste" required />
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
                <Input value={editForm.position} onChange={(e) => setEditForm(p => ({ ...p, position: e.target.value }))} required />
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
            </div>
            <DialogFooter showCloseButton className="mt-6">
              <Button type="submit">Enregistrer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Matricule</TableHead>
            <TableHead>Nom</TableHead>
            <TableHead>Prénom</TableHead>
            <TableHead>Poste</TableHead>
            <TableHead>Département</TableHead>
            <TableHead>Date d'embauche</TableHead>
            <TableHead>Ancienneté</TableHead>
            {isAdmin && <TableHead className="text-right">ACTIONS</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((e) => (
            <TableRow key={e.id}>
              <TableCell className="font-mono text-sm">{e.matricule}</TableCell>
              <TableCell className="font-medium">{e.lastName}</TableCell>
              <TableCell>{e.firstName}</TableCell>
              <TableCell className="text-muted-foreground">{e.position}</TableCell>
              <TableCell className="text-muted-foreground">{e.department?.name}</TableCell>
              <TableCell className="text-muted-foreground">{formatDate(e.hireDate)}</TableCell>
              <TableCell className="text-muted-foreground">{e.seniority}</TableCell>
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
          {employees.length === 0 && (
            <TableRow>
              <TableCell colSpan={colCount} className="text-center text-muted-foreground">Aucun employé</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
