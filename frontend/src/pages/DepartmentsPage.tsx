import { useEffect, useState } from 'react';
import api from '../services/api';
import type { Department } from '../types';

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    api.get('/departments').then((res) => setDepartments(res.data));
  }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/departments', { name, description });
    setName('');
    setDescription('');
    api.get('/departments').then((res) => setDepartments(res.data));
  };

  const remove = async (id: number) => {
    await api.delete(`/departments/${id}`);
    api.get('/departments').then((res) => setDepartments(res.data));
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Départements</h1>

      <form onSubmit={create} className="flex gap-2 mb-6">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nom du département"
          required
          className="px-3 py-2 border rounded flex-1"
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optionnelle)"
          className="px-3 py-2 border rounded flex-1"
        />
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Ajouter
        </button>
      </form>

      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="p-3 text-sm font-medium">Nom</th>
              <th className="p-3 text-sm font-medium">Description</th>
              <th className="p-3 text-sm font-medium">Services</th>
              <th className="p-3 text-sm font-medium">Employés</th>
              <th className="p-3 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {departments.map((d) => (
              <tr key={d.id} className="border-t">
                <td className="p-3 font-medium">{d.name}</td>
                <td className="p-3 text-gray-500">{d.description || '-'}</td>
                <td className="p-3">{d.services?.length || 0}</td>
                <td className="p-3">{d._count?.employees || 0}</td>
                <td className="p-3">
                  <button onClick={() => remove(d.id)} className="text-red-600 hover:text-red-800 text-sm">
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
