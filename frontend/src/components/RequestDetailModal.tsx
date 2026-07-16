import { useState } from 'react';
import api from '../services/api';
import type { LeaveRequest, PermissionRequest, LeaveBalance } from '../types';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { CalendarDays, Clock, User, FileText, MessageSquare, Scale, History, Loader2, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

type RequestType = LeaveRequest | PermissionRequest;

interface Props {
  request: RequestType;
  type: 'leave' | 'permission';
  role: string;
  onClose: () => void;
  onRefresh: () => void;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'warning' | 'success' | 'danger' | 'info'; color: string }> = {
  BROUILLON: { label: 'Brouillon', variant: 'default', color: 'text-gray-500 bg-gray-100' },
  EN_ATTENTE_RH: { label: 'En attente RH', variant: 'warning', color: 'text-amber-700 bg-amber-100' },
  EN_ATTENTE_DIRECTION: { label: 'En attente Direction', variant: 'info', color: 'text-blue-700 bg-blue-100' },
  AVIS_RH_RENDU: { label: 'Avis RH rendu', variant: 'info', color: 'text-indigo-700 bg-indigo-100' },
  APPROUVE: { label: 'Approuvé', variant: 'success', color: 'text-green-700 bg-green-100' },
  REFUSE: { label: 'Refusé', variant: 'danger', color: 'text-red-700 bg-red-100' },
  ANNULE: { label: 'Annulé', variant: 'outline', color: 'text-gray-500 bg-gray-100' },
};

const permissionTypeLabels: Record<string, string> = {
  PERMISSION: 'Permission',
  MARIAGE: 'Mariage',
  NAISSANCE: 'Naissance',
  DECES: 'Décès',
  FAMILIAL: 'Événement familial',
};

function Timeline({ request }: { request: any }) {
  const steps = [];
  steps.push({ label: 'Demande créée', date: request.createdAt, author: request.employee?.user?.email, done: !!request.createdAt });
  if (request.histories) {
    const sortedHistories = [...(request.histories || [])].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    sortedHistories.forEach((h: any) => {
      const statusLabel = statusConfig[h.newStatus]?.label || h.newStatus;
      steps.push({
        label: statusLabel,
        date: h.createdAt,
        author: h.user?.email,
        done: true,
        detail: h.newStatus === 'APPROUVE' ? 'Approuvée' : h.newStatus === 'REFUSE' ? 'Refusée' : h.comment || undefined,
        isCurrent: h.newStatus === request.status && request.status !== 'APPROUVE' && request.status !== 'REFUSE' && request.status !== 'ANNULE',
      });
    });
  }

  return (
    <div className="space-y-0">
      {steps.map((step, i) => (
        <div key={i} className="flex items-start gap-3 py-2">
          <div className="flex flex-col items-center">
            <div className={`w-3 h-3 rounded-full mt-1.5 ${step.done ? step.isCurrent ? 'bg-amber-500 ring-2 ring-amber-200 animate-pulse' : 'bg-primary ring-2 ring-primary/20' : 'bg-gray-200'}`} />
            {i < steps.length - 1 && <div className="w-px h-5 bg-gray-200" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className={`text-sm font-medium ${step.done ? 'text-foreground' : 'text-muted-foreground'}`}>
                {step.label}
              </p>
              {step.detail && (
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${step.detail === 'Favorable' || step.detail === 'Approuvée' ? 'bg-green-100 text-green-700' : step.detail === 'Défavorable' || step.detail === 'Refusée' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                  {step.detail}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {step.date && (
                <span className="text-xs text-muted-foreground">
                  {new Date(step.date).toLocaleDateString('fr-FR')} à {new Date(step.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
              {step.author && (
                <span className="text-xs text-muted-foreground">par {step.author}</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SectionCard({ icon, title, children }: { icon?: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          {icon && <span className="text-muted-foreground">{icon}</span>}
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

export default function RequestDetailModal({ request, type, role, onClose, onRefresh }: Props) {
  const [cancelling, setCancelling] = useState(false);
  const [hrOpinion, setHrOpinion] = useState('Favorable');
  const [hrComment, setHrComment] = useState('');
  const [directorComment, setDirectorComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [transmitting, setTransmitting] = useState(false);
  const r = request as any;

  const handleHrReview = async () => {
    setSubmitting(true);
    try {
      const endpoint = type === 'leave' ? `/leave/requests/${r.id}/hr-review` : `/permissions/requests/${r.id}/hr-review`;
      await api.patch(endpoint, { hrComment, hrOpinion });
      onRefresh();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransmit = async () => {
    setTransmitting(true);
    try {
      const endpoint = type === 'leave' ? `/leave/requests/${r.id}/transmit` : `/permissions/requests/${r.id}/transmit`;
      await api.patch(endpoint);
      onRefresh();
      onClose();
    } finally {
      setTransmitting(false);
    }
  };

  const handleDecision = async (decision: 'APPROUVE' | 'REFUSE') => {
    if (!directorComment.trim()) return;
    setSubmitting(true);
    try {
      const endpoint = type === 'leave' ? `/leave/requests/${r.id}/decide` : `/permissions/requests/${r.id}/decide`;
      await api.patch(endpoint, { decision, directorComment });
      onRefresh();
      onClose();
    } finally {
      setSubmitting(false);
    }
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

  const canReview = (role === 'HR' || role === 'ADMIN') && r.status === 'EN_ATTENTE_RH';
  const canTransmit = (role === 'HR' || role === 'ADMIN') && r.status === 'AVIS_RH_RENDU';
  const canDecide = (role === 'DIRECTOR' || role === 'ADMIN') && r.status === 'EN_ATTENTE_DIRECTION';
  const canCancel = role === 'EMPLOYEE' && (r.status === 'EN_ATTENTE_RH' || r.status === 'BROUILLON');
  const isLeave = type === 'leave';
  const status = statusConfig[r.status];
  const leaveTypeName = r.leaveType?.name || permissionTypeLabels[r.permissionType] || 'Permission';

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[95vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b z-10 p-5 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold">
              {isLeave ? 'Demande de congé' : 'Demande de permission'}
            </h2>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${status?.color || ''}`}>
              {status?.label || r.status}
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>Fermer</Button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SectionCard icon={<User className="size-4" />} title="Employé">
              <p className="font-medium">{r.employee?.lastName || r.employee?.user?.lastName || ''} {r.employee?.firstName || r.employee?.user?.firstName || ''}</p>
              {r.employee?.position && (
                <p className="text-sm text-muted-foreground">Poste : {r.employee.position}</p>
              )}
              {r.employee?.department?.name && (
                <p className="text-sm text-muted-foreground">Département : {r.employee.department.name}</p>
              )}
            </SectionCard>

            <SectionCard icon={<CalendarDays className="size-4" />} title="Période">
              <p className="font-medium">{leaveTypeName}</p>
              <p className="text-sm text-muted-foreground">
                {new Date(r.startDate).toLocaleDateString('fr-FR')} — {new Date(r.endDate).toLocaleDateString('fr-FR')}
              </p>
              <p className="text-sm text-muted-foreground">{r.duration} jour{r.duration > 1 ? 's' : ''}</p>
              {r.returnDate && (
                <p className="text-sm text-muted-foreground mt-1">
                  Retour prévu : {new Date(r.returnDate).toLocaleDateString('fr-FR')}
                </p>
              )}
            </SectionCard>
          </div>

          <SectionCard icon={<FileText className="size-4" />} title="Motif">
            <p className="text-sm whitespace-pre-wrap">{r.reason}</p>
          </SectionCard>

          {r.hrComment && (
            <SectionCard icon={<MessageSquare className="size-4" />} title="Avis du RH">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.hrOpinion === 'Favorable' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {r.hrOpinion === 'Favorable' ? 'Favorable' : 'Défavorable'}
                </span>
                {r.reviewedBy && <span className="text-xs text-muted-foreground">par {r.reviewedBy.email}</span>}
              </div>
              <p className="text-sm">{r.hrComment}</p>
            </SectionCard>
          )}

          {r.directorComment && (
            <SectionCard icon={<Scale className="size-4" />} title="Décision de la direction">
              <p className="text-sm">{r.directorComment}</p>
              {r.decidedBy && <p className="text-xs text-muted-foreground mt-1">Par {r.decidedBy.email}</p>}
            </SectionCard>
          )}

          <SectionCard icon={<History className="size-4" />} title="Historique">
            {r.histories && r.histories.length > 0 ? (
              <Timeline request={r} />
            ) : (
              <p className="text-sm text-muted-foreground">Aucun historique disponible</p>
            )}
          </SectionCard>

          {canReview && (
            <Card className="border-2 border-amber-200 bg-amber-50/50">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="size-4 text-amber-600" />
                  <h3 className="font-semibold text-amber-800">Avis RH</h3>
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="hrOpinion" value="Favorable" checked={hrOpinion === 'Favorable'} onChange={() => setHrOpinion('Favorable')} className="accent-primary" />
                    <span className="text-sm font-medium">Favorable</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="hrOpinion" value="Défavorable" checked={hrOpinion === 'Défavorable'} onChange={() => setHrOpinion('Défavorable')} className="accent-red-500" />
                    <span className="text-sm font-medium text-red-600">Défavorable</span>
                  </label>
                </div>
                <Textarea rows={3} placeholder="Commentaire (optionnel)" value={hrComment} onChange={(e) => setHrComment(e.target.value)} />
                <div className="flex justify-end">
                  <Button onClick={handleHrReview} disabled={submitting}>
                    {submitting ? <><Loader2 className="size-4 animate-spin mr-2" />Traitement...</> : 'Enregistrer l\'avis'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {canTransmit && (
            <Card className="border-2 border-indigo-200 bg-indigo-50/50">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <ArrowRight className="size-4 text-indigo-600" />
                  <h3 className="font-semibold text-indigo-800">Transmettre à la direction</h3>
                </div>
                <p className="text-sm text-indigo-700">
                  L'avis RH a été enregistré. Vous pouvez maintenant transmettre cette demande à la direction pour décision finale.
                </p>
                <div className="flex justify-end">
                  <Button onClick={handleTransmit} disabled={transmitting} className="bg-indigo-600 hover:bg-indigo-700">
                    {transmitting ? <><Loader2 className="size-4 animate-spin mr-2" />Transmission...</> : 'Transmettre à la Direction'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {canDecide && (
            <Card className="border-2 border-blue-200 bg-blue-50/50">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Scale className="size-4 text-blue-600" />
                  <h3 className="font-semibold text-blue-800">Décision de la direction</h3>
                </div>
                <Textarea rows={3} placeholder="Commentaire (obligatoire)" value={directorComment} onChange={(e) => setDirectorComment(e.target.value)} />
                <div className="flex gap-2 justify-end">
                  <Button
                    onClick={() => handleDecision('REFUSE')}
                    disabled={submitting || !directorComment.trim()}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    {submitting ? <><Loader2 className="size-4 animate-spin mr-2" />Traitement...</> : 'Refuser'}
                  </Button>
                  <Button
                    onClick={() => handleDecision('APPROUVE')}
                    disabled={submitting || !directorComment.trim()}
                  >
                    {submitting ? <><Loader2 className="size-4 animate-spin mr-2" />Traitement...</> : 'Approuver'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {canCancel && (
            <div className="flex justify-end">
              <Button onClick={handleCancel} disabled={cancelling} variant="outline" className="border-destructive text-destructive hover:bg-destructive/10">
                {cancelling ? <><Loader2 className="size-4 animate-spin mr-2" />Annulation...</> : 'Annuler la demande'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
