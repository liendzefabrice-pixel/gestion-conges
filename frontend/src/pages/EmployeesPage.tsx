import { useEffect, useState } from 'react';
import api from '../services/api';
import type { Employee, Department } from '../types';
import { PasswordInput } from '../components/ui/password-input';

function computeSeniority(hireDate: string): string {
  const now = new Date();
  const hire = new Date(hireDate);
  const diff = now.getTime() - hire.getTime();
  const years = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
  return `${years} an${years > 1 ? 's' : ''}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR');
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<(Employee & { seniority?: string })[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState('');

  const initForm = () => ({
    matricule: '', firstName: '', lastName: '', email: '', password: '',
    position: '', hireDate: '', departmentId: '',
  });
  const [form, setForm] = useState(initForm());

  const load = () => {
    api.get('/employees').then((res) => {
      const list = res.data.map((e: Employee) => ({ ...e, seniority: computeSeniority(e.hireDate) }));
      setEmployees(list);
    });
    api.get('/departments').then((res) => setDepartments(res.data));
  };

  useEffect(() => { load(); }, []);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const createEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/employees', {
        matricule: form.matricule,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password || form.email,
        position: form.position,
        hireDate: form.hireDate,
        departmentId: Number(form.departmentId),
      });
      setForm(initForm());
      setShowCreate(false);
      load();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la création');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Employés</h1>
        <button onClick={() => setShowCreate(!showCreate)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          {showCreate ? 'Annuler' : 'Nouvel employé'}
        </button>
      </div>

      {showCreate && (
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-3">Nouvel employé</h2>
          {error && <p className="text-red-600 bg-red-50 p-3 rounded mb-4 text-sm">{error}</p>}
          <form onSubmit={createEmployee} className="grid grid-cols-2 gap-3">
            <input value={form.matricule} onChange={(e) => handleChange('matricule', e.target.value)} placeholder="Matricule" required className="px-3 py-2 border rounded" />
            <input value={form.firstName} onChange={(e) => handleChange('firstName', e.target.value)} placeholder="Prénom" required className="px-3 py-2 border rounded" />
            <input value={form.lastName} onChange={(e) => handleChange('lastName', e.target.value)} placeholder="Nom" required className="px-3 py-2 border rounded" />
            <input value={form.email} onChange={(e) => handleChange('email', e.target.value)} placeholder="Email" required type="email" className="px-3 py-2 border rounded" />
            <PasswordInput value={form.password} onChange={(e) => handleChange('password', e.target.value)} placeholder="Mot de passe (optionnel)" containerClassName="col-span-1" />
            <input value={form.position} onChange={(e) => handleChange('position', e.target.value)} placeholder="Poste" required className="px-3 py-2 border rounded" />
            <input value={form.hireDate} onChange={(e) => handleChange('hireDate', e.target.value)} required type="date" className="px-3 py-2 border rounded" />
            <select value={form.departmentId} onChange={(e) => handleChange('departmentId', e.target.value)} required className="px-3 py-2 border rounded">
              <option value="">Département</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <div className="col-span-2">
              <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Créer</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="p-3 text-sm font-medium">Matricule</th>
              <th className="p-3 text-sm font-medium">Noms</th>
              <th className="p-3 text-sm font-medium">Prénoms</th>
              <th className="p-3 text-sm font-medium">Poste</th>
              <th className="p-3 text-sm font-medium">Département</th>
              <th className="p-3 text-sm font-medium">Date d'embauche</th>
              <th className="p-3 text-sm font-medium">Ancienneté</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((e) => (
              <tr key={e.id} className="border-t">
                <td className="p-3 font-mono text-sm">{e.matricule}</td>
                <td className="p-3 font-medium">{e.lastName}</td>
                <td className="p-3">{e.firstName}</td>
                <td className="p-3 text-gray-600">{e.position}</td>
                <td className="p-3 text-gray-600">{e.department?.name}</td>
                <td className="p-3 text-gray-600">{formatDate(e.hireDate)}</td>
                <td className="p-3 text-gray-600">{e.seniority}</td>
              </tr>
            ))}
            {employees.length === 0 && (
              <tr>
                <td colSpan={7} className="p-3 text-center text-gray-500">Aucun employé</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
