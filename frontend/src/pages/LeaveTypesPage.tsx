import { useEffect, useState, useMemo } from 'react';
import api from '../services/api';
import type { LeaveType } from '../types';
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

const ICON_OPTIONS = ['Calendar', 'HeartPulse', 'Baby', 'Star', 'Clock', 'Briefcase', 'UserCheck', 'Sun', 'Moon', 'Zap'];

const colorMap: Record<string, string> = {
  '#0B6B3A': 'Vert',
  '#D91F26': 'Rouge',
  '#8DBB52': 'Vert clair',
  '#F59E0B': 'Orange',
  '#6B7280': 'Gris',
  '#2563EB': 'Bleu',
  '#7C3AED': 'Violet',
  '#EC4899': 'Rose',
  '#06B6D4': 'Cyan',
};

export default function LeaveTypesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role?.name === 'ADMIN';

  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editing, setEditing] = useState<any>(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formDays, setFormDays] = useState('');
  const [formColor, setFormColor] = useState('#0B6B3A');
  const [formIcon, setFormIcon] = useState('Calendar');
  const [formIsActive, setFormIsActive] = useState('true');
  const [formRequiresRh, setFormRequiresRh] = useState('true');
  const [formRequiresDir, setFormRequiresDir] = useState('false');
  const [formRequiresJustif, setFormRequiresJustif] = useState('false');
  const [formDeducts, setFormDeducts] = useState('true');
  const [formMaxDuration, setFormMaxDuration] = useState('');
  const [formMinDuration, setFormMinDuration] = useState('');

  const load = () => {
    api.get('/leave-types').then((res) => setLeaveTypes(res.data));
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return leaveTypes.filter(
      (lt) => lt.name.toLowerCase().includes(q) || (lt.description || '').toLowerCase().includes(q),
    );
  }, [leaveTypes, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const openCreate = () => {
    setModalMode('create');
    setEditing(null);
    setFormName('');
    setFormDesc('');
    setFormDays('0');
    setFormColor('#0B6B3A');
    setFormIcon('Calendar');
    setFormIsActive('true');
    setFormRequiresRh('true');
    setFormRequiresDir('false');
    setFormRequiresJustif('false');
    setFormDeducts('true');
    setFormMaxDuration('');
    setFormMinDuration('');
    setError('');
    setSuccess('');
  };

  const openEdit = (lt: any) => {
    setModalMode('edit');
    setEditing(lt);
    setFormName(lt.name);
    setFormDesc(lt.description || '');
    setFormDays(String(lt.defaultDays));
    setFormColor(lt.color || '#0B6B3A');
    setFormIcon(lt.icon || 'Calendar');
    setFormIsActive(lt.isActive !== false ? 'true' : 'false');
    setFormRequiresRh(lt.requiresRhValidation !== false ? 'true' : 'false');
    setFormRequiresDir(lt.requiresDirectorValidation ? 'true' : 'false');
    setFormRequiresJustif(lt.requiresJustification ? 'true' : 'false');
    setFormDeducts(lt.deductsFromAnnualBalance !== false ? 'true' : 'false');
    setFormMaxDuration(lt.maxDuration ? String(lt.maxDuration) : '');
    setFormMinDuration(lt.minDuration ? String(lt.minDuration) : '');
    setError('');
    setSuccess('');
  };

  const closeModal = () => {
    setModalMode(null);
    setEditing(null);
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
      defaultDays: Number(formDays),
      color: formColor,
      icon: formIcon,
      isActive: formIsActive === 'true',
      requiresRhValidation: formRequiresRh === 'true',
      requiresDirectorValidation: formRequiresDir === 'true',
      requiresJustification: formRequiresJustif === 'true',
      deductsFromAnnualBalance: formDeducts === 'true',
      maxDuration: formMaxDuration ? Number(formMaxDuration) : null,
      minDuration: formMinDuration ? Number(formMinDuration) : null,
    };

    try {
      if (modalMode === 'create') {
        await api.post('/leave-types', body);
      } else if (modalMode === 'edit' && editing) {
        await api.patch(`/leave-types/${editing.id}`, body);
      }
      setSuccess(modalMode === 'create' ? 'Type de congé créé avec succès' : 'Type de congé modifié avec succès');
      setModalMode(null);
      setEditing(null);
      load();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur');
    }
  };

  const toggleActive = async (lt: any) => {
    try {
      await api.patch(`/leave-types/${lt.id}`, { isActive: !(lt.isActive !== false) });
      load();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur');
    }
  };

  const modalTitle = modalMode === 'create' ? 'Nouveau type de congé' : 'Modifier le type de congé';

  return (
    <div>
      <PageHeader
        title="Types de congés"
        description="Gérez les types de congés de l'entreprise"
        actions={
          isAdmin ? (
            <Button onClick={openCreate}>
              Nouveau type
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

      <div className="relative max-w-sm mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          placeholder="Rechercher un type de congé..."
          className="pl-9"
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Jours par défaut</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Date de création</TableHead>
            {isAdmin && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {paged.map((lt) => (
            <TableRow key={lt.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: lt.color || '#0B6B3A' }}
                  />
                  {lt.name}
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground max-w-[200px] truncate">{lt.description || '—'}</TableCell>
              <TableCell>{lt.defaultDays} jour{lt.defaultDays > 1 ? 's' : ''}</TableCell>
              <TableCell>
                <Badge variant={lt.isActive !== false ? 'success' : 'danger'}>
                  {lt.isActive !== false ? 'Actif' : 'Inactif'}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">{lt.createdAt ? formatDate(lt.createdAt) : '—'}</TableCell>
              {isAdmin && (
                <TableCell className="text-right">
                  <div className="flex flex-col items-end gap-1">
                    <Button variant="ghost" size="sm" className="h-auto py-1" onClick={() => openEdit(lt)}>
                      Modifier
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-auto py-1 ${lt.isActive !== false ? 'text-destructive hover:text-destructive' : 'text-success hover:text-success'}`}
                      onClick={() => toggleActive(lt)}
                    >
                      {lt.isActive !== false ? 'Désactiver' : 'Activer'}
                    </Button>
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
          {paged.length === 0 && (
            <TableRow>
              <TableCell colSpan={isAdmin ? 6 : 5} className="text-center text-muted-foreground">
                {search ? 'Aucun type de congé ne correspond à votre recherche' : 'Aucun type de congé'}
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
              {modalMode === 'create' ? 'Créez un nouveau type de congé' : 'Modifiez les informations du type de congé'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            {error && <div className="p-3 text-sm text-red-700 bg-red-50 rounded-lg mb-4 border border-red-200">{error}</div>}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Jours par défaut</Label>
                <Input value={formDays} onChange={(e) => setFormDays(e.target.value)} type="number" min="0" required />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Description</Label>
                <Input value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Optionnelle" />
              </div>
              <div className="space-y-2">
                <Label>Couleur</Label>
                <Select value={formColor} onValueChange={setFormColor}>
                  <SelectTrigger>
                    <span className="flex flex-1 text-left items-center gap-2">
                      <span className="inline-block w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: formColor }} />
                      {colorMap[formColor] || formColor}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(colorMap).map(([code, label]) => (
                      <SelectItem key={code} value={code}>
                        <span className="flex items-center gap-2">
                          <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: code }} />
                          {label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Icône</Label>
                <Select value={formIcon} onValueChange={setFormIcon}>
                  <SelectTrigger>
                    <span className="flex flex-1 text-left">{formIcon}</span>
                  </SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map((icon) => (
                      <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Validation RH</Label>
                <Select value={formRequiresRh} onValueChange={setFormRequiresRh}>
                  <SelectTrigger>
                    <span className="flex flex-1 text-left">{formRequiresRh === 'true' ? 'Oui' : 'Non'}</span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Oui</SelectItem>
                    <SelectItem value="false">Non</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Validation Direction</Label>
                <Select value={formRequiresDir} onValueChange={setFormRequiresDir}>
                  <SelectTrigger>
                    <span className="flex flex-1 text-left">{formRequiresDir === 'true' ? 'Oui' : 'Non'}</span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Oui</SelectItem>
                    <SelectItem value="false">Non</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Justificatif requis</Label>
                <Select value={formRequiresJustif} onValueChange={setFormRequiresJustif}>
                  <SelectTrigger>
                    <span className="flex flex-1 text-left">{formRequiresJustif === 'true' ? 'Oui' : 'Non'}</span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Oui</SelectItem>
                    <SelectItem value="false">Non</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Déduit du solde</Label>
                <Select value={formDeducts} onValueChange={setFormDeducts}>
                  <SelectTrigger>
                    <span className="flex flex-1 text-left">{formDeducts === 'true' ? 'Oui' : 'Non'}</span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Oui</SelectItem>
                    <SelectItem value="false">Non</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Durée max. (jours)</Label>
                <Input value={formMaxDuration} onChange={(e) => setFormMaxDuration(e.target.value)} type="number" min="1" placeholder="Illimitée" />
              </div>
              <div className="space-y-2">
                <Label>Durée min. (jours)</Label>
                <Input value={formMinDuration} onChange={(e) => setFormMinDuration(e.target.value)} type="number" min="1" placeholder="Aucune" />
              </div>
              <div className="space-y-2">
                <Label>Statut</Label>
                <Select value={formIsActive} onValueChange={setFormIsActive}>
                  <SelectTrigger>
                    <span className="flex flex-1 text-left">{formIsActive === 'true' ? 'Actif' : 'Inactif'}</span>
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
                {modalMode === 'create' ? 'Créer le type' : 'Enregistrer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
