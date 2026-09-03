import { useEffect, useState } from 'react';
import api from '../../lib/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input, { Select, Textarea } from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';
import { Edit2, MessageSquare, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const TYPES = ['in_person', 'call', 'online_meeting', 'center_visit', 'home_visit', 'other'];

export default function Interactions() {
  const [interactions, setInteractions] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const blank = { studentId: '', type: 'in_person', notes: '', concerns: '', actionItems: '', nextFollowUpDate: '' };
  const [form, setForm] = useState(blank);

  const fetchAll = async () => {
    const [ia, sa] = await Promise.all([
      api.get('/interactions').catch(() => ({ data: [] })),
      api.get('/coordinator/students').catch(() => ({ data: [] })),
    ]);
    setInteractions(ia.data?.data || ia.data || []);
    const sList = Array.isArray(sa.data?.data) ? sa.data.data : Array.isArray(sa.data) ? sa.data : [];
    setStudents(sList);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const openCreate = () => { setEditing(null); setForm(blank); setShowModal(true); };
  const openEdit = (i) => {
    setEditing(i._id);
    setForm({ studentId: i.studentId?._id || i.studentId || '', type: i.type, notes: i.notes, concerns: i.concerns?.join(', ') || '', actionItems: i.actionItems?.map((a) => a.description).join(', ') || '', nextFollowUpDate: i.nextFollowUpDate?.slice(0, 10) || '' });
    setShowModal(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        concerns: form.concerns.split(',').map((s) => s.trim()).filter(Boolean),
        actionItems: form.actionItems.split(',').map((s) => s.trim()).filter(Boolean).map((d) => ({ description: d })),
      };
      if (editing) await api.put(`/interactions/${editing}`, payload);
      else await api.post('/interactions', payload);
      toast.success(editing ? 'Interaction updated!' : 'Interaction logged!');
      setShowModal(false);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this interaction?')) return;
    try {
      await api.delete(`/interactions/${id}`);
      toast.success('Deleted');
      setInteractions((prev) => prev.filter((i) => i._id !== id));
    } catch { toast.error('Failed to delete'); }
  };

  const studentName = (s) => {
    if (!s) return 'Student';
    return s.userId?.name || s.name || s.user?.name || s.studentId?.userId?.name || s.studentId?.name || 'Student';
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button onClick={openCreate} size="sm" className="gap-2"><Plus size={15} /> Log Interaction</Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-[#AAFF00] border-t-transparent rounded-full animate-spin" /></div>
      ) : interactions.length === 0 ? (
        <EmptyState icon={MessageSquare} title="No interactions yet" description="Log your student meetings, calls and visits here." action={<Button onClick={openCreate} size="sm" className="gap-2"><Plus size={14} /> Log Interaction</Button>} />
      ) : (
        <div className="space-y-3">
          {interactions.map((i) => (
            <Card key={i._id} hover>
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#f5f5f0] flex items-center justify-center shrink-0">
                    <MessageSquare size={15} className="text-[#1a1a1a]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-[#1a1a1a] capitalize">{i.type?.replace('_', ' ')}</span>
                      <span className="text-xs text-[#9ca3af]">·</span>
                      <span className="text-xs text-[#6b7280]">{studentName(i.studentId)}</span>
                    </div>
                    <p className="text-sm text-[#2d2d2d]">{i.notes}</p>
                    {i.concerns?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {i.concerns.map((c, ci) => <span key={ci} className="text-[10px] bg-red-50 text-red-500 px-2 py-0.5 rounded-full">{c}</span>)}
                      </div>
                    )}
                    {i.nextFollowUpDate && (
                      <p className="text-xs text-[#9ca3af] mt-1.5">Follow-up: {format(new Date(i.nextFollowUpDate), 'dd MMM yyyy')}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <p className="text-xs text-[#9ca3af] mr-2">{i.interactionDate ? format(new Date(i.interactionDate), 'dd MMM') : ''}</p>
                  <button onClick={() => openEdit(i)} className="p-1.5 rounded-lg hover:bg-[#f0f0f0]"><Edit2 size={13} className="text-[#6b7280]" /></button>
                  <button onClick={() => remove(i._id)} className="p-1.5 rounded-lg hover:bg-red-50"><Trash2 size={13} className="text-red-400" /></button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Interaction' : 'Log Interaction'} size="lg">
        <form onSubmit={submit} className="space-y-4">
          <Select label="Student *" value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} required>
            <option value="">Select a student…</option>
            {students.map((s) => {
              const sid = s._id || s.student?._id;
              const name = s.userId?.name || s.name || s.user?.name || s.student?.userId?.name || 'Student';
              const email = s.userId?.email || s.email || s.user?.email || '';
              const prog = s.program || s.student?.program;
              const grade = s.stage || s.student?.stage;
              const tag = [prog, grade].filter(Boolean).join(' · ');
              return (
                <option key={sid} value={sid}>
                  {name} {email ? `(${email})` : ''} {tag ? `— ${tag}` : ''}
                </option>
              );
            })}
          </Select>
          <Select label="Interaction Type *" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
          </Select>
          <Textarea label="Notes *" placeholder="What was discussed?" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} required />
          <Input label="Concerns (comma-separated)" placeholder="e.g. Low attendance, missed goals…" value={form.concerns} onChange={(e) => setForm({ ...form, concerns: e.target.value })} />
          <Input label="Action Items (comma-separated)" placeholder="e.g. Submit assignment, register for course…" value={form.actionItems} onChange={(e) => setForm({ ...form, actionItems: e.target.value })} />
          <Input label="Next Follow-up Date" type="date" value={form.nextFollowUpDate} onChange={(e) => setForm({ ...form, nextFollowUpDate: e.target.value })} />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editing ? 'Save Changes' : 'Log Interaction'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
