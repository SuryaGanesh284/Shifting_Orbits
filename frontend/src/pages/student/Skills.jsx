import { useEffect, useState } from 'react';
import api from '../../lib/api';
import Card, { CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input, { Select } from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';
import { Edit2, Plus, Star, Trash2 } from 'lucide-react';

const CATEGORIES = ['technical', 'soft', 'domain', 'language'];
const LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'];
const levelColor = { beginner: 'gray', intermediate: 'blue', advanced: 'orange', expert: 'green' };

export default function Skills() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const blank = { name: '', category: 'technical', level: 'beginner' };
  const [form, setForm] = useState(blank);

  const fetch = () => {
    api.get('/students/me/skills')
      .then(({ data }) => setSkills(data.data || data || []))
      .catch(() => toast.error('Failed to load skills'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const openCreate = () => { setEditing(null); setForm(blank); setShowModal(true); };
  const openEdit = (s) => { setEditing(s._id); setForm({ name: s.name, category: s.category, level: s.level }); setShowModal(true); };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) await api.put(`/students/me/skills/${editing}`, form);
      else await api.post('/students/me/skills', form);
      toast.success(editing ? 'Skill updated!' : 'Skill added!');
      setShowModal(false);
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save skill');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this skill?')) return;
    try {
      await api.delete(`/students/me/skills/${id}`);
      toast.success('Skill removed');
      setSkills((prev) => prev.filter((s) => s._id !== id));
    } catch {
      toast.error('Failed to delete skill');
    }
  };

  const grouped = CATEGORIES.reduce((acc, c) => {
    acc[c] = skills.filter((s) => s.category === c);
    return acc;
  }, {});

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-end">
        <Button onClick={openCreate} size="sm" className="gap-2"><Plus size={15} /> Add Skill</Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-[#AAFF00] border-t-transparent rounded-full animate-spin" /></div>
      ) : skills.length === 0 ? (
        <EmptyState icon={Star} title="No skills yet" description="Add skills to showcase your abilities and improve AI career matches." action={<Button onClick={openCreate} size="sm" className="gap-2"><Plus size={14} /> Add Skill</Button>} />
      ) : (
        CATEGORIES.filter((c) => grouped[c].length > 0).map((cat) => (
          <Card key={cat}>
            <CardHeader title={cat.charAt(0).toUpperCase() + cat.slice(1)} subtitle={`${grouped[cat].length} skill${grouped[cat].length !== 1 ? 's' : ''}`} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {grouped[cat].map((s) => (
                <div key={s._id} className="flex items-center justify-between p-3 bg-[#fafafa] rounded-xl border border-[#f0f0f0]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#f5f5f0] flex items-center justify-center">
                      <Star size={14} className="text-[#1a1a1a]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1a1a1a]">{s.name}</p>
                      <Badge color={levelColor[s.level]}>{s.level}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-[#f0f0f0] transition-colors"><Edit2 size={13} className="text-[#6b7280]" /></button>
                    <button onClick={() => remove(s._id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"><Trash2 size={13} className="text-red-400" /></button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Skill' : 'Add Skill'}>
        <form onSubmit={submit} className="space-y-4">
          <Input label="Skill Name *" placeholder="e.g. Python, Communication…" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Select label="Category *" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </Select>
          <Select label="Level *" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
            {LEVELS.map((l) => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
          </Select>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editing ? 'Save Changes' : 'Add Skill'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
