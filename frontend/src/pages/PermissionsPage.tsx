import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import RequestDetailModal from '../components/RequestDetailModal';
import type { PermissionRequest } from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { PageHeader } from '../components/ui/page-header';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../components/ui/table';
import { Label } from '../components/ui/label';
import { Plus } from 'lucide-react';

const statusConfig: Record<string, { label: string; variant: 'default' | 'warning' | 'success' | 'danger' | 'info' }> = {
  PENDING: { label: 'En attente', variant: 'warning' },
  RH_REVIEWED: { label: 'Examinée', variant: 'info' },
  APPROVED: { label: 'Approuvée', variant: 'success' },
  REJECTED: { label: 'Refusée', variant: 'danger' },
};

export default function PermissionsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<PermissionRequest[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<PermissionRequest | null>(null);
  const role = user?.role?.name;

  const loadRequests = () => {
    const url = role === 'EMPLOYEE' ? '/permissions/requests/my' : '/permissions/requests';
    api.get(url).then((res) => setRequests(res.data));
  };

  useEffect(() => { loadRequests(); }, []);

  const createRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/permissions/requests', { startDate, endDate, reason });
      setShowForm(false);
      setStartDate('');
      setEndDate('');
      setReason('');
      loadRequests();
    } catch (err: any) {
      setError(err.response?.data?.message?.[0] || err.response?.data?.message || 'Erreur lors de la soumission');
    }
  };

  return (
    <div>
      <PageHeader
        title="Demandes de permission"
        description="Gérez vos demandes de permission"
        actions={
          role === 'EMPLOYEE' && (
            <Button onClick={() => setShowForm(!showForm)}>
              <Plus className="size-4" />
              Nouvelle demande
            </Button>
          )
        }
      />

      {showForm && (
        <Card className="mb-6 animate-fade-in">
          <CardHeader>
            <CardTitle>Nouvelle demande de permission</CardTitle>
          </CardHeader>
          <CardContent>
            {error && <div className="p-3 text-sm text-red-700 bg-red-50 rounded-lg mb-4 border border-red-200">{error}</div>}
            <form onSubmit={createRequest} className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <Label>Date de début</Label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
                </div>
                <div className="flex-1 space-y-2">
                  <Label>Date de fin</Label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Motif</Label>
                <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motif de la demande" required />
              </div>
              <Button type="submit">Soumettre</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employé</TableHead>
            <TableHead>Période</TableHead>
            <TableHead>Jours</TableHead>
            <TableHead>Statut</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((r) => (
            <TableRow key={r.id} className="cursor-pointer" onClick={() => setSelectedRequest(r)}>
              <TableCell>{r.employee?.user?.email || 'N/A'}</TableCell>
              <TableCell className="text-sm">
                {new Date(r.startDate).toLocaleDateString()} - {new Date(r.endDate).toLocaleDateString()}
              </TableCell>
              <TableCell>{r.duration}</TableCell>
              <TableCell>
                <Badge variant={statusConfig[r.status]?.variant}>
                  {statusConfig[r.status]?.label}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
          {requests.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">Aucune demande</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {selectedRequest && (
        <RequestDetailModal
          request={selectedRequest}
          type="permission"
          role={role || ''}
          onClose={() => setSelectedRequest(null)}
          onRefresh={loadRequests}
        />
      )}
    </div>
  );
}
