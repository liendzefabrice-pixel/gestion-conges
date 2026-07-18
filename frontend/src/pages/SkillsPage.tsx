import { useEffect, useState } from 'react'
import api from '../services/api'
import { Button } from '../components/ui/button'
import Tooltip from '../components/ui/tooltip'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { PageHeader } from '../components/ui/page-header'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog'
import { Label } from '../components/ui/label'
import { X, Pencil, Trash2 } from 'lucide-react'

interface Skill {
  id: number
  name: string
  description: string | null
  employeeCount: number
}

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [editSkill, setEditSkill] = useState<Skill | null>(null)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', description: '' })

  const load = () => {
    api.get('/skills').then((res) => setSkills(res.data))
  }

  useEffect(() => { load() }, [])

  const resetForm = () => setForm({ name: '', description: '' })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await api.post('/skills', form)
      resetForm()
      setShowCreate(false)
      load()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur')
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editSkill) return
    setError('')
    try {
      await api.patch(`/skills/${editSkill.id}`, form)
      setEditSkill(null)
      resetForm()
      load()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette compétence ?')) return
    try {
      await api.delete(`/skills/${id}`)
      load()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur')
    }
  }

  return (
    <div>
      <PageHeader
        title="Compétences"
        description="Gérez les compétences des employés"
        actions={
          <Button onClick={() => { resetForm(); setShowCreate(true) }}>
            Nouvelle compétence
          </Button>
        }
      />

      {error && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="p-3 text-sm text-red-700 bg-red-50 rounded-lg border border-red-200">{error}</div>
          </CardContent>
        </Card>
      )}

      {showCreate && (
        <Card className="mb-6 animate-fade-in">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Nouvelle compétence</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)}>
                <X className="size-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} required placeholder="Ex: Management" />
              </div>
              <div className="space-y-2">
                <Label>Description (optionnelle)</Label>
                <Input value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Description" />
              </div>
              <Button type="submit">Créer</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!editSkill} onOpenChange={(open) => { if (!open) { setEditSkill(null); resetForm() } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la compétence</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label>Nom</Label>
              <Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label>Description (optionnelle)</Label>
              <Input value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <DialogFooter>
              <Button type="submit">Enregistrer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
          {skills.map((s) => (
            <TableRow key={s.id}>
              <TableCell className="font-medium">{s.name}</TableCell>
              <TableCell className="text-muted-foreground">{s.description || '—'}</TableCell>
              <TableCell>{s.employeeCount}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Tooltip content="Modifier">
                    <Button variant="ghost" size="sm" onClick={() => { setEditSkill(s); setForm({ name: s.name, description: s.description || '' }) }}>
                      <Pencil className="size-4" />
                    </Button>
                  </Tooltip>
                  <Tooltip content="Supprimer">
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(s.id)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </Tooltip>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {skills.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">Aucune compétence</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
