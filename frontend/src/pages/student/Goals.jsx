import { useEffect, useState } from 'react';
import api from '../../lib/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input, { Select, Textarea } from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { statusBadge } from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import ProgressBar from '../../components/ui/ProgressBar';
import toast from 'react-hot-toast';
import { Edit2, Plus, Target, Trash2, Check } from 'lucide-react';
import { format } from 'date-fns';

const CATEGORIES = ['academic', 'skill', 'career', 'personal'];
const STATUSES = ['pending', 'in_progress', 'completed', 'deferred', 'cancelled'];

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const blank = { title: '', description: '', category: 'academic', targetDate: '', status: 'pending', milestones: [] };
  const [form, setForm] = useState(blank);
  const [milestoneText, setMilestoneText] = useState('');

  const fetch = () => {
    api.get('/students/me/goals')
      .then(({ data }) => setGoals(data.data || data || []))
      .catch(() => toast.error('Failed to load goals'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const openCreate = () => { setEditing(null); setForm(blank); setMilestoneText(''); setShowModal(true); };
  const openEdit = (g) => {
    setEditing(g._id);
    setForm({ title: g.title, description: g.description || '', category: g.category, targetDate: g.targetDate?.slice(0, 10) || '', status: g.status, milestones: g.milestones || [] });
    setMilestoneText('');
    setShowModal(true);
  };

  const addMilestone = () => {
    if (!milestoneText.trim()) return;
    setForm((f) => ({ ...f, milestones: [...f.milestones, { title: milestoneText.trim(), isCompleted: false }] }));
    setMilestoneText('');
  };

  const toggleMilestone = (i) => {
    setForm((f) => ({ ...f, milestones: f.milestones.map((m, idx) => idx === i ? { ...m, isCompleted: !m.isCompleted } : m) }));
  };

  const removeMilestone = (i) => setForm((f) => ({ ...f, milestones: f.milestones.filter((_, idx) => idx !== i) }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) await api.put(`/students/me/goals/${editing}`, form);
      else await api.post('/students/me/goals', form);
      toast.success(editing ? 'Goal updated!' : 'Goal created!');
      setShowModal(false);
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save goal');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this goal?')) return;
    try {
      await api.delete(`/students/me/goals/${id}`);
      toast.success('Goal deleted');
      setGoals((prev) => prev.filter((g) => g._id !== id));
    } catch { toast.error('Failed to delete goal'); }
  };

  const catColor = { academic: 'blue', skill: 'orange', career: 'green', personal: 'purple' };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-end">
        <Button onClick={openCreate} size="sm" className="gap-2"><Plus size={15} /> Add Goal</Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-[#AAFF00] border-t-transparent rounded-full animate-spin" /></div>
      ) : goals.length === 0 ? (
        <EmptyState icon={Target} title="No goals yet" description="Set goals with milestones to stay on track." action={<Button onClick={openCreate} size="sm" className="gap-2"><Plus size={14} /> Add Goal</Button>} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((g) => (
            <Card key={g._id} hover>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#1a1a1a] mb-1">{g.title}</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${catColor[g.category] === 'blue' ? 'bg-blue-50 text-blue-600' : catColor[g.category] === 'orange' ? 'bg-orange-50 text-orange-600' : catColor[g.category] === 'green' ? 'bg-emerald-50 text-emerald-600' : 'bg-purple-50 text-purple-600'}`}>{g.category}</span>
                    {statusBadge(g.status)}
                  </div>
                </div>
                <div className="flex gap-1 ml-2">
                  <button onClick={() => openEdit(g)} className="p-1.5 rounded-lg hover:bg-[#f0f0f0]"><Edit2 size={12} className="text-[#6b7280]" /></button>
                  <button onClick={() => remove(g._id)} className="p-1.5 rounded-lg hover:bg-red-50"><Trash2 size={12} className="text-red-400" /></button>
                </div>
              </div>

              {g.description && <p className="text-xs text-[#6b7280] mb-3 line-clamp-2">{g.description}</p>}

              <ProgressBar value={g.progress} />

              {g.milestones?.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {g.milestones.slice(0, 3).map((m, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${m.isCompleted ? 'bg-[#AAFF00] border-[#AAFF00]' : 'border-[#d1d1d1]'}`}>
                        {m.isCompleted && <Check size={10} className="text-[#1a1a1a]" />}
                      </div>
                      <span className={`text-xs ${m.isCompleted ? 'line-through text-[#9ca3af]' : 'text-[#6b7280]'}`}>{m.title}</span>
                    </div>
                  ))}
                  {g.milestones.length > 3 && <p className="text-xs text-[#9ca3af]">+{g.milestones.length - 3} more</p>}
                </div>
              )}

              {g.targetDate && <p className="text-xs text-[#9ca3af] mt-3">Due {format(new Date(g.targetDate), 'dd MMM yyyy')}</p>}
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Goal' : 'Create Goal'} size="lg">
        <form onSubmit={submit} className="space-y-4">
          <Input label="Goal Title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What does success look like?" />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </Select>
            <Input label="Target Date *" type="date" value={form.targetDate} onChange={(e) => setForm({ ...form, targetDate: e.target.value })} required />
          </div>
          {editing && (
            <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </Select>
          )}
          {/* Milestones */}
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">Milestones</label>
            <div className="flex gap-2 mb-2">
              <input className="flex-1 px-3 py-2 border border-[#e5e5e5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#AAFF00]" placeholder="Add a milestone…" value={milestoneText} onChange={(e) => setMilestoneText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addMilestone())} />
              <Button type="button" variant="outline" size="sm" onClick={addMilestone}>Add</Button>
            </div>
            {form.milestones.map((m, i) => (
              <div key={i} className="flex items-center gap-2 py-1.5 px-3 bg-[#fafafa] rounded-lg mb-1">
                <button type="button" onClick={() => toggleMilestone(i)} className={`w-4 h-4 rounded-full border flex items-center justify-center ${m.isCompleted ? 'bg-[#AAFF00] border-[#AAFF00]' : 'border-[#d1d1d1]'}`}>
                  {m.isCompleted && <Check size={10} className="text-[#1a1a1a]" />}
                </button>
                <span className={`flex-1 text-xs ${m.isCompleted ? 'line-through text-[#9ca3af]' : 'text-[#1a1a1a]'}`}>{m.title}</span>
                <button type="button" onClick={() => removeMilestone(i)} className="text-red-400 hover:text-red-600"><Trash2 size={12} /></button>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editing ? 'Save Changes' : 'Create Goal'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
