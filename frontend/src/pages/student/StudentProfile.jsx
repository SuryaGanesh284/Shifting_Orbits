import { useEffect, useState } from 'react';
import api from '../../lib/api';
import Card, { CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input, { Select } from '../../components/ui/Input';
import ProgressBar from '../../components/ui/ProgressBar';
import toast from 'react-hot-toast';
import { Edit2, Save, X } from 'lucide-react';

const PROGRAMS = ['Sethu', 'Stambha'];
const STAGES = ['Grade 11', 'Grade 12', 'Higher Education', 'Skill Development', 'Internship', 'Employment'];
const BOARDS = ['State Board', 'CBSE', 'ICSE', 'IB', 'Other'];

export default function StudentProfile() {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetch = () => {
    api.get('/students/me')
      .then(({ data }) => {
        const s = data.data || data;
        setProfile(s);
        setForm({
          program: s.program || 'Sethu',
          stage: s.stage || 'Grade 11',
          education: { ...s.education },
          interests: s.interests?.join(', ') || '',
          aspirations: { ...s.aspirations, dreamCompanies: s.aspirations?.dreamCompanies?.join(', ') || '' },
          contact: { ...s.contact },
        });
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        interests: form.interests.split(',').map((s) => s.trim()).filter(Boolean),
        aspirations: { ...form.aspirations, dreamCompanies: form.aspirations.dreamCompanies.split(',').map((s) => s.trim()).filter(Boolean) },
      };
      await api.put('/students/me', payload);
      toast.success('Profile updated!');
      setEditing(false);
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const set = (path, value) => {
    const keys = path.split('.');
    setForm((prev) => {
      const next = { ...prev };
      let cur = next;
      for (let i = 0; i < keys.length - 1; i++) { cur[keys[i]] = { ...cur[keys[i]] }; cur = cur[keys[i]]; }
      cur[keys[keys.length - 1]] = value;
      return next;
    });
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-[#AAFF00] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Profile completion */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-black text-[#1a1a1a]">{profile?.user?.name || 'My Profile'}</h2>
            <p className="text-sm text-[#6b7280]">{profile?.user?.email}</p>
          </div>
          {!editing ? (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="gap-1.5">
              <Edit2 size={14} /> Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)} className="gap-1.5">
                <X size={14} /> Cancel
              </Button>
              <Button size="sm" loading={saving} onClick={save} className="gap-1.5">
                <Save size={14} /> Save
              </Button>
            </div>
          )}
        </div>
        <ProgressBar value={profile?.profileCompletion || 20} label="Profile completion" />
      </Card>

      {/* Programme & Stage */}
      <Card>
        <CardHeader title="Programme & Stage" />
        <div className="grid grid-cols-2 gap-4">
          {editing ? (
            <>
              <Select label="Programme" value={form.program} onChange={(e) => set('program', e.target.value)}>
                {PROGRAMS.map((p) => <option key={p}>{p}</option>)}
              </Select>
              <Select label="Stage" value={form.stage} onChange={(e) => set('stage', e.target.value)}>
                {STAGES.map((s) => <option key={s}>{s}</option>)}
              </Select>
            </>
          ) : (
            <>
              <div><p className="text-xs text-[#6b7280] mb-1">Programme</p><span className="inline-block bg-[#AAFF00] text-[#1a1a1a] text-xs font-bold px-3 py-1 rounded-full">{profile?.program}</span></div>
              <div><p className="text-xs text-[#6b7280] mb-1">Stage</p><span className="inline-block bg-[#f5f5f0] text-[#1a1a1a] text-xs font-semibold px-3 py-1 rounded-full border border-[#e5e5e5]">{profile?.stage}</span></div>
            </>
          )}
        </div>
      </Card>

      {/* Education */}
      <Card>
        <CardHeader title="Education" />
        {editing ? (
          <div className="grid grid-cols-2 gap-4">
            <Input label="Institution" value={form.education?.institution || ''} onChange={(e) => set('education.institution', e.target.value)} />
            <Input label="Stream" value={form.education?.stream || ''} onChange={(e) => set('education.stream', e.target.value)} />
            <Input label="Current Grade" value={form.education?.currentGrade || ''} onChange={(e) => set('education.currentGrade', e.target.value)} />
            <Input label="Graduation Year" type="number" value={form.education?.graduationYear || ''} onChange={(e) => set('education.graduationYear', e.target.value)} />
            <Select label="Board" value={form.education?.board || 'State Board'} onChange={(e) => set('education.board', e.target.value)}>
              {BOARDS.map((b) => <option key={b}>{b}</option>)}
            </Select>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              ['Institution', profile?.education?.institution],
              ['Stream', profile?.education?.stream],
              ['Current Grade', profile?.education?.currentGrade],
              ['Graduation Year', profile?.education?.graduationYear],
              ['Board', profile?.education?.board],
            ].map(([label, val]) => (
              <div key={label}>
                <p className="text-xs text-[#6b7280] mb-0.5">{label}</p>
                <p className="text-sm font-medium text-[#1a1a1a]">{val || '—'}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Interests */}
      <Card>
        <CardHeader title="Interests" />
        {editing ? (
          <Input label="Interests (comma-separated)" value={form.interests} onChange={(e) => set('interests', e.target.value)} placeholder="e.g. Design, Coding, Music" />
        ) : (
          <div className="flex flex-wrap gap-2">
            {profile?.interests?.length ? profile.interests.map((i) => (
              <span key={i} className="bg-[#f5f5f0] text-[#1a1a1a] text-xs px-3 py-1.5 rounded-full border border-[#e5e5e5] font-medium">{i}</span>
            )) : <p className="text-sm text-[#6b7280]">No interests added yet.</p>}
          </div>
        )}
      </Card>

      {/* Aspirations */}
      <Card>
        <CardHeader title="Aspirations" />
        {editing ? (
          <div className="space-y-3">
            <Input label="Target Career" value={form.aspirations?.targetCareer || ''} onChange={(e) => set('aspirations.targetCareer', e.target.value)} />
            <Input label="Higher Education Goal" value={form.aspirations?.higherEducationGoal || ''} onChange={(e) => set('aspirations.higherEducationGoal', e.target.value)} />
            <Input label="Dream Companies (comma-separated)" value={form.aspirations?.dreamCompanies || ''} onChange={(e) => set('aspirations.dreamCompanies', e.target.value)} />
            <Input label="Notes" value={form.aspirations?.notes || ''} onChange={(e) => set('aspirations.notes', e.target.value)} />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              ['Target Career', profile?.aspirations?.targetCareer],
              ['Higher Ed Goal', profile?.aspirations?.higherEducationGoal],
              ['Dream Companies', profile?.aspirations?.dreamCompanies?.join(', ')],
              ['Notes', profile?.aspirations?.notes],
            ].map(([label, val]) => (
              <div key={label}>
                <p className="text-xs text-[#6b7280] mb-0.5">{label}</p>
                <p className="text-sm font-medium text-[#1a1a1a]">{val || '—'}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Contact */}
      <Card>
        <CardHeader title="Contact Information" />
        {editing ? (
          <div className="grid grid-cols-2 gap-4">
            <Input label="Parent Name" value={form.contact?.parentName || ''} onChange={(e) => set('contact.parentName', e.target.value)} />
            <Input label="Parent Phone" value={form.contact?.parentPhone || ''} onChange={(e) => set('contact.parentPhone', e.target.value)} />
            <Input label="Address" value={form.contact?.address || ''} onChange={(e) => set('contact.address', e.target.value)} />
            <Input label="Emergency Contact" value={form.contact?.emergencyContact || ''} onChange={(e) => set('contact.emergencyContact', e.target.value)} />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {[
              ['Parent Name', profile?.contact?.parentName],
              ['Parent Phone', profile?.contact?.parentPhone],
              ['Address', profile?.contact?.address],
              ['Emergency Contact', profile?.contact?.emergencyContact],
            ].map(([label, val]) => (
              <div key={label}>
                <p className="text-xs text-[#6b7280] mb-0.5">{label}</p>
                <p className="text-sm font-medium text-[#1a1a1a]">{val || '—'}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
