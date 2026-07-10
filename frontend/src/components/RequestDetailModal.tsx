import { useState } from 'react';
import api from '../services/api';
import type { LeaveRequest, PermissionRequest } from '../types';
import { Button } from '../components/ui/button';

type RequestType = LeaveRequest | PermissionRequest;

interface Props {
  request: RequestType;
  type: 'leave' | 'permission';
  role: string;
  onClose: () => void;
  onRefresh: () => void;
}

const statusLabels: Record<string, string> = {
  DRAFT: 'Brouillon',
  PENDING: 'En attente RH',
  RH_REVIEWED: 'Avis RH rendu',
  APPROVED: 'Approuvée',
  REJECTED: 'Refusée',
  CANCELLED: 'Annulée',
};

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  PENDING: 'bg-yellow-100 text-yellow-800',
  RH_REVIEWED: 'bg-blue-100 text-blue-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

function Timeline({ request }: { request: any }) {
  const steps = [
    { label: 'Demande créée', date: request.createdAt, done: !!request.createdAt },
    { label: 'Reçue par le RH', date: request.createdAt, done: request.status !== 'DRAFT' },
    { label: 'Avis RH rédigé', date: request.reviewedAt, done: !!request.reviewedAt },
    { label: 'Transmise à la Direction', date: request.reviewedAt, done: !!request.reviewedAt },
    { label: 'Décision finale', date: request.decidedAt, done: !!request.decidedAt },
  ];

  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-500">Historique</p>
      <div className="space-y-0">
        {steps.map((step, i) => (
          <div key={i} className="flex items-start gap-3 py-1.5">
            <div className="flex flex-col items-center">
              <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${step.done ? 'bg-primary' : 'bg-gray-200'}`} />
              {i < steps.length - 1 && <div className="w-px h-4 bg-gray-200" />}
            </div>
            <div>
              <p className={`text-sm ${step.done ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                {step.label}
              </p>
              {step.date && (
                <p className="text-xs text-muted-foreground">{new Date(step.date).toLocaleDateString('fr-FR')}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RequestDetailModal({ request, type, role, onClose, onRefresh }: Props) {
  const [cancelling, setCancelling] = useState(false);
  const r = request as any;

  const handleHrReview = async () => {
    const hrComment = (document.getElementById('hrComment') as HTMLTextAreaElement)?.value || '';
    const hrOpinion = (document.getElementById('hrOpinion') as HTMLSelectElement)?.value || 'Favorable';
    const endpoint = type === 'leave' ? `/leave/requests/${r.id}/hr-review` : `/permissions/requests/${r.id}/hr-review`;
    await api.patch(endpoint, { hrComment, hrOpinion });
    onRefresh();
    onClose();
  };

  const handleDecision = async (decision: 'APPROVED' | 'REJECTED') => {
    const directorComment = (document.getElementById('directorComment') as HTMLTextAreaElement)?.value || '';
    const endpoint = type === 'leave' ? `/leave/requests/${r.id}/decide` : `/permissions/requests/${r.id}/decide`;
    await api.patch(endpoint, { decision, directorComment });
    onRefresh();
    onClose();
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await api.patch(`/leave/requests/${r.id}/cancel`);
      onRefresh();
      onClose();
    } finally {
      setCancelling(false);
    }
  };

  const canReview = (role === 'HR' || role === 'ADMIN') && r.status === 'PENDING';
  const canDecide = (role === 'DIRECTOR' || role === 'ADMIN') && r.status === 'RH_REVIEWED';
  const canCancel = (role === 'EMPLOYEE' || role === 'HR') && (r.status === 'PENDING' || r.status === 'DRAFT');
  const isLeave = type === 'leave';

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">
            {isLeave ? 'Demande de congé' : 'Demande de permission'}
          </h2>
          <span className={`px-3 py-1 rounded text-sm font-medium ${statusColors[r.status] || ''}`}>
            {statusLabels[r.status] || r.status}
          </span>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Employé</p>
              <p className="font-medium">{r.employee?.user?.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{isLeave ? 'Type' : 'Durée'}</p>
              <p className="font-medium">{r.leaveType?.name || `${r.duration} jour(s)`}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date de début</p>
              <p className="font-medium">{new Date(r.startDate).toLocaleDateString('fr-FR')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date de fin</p>
              <p className="font-medium">{new Date(r.endDate).toLocaleDateString('fr-FR')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Nombre de jours</p>
              <p className="font-medium">{r.duration} jour(s)</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Soumis le</p>
              <p className="font-medium">{r.createdAt ? new Date(r.createdAt).toLocaleDateString('fr-FR') : '—'}</p>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Motif</p>
            <p className="mt-1 p-3 bg-gray-50 rounded text-sm whitespace-pre-wrap">{r.reason}</p>
          </div>

          {r.hrComment && (
            <div>
              <p className="text-sm text-muted-foreground">Avis du RH</p>
              <div className="mt-1 p-3 bg-blue-50 rounded text-sm">
                <p className="font-medium">{r.hrOpinion === 'Favorable' ? 'Favorable' : 'Défavorable'}</p>
                {r.hrComment && <p className="mt-1">{r.hrComment}</p>}
                {r.reviewedBy && <p className="mt-1 text-xs text-muted-foreground">Par {r.reviewedBy.email}</p>}
              </div>
            </div>
          )}

          {r.directorComment && (
            <div>
              <p className="text-sm text-muted-foreground">Commentaire de la direction</p>
              <p className="mt-1 p-3 bg-green-50 rounded text-sm">{r.directorComment}</p>
            </div>
          )}

          <Timeline request={r} />

          {canReview && (
            <div className="border-t pt-4 space-y-3">
              <h3 className="font-semibold">Donner un avis</h3>
              <select id="hrOpinion" className="w-full px-3 py-2 border rounded-lg text-sm" defaultValue="Favorable">
                <option value="Favorable">Favorable</option>
                <option value="Défavorable">Défavorable</option>
              </select>
              <textarea id="hrComment" rows={3} placeholder="Commentaire (optionnel)" className="w-full px-3 py-2 border rounded-lg text-sm" />
              <div className="flex justify-end">
                <Button onClick={handleHrReview}>Envoyer l'avis à la direction</Button>
              </div>
            </div>
          )}

          {canDecide && (
            <div className="border-t pt-4 space-y-3">
              <h3 className="font-semibold">Décision de la direction</h3>
              <textarea id="directorComment" rows={2} placeholder="Commentaire (optionnel)" className="w-full px-3 py-2 border rounded-lg text-sm" />
              <div className="flex gap-2 justify-end">
                <Button onClick={() => handleDecision('APPROVED')} className="bg-success hover:bg-success/90">
                  Approuver
                </Button>
                <Button onClick={() => handleDecision('REJECTED')} className="bg-destructive hover:bg-destructive/90">
                  Refuser
                </Button>
              </div>
            </div>
          )}

          {canCancel && isLeave && (
            <div className="border-t pt-4 flex justify-end">
              <Button onClick={handleCancel} disabled={cancelling} className="bg-destructive hover:bg-destructive/90">
                {cancelling ? 'Annulation...' : 'Annuler la demande'}
              </Button>
            </div>
          )}
        </div>

        <div className="p-4 border-t flex justify-end">
          <Button variant="ghost" onClick={onClose}>Fermer</Button>
        </div>
      </div>
    </div>
  );
}
