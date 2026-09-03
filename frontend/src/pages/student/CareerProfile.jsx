import { useEffect, useState } from 'react';
import api from '../../lib/api';
import Card, { CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ProgressBar from '../../components/ui/ProgressBar';
import toast from 'react-hot-toast';
import { Edit2, Save, X } from 'lucide-react';

export default function CareerProfile() {
  const [profile, setProfile] = useState(null);
  const [readiness, setReadiness] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});

  const fetch = async () => {
    try {
      const [p, r] = await Promise.all([api.get('/students/me/career-profile'), api.get('/students/me/career-readiness')]);
      const profileData = p.data.data || p.data;
      setProfile(profileData);
      setReadiness(r.data.data || r.data);
      const asp = profileData?.aspirations || profileData || {};
      setForm({
        aspirations: {
          targetCareer: asp.targetCareer || '',
          higherEducationGoal: asp.higherEducationGoal || '',
          dreamCompanies: Array.isArray(asp.dreamCompanies) ? asp.dreamCompanies.join(', ') : (asp.dreamCompanies || ''),
          notes: asp.notes || '',
        }
      });
    } catch {
      toast.error('Failed to load career profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  const save = async () => {
    setSaving(true);
    try {
      const companies = typeof form.aspirations?.dreamCompanies === 'string'
        ? form.aspirations.dreamCompanies.split(',').map((s) => s.trim()).filter(Boolean)
        : (Array.isArray(form.aspirations?.dreamCompanies) ? form.aspirations.dreamCompanies : []);

      const payload = {
        targetCareer: form.aspirations?.targetCareer || '',
        higherEducationGoal: form.aspirations?.higherEducationGoal || '',
        dreamCompanies: companies,
        notes: form.aspirations?.notes || '',
        aspirations: {
          targetCareer: form.aspirations?.targetCareer || '',
          higherEducationGoal: form.aspirations?.higherEducationGoal || '',
          dreamCompanies: companies,
          notes: form.aspirations?.notes || '',
        }
      };
      await api.put('/students/me/career-profile', payload);
      toast.success('Career profile updated!');
      setEditing(false);
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, aspirations: { ...f.aspirations, [k]: e.target.value } }));

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-[#AAFF00] border-t-transparent rounded-full animate-spin" /></div>;

  const score = readiness?.overallScore || readiness?.score || 0;
  const breakdown = readiness?.breakdown || {};

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Readiness score */}
      <div className="bg-[#1a1a1a] rounded-2xl p-6">
        <p className="text-gray-400 text-sm mb-1">Career Readiness Score</p>
        <div className="flex items-end gap-3 mb-4">
          <span className="text-5xl font-black text-[#AAFF00]">{score}</span>
          <span className="text-gray-400 text-lg mb-1">/100</span>
        </div>
        <ProgressBar value={score} color="lime" showPercent={false} />
        {Object.keys(breakdown).length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            {Object.entries(breakdown).map(([k, v]) => (
              <div key={k} className="text-center">
                <p className="text-[#AAFF00] text-xl font-black">{Math.round(v)}</p>
                <p className="text-gray-400 text-[10px] capitalize mt-0.5">{k.replace(/_/g, ' ')}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Aspirations */}
      <Card>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-[#1a1a1a]">Career Aspirations</h3>
          {!editing ? (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="gap-1.5"><Edit2 size={13} /> Edit</Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)}><X size={13} /></Button>
              <Button size="sm" loading={saving} onClick={save} className="gap-1.5"><Save size={13} /> Save</Button>
            </div>
          )}
        </div>

        {editing ? (
          <div className="space-y-3">
            {[
              ['targetCareer', 'Target Career', 'e.g. Software Engineer'],
              ['higherEducationGoal', 'Higher Education Goal', 'e.g. B.Tech Computer Science'],
              ['dreamCompanies', 'Dream Companies (comma-separated)', 'e.g. Google, Infosys, TCS'],
              ['notes', 'Notes', 'Any additional notes…'],
            ].map(([field, label, placeholder]) => (
              <div key={field}>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-1.5">{label}</label>
                <input className="w-full px-4 py-2.5 border border-[#e5e5e5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#AAFF00]" placeholder={placeholder} value={form.aspirations?.[field] || ''} onChange={set(field)} />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {[
              ['Target Career', profile?.aspirations?.targetCareer || profile?.targetCareer],
              ['Higher Education Goal', profile?.aspirations?.higherEducationGoal || profile?.higherEducationGoal],
              ['Dream Companies', Array.isArray(profile?.aspirations?.dreamCompanies || profile?.dreamCompanies) ? (profile?.aspirations?.dreamCompanies || profile?.dreamCompanies).join(', ') : (profile?.aspirations?.dreamCompanies || profile?.dreamCompanies)],
              ['Notes', profile?.aspirations?.notes || profile?.notes],
            ].map(([label, val]) => (
              <div key={label} className="flex items-start gap-4 py-3 border-b border-[#f5f5f5] last:border-0">
                <p className="text-xs text-[#6b7280] w-40 shrink-0 mt-0.5">{label}</p>
                <p className="text-sm font-medium text-[#1a1a1a]">{val || <span className="text-[#9ca3af]">Not set</span>}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Dream companies chips */}
      {!editing && ((profile?.aspirations?.dreamCompanies?.length > 0) || (profile?.dreamCompanies?.length > 0)) && (
        <Card>
          <CardHeader title="Dream Companies" />
          <div className="flex flex-wrap gap-2">
            {(profile?.aspirations?.dreamCompanies || profile?.dreamCompanies || []).map((c) => (
              <span key={c} className="bg-[#1a1a1a] text-white text-xs font-medium px-3 py-1.5 rounded-full">{c}</span>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
