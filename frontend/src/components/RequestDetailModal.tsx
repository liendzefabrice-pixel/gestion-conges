import api from '../services/api';
import type { LeaveRequest, PermissionRequest } from '../types';

type RequestType = LeaveRequest | PermissionRequest;

interface Props {
  request: RequestType;
  type: 'leave' | 'permission';
  role: string;
  onClose: () => void;
  onRefresh: () => void;
}

const statusLabels: Record<string, string> = {
  PENDING: 'En attente',
  RH_REVIEWED: 'Examinée',
  APPROVED: 'Approuvée',
  REJECTED: 'Refusée',
};

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  RH_REVIEWED: 'bg-blue-100 text-blue-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
};

export default function RequestDetailModal({ request, type, role, onClose, onRefresh }: Props) {
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

  const canReview = (role === 'HR' || role === 'ADMIN') && r.status === 'PENDING';
  const canDecide = (role === 'DIRECTOR' || role === 'ADMIN') && r.status === 'RH_REVIEWED';

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">
            {type === 'leave' ? 'Demande de congé' : 'Demande de permission'}
          </h2>
          <span className={`px-3 py-1 rounded text-sm font-medium ${statusColors[r.status]}`}>
            {statusLabels[r.status]}
          </span>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Employé</p>
              <p className="font-medium">{r.employee?.user?.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">{type === 'leave' ? 'Type' : 'Durée'}</p>
              <p className="font-medium">{r.leaveType?.name || `${r.duration} jour(s)`}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Date de début</p>
              <p className="font-medium">{new Date(r.startDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Date de fin</p>
              <p className="font-medium">{new Date(r.endDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Nombre de jours</p>
              <p className="font-medium">{r.duration} jour(s) ouvrables</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Soumis le</p>
              <p className="font-medium">{new Date(r.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-500">Motif</p>
            <p className="mt-1 p-3 bg-gray-50 rounded text-sm whitespace-pre-wrap">{r.reason}</p>
          </div>

          {r.hrComment && (
            <div>
              <p className="text-sm text-gray-500">Avis du RH</p>
              <div className="mt-1 p-3 bg-blue-50 rounded text-sm">
                <p className="font-medium">{r.hrOpinion === 'Favorable' ? 'Favorable' : 'Défavorable'}</p>
                {r.hrComment && <p className="mt-1">{r.hrComment}</p>}
                {r.reviewedBy && <p className="mt-1 text-xs text-gray-400">Par {r.reviewedBy.email}</p>}
              </div>
            </div>
          )}

          {r.directorComment && (
            <div>
              <p className="text-sm text-gray-500">Commentaire de la direction</p>
              <p className="mt-1 p-3 bg-green-50 rounded text-sm">{r.directorComment}</p>
            </div>
          )}

          {canReview && (
            <div className="border-t pt-4 space-y-3">
              <h3 className="font-semibold">Donner un avis</h3>
              <select id="hrOpinion" className="w-full px-3 py-2 border rounded" defaultValue="Favorable">
                <option value="Favorable">Favorable</option>
                <option value="Défavorable">Défavorable</option>
              </select>
              <textarea id="hrComment" rows={3} placeholder="Commentaire (optionnel)" className="w-full px-3 py-2 border rounded" />
              <button onClick={handleHrReview} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Envoyer l'avis à la direction
              </button>
            </div>
          )}

          {canDecide && (
            <div className="border-t pt-4 space-y-3">
              <h3 className="font-semibold">Décision de la direction</h3>
              <textarea id="directorComment" rows={2} placeholder="Commentaire (optionnel)" className="w-full px-3 py-2 border rounded" />
              <div className="flex gap-2 justify-end">
                <button onClick={() => handleDecision('APPROVED')} className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                  Approuver
                </button>
                <button onClick={() => handleDecision('REJECTED')} className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                  Refuser
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
