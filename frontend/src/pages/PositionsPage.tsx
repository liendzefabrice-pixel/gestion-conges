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
import { Select, SelectContent, SelectItem, SelectTrigger } from '../components/ui/select';
import { Label } from '../components/ui/label';
import { Search, Loader2, AlertTriangle } from 'lucide-react';

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
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const [confirmAction, setConfirmAction] = useState<{ pos: any; action: 'activate' | 'deactivate' | 'delete' } | null>(null);

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingPosition, setEditingPosition] = useState<any>(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formDeptId, setFormDeptId] = useState('');
  const [formIsActive, setFormIsActive] = useState('true');
  const [formIsCritical, setFormIsCritical] = useState(false);
  const [formCanBeReplaced, setFormCanBeReplaced] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/positions'),
      api.get('/departments'),
    ]).then(([posRes, deptRes]) => {
      setPositions(posRes.data);
      setDepartments(deptRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
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
    setFormIsCritical(false);
    setFormCanBeReplaced(true);
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
    setFormIsCritical(p.isCritical ?? false);
    setFormCanBeReplaced(p.canBeReplaced ?? true);
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

    if (!formName.trim()) {
      setError('Le nom du poste est obligatoire');
      return;
    }
    if (formName.trim().length > 100) {
      setError('Le nom ne peut pas dépasser 100 caractères');
      return;
    }
    if (!formDeptId) {
      setError('Veuillez sélectionner un département');
      return;
    }

    setSubmitting(true);
    const body: Record<string, any> = {
      name: formName.trim(),
      description: formDesc.trim() || undefined,
      departmentId: Number(formDeptId),
      isActive: formIsActive === 'true',
      isCritical: formIsCritical,
      canBeReplaced: formCanBeReplaced,
    };

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
      const msg = err.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : msg || 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (p: any) => {
    try {
      await api.patch(`/positions/${p.id}`, { isActive: !(p.isActive !== false) });
      setSuccess(p.isActive !== false ? 'Poste désactivé' : 'Poste activé');
      setConfirmAction(null);
      load();
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : msg || 'Erreur');
      setConfirmAction(null);
    }
  };

  const handleDelete = async (p: any) => {
    try {
      await api.delete(`/positions/${p.id}`);
      setSuccess('Poste supprimé');
      setConfirmAction(null);
      load();
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : msg || 'Erreur');
      setConfirmAction(null);
    }
  };

  const modalTitle = modalMode === 'create' ? 'Nouveau poste' : 'Modifier le poste';
  const colCount = isAdmin ? 9 : 8;

  const activeDepartments = useMemo(() => {
    if (isAdmin) return departments;
    return departments.filter((d) => d.isActive !== false);
  }, [departments, isAdmin]);

  return (
    <div>
      <PageHeader
        title="Postes"
        description="Gérez les postes et fonctions de l'entreprise"
        actions={
          isAdmin ? (
            <Button onClick={openCreate} disabled={submitting}>
              {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
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

      {error && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="p-3 text-sm text-red-700 bg-red-50 rounded-lg border border-red-200">{error}</div>
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

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom du poste</TableHead>
              <TableHead>Département</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Effectif</TableHead>
              <TableHead>Poste critique</TableHead>
              <TableHead>Remplaçable</TableHead>
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
                <TableCell className="text-right font-medium tabular-nums">{p._count?.employees || 0}</TableCell>
                <TableCell>
                  {p.isCritical
                    ? <Badge variant="danger">Critique</Badge>
                    : <span className="text-muted-foreground">—</span>
                  }
                </TableCell>
                <TableCell>
                  {p.canBeReplaced !== false
                    ? <Badge variant="success">Oui</Badge>
                    : <Badge variant="danger">Non</Badge>
                  }
                </TableCell>
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
                        onClick={() => setConfirmAction({ pos: p, action: p.isActive !== false ? 'deactivate' : 'activate' })}
                      >
                        {p.isActive !== false ? 'Désactiver' : 'Activer'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto py-1 text-destructive hover:text-destructive"
                        onClick={() => setConfirmAction({ pos: p, action: 'delete' })}
                      >
                        Supprimer
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {paged.length === 0 && (
              <TableRow>
                <TableCell colSpan={colCount} className="text-center text-muted-foreground py-8">
                  {search || filterDeptId ? 'Aucun poste ne correspond à votre recherche' : 'Aucun poste'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2 mt-4">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(Math.max(0, page - 1))}>
            Précédent
          </Button>
          <span className="text-sm text-muted-foreground tabular-nums">
            Page {page + 1} / {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(Math.min(totalPages - 1, page + 1))}>
            Suivant
          </Button>
        </div>
      )}

      <Dialog open={confirmAction !== null} onOpenChange={() => setConfirmAction(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-destructive" />
              Confirmation
            </DialogTitle>
            <DialogDescription>
              {confirmAction && (
                confirmAction.action === 'delete'
                  ? `Êtes-vous sûr de vouloir supprimer le poste « ${confirmAction.pos.name} » ?`
                  : confirmAction.action === 'activate'
                    ? `Voulez-vous activer le poste « ${confirmAction.pos.name} » ?`
                    : `Voulez-vous désactiver le poste « ${confirmAction.pos.name} » ?`
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter showCloseButton>
            <Button variant="outline" onClick={() => setConfirmAction(null)}>Annuler</Button>
            <Button
              variant={confirmAction?.action === 'delete' ? 'danger' : 'primary'}
              onClick={() => {
                if (!confirmAction) return;
                if (confirmAction.action === 'delete') handleDelete(confirmAction.pos);
                else handleToggleActive(confirmAction.pos);
              }}
              loading={submitting}
            >
              {confirmAction?.action === 'delete' ? 'Supprimer' : confirmAction?.action === 'activate' ? 'Activer' : 'Désactiver'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} required maxLength={100} />
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
                    {activeDepartments.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Optionnelle" />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="isCritical" checked={formIsCritical} onChange={(e) => setFormIsCritical(e.target.checked)} className="rounded border-gray-300" />
                  <Label htmlFor="isCritical" className="mb-0">Poste critique</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="canBeReplaced" checked={formCanBeReplaced} onChange={(e) => setFormCanBeReplaced(e.target.checked)} className="rounded border-gray-300" />
                  <Label htmlFor="canBeReplaced" className="mb-0">Peut être remplacé</Label>
                </div>
              </div>
              {modalMode === 'edit' && (
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
              )}
            </div>
            <DialogFooter showCloseButton className="mt-6">
              <Button type="submit" loading={submitting}>
                {modalMode === 'create' ? 'Créer le poste' : 'Enregistrer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
