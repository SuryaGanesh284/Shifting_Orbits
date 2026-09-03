import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../lib/api';
import Card, { CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ProgressBar from '../../components/ui/ProgressBar';
import { ArrowLeft, Brain } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const TABS = ['Overview', 'Academic', 'Skills', 'Career', 'Interactions'];

export default function StudentDetail() {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [tab, setTab] = useState('Overview');
  const [loading, setLoading] = useState(true);
  const [aiSummary, setAiSummary] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    api.get(`/coordinator/students/${id}`)
      .then(({ data }) => setStudent(data.data || data))
      .catch(() => toast.error('Failed to load student'))
      .finally(() => setLoading(false));
  }, [id]);

  const fetchAI = async () => {
    setLoadingAi(true);
    try {
      const { data } = await api.get(`/ai/student-summary/${id}`);
      setAiSummary(data.data || data);
    } catch { toast.error('Failed to load AI summary'); }
    finally { setLoadingAi(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-[#AAFF00] border-t-transparent rounded-full animate-spin" /></div>;
  if (!student) return <div className="text-center py-16 text-[#6b7280]">Student not found.</div>;

  const profile = student.student || student;
  const user = student.student?.user || student.user || student.userId || {};
  const academic = student.academicOverview?.records || student.academicRecords || [];
  const skills = student.skillsOverview?.skills || student.skills || [];
  const goals = student.goalsOverview?.goals || student.goals || [];
  const interactions = student.interactions || [];
  const progress = student.academicOverview || student.progress || {};
  const career = student.careerReadiness || student.career || {};

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back + header */}
      <div>
        <Link to="/coordinator/students" className="inline-flex items-center gap-1.5 text-sm text-[#6b7280] hover:text-[#1a1a1a] mb-4 transition-colors">
          <ArrowLeft size={14} /> Back to Students
        </Link>
        <div className="bg-[#1a1a1a] rounded-2xl p-6 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#AAFF00] flex items-center justify-center text-[#1a1a1a] font-black text-xl">
              {user.name?.charAt(0) || 'S'}
            </div>
            <div>
              <h2 className="text-xl font-black text-white">{user.name || 'Student'}</h2>
              <p className="text-gray-400 text-sm">{user.email || profile.email}</p>
              <div className="flex items-center gap-2 mt-1.5">
                {profile.program && <span className="bg-[#AAFF00] text-[#1a1a1a] text-xs font-bold px-2.5 py-0.5 rounded-full">{profile.program}</span>}
                {profile.stage && <span className="text-gray-300 text-xs border border-gray-600 px-2.5 py-0.5 rounded-full">{profile.stage}</span>}
              </div>
            </div>
          </div>
          <Button onClick={fetchAI} loading={loadingAi} variant="lime" size="sm" className="gap-1.5 shrink-0">
            <Brain size={13} /> AI Summary
          </Button>
        </div>
      </div>

      {/* AI Summary */}
      {aiSummary && (
        <Card>
          <CardHeader title="AI Coordinator Briefing 🤖" />
          {typeof aiSummary === 'string' ? (
            <p className="text-sm text-[#2d2d2d] whitespace-pre-wrap leading-relaxed">{aiSummary}</p>
          ) : (
            <div className="space-y-4">
              <div className="p-3.5 bg-[#f5f5f0] rounded-xl">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Executive Summary</p>
                <p className="text-sm text-[#1a1a1a] leading-relaxed">{aiSummary.executiveSummary}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                  <p className="text-xs font-bold text-emerald-800 mb-1.5">Key Strengths</p>
                  <ul className="text-xs text-emerald-900 space-y-1">
                    {aiSummary.keyStrengths?.map((s, i) => <li key={i}>• {s}</li>)}
                  </ul>
                </div>
                <div className="p-3.5 bg-amber-50/50 border border-amber-100 rounded-xl">
                  <p className="text-xs font-bold text-amber-800 mb-1.5">Primary Focus / Concerns</p>
                  <ul className="text-xs text-amber-900 space-y-1">
                    {aiSummary.primaryConcerns?.map((c, i) => <li key={i}>• {c}</li>)}
                  </ul>
                </div>
              </div>
              {aiSummary.suggestedDiscussionPoints?.length > 0 && (
                <div className="p-3.5 bg-[#fafafa] border border-[#e5e5e5] rounded-xl">
                  <p className="text-xs font-bold text-gray-700 mb-1.5">Suggested Discussion Points</p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {aiSummary.suggestedDiscussionPoints.map((p, i) => <li key={i}>✓ {p}</li>)}
                  </ul>
                </div>
              )}
              {aiSummary.recommendedAction && (
                <div className="p-3.5 bg-[#1a1a1a] text-white rounded-xl text-xs">
                  <span className="text-[#AAFF00] font-bold uppercase tracking-wider mr-2">Recommended Action:</span>
                  <span>{aiSummary.recommendedAction}</span>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-[#f5f5f0] rounded-xl w-fit">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === t ? 'bg-white text-[#1a1a1a] shadow-sm' : 'text-[#6b7280] hover:text-[#1a1a1a]'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'Overview' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Academic Records', value: academic.length },
            { label: 'Skills', value: skills.length },
            { label: 'Goals', value: goals.length },
            { label: 'Support Requests', value: student.supportRequests?.length ?? 0 },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white border border-[#e5e5e5] rounded-2xl p-5 text-center">
              <p className="text-2xl font-black text-[#1a1a1a]">{value ?? '0'}</p>
              <p className="text-xs text-[#6b7280] mt-1">{label}</p>
            </div>
          ))}
          <Card className="col-span-2 lg:col-span-4">
            <CardHeader title="Profile Details" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              {[
                ['Institution', profile.education?.institution],
                ['Stream', profile.education?.stream],
                ['Board', profile.education?.board],
                ['Graduation Year', profile.education?.graduationYear],
                ['Interests', profile.interests?.join(', ')],
                ['Target Career', profile.aspirations?.targetCareer],
              ].map(([label, val]) => (
                <div key={label}>
                  <p className="text-xs text-[#6b7280] mb-0.5">{label}</p>
                  <p className="font-medium text-[#1a1a1a]">{val || '—'}</p>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <ProgressBar value={profile.profileCompletion || 20} label="Profile completion" />
            </div>
          </Card>
        </div>
      )}

      {tab === 'Academic' && (
        <Card>
          <CardHeader title="Academic Records" />
          {academic.length === 0 ? <p className="text-sm text-center py-6 text-[#6b7280]">No records.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-[#f0f0f0]">{['Subject', 'Year', 'Term', 'Score', 'Attendance'].map((h) => <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-[#6b7280] uppercase">{h}</th>)}</tr></thead>
                <tbody>
                  {academic.map((r) => {
                    const max = r.maxScore || 100;
                    const pct = Math.round((r.score / max) * 100);
                    const c = pct >= 75 ? 'text-emerald-600' : pct >= 50 ? 'text-yellow-600' : 'text-red-500';
                    return (
                      <tr key={r._id} className="border-b border-[#f9f9f9] hover:bg-[#fafafa]">
                        <td className="py-3 px-3 font-medium">{r.subject}</td>
                        <td className="py-3 px-3 text-[#6b7280]">{r.academicYear}</td>
                        <td className="py-3 px-3 text-[#6b7280]">{r.term}</td>
                        <td className={`py-3 px-3 font-semibold ${c}`}>{r.score}/{max}</td>
                        <td className="py-3 px-3 text-[#6b7280]">{r.attendance}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {tab === 'Skills' && (
        <Card>
          <CardHeader title="Skills" />
          {skills.length === 0 ? <p className="text-sm text-center py-6 text-[#6b7280]">No skills.</p> : (
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => (
                <span key={s._id} className="bg-[#f5f5f0] border border-[#e5e5e5] text-[#1a1a1a] text-xs font-medium px-3 py-1.5 rounded-full">
                  {s.name} · <span className="text-[#6b7280]">{s.level}</span>
                </span>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === 'Career' && (
        <Card>
          <CardHeader title="Career Profile" />
          <div className="space-y-3">
            {[
              ['Target Career', profile.aspirations?.targetCareer],
              ['Higher Ed Goal', profile.aspirations?.higherEducationGoal],
              ['Dream Companies', profile.aspirations?.dreamCompanies?.join(', ')],
            ].map(([label, val]) => (
              <div key={label} className="flex gap-4 py-2.5 border-b border-[#f5f5f5] last:border-0">
                <p className="text-xs text-[#6b7280] w-36 shrink-0">{label}</p>
                <p className="text-sm font-medium text-[#1a1a1a]">{val || '—'}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === 'Interactions' && (
        <Card>
          <CardHeader title="Interaction Log" />
          {interactions.length === 0 ? <p className="text-sm text-center py-6 text-[#6b7280]">No interactions logged.</p> : (
            <ul className="space-y-3">
              {interactions.map((i) => (
                <li key={i._id} className="p-4 bg-[#fafafa] rounded-xl border border-[#f0f0f0]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-[#6b7280] capitalize">{i.type?.replace('_', ' ')}</span>
                    <span className="text-xs text-[#9ca3af]">{i.interactionDate ? format(new Date(i.interactionDate), 'dd MMM yyyy') : ''}</span>
                  </div>
                  <p className="text-sm text-[#1a1a1a]">{i.notes}</p>
                  {i.concerns?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {i.concerns.map((c, ci) => <span key={ci} className="text-[10px] bg-red-50 text-red-500 px-2 py-0.5 rounded-full">{c}</span>)}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}
