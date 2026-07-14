import { useEffect, useState, useMemo } from 'react';
import api from '../services/api';
import type { Department, Employee } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
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
import { Search } from 'lucide-react';

type ModalMode = 'create' | 'edit' | null;

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR');
}

const PAGE_SIZE = 8;

export default function DepartmentsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role?.name === 'ADMIN';

  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<'name' | 'createdAt' | 'count'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingDept, setEditingDept] = useState<any>(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formHeadId, setFormHeadId] = useState('');
  const [formMinEmployees, setFormMinEmployees] = useState('0');
  const [formIsActive, setFormIsActive] = useState('true');

  const load = () => {
    api.get('/departments').then((res) => setDepartments(res.data));
    api.get('/employees').then((res) => setEmployees(res.data));
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let list = departments.filter(
      (d) => d.name.toLowerCase().includes(q) || (d.description || '').toLowerCase().includes(q),
    );
    list.sort((a, b) => {
      if (sortKey === 'count') {
        const aCount = a._count?.employees || 0;
        const bCount = b._count?.employees || 0;
        return sortDir === 'asc' ? aCount - bCount : bCount - aCount;
      }
      const aVal = (sortKey === 'createdAt' ? a.createdAt || '' : a.name);
      const bVal = (sortKey === 'createdAt' ? b.createdAt || '' : b.name);
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
    return list;
  }, [departments, search, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const availableHeads = employees.filter(
    (e) => !departments.some((d) => d.head?.id === e.id && d.id !== editingDept?.id),
  );

  const openCreate = () => {
    setModalMode('create');
    setEditingDept(null);
    setFormName('');
    setFormDesc('');
    setFormHeadId('');
    setFormMinEmployees('0');
    setFormIsActive('true');
    setError('');
    setSuccess('');
  };

  const openEdit = (d: any) => {
    setModalMode('edit');
    setEditingDept(d);
    setFormName(d.name);
    setFormDesc(d.description || '');
    setFormHeadId(d.head?.id ? String(d.head.id) : '');
    setFormMinEmployees(String(d.minEmployees ?? 0));
    setFormIsActive(d.isActive !== false ? 'true' : 'false');
    setError('');
    setSuccess('');
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingDept(null);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const body: Record<string, any> = {
      name: formName,
      description: formDesc || undefined,
      minEmployees: Number(formMinEmployees) || 0,
    };
    if (formHeadId) body.headId = Number(formHeadId);
    else body.headId = null;
    body.isActive = formIsActive === 'true';

    try {
      if (modalMode === 'create') {
        await api.post('/departments', body);
      } else if (modalMode === 'edit' && editingDept) {
        await api.patch(`/departments/${editingDept.id}`, body);
      }
      setSuccess(modalMode === 'create' ? 'Département créé avec succès' : 'Département modifié avec succès');
      setModalMode(null);
      setEditingDept(null);
      load();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur');
    }
  };

  const toggleActive = async (d: any) => {
    try {
      await api.patch(`/departments/${d.id}`, { isActive: !(d.isActive !== false) });
      load();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur');
    }
  };

  const modalTitle = modalMode === 'create' ? 'Nouveau département' : 'Modifier le département';

  return (
    <div>
      <PageHeader
        title="Départements"
        description="Gérez les départements de l'entreprise"
        actions={
          isAdmin ? (
            <Button onClick={openCreate}>
              Nouveau département
            </Button>
          ) : undefined
        }
      />

      {success && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="p-3 text-sm text-emerald-700 bg-emerald-50 rounded-lg border border-emerald-200">{success}</div>
          </CardContent>
        </Card>
      )}

      {/* Search + Sort */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Rechercher un département..."
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Trier par :</span>
          <Select value={sortKey} onValueChange={(v) => { setSortKey(v as any); setPage(0); }}>
            <SelectTrigger className="w-32">
              <span className="flex flex-1 text-left">
                {sortKey === 'name' ? 'Nom' : sortKey === 'count' ? 'Effectif' : 'Date'}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Nom</SelectItem>
              <SelectItem value="count">Effectif</SelectItem>
              <SelectItem value="createdAt">Date</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
          >
            {sortDir === 'asc' ? '↑' : '↓'}
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom du département</TableHead>
            <TableHead>Responsable</TableHead>
            <TableHead>Nombre d'employés</TableHead>
            <TableHead>Min. requis</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Date de création</TableHead>
            <TableHead>Statut</TableHead>
            {isAdmin && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {paged.map((d) => (
            <TableRow key={d.id}>
              <TableCell className="font-medium">{d.name}</TableCell>
              <TableCell className="text-muted-foreground">
                {d.head ? `${d.head.firstName} ${d.head.lastName}` : '—'}
              </TableCell>
              <TableCell>{d._count?.employees || 0}</TableCell>
              <TableCell>{d.minEmployees ?? 0}</TableCell>
              <TableCell className="text-muted-foreground max-w-[200px] truncate">{d.description || '—'}</TableCell>
              <TableCell className="text-muted-foreground">{d.createdAt ? formatDate(d.createdAt) : '—'}</TableCell>
              <TableCell>
                <Badge variant={d.isActive !== false ? 'success' : 'danger'}>
                  {d.isActive !== false ? 'Actif' : 'Inactif'}
                </Badge>
              </TableCell>
              {isAdmin && (
                <TableCell className="text-right">
                  <div className="flex flex-col items-end gap-1">
                    <Button variant="ghost" size="sm" className="h-auto py-1" onClick={() => openEdit(d)}>
                      Modifier
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-auto py-1 ${d.isActive !== false ? 'text-destructive hover:text-destructive' : 'text-success hover:text-success'}`}
                      onClick={() => toggleActive(d)}
                    >
                      {d.isActive !== false ? 'Désactiver' : 'Activer'}
                    </Button>
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
          {paged.length === 0 && (
            <TableRow>
              <TableCell colSpan={isAdmin ? 7 : 6} className="text-center text-muted-foreground">
                Aucun département
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <Button variant="ghost" size="sm" disabled={page === 0} onClick={() => setPage(Math.max(0, page - 1))}>
            Précédent
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page + 1} / {totalPages}
          </span>
          <Button variant="ghost" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(Math.min(totalPages - 1, page + 1))}>
            Suivant
          </Button>
        </div>
      )}

      {/* Create / Edit Modal */}
      <Dialog open={modalMode !== null} onOpenChange={(open) => { if (!open) closeModal(); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{modalTitle}</DialogTitle>
            <DialogDescription>
              {modalMode === 'create' ? 'Créez un nouveau département' : 'Modifiez les informations du département'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            {error && <div className="p-3 text-sm text-red-700 bg-red-50 rounded-lg mb-4 border border-red-200">{error}</div>}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Optionnelle" />
              </div>
              <div className="space-y-2">
                <Label>Effectif minimum requis</Label>
                <Input type="number" min="0" value={formMinEmployees} onChange={(e) => setFormMinEmployees(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Responsable</Label>
                <Select value={formHeadId || null} onValueChange={(v) => setFormHeadId(v || '')}>
                  <SelectTrigger>
                    <span className="flex flex-1 text-left">
                      {formHeadId
                        ? employees.find(e => e.id === Number(formHeadId))
                          ? `${employees.find(e => e.id === Number(formHeadId))!.firstName} ${employees.find(e => e.id === Number(formHeadId))!.lastName}`
                          : ''
                        : <span className="text-muted-foreground">Sélectionner un responsable</span>
                      }
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Aucun</SelectItem>
                    {availableHeads.map((e) => (
                      <SelectItem key={e.id} value={String(e.id)}>{e.firstName} {e.lastName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Statut</Label>
                <Select value={formIsActive} onValueChange={setFormIsActive}>
                  <SelectTrigger>
                    <span className="flex flex-1 text-left">
                      {formIsActive === 'true' ? 'Actif' : formIsActive === 'false' ? 'Inactif' : <span className="text-muted-foreground">Sélectionner</span>}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Actif</SelectItem>
                    <SelectItem value="false">Inactif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter showCloseButton className="mt-6">
              <Button type="submit">
                {modalMode === 'create' ? 'Créer le département' : 'Enregistrer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
