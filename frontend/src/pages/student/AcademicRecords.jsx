import { useEffect, useState } from 'react';
import api from '../../lib/api';
import Card, { CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input, { Select } from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';
import { BookOpen, Plus } from 'lucide-react';
import { format } from 'date-fns';

const TERMS = ['Term 1', 'Term 2', 'Annual', 'Semester 1', 'Semester 2'];

export default function AcademicRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ academicYear: '', grade: '', term: 'Term 1', subject: '', score: '', maxScore: 100, attendance: 90, remarks: '' });

  const fetch = () => {
    api.get('/students/me/academic-records')
      .then(({ data }) => setRecords(data.data || data || []))
      .catch(() => toast.error('Failed to load records'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/students/me/academic-records', {
        ...form,
        score: Number(form.score),
        maxScore: Number(form.maxScore),
        attendance: Number(form.attendance),
      });
      toast.success('Record added!');
      setShowModal(false);
      setForm({ academicYear: '', grade: '', term: 'Term 1', subject: '', score: '', maxScore: 100, attendance: 90, remarks: '' });
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add record');
    } finally {
      setSaving(false);
    }
  };

  // Group by academic year
  const grouped = records.reduce((acc, r) => {
    const yr = r.academicYear || 'Unknown Year';
    if (!acc[yr]) acc[yr] = [];
    acc[yr].push(r);
    return acc;
  }, {});

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div />
        <Button onClick={() => setShowModal(true)} className="gap-2" size="sm">
          <Plus size={15} /> Add Record
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-[#AAFF00] border-t-transparent rounded-full animate-spin" /></div>
      ) : records.length === 0 ? (
        <EmptyState icon={BookOpen} title="No academic records yet" description="Add your grades and attendance to track your academic progress." action={<Button onClick={() => setShowModal(true)} size="sm" className="gap-2"><Plus size={14} /> Add Record</Button>} />
      ) : (
        Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a)).map(([year, recs]) => (
          <Card key={year}>
            <CardHeader title={year} subtitle={`${recs.length} record${recs.length !== 1 ? 's' : ''}`} />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#f0f0f0]">
                    {['Subject', 'Term', 'Grade', 'Score', 'Attendance', 'Date'].map((h) => (
                      <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-[#6b7280] uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recs.map((r) => {
                    const pct = Math.round((r.score / r.maxScore) * 100);
                    const color = pct >= 75 ? 'text-emerald-600' : pct >= 50 ? 'text-yellow-600' : 'text-red-500';
                    return (
                      <tr key={r._id} className="border-b border-[#f9f9f9] hover:bg-[#fafafa] transition-colors">
                        <td className="py-3 px-3 font-medium text-[#1a1a1a]">{r.subject}</td>
                        <td className="py-3 px-3 text-[#6b7280]">{r.term}</td>
                        <td className="py-3 px-3 text-[#6b7280]">{r.grade}</td>
                        <td className={`py-3 px-3 font-semibold ${color}`}>{r.score}/{r.maxScore} <span className="text-xs font-normal">({pct}%)</span></td>
                        <td className="py-3 px-3 text-[#6b7280]">{r.attendance}%</td>
                        <td className="py-3 px-3 text-[#9ca3af] text-xs">{r.assessmentDate ? format(new Date(r.assessmentDate), 'dd MMM yy') : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        ))
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Academic Record">
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Academic Year *" placeholder="e.g. 2025-2026" value={form.academicYear} onChange={set('academicYear')} required />
            <Input label="Grade *" placeholder="e.g. Grade 11" value={form.grade} onChange={set('grade')} required />
            <Input label="Subject *" placeholder="e.g. Mathematics" value={form.subject} onChange={set('subject')} required />
            <Select label="Term *" value={form.term} onChange={set('term')}>
              {TERMS.map((t) => <option key={t}>{t}</option>)}
            </Select>
            <Input label="Score *" type="number" min="0" value={form.score} onChange={set('score')} required />
            <Input label="Max Score" type="number" min="1" value={form.maxScore} onChange={set('maxScore')} />
            <Input label="Attendance (%)" type="number" min="0" max="100" value={form.attendance} onChange={set('attendance')} />
            <Input label="Date" type="date" value={form.assessmentDate || ''} onChange={set('assessmentDate')} />
          </div>
          <Input label="Remarks" value={form.remarks} onChange={set('remarks')} placeholder="Optional remarks" />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Add Record</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
