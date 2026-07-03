import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import RequestDetailModal from '../components/RequestDetailModal';
import type { LeaveRequest, LeaveType } from '../types';

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

export default function LeavePage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const role = user?.role?.name;

  const loadRequests = () => {
    const url = role === 'EMPLOYEE' ? '/leave/requests/my' : '/leave/requests';
    api.get(url).then((res) => setRequests(res.data));
  };

  useEffect(() => {
    loadRequests();
    api.get('/leave/types').then((res) => setLeaveTypes(res.data));
  }, []);

  const createRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/leave/requests', { leaveTypeId: Number(leaveTypeId), startDate, endDate, reason });
      setShowForm(false);
      setLeaveTypeId('');
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Demandes de congé</h1>
        {role === 'EMPLOYEE' && (
          <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Nouvelle demande
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={createRequest} className="bg-white p-4 rounded-lg shadow mb-6 space-y-3">
          {error && <p className="text-red-600 bg-red-50 p-3 rounded text-sm">{error}</p>}
          <select value={leaveTypeId} onChange={(e) => setLeaveTypeId(e.target.value)} required className="w-full px-3 py-2 border rounded">
            <option value="">Type de congé</option>
            {leaveTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <div className="flex gap-2">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className="flex-1 px-3 py-2 border rounded" />
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required className="flex-1 px-3 py-2 border rounded" />
          </div>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motif" required className="w-full px-3 py-2 border rounded" rows={2} />
          <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Soumettre</button>
        </form>
      )}

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="p-3 text-sm font-medium">Employé</th>
              <th className="p-3 text-sm font-medium">Type</th>
              <th className="p-3 text-sm font-medium">Période</th>
              <th className="p-3 text-sm font-medium">Jours</th>
              <th className="p-3 text-sm font-medium">Statut</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id} className="border-t cursor-pointer hover:bg-gray-50" onClick={() => setSelectedRequest(r)}>
                <td className="p-3">{r.employee?.user?.email || 'N/A'}</td>
                <td className="p-3">{r.leaveType?.name}</td>
                <td className="p-3 text-sm">{new Date(r.startDate).toLocaleDateString()} - {new Date(r.endDate).toLocaleDateString()}</td>
                <td className="p-3">{r.duration}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[r.status]}`}>
                    {statusLabels[r.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedRequest && (
        <RequestDetailModal
          request={selectedRequest}
          type="leave"
          role={role || ''}
          onClose={() => setSelectedRequest(null)}
          onRefresh={loadRequests}
        />
      )}
    </div>
  );
}
