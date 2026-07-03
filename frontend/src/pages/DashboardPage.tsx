import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import type {
  DashboardAdmin,
  DashboardHr,
  DashboardDirector,
  DashboardEmployee,
} from '../types';

type DashboardData = DashboardAdmin | DashboardHr | DashboardDirector | DashboardEmployee;

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const role = user?.role?.name || '';

  useEffect(() => {
    api.get('/dashboard').then((res) => setData(res.data));
  }, []);

  if (!data) {
    return <div className="text-gray-500">Chargement...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Tableau de bord</h1>

      {role === 'ADMIN' && <AdminDashboard data={data as DashboardAdmin} />}
      {role === 'HR' && <HrDashboard data={data as DashboardHr} />}
      {role === 'DIRECTOR' && <DirectorDashboard data={data as DashboardDirector} />}
      {role === 'EMPLOYEE' && <EmployeeDashboard data={data as DashboardEmployee} />}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className={`p-4 rounded-lg shadow text-white ${color}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm opacity-90">{label}</p>
    </div>
  );
}

function AdminDashboard({ data }: { data: DashboardAdmin }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard label="Utilisateurs" value={data.users} color="bg-blue-600" />
      <StatCard label="Employés" value={data.employees} color="bg-green-600" />
      <StatCard label="Départements" value={data.departments} color="bg-purple-600" />
      <StatCard label="Services" value={data.services} color="bg-indigo-600" />
      <StatCard label="Types de congés" value={data.leaveTypes} color="bg-teal-600" />
      <StatCard label="Demandes en attente" value={data.pendingRequests.total} color="bg-orange-600" />
    </div>
  );
}

function HrDashboard({ data }: { data: DashboardHr }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard label="Congés à examiner" value={data.toReview.leave} color="bg-blue-600" />
      <StatCard label="Permissions à examiner" value={data.toReview.permission} color="bg-purple-600" />
      <StatCard label="Total à examiner" value={data.toReview.total} color="bg-orange-600" />
      <StatCard label="Total congés traités" value={data.totalProcessed.leave} color="bg-green-600" />
      <StatCard label="Total permissions traitées" value={data.totalProcessed.permission} color="bg-teal-600" />
    </div>
  );
}

function DirectorDashboard({ data }: { data: DashboardDirector }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard label="Congés à décider" value={data.toDecide.leave} color="bg-blue-600" />
      <StatCard label="Permissions à décider" value={data.toDecide.permission} color="bg-purple-600" />
      <StatCard label="Total à décider" value={data.toDecide.total} color="bg-orange-600" />
      <StatCard label="Approuvés" value={data.decisions.approved} color="bg-green-600" />
      <StatCard label="Refusés" value={data.decisions.rejected} color="bg-red-600" />
    </div>
  );
}

function EmployeeDashboard({ data }: { data: DashboardEmployee }) {
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard label="Demandes en attente" value={data.pendingRequests.total} color="bg-orange-600" />
        <StatCard label="Congés" value={data.pendingRequests.leave} color="bg-blue-600" />
        <StatCard label="Permissions" value={data.pendingRequests.permission} color="bg-purple-600" />
      </div>

      <h2 className="text-lg font-semibold mb-3">Mes soldes de congés</h2>
      <div className="overflow-x-auto">
        <table className="w-full bg-white rounded-lg shadow">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="p-3 text-sm font-medium">Type</th>
              <th className="p-3 text-sm font-medium">Année</th>
              <th className="p-3 text-sm font-medium">Total</th>
              <th className="p-3 text-sm font-medium">Utilisé</th>
              <th className="p-3 text-sm font-medium">En attente</th>
              <th className="p-3 text-sm font-medium">Restant</th>
            </tr>
          </thead>
          <tbody>
            {data.balances.map((b, i) => (
              <tr key={i} className="border-t">
                <td className="p-3">{b.type}</td>
                <td className="p-3">{b.year}</td>
                <td className="p-3">{b.total}</td>
                <td className="p-3">{b.used}</td>
                <td className="p-3">{b.pending}</td>
                <td className="p-3 font-semibold">{b.remaining}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
