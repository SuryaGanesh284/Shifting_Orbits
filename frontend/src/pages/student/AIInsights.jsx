import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import Card, { CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ProgressBar from '../../components/ui/ProgressBar';
import toast from 'react-hot-toast';
import {
  Brain,
  Lightbulb,
  Map,
  Target,
  Zap,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Award,
  BookOpen,
  ArrowRight,
  Sparkles,
  Compass
} from 'lucide-react';

/* -------------------------------------------------------------
 * Component: Smart Nudges Renderer
 * ----------------------------------------------------------- */
function RenderNudges({ nudges }) {
  if (!nudges) return null;
  const list = Array.isArray(nudges) ? nudges : (nudges.nudges || []);

  if (list.length === 0) {
    return (
      <div className="p-5 bg-[#fafafa] rounded-xl border border-[#e5e5e5] text-center">
        <Sparkles size={24} className="text-[#AAFF00] mx-auto mb-2" />
        <p className="text-sm font-semibold text-[#1a1a1a]">All Caught Up!</p>
        <p className="text-xs text-[#6b7280] mt-1">You are on track with your profile, skills, and goals. Keep going!</p>
      </div>
    );
  }

  const priorityStyles = {
    high: 'border-rose-200 bg-rose-50/70 text-rose-700',
    medium: 'border-amber-200 bg-amber-50/70 text-amber-700',
    low: 'border-emerald-200 bg-emerald-50/70 text-emerald-700'
  };

  return (
    <div className="space-y-3">
      {list.map((n, idx) => (
        <div key={n.id || idx} className="p-4 rounded-xl border border-[#e5e5e5] bg-white hover:border-[#d1d1d1] transition-all">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#1a1a1a] text-[#AAFF00] flex items-center justify-center shrink-0 mt-0.5">
                <Zap size={16} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h4 className="text-sm font-bold text-[#1a1a1a]">{n.title}</h4>
                  {n.priority && (
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${priorityStyles[n.priority] || priorityStyles.low}`}>
                      {n.priority}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#4b5563] leading-relaxed">{n.message}</p>
              </div>
            </div>
            {n.actionUrl && (
              <Link
                to={n.actionUrl.startsWith('/student') ? n.actionUrl : `/student${n.actionUrl}`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#1a1a1a] hover:text-black bg-[#fafafa] hover:bg-[#f0f0f0] border border-[#e5e5e5] px-2.5 py-1.5 rounded-lg shrink-0 transition-colors"
              >
                Go <ArrowRight size={12} />
              </Link>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------
 * Component: Action Plan Renderer (Rich Table & Timeline)
 * ----------------------------------------------------------- */
function RenderActionPlan({ plan }) {
  if (!plan) return null;
  if (typeof plan === 'string') {
    return <p className="text-sm text-[#2d2d2d] whitespace-pre-wrap leading-relaxed">{plan}</p>;
  }

  const milestones = plan.weeklyMilestones || [];
  const skills = plan.skillRecommendations || [];
  const certs = plan.recommendedCertifications || [];
  const tips = plan.coordinatorTips || [];

  return (
    <div className="space-y-6 pt-2">
      {/* Plan Header */}
      <div className="p-4 bg-[#1a1a1a] text-white rounded-xl">
        <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
          <h4 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles size={16} className="text-[#AAFF00]" />
            {plan.planTitle || 'Structured 4-Week Action Plan'}
          </h4>
          <span className="text-xs font-semibold bg-[#AAFF00] text-black px-2.5 py-1 rounded-full">
            {plan.durationWeeks || 4} Weeks Plan
          </span>
        </div>
        {plan.objective && (
          <p className="text-xs text-gray-300 leading-relaxed">
            <strong className="text-white">Objective:</strong> {plan.objective}
          </p>
        )}
      </div>

      {/* Weekly Roadmap Table */}
      {milestones.length > 0 && (
        <div>
          <h5 className="text-xs font-bold text-[#1a1a1a] uppercase tracking-wider mb-3 flex items-center gap-2">
            <Calendar size={14} className="text-[#6b7280]" />
            Weekly Roadmap & Tasks
          </h5>
          <div className="overflow-x-auto rounded-xl border border-[#e5e5e5]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#fafafa] border-b border-[#e5e5e5] text-[#6b7280]">
                  <th className="py-3 px-4 font-semibold w-24">Week</th>
                  <th className="py-3 px-4 font-semibold w-48">Theme</th>
                  <th className="py-3 px-4 font-semibold">Action Items & Tasks</th>
                  <th className="py-3 px-4 font-semibold w-48">Expected Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0f0]">
                {milestones.map((m, idx) => (
                  <tr key={idx} className="hover:bg-[#fafafa]/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[#1a1a1a] align-top">
                      <span className="bg-[#f0f0f0] text-[#1a1a1a] px-2 py-1 rounded font-mono text-[11px]">
                        Week {m.weekNumber || idx + 1}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-[#1a1a1a] align-top">
                      {m.theme}
                    </td>
                    <td className="py-3.5 px-4 align-top">
                      <ul className="space-y-1.5">
                        {(m.tasks || []).map((t, tIdx) => (
                          <li key={tIdx} className="flex items-start gap-1.5 text-[#374151]">
                            <span className="text-[#AAFF00] font-black shrink-0">•</span>
                            <span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="py-3.5 px-4 align-top">
                      <span className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-1 rounded text-[11px] font-medium">
                        ✓ {m.outcome}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recommended Skills & Certifications */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {skills.length > 0 && (
          <div className="p-4 bg-[#fafafa] rounded-xl border border-[#e5e5e5]">
            <p className="text-xs font-bold text-[#1a1a1a] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <BookOpen size={13} className="text-[#6b7280]" />
              Target Skills to Build
            </p>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((s, i) => (
                <span key={i} className="bg-white border border-[#e5e5e5] text-[#1a1a1a] text-xs font-semibold px-2.5 py-1 rounded-lg">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {certs.length > 0 && (
          <div className="p-4 bg-[#fafafa] rounded-xl border border-[#e5e5e5]">
            <p className="text-xs font-bold text-[#1a1a1a] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Award size={13} className="text-[#6b7280]" />
              Recommended Certifications
            </p>
            <ul className="space-y-1 text-xs text-[#374151]">
              {certs.map((c, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-amber-500 font-bold shrink-0">★</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Coordinator Tips */}
      {tips.length > 0 && (
        <div className="p-4 bg-[#f7fdf0] border border-[#d6f5a3] rounded-xl">
          <p className="text-xs font-bold text-[#1a1a1a] uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Lightbulb size={13} className="text-emerald-600" />
            Mentor / Coordinator Success Tips
          </p>
          <ul className="space-y-1.5 text-xs text-[#374151]">
            {tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">👉</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------
 * Component: Career Match Renderer (Score, Gap Analysis & Path)
 * ----------------------------------------------------------- */
function RenderCareerMatch({ data }) {
  if (!data) return null;
  if (typeof data === 'string') {
    return <p className="text-sm text-[#2d2d2d] whitespace-pre-wrap leading-relaxed">{data}</p>;
  }

  const score = data.readinessScore || 0;
  const level = data.readinessLevel || 'Developing';
  const matched = data.matchedSkills || [];
  const missingCritical = data.missingCriticalSkills || [];
  const missingRec = data.missingRecommendedSkills || [];
  const path = data.recommendedLearningPath || [];
  const certs = data.recommendedCertifications || [];

  return (
    <div className="space-y-6 pt-2">
      {/* Score and Target Career Summary Banner */}
      <div className="bg-[#1a1a1a] text-white p-5 rounded-2xl">
        <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
          <div>
            <p className="text-xs text-gray-400">Target Role Assessment</p>
            <h4 className="text-lg font-black text-white">{data.targetCareer || 'Career Assessment'}</h4>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#AAFF00]/20 text-[#AAFF00]">
              {level} Match
            </span>
            <div className="text-2xl font-black text-[#AAFF00] mt-1">{score}%</div>
          </div>
        </div>
        <ProgressBar value={score} color="lime" showPercent={false} />
      </div>

      {/* Skills Comparison Table / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Acquired / Matched */}
        <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200">
          <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-emerald-600" />
            Matching Skills You Have ({matched.length})
          </p>
          {matched.length > 0 ? (
            <div className="space-y-1.5">
              {matched.map((m, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs bg-white px-3 py-1.5 rounded-lg border border-emerald-100">
                  <span className="font-semibold text-[#1a1a1a]">{m.name || m}</span>
                  {m.level && <span className="text-[10px] text-gray-500 capitalize">{m.level}</span>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500">None logged yet for this career benchmark.</p>
          )}
        </div>

        {/* Missing Critical */}
        <div className="p-4 bg-rose-50/50 rounded-xl border border-rose-200">
          <p className="text-xs font-bold text-rose-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <AlertCircle size={13} className="text-rose-600" />
            Critical Skills Gap ({missingCritical.length})
          </p>
          {missingCritical.length > 0 ? (
            <div className="space-y-1.5">
              {missingCritical.map((s, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs bg-white px-3 py-1.5 rounded-lg border border-rose-100">
                  <span className="font-semibold text-[#1a1a1a]">{s}</span>
                  <span className="text-[10px] text-rose-600 font-bold">Required</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-emerald-700 font-medium">You have all critical skills required!</p>
          )}
        </div>
      </div>

      {/* Recommended Secondary Skills */}
      {missingRec.length > 0 && (
        <div className="p-4 bg-[#fafafa] rounded-xl border border-[#e5e5e5]">
          <p className="text-xs font-bold text-[#1a1a1a] uppercase tracking-wider mb-2">
            Secondary / Recommended Skills
          </p>
          <div className="flex flex-wrap gap-1.5">
            {missingRec.map((s, idx) => (
              <span key={idx} className="bg-white border border-[#e5e5e5] text-xs font-medium px-2.5 py-1 rounded-lg text-[#374151]">
                + {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Learning Path Table */}
      {path.length > 0 && (
        <div>
          <h5 className="text-xs font-bold text-[#1a1a1a] uppercase tracking-wider mb-3 flex items-center gap-2">
            <Compass size={14} className="text-[#6b7280]" />
            Recommended Step-by-Step Learning Path
          </h5>
          <div className="overflow-x-auto rounded-xl border border-[#e5e5e5]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#fafafa] border-b border-[#e5e5e5] text-[#6b7280]">
                  <th className="py-3 px-4 font-semibold w-40">Phase</th>
                  <th className="py-3 px-4 font-semibold">Focus Skills</th>
                  <th className="py-3 px-4 font-semibold w-28">Duration</th>
                  <th className="py-3 px-4 font-semibold">Suggested Projects</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0f0]">
                {path.map((step, idx) => (
                  <tr key={idx} className="hover:bg-[#fafafa]/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[#1a1a1a] align-top">
                      {step.phase}
                    </td>
                    <td className="py-3.5 px-4 align-top">
                      <div className="flex flex-wrap gap-1">
                        {(step.focusSkills || []).map((sk, skIdx) => (
                          <span key={skIdx} className="bg-[#f0f0f0] text-[#1a1a1a] px-2 py-0.5 rounded text-[11px] font-medium">
                            {sk}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 align-top font-mono text-[11px] text-[#4b5563]">
                      {step.estimatedDuration}
                    </td>
                    <td className="py-3.5 px-4 align-top text-[#374151]">
                      {(step.suggestedProjects || []).join(', ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recommended Certifications */}
      {certs.length > 0 && (
        <div className="p-4 bg-[#fafafa] rounded-xl border border-[#e5e5e5]">
          <p className="text-xs font-bold text-[#1a1a1a] uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Award size={13} className="text-[#6b7280]" />
            Target Certifications
          </p>
          <ul className="space-y-1 text-xs text-[#374151]">
            {certs.map((c, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <span className="text-amber-500 font-bold">★</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function AIInsights() {
  const [nudges, setNudges] = useState(null);
  const [actionPlan, setActionPlan] = useState(null);
  const [careerMatch, setCareerMatch] = useState(null);
  const [loading, setLoading] = useState({ nudges: false, plan: false, career: false });
  const [focusArea, setFocusArea] = useState('');
  const [targetCareer, setTargetCareer] = useState('');

  const fetchNudges = async () => {
    setLoading((l) => ({ ...l, nudges: true }));
    try {
      const { data } = await api.get('/ai/nudges');
      setNudges(data.data || data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch nudges');
    } finally {
      setLoading((l) => ({ ...l, nudges: false }));
    }
  };

  const fetchPlan = async () => {
    setLoading((l) => ({ ...l, plan: true }));
    try {
      const { data } = await api.post('/ai/action-plan', focusArea ? { focusArea } : {});
      setActionPlan(data.data || data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate plan');
    } finally {
      setLoading((l) => ({ ...l, plan: false }));
    }
  };

  const fetchCareer = async () => {
    setLoading((l) => ({ ...l, career: true }));
    try {
      const { data } = await api.post('/ai/career-match', targetCareer ? { targetCareer } : {});
      setCareerMatch(data.data || data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to match career');
    } finally {
      setLoading((l) => ({ ...l, career: false }));
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Hero */}
      <div className="bg-[#1a1a1a] rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#AAFF00] flex items-center justify-center">
            <Brain size={20} className="text-[#1a1a1a]" />
          </div>
          <div>
            <h2 className="text-white font-black text-lg">AI-Powered Insights</h2>
            <p className="text-gray-400 text-sm">Personalised recommendations, learning roadmaps, and career matching</p>
          </div>
        </div>
      </div>

      {/* Smart Nudges */}
      <Card>
        <CardHeader
          title="Smart Nudges ⚡"
          subtitle="Proactive tips and prioritized next steps based on your current progress"
          action={
            <Button onClick={fetchNudges} loading={loading.nudges} size="sm" className="gap-1.5">
              <Zap size={13} /> Get Nudges
            </Button>
          }
        />
        {nudges ? (
          <RenderNudges nudges={nudges} />
        ) : (
          <div className="py-8 text-center">
            <Lightbulb size={32} className="text-[#d1d1d1] mx-auto mb-3" />
            <p className="text-sm font-medium text-[#1a1a1a] mb-1">Looking for fresh guidance?</p>
            <p className="text-xs text-[#6b7280] mb-4">Click "Get Nudges" to receive instant, context-aware coaching advice.</p>
            <Button onClick={fetchNudges} loading={loading.nudges} size="sm" variant="outline" className="gap-1.5">
              <Zap size={13} /> Get Nudges
            </Button>
          </div>
        )}
      </Card>

      {/* Action Plan */}
      <Card>
        <CardHeader
          title="4-Week Action Plan Generator 🗺️"
          subtitle="Structured roadmap breakdown with weekly themes, tasks, and expected milestones"
        />
        <div className="flex gap-3 mb-4">
          <input
            className="flex-1 px-4 py-2.5 border border-[#e5e5e5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#AAFF00]"
            placeholder="Focus area (optional): e.g. Full-Stack Web Development, Data Analysis, Board Exam Prep…"
            value={focusArea}
            onChange={(e) => setFocusArea(e.target.value)}
          />
          <Button onClick={fetchPlan} loading={loading.plan} size="sm" className="gap-1.5 shrink-0">
            <Map size={13} /> Generate Plan
          </Button>
        </div>
        {actionPlan ? (
          <RenderActionPlan plan={actionPlan} />
        ) : (
          <div className="py-8 text-center">
            <Target size={32} className="text-[#d1d1d1] mx-auto mb-3" />
            <p className="text-sm font-medium text-[#1a1a1a] mb-1">Generate a Custom 4-Week Roadmap</p>
            <p className="text-xs text-[#6b7280]">Enter a focus area above or click Generate to get an AI-tailored study and practice plan.</p>
          </div>
        )}
      </Card>

      {/* Career Match */}
      <Card>
        <CardHeader
          title="Career Benchmark Gap Analysis 🎯"
          subtitle="Compare your profile against industry standards with learning phases and certifications"
        />
        <div className="flex gap-3 mb-4">
          <input
            className="flex-1 px-4 py-2.5 border border-[#e5e5e5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#AAFF00]"
            placeholder="Target career (optional): e.g. Software Engineer, Data Analyst, Electronics Engineer…"
            value={targetCareer}
            onChange={(e) => setTargetCareer(e.target.value)}
          />
          <Button onClick={fetchCareer} loading={loading.career} size="sm" className="gap-1.5 shrink-0">
            <Brain size={13} /> Evaluate Match
          </Button>
        </div>
        {careerMatch ? (
          <RenderCareerMatch data={careerMatch} />
        ) : (
          <div className="py-8 text-center">
            <Brain size={32} className="text-[#d1d1d1] mx-auto mb-3" />
            <p className="text-sm font-medium text-[#1a1a1a] mb-1">Evaluate Your Career Readiness</p>
            <p className="text-xs text-[#6b7280]">Discover matched skills, missing critical competencies, and a multi-phase learning path.</p>
          </div>
        )}
      </Card>
    </div>
  );
}
