import { useEffect, useState } from 'react';
import api from '../services/api';
import type { Department } from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { PageHeader } from '../components/ui/page-header';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../components/ui/table';
import { Plus, Trash2 } from 'lucide-react';

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    api.get('/departments').then((res) => setDepartments(res.data));
  }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/departments', { name, description });
    setName('');
    setDescription('');
    setShowForm(false);
    api.get('/departments').then((res) => setDepartments(res.data));
  };

  const remove = async (id: number) => {
    await api.delete(`/departments/${id}`);
    api.get('/departments').then((res) => setDepartments(res.data));
  };

  return (
    <div>
      <PageHeader
        title="Départements"
        description="Gérez les départements de l'entreprise"
        actions={
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="size-4" />
            Nouveau département
          </Button>
        }
      />

      {showForm && (
        <Card className="mb-6 animate-fade-in">
          <CardContent>
            <form onSubmit={create} className="flex gap-3">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nom du département"
                className="flex-1"
              />
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optionnelle)"
                className="flex-1"
              />
              <Button type="submit">Ajouter</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Employés</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {departments.map((d) => (
            <TableRow key={d.id}>
              <TableCell className="font-medium">{d.name}</TableCell>
              <TableCell className="text-muted-foreground">{d.description || '-'}</TableCell>
              <TableCell>{d._count?.employees || 0}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" onClick={() => remove(d.id)} className="text-destructive hover:text-destructive">
                  <Trash2 className="size-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {departments.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">Aucun département</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
