import { useEffect, useState } from 'react';
import api from '../../lib/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input, { Select, Textarea } from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { statusBadge, priorityBadge } from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';
import { HelpCircle, Plus } from 'lucide-react';
import { format } from 'date-fns';

const CATEGORIES = ['academic', 'career', 'skill', 'college', 'financial', 'general'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

export default function SupportRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const blank = { category: 'general', title: '', description: '', priority: 'medium' };
  const [form, setForm] = useState(blank);

  const fetch = () => {
    api.get('/support-requests/my')
      .then(({ data }) => setRequests(data.data || data || []))
      .catch(() => toast.error('Failed to load support requests'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/support-requests', form);
      toast.success('Support request submitted!');
      setShowModal(false);
      setForm(blank);
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setSaving(false);
    }
  };

  const cancel = async (id) => {
    if (!confirm('Cancel this support request?')) return;
    try {
      await api.delete(`/support-requests/${id}`);
      toast.success('Request cancelled');
      setRequests((prev) => prev.filter((r) => r._id !== id));
    } catch { toast.error('Failed to cancel request'); }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex justify-end">
        <Button onClick={() => setShowModal(true)} size="sm" className="gap-2"><Plus size={15} /> New Request</Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-[#AAFF00] border-t-transparent rounded-full animate-spin" /></div>
      ) : requests.length === 0 ? (
        <EmptyState icon={HelpCircle} title="No support requests" description="Raise a request if you need help with academics, career, finances and more." action={<Button onClick={() => setShowModal(true)} size="sm" className="gap-2"><Plus size={14} /> New Request</Button>} />
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <Card key={r._id} hover>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    {statusBadge(r.status)}
                    {priorityBadge(r.priority)}
                    <span className="text-xs text-[#9ca3af] capitalize border border-[#e5e5e5] px-2 py-0.5 rounded-full">{r.category}</span>
                  </div>
                  <h4 className="text-sm font-bold text-[#1a1a1a] mb-1">{r.title}</h4>
                  <p className="text-xs text-[#6b7280] line-clamp-2">{r.description}</p>
                  {r.assignedCoordinator && (
                    <p className="text-xs text-[#9ca3af] mt-2">Assigned to coordinator</p>
                  )}
                  {r.resolutionNotes && (
                    <div className="mt-2 p-2.5 bg-[#f5f5f0] rounded-lg">
                      <p className="text-xs font-medium text-[#1a1a1a]">Resolution:</p>
                      <p className="text-xs text-[#6b7280]">{r.resolutionNotes}</p>
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-[#9ca3af]">{format(new Date(r.createdAt), 'dd MMM yyyy')}</p>
                  {r.status === 'pending' && (
                    <button onClick={() => cancel(r._id)} className="mt-2 text-xs text-red-400 hover:text-red-600 transition-colors">Cancel</button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Support Request">
        <form onSubmit={submit} className="space-y-4">
          <Input label="Title *" placeholder="Brief description of your issue" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </Select>
            <Select label="Priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              {PRIORITIES.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </Select>
          </div>
          <Textarea label="Description *" placeholder="Describe your issue in detail…" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Submit Request</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
