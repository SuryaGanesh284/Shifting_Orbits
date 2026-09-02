import { useEffect, useState } from 'react';
import api from '../../lib/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input, { Select, Textarea } from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { statusBadge, priorityBadge } from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';
import { Check, ClipboardList, Plus, Edit2 } from 'lucide-react';
import { format } from 'date-fns';

const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const FILTER_TABS = ['All', 'Today', 'Overdue', 'Pending'];

export default function FollowUps() {
  const [followups, setFollowups] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showCompleteModal, setShowCompleteModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');
  const blank = { studentId: '', title: '', description: '', dueDate: '', priority: 'medium' };
  const [form, setForm] = useState(blank);

  const fetchAll = async () => {
    const endpoint = activeTab === 'Today' ? '/followups/today' : activeTab === 'Overdue' ? '/followups/overdue' : '/followups';
    const [fa, sa] = await Promise.all([
      api.get(endpoint).catch(() => ({ data: [] })),
      api.get('/coordinator/students').catch(() => ({ data: [] })),
    ]);
    let data = fa.data?.data || fa.data || [];
    if (activeTab === 'Pending') data = data.filter((f) => f.status === 'pending' || f.status === 'in_progress');
    setFollowups(data);
    setStudents(sa.data?.data || sa.data || []);
    setLoading(false);
  };

  useEffect(() => { setLoading(true); fetchAll(); }, [activeTab]);

  const openCreate = () => { setEditing(null); setForm(blank); setShowModal(true); };
  const openEdit = (f) => {
    setEditing(f._id);
    setForm({ studentId: f.studentId?._id || f.studentId || '', title: f.title, description: f.description || '', dueDate: f.dueDate?.slice(0, 10) || '', priority: f.priority });
    setShowModal(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) await api.put(`/followups/${editing}`, form);
      else await api.post('/followups', form);
      toast.success(editing ? 'Follow-up updated!' : 'Follow-up created!');
      setShowModal(false);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const complete = async () => {
    setSaving(true);
    try {
      await api.post(`/followups/${showCompleteModal}/complete`, { completionNotes });
      toast.success('Marked as completed!');
      setShowCompleteModal(null);
      setCompletionNotes('');
      fetchAll();
    } catch { toast.error('Failed to complete'); }
    finally { setSaving(false); }
  };

  const studentName = (s) => s?.name || s?.user?.name || 'Student';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 p-1 bg-[#f5f5f0] rounded-xl">
          {FILTER_TABS.map((t) => (
            <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === t ? 'bg-white text-[#1a1a1a] shadow-sm' : 'text-[#6b7280] hover:text-[#1a1a1a]'}`}>{t}</button>
          ))}
        </div>
        <Button onClick={openCreate} size="sm" className="gap-2"><Plus size={15} /> Add Follow-up</Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-[#AAFF00] border-t-transparent rounded-full animate-spin" /></div>
      ) : followups.length === 0 ? (
        <EmptyState icon={ClipboardList} title={`No ${activeTab.toLowerCase()} follow-ups`} description="Create follow-ups to stay on top of student check-ins." action={<Button onClick={openCreate} size="sm" className="gap-2"><Plus size={14} /> Add</Button>} />
      ) : (
        <div className="space-y-3">
          {followups.map((f) => (
            <Card key={f._id} hover>
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${f.status === 'completed' ? 'bg-[#AAFF00]/20' : f.status === 'overdue' ? 'bg-red-50' : 'bg-[#f5f5f0]'}`}>
                    <ClipboardList size={15} className={f.status === 'completed' ? 'text-[#3a6e00]' : f.status === 'overdue' ? 'text-red-500' : 'text-[#1a1a1a]'} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1a1a1a] mb-1">{f.title}</p>
                    <div className="flex items-center gap-2">
                      {statusBadge(f.status)}
                      {priorityBadge(f.priority)}
                      <span className="text-xs text-[#6b7280]">{studentName(f.studentId)}</span>
                    </div>
                    {f.description && <p className="text-xs text-[#6b7280] mt-1.5">{f.description}</p>}
                    {f.completionNotes && <p className="text-xs text-emerald-600 mt-1.5 italic">{f.completionNotes}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <p className="text-xs text-[#9ca3af]">{f.dueDate ? format(new Date(f.dueDate), 'dd MMM') : ''}</p>
                  {f.status !== 'completed' && f.status !== 'cancelled' && (
                    <>
                      <button onClick={() => openEdit(f)} className="p-1.5 rounded-lg hover:bg-[#f0f0f0]"><Edit2 size={13} className="text-[#6b7280]" /></button>
                      <button onClick={() => setShowCompleteModal(f._id)} className="p-1.5 rounded-lg hover:bg-[#AAFF00]/20" title="Mark complete"><Check size={13} className="text-[#3a6e00]" /></button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Follow-up' : 'New Follow-up'}>
        <form onSubmit={submit} className="space-y-4">
          <Select label="Student *" value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} required>
            <option value="">Select a student…</option>
            {students.map((s) => {
              const sid = s._id || s.student?._id;
              return <option key={sid} value={sid}>{studentName(s)}</option>;
            })}
          </Select>
          <Input label="Title *" placeholder="What needs to be followed up?" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <Textarea label="Description" placeholder="Additional details…" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Due Date *" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} required />
            <Select label="Priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              {PRIORITIES.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </Select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editing ? 'Save Changes' : 'Create'}</Button>
          </div>
        </form>
      </Modal>

      {/* Complete Modal */}
      <Modal isOpen={!!showCompleteModal} onClose={() => setShowCompleteModal(null)} title="Mark as Completed" size="sm">
        <div className="space-y-4">
          <Textarea label="Completion Notes" placeholder="How was it resolved?" value={completionNotes} onChange={(e) => setCompletionNotes(e.target.value)} />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setShowCompleteModal(null)}>Cancel</Button>
            <Button onClick={complete} loading={saving} variant="lime">Mark Complete</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
