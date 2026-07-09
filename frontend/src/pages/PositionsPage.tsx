import { useEffect, useState, useMemo } from 'react';
import api from '../services/api';
import type { Position, Department } from '../types';
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
import { Plus, Search } from 'lucide-react';

type ModalMode = 'create' | 'edit' | null;

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR');
}

const PAGE_SIZE = 8;

export default function PositionsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role?.name === 'ADMIN';

  const [positions, setPositions] = useState<Position[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [search, setSearch] = useState('');
  const [filterDeptId, setFilterDeptId] = useState('');
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<'name' | 'createdAt' | 'count'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingPosition, setEditingPosition] = useState<any>(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formDeptId, setFormDeptId] = useState('');
  const [formIsActive, setFormIsActive] = useState('true');

  const load = () => {
    api.get('/positions').then((res) => setPositions(res.data));
    api.get('/departments').then((res) => setDepartments(res.data));
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let list = positions.filter(
      (p) =>
        (p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q)) &&
        (!filterDeptId || p.departmentId === Number(filterDeptId)),
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
  }, [positions, search, filterDeptId, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const openCreate = () => {
    setModalMode('create');
    setEditingPosition(null);
    setFormName('');
    setFormDesc('');
    setFormDeptId('');
    setFormIsActive('true');
    setError('');
    setSuccess('');
  };

  const openEdit = (p: any) => {
    setModalMode('edit');
    setEditingPosition(p);
    setFormName(p.name);
    setFormDesc(p.description || '');
    setFormDeptId(String(p.departmentId));
    setFormIsActive(p.isActive !== false ? 'true' : 'false');
    setError('');
    setSuccess('');
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingPosition(null);
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
      isActive: formIsActive === 'true',
    };
    if (modalMode === 'create' || editingPosition) {
      body.departmentId = Number(formDeptId);
    }

    try {
      if (modalMode === 'create') {
        await api.post('/positions', body);
      } else if (modalMode === 'edit' && editingPosition) {
        await api.patch(`/positions/${editingPosition.id}`, body);
      }
      setSuccess(modalMode === 'create' ? 'Poste créé avec succès' : 'Poste modifié avec succès');
      setModalMode(null);
      setEditingPosition(null);
      load();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur');
    }
  };

  const toggleActive = async (p: any) => {
    try {
      await api.patch(`/positions/${p.id}`, { isActive: !(p.isActive !== false) });
      load();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur');
    }
  };

  const modalTitle = modalMode === 'create' ? 'Nouveau poste' : 'Modifier le poste';
  const colCount = isAdmin ? 7 : 6;

  return (
    <div>
      <PageHeader
        title="Postes"
        description="Gérez les postes et fonctions de l'entreprise"
        actions={
          isAdmin ? (
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              Nouveau poste
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

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Rechercher un poste..."
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Département :</span>
          <Select value={filterDeptId} onValueChange={(v) => { setFilterDeptId(v); setPage(0); }}>
            <SelectTrigger className="w-44">
              <span className="flex flex-1 text-left">
                {filterDeptId
                  ? departments.find(d => d.id === Number(filterDeptId))?.name || ''
                  : <span className="text-muted-foreground">Tous</span>
                }
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tous</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span>Trier par :</span>
          <Select value={sortKey} onValueChange={(v) => { setSortKey(v as any); setPage(0); }}>
            <SelectTrigger className="w-28">
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
            <TableHead>Nom du poste</TableHead>
            <TableHead>Département</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Nombre d'employés</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Date de création</TableHead>
            {isAdmin && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {paged.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="font-medium">{p.name}</TableCell>
              <TableCell className="text-muted-foreground">{p.department?.name || '—'}</TableCell>
              <TableCell className="text-muted-foreground max-w-[200px] truncate">{p.description || '—'}</TableCell>
              <TableCell>{p._count?.employees || 0}</TableCell>
              <TableCell>
                <Badge variant={p.isActive !== false ? 'success' : 'danger'}>
                  {p.isActive !== false ? 'Actif' : 'Inactif'}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">{p.createdAt ? formatDate(p.createdAt) : '—'}</TableCell>
              {isAdmin && (
                <TableCell className="text-right">
                  <div className="flex flex-col items-end gap-1">
                    <Button variant="ghost" size="sm" className="h-auto py-1" onClick={() => openEdit(p)}>
                      Modifier
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-auto py-1 ${p.isActive !== false ? 'text-destructive hover:text-destructive' : 'text-success hover:text-success'}`}
                      onClick={() => toggleActive(p)}
                    >
                      {p.isActive !== false ? 'Désactiver' : 'Activer'}
                    </Button>
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
          {paged.length === 0 && (
            <TableRow>
              <TableCell colSpan={colCount} className="text-center text-muted-foreground">
                {search || filterDeptId ? 'Aucun poste ne correspond à votre recherche' : 'Aucun poste'}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

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

      <Dialog open={modalMode !== null} onOpenChange={(open) => { if (!open) closeModal(); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{modalTitle}</DialogTitle>
            <DialogDescription>
              {modalMode === 'create' ? 'Créez un nouveau poste' : 'Modifiez les informations du poste'}
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
                <Label>Département</Label>
                <Select value={formDeptId || null} onValueChange={(v) => setFormDeptId(v || '')}>
                  <SelectTrigger>
                    <span className="flex flex-1 text-left">
                      {formDeptId
                        ? departments.find(d => d.id === Number(formDeptId))?.name || ''
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
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Optionnelle" />
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
                {modalMode === 'create' ? 'Créer le poste' : 'Enregistrer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
