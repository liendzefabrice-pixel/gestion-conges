import { useEffect, useState } from 'react';
import api from '../services/api';
import type { Employee, Department } from '../types';
import { PasswordInput } from '../components/ui/password-input';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '',
    position: '', hireDate: '', departmentId: '', serviceId: '',
  });
  const [services, setServices] = useState<{ id: number; name: string; departmentId: number }[]>([]);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadEmployees = () => api.get('/employees').then((res) => setEmployees(res.data));

  useEffect(() => {
    loadEmployees();
    api.get('/departments').then((res) => {
      setDepartments(res.data);
      const allServices = res.data.flatMap((d: Department) => d.services || []);
      setServices(allServices);
    });
  }, []);

  const handleChange = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const createEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const pwd = form.password || `${form.firstName.toLowerCase()}.${form.lastName.toLowerCase()}123`;
    try {
      await api.post('/employees', {
        ...form,
        password: pwd,
        departmentId: Number(form.departmentId),
        serviceId: form.serviceId ? Number(form.serviceId) : undefined,
        hireDate: form.hireDate,
      });
      setTempPassword(pwd);
      setForm({ firstName: '', lastName: '', email: '', password: '', position: '', hireDate: '', departmentId: '', serviceId: '' });
      loadEmployees();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la création');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Employés</h1>
        <button onClick={() => setShowCreate(!showCreate)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Créer un employé
        </button>
      </div>

      {showCreate && (
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-3">Nouvel employé</h2>
          {error && <p className="text-red-600 bg-red-50 p-3 rounded mb-4 text-sm">{error}</p>}
          <form onSubmit={createEmployee} className="grid grid-cols-2 gap-3">
            <input value={form.firstName} onChange={(e) => handleChange('firstName', e.target.value)} placeholder="Prénom" required className="px-3 py-2 border rounded" />
            <input value={form.lastName} onChange={(e) => handleChange('lastName', e.target.value)} placeholder="Nom" required className="px-3 py-2 border rounded" />
            <input value={form.email} onChange={(e) => handleChange('email', e.target.value)} placeholder="Email" required type="email" className="px-3 py-2 border rounded" />
            <PasswordInput value={form.password} onChange={(e) => handleChange('password', e.target.value)} placeholder="Mot de passe (optionnel)" />
            <input value={form.position} onChange={(e) => handleChange('position', e.target.value)} placeholder="Poste" required className="px-3 py-2 border rounded" />
            <input value={form.hireDate} onChange={(e) => handleChange('hireDate', e.target.value)} required type="date" className="px-3 py-2 border rounded" />
            <select value={form.departmentId} onChange={(e) => handleChange('departmentId', e.target.value)} required className="px-3 py-2 border rounded">
              <option value="">Département</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <select value={form.serviceId} onChange={(e) => handleChange('serviceId', e.target.value)} className="px-3 py-2 border rounded">
              <option value="">Service (optionnel)</option>
              {services.filter((s) => s.departmentId === Number(form.departmentId)).map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <div className="col-span-2">
              <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Créer</button>
            </div>
          </form>

          {tempPassword && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="font-semibold text-sm">Mot de passe temporaire :</p>
              <p className="text-lg font-mono font-bold text-yellow-800">{tempPassword}</p>
              <p className="text-xs text-gray-500 mt-1">L'employé devra changer son mot de passe à la première connexion.</p>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="p-3 text-sm font-medium">Nom</th>
              <th className="p-3 text-sm font-medium">Email</th>
              <th className="p-3 text-sm font-medium">Poste</th>
              <th className="p-3 text-sm font-medium">Département</th>
              <th className="p-3 text-sm font-medium">Date d'embauche</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((e) => (
              <tr key={e.id} className="border-t">
                <td className="p-3 font-medium">{e.firstName} {e.lastName}</td>
                <td className="p-3 text-gray-500">{e.user.email}</td>
                <td className="p-3">{e.position}</td>
                <td className="p-3">{e.department.name}</td>
                <td className="p-3">{new Date(e.hireDate).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
