import { useEffect, useState } from 'react';
import api from '../../lib/api';
import Card, { CardHeader } from '../../components/ui/Card';
import ProgressBar from '../../components/ui/ProgressBar';
import { statusBadge } from '../../components/ui/Badge';
import {
  BookOpen,
  Brain,
  Star,
  Target,
  Activity,
  TrendingUp,
  Calendar,
  ArrowRight,
  Award
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import { format } from 'date-fns';

const safeFormatDate = (dateVal, fmt = 'dd MMM yyyy') => {
  if (!dateVal) return '';
  try {
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? '' : format(d, fmt);
  } catch {
    return '';
  }
};
/* -------------------------------------------------------------
 * Component 1: Interactive Academic Performance & Attendance Trend
 * ----------------------------------------------------------- */
function AcademicTrendChart({ data }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="py-12 text-center bg-[#fafafa] rounded-xl border border-[#e5e5e5]">
        <Activity size={32} className="text-[#d1d1d1] mx-auto mb-2" />
        <p className="text-sm font-semibold text-[#1a1a1a]">No Assessment Data Yet</p>
        <p className="text-xs text-[#6b7280] max-w-xs mx-auto mt-1 mb-3">
          Log at least one assessment in Academic Records to see your live performance and attendance graph!
        </p>
        <Link to="/student/academic-records">
          <Button size="sm" variant="outline">Add First Record</Button>
        </Link>
      </div>
    );
  }

  const width = 600;
  const height = 220;
  const padding = { top: 25, right: 30, bottom: 35, left: 40 };

  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const points = data.map((d, i) => {
    const x = padding.left + (data.length > 1 ? (i / (data.length - 1)) * innerWidth : innerWidth / 2);
    const scoreVal = Math.min(100, Math.max(0, d.score || 0));
    const yScore = padding.top + innerHeight - (scoreVal / 100) * innerHeight;
    const attVal = Math.min(100, Math.max(0, d.attendance || 0));
    const yAtt = padding.top + innerHeight - (attVal / 100) * innerHeight;
    return { x, yScore, yAtt, ...d };
  });

  const scorePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.yScore}`).join(' ');
  const areaPath = `${scorePath} L ${points[points.length - 1].x} ${padding.top + innerHeight} L ${points[0].x} ${padding.top + innerHeight} Z`;
  const attPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.yAtt}`).join(' ');

  const hovered = hoveredIndex !== null ? points[hoveredIndex] : null;

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#AAFF00] inline-block" />
            <span className="font-semibold text-[#1a1a1a]">Exam Score (%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-cyan-500 inline-block border-t border-dashed" />
            <span className="font-semibold text-[#1a1a1a]">Attendance (%)</span>
          </div>
        </div>
        <span className="text-[11px] text-[#6b7280]">Showing last {data.length} assessments</span>
      </div>

      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[480px]">
          <defs>
            <linearGradient id="scoreAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#AAFF00" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#AAFF00" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((val) => {
            const y = padding.top + innerHeight - (val / 100) * innerHeight;
            return (
              <g key={val}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#f0f0f0"
                  strokeWidth="1"
                  strokeDasharray={val === 0 ? '0' : '3 3'}
                />
                <text
                  x={padding.left - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="text-[10px] fill-gray-400 font-mono"
                >
                  {val}%
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          <path d={areaPath} fill="url(#scoreAreaGradient)" />

          {/* Attendance Line */}
          <path
            d={attPath}
            fill="none"
            stroke="#06b6d4"
            strokeWidth="2"
            strokeDasharray="4 4"
            strokeLinecap="round"
          />

          {/* Score Line */}
          <path
            d={scorePath}
            fill="none"
            stroke="#1a1a1a"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points */}
          {points.map((p, idx) => (
            <g
              key={idx}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <circle cx={p.x} cy={p.yScore} r="14" fill="transparent" />
              <circle cx={p.x} cy={p.yAtt} r="3.5" fill="#06b6d4" />
              <circle
                cx={p.x}
                cy={p.yScore}
                r={hoveredIndex === idx ? '6' : '4.5'}
                fill="#AAFF00"
                stroke="#1a1a1a"
                strokeWidth="2"
                className="transition-all"
              />
              <text
                x={p.x}
                y={height - 10}
                textAnchor="middle"
                className="text-[10px] fill-gray-500 font-medium"
              >
                {p.subject ? p.subject.slice(0, 5) : `A${idx + 1}`}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {hovered && (
        <div
          className="absolute top-10 left-1/2 -translate-x-1/2 bg-[#1a1a1a] text-white p-3 rounded-xl shadow-lg border border-white/10 text-xs flex items-center gap-4 pointer-events-none z-10"
        >
          <div>
            <p className="font-bold text-[#AAFF00]">{hovered.subject || 'Assessment'}</p>
            <p className="text-[10px] text-gray-400">{hovered.term || 'Term 1'} {hovered.date ? `· ${safeFormatDate(hovered.date)}` : ''}</p>
          </div>
          <div className="flex items-center gap-3 border-l border-white/20 pl-3">
            <div>
              <p className="text-[10px] text-gray-400">Score</p>
              <p className="font-black text-sm text-[#AAFF00]">{hovered.score}%</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400">Attendance</p>
              <p className="font-black text-sm text-cyan-400">{hovered.attendance || 0}%</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------
 * Component 2: Subject Mastery Distribution Bar Chart
 * ----------------------------------------------------------- */
function SubjectBarChart({ subjects }) {
  if (!subjects || subjects.length === 0) {
    return (
      <div className="py-8 text-center bg-[#fafafa] rounded-xl border border-[#e5e5e5]">
        <p className="text-xs text-[#6b7280]">Log assessment marks to view subject proficiency breakdown.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      {subjects.map((s, idx) => {
        const score = s.averageScore || 0;
        const color = score >= 75 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-400' : 'bg-rose-400';
        const badgeText = score >= 75 ? 'Mastery' : score >= 60 ? 'Proficient' : 'Needs Focus';
        const badgeStyle = score >= 75 ? 'bg-emerald-50 text-emerald-700' : score >= 60 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700';

        return (
          <div key={idx} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#1a1a1a]">{s.subject}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${badgeStyle}`}>{badgeText}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-400">{s.assessmentsCount} tests</span>
                <span className="font-bold text-[#1a1a1a]">{score}%</span>
              </div>
            </div>
            <div className="w-full h-2 bg-[#f0f0f0] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${color}`}
                style={{ width: `${Math.min(score, 100)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------
 * Component 3: Skills Taxonomy Breakdown
 * ----------------------------------------------------------- */
function SkillsTaxonomyChart({ skillsByCategory, totalSkills }) {
  const categories = [
    { key: 'technical', label: 'Technical', count: skillsByCategory?.technical || 0, color: 'bg-emerald-500', bar: '#10b981' },
    { key: 'soft', label: 'Soft Skills', count: skillsByCategory?.soft || 0, color: 'bg-blue-500', bar: '#3b82f6' },
    { key: 'domain', label: 'Domain', count: skillsByCategory?.domain || 0, color: 'bg-purple-500', bar: '#a855f7' },
    { key: 'language', label: 'Language', count: skillsByCategory?.language || 0, color: 'bg-amber-500', bar: '#f59e0b' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {categories.map((c) => {
          const pct = totalSkills > 0 ? Math.round((c.count / totalSkills) * 100) : 0;
          return (
            <div key={c.key} className="p-3 bg-[#fafafa] rounded-xl border border-[#e5e5e5] text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <span className={`w-2 h-2 rounded-full ${c.color}`} />
                <p className="text-[11px] font-semibold text-[#1a1a1a]">{c.label}</p>
              </div>
              <p className="text-xl font-black text-[#1a1a1a]">{c.count}</p>
              <p className="text-[10px] text-gray-400">{pct}% of total</p>
            </div>
          );
        })}
      </div>

      {totalSkills > 0 ? (
        <div className="w-full h-3 bg-[#f0f0f0] rounded-full overflow-hidden flex">
          {categories.map((c) => {
            const pct = (c.count / totalSkills) * 100;
            if (pct === 0) return null;
            return (
              <div
                key={c.key}
                style={{ width: `${pct}%`, backgroundColor: c.bar }}
                title={`${c.label}: ${c.count} (${Math.round(pct)}%)`}
                className="h-full first:rounded-l-full last:rounded-r-full"
              />
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-gray-500 text-center py-2">No skills categorized yet. Add skills in Skills inventory.</p>
      )}
    </div>
  );
}

/* -------------------------------------------------------------
 * Component 4: Student Journey Lifecycle Roadmap
 * ----------------------------------------------------------- */
function JourneyRoadmap({ currentStage }) {
  const STAGES = [
    { id: 'Grade 11', label: 'Grade 11', desc: 'Sethu Foundation' },
    { id: 'Grade 12', label: 'Grade 12', desc: 'Board & Entrance' },
    { id: 'Higher Education', label: 'Higher Ed', desc: 'Stambha Degree' },
    { id: 'Skill Development', label: 'Skills', desc: 'Professional' },
    { id: 'Internship', label: 'Internship', desc: 'Industry Project' },
    { id: 'Employment', label: 'Career', desc: 'Placement' },
  ];

  const currentIdx = Math.max(0, STAGES.findIndex((s) => s.id === currentStage));

  return (
    <div className="overflow-x-auto py-2">
      <div className="flex items-center min-w-[560px]">
        {STAGES.map((s, idx) => {
          const isCompleted = idx < currentIdx;
          const isCurrent = idx === currentIdx;

          return (
            <div key={s.id} className="flex-1 flex flex-col items-center relative">
              {idx > 0 && (
                <div
                  className={`absolute top-3.5 right-1/2 w-full h-0.5 -z-0 ${
                    idx <= currentIdx ? 'bg-[#AAFF00]' : 'bg-[#e5e5e5]'
                  }`}
                />
              )}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold z-10 transition-all ${
                  isCompleted
                    ? 'bg-[#AAFF00] text-black'
                    : isCurrent
                    ? 'bg-[#1a1a1a] text-[#AAFF00] ring-4 ring-[#AAFF00]/30'
                    : 'bg-[#fafafa] text-gray-400 border border-[#d1d1d1]'
                }`}
              >
                {isCompleted ? '✓' : idx + 1}
              </div>
              <p className={`text-[11px] font-bold mt-2 text-center ${isCurrent ? 'text-[#1a1a1a]' : 'text-gray-500'}`}>
                {s.label}
              </p>
              <p className="text-[9px] text-gray-400 text-center leading-tight hidden sm:block">
                {s.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  const [dash, setDash] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/students/me/dashboard')
      .then(({ data }) => setDash(data.data || data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#AAFF00] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const student = dash?.student || {};
  const progress = dash?.progress || dash?.summary || {};
  const summary = dash?.summary || dash?.progress || {};
  const recentGoals = dash?.recentGoals || dash?.upcomingGoals || [];
  const recentInteractions = dash?.recentInteractions || [];
  const scoreTrend = dash?.scoreTrend || [];
  const subjectBreakdown = dash?.subjectBreakdown || [];
  const skillsByCategory = dash?.skillsByCategory || {};
  const topSkills = dash?.topSkills || [];

  const completion = student.profileCompletion || progress.profileCompletion || 20;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Welcome Banner */}
      <div className="bg-[#1a1a1a] rounded-2xl p-6 text-white relative overflow-hidden shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-[#AAFF00] font-bold uppercase tracking-wider bg-[#AAFF00]/15 px-2.5 py-0.5 rounded-full">
                {student.program || 'Sethu'} Program
              </span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-300 font-medium">
                {student.stage || 'Grade 11'}
              </span>
            </div>
            <h2 className="text-2xl font-black text-white">
              Welcome back, {student.name || 'Student'} 👋
            </h2>
            <p className="text-gray-400 text-xs mt-1">
              {student.education?.stream ? `${student.education.stream} Stream` : 'Active Student'}
              {student.education?.institution ? ` · ${student.education.institution}` : ''}
              {student.centerId ? ` · Center: ${student.centerId}` : ''}
            </p>
          </div>

          {/* Profile Completion Ring / Callout */}
          <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-3.5 rounded-xl self-start md:self-auto">
            <div className="text-right">
              <p className="text-xl font-black text-[#AAFF00]">{completion}%</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">Profile Complete</p>
            </div>
            <Link to="/student/profile">
              <Button size="sm" variant="outline" className="text-xs border-white/20 hover:bg-white/10 text-white">
                Edit Profile
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Core KPI Stat Cards (Live Updating) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Academic Average */}
        <div className="bg-white p-5 rounded-2xl border border-[#e5e5e5] shadow-2xs hover:border-[#d1d1d1] transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#6b7280]">Academic Average</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#1a1a1a]">
              {progress.academicAverage ? `${progress.academicAverage}%` : '—'}
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            {progress.totalAcademicRecords ? `${progress.totalAcademicRecords} tests logged` : 'No records yet'}
          </p>
        </div>

        {/* Attendance Rate */}
        <div className="bg-white p-5 rounded-2xl border border-[#e5e5e5] shadow-2xs hover:border-[#d1d1d1] transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#6b7280]">Attendance Rate</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <Activity size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#1a1a1a]">
              {progress.attendanceAverage ? `${progress.attendanceAverage}%` : '—'}
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            {progress.attendanceAverage >= 85 ? 'Healthy participation' : 'Log class attendance'}
          </p>
        </div>

        {/* Goals Progress */}
        <div className="bg-white p-5 rounded-2xl border border-[#e5e5e5] shadow-2xs hover:border-[#d1d1d1] transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#6b7280]">Goals Tracked</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Target size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#1a1a1a]">
              {progress.completedGoals || 0}/{progress.totalGoals || 0}
            </span>
            <span className="text-xs text-purple-600 font-semibold">Done</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            {progress.activeGoals || 0} active goal{progress.activeGoals === 1 ? '' : 's'}
          </p>
        </div>

        {/* Verified Skills */}
        <div className="bg-white p-5 rounded-2xl border border-[#e5e5e5] shadow-2xs hover:border-[#d1d1d1] transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#6b7280]">Skills Inventory</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Star size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#1a1a1a]">
              {progress.totalSkills || 0}
            </span>
            <span className="text-xs text-amber-600 font-semibold">Skills</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            {skillsByCategory.technical || 0} technical · {skillsByCategory.soft || 0} soft
          </p>
        </div>
      </div>

      {/* Lifecycle Journey Roadmap Stepper */}
      <Card>
        <CardHeader
          title="Lifecycle Journey Roadmap 🚀"
          subtitle={`Current Stage: ${student.stage || 'Grade 11'} (${summary.journeyProgress || 20}% overall progress)`}
          action={
            <Link to="/student/journey">
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                View Journey <ArrowRight size={12} />
              </Button>
            </Link>
          }
        />
        <JourneyRoadmap currentStage={student.stage || 'Grade 11'} />
      </Card>

      {/* Visual Analytics Graphs Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graph 1: Academic Trend Chart */}
        <Card>
          <CardHeader
            title="Academic Performance Trend 📈"
            subtitle="Live trajectory of assessment scores and attendance rate"
            action={
              <Link to="/student/academic-records">
                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                  Records <ArrowRight size={12} />
                </Button>
              </Link>
            }
          />
          <AcademicTrendChart data={scoreTrend} />
        </Card>

        {/* Graph 2: Subject Mastery Bar Chart */}
        <Card>
          <CardHeader
            title="Subject Proficiency Breakdown 📊"
            subtitle="Average marks across logged subjects with mastery indicators"
            action={
              <Link to="/student/academic-records">
                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                  Add Marks <ArrowRight size={12} />
                </Button>
              </Link>
            }
          />
          <SubjectBarChart subjects={subjectBreakdown} />
        </Card>
      </div>

      {/* Skills Taxonomy & Top Competencies */}
      <Card>
        <CardHeader
          title="Skills Inventory & Taxonomy 💡"
          subtitle="Distribution of your logged competencies across key domain categories"
          action={
            <Link to="/student/skills">
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                Manage Skills <ArrowRight size={12} />
              </Button>
            </Link>
          }
        />
        <SkillsTaxonomyChart skillsByCategory={skillsByCategory} totalSkills={progress.totalSkills || 0} />

        {topSkills.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[#f0f0f0]">
            <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-2">
              Top Highlighted Competencies
            </p>
            <div className="flex flex-wrap gap-2">
              {topSkills.map((sk) => (
                <span
                  key={sk._id}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#fafafa] border border-[#e5e5e5] rounded-lg text-xs font-semibold text-[#1a1a1a]"
                >
                  <Award size={12} className="text-amber-500" />
                  {sk.name}
                  <span className="text-[10px] text-gray-500 font-normal capitalize">({sk.level})</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Recent Goals & Interactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Goals */}
        <Card>
          <CardHeader
            title="Active Goals & Milestones 🎯"
            subtitle="Goals you are currently advancing"
            action={
              <Link to="/student/goals">
                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                  View all <ArrowRight size={12} />
                </Button>
              </Link>
            }
          />
          {recentGoals.length === 0 ? (
            <div className="py-8 text-center">
              <Target size={32} className="text-[#d1d1d1] mx-auto mb-2" />
              <p className="text-xs text-[#6b7280]">No active goals found.</p>
              <Link to="/student/goals" className="text-xs font-semibold text-[#1a1a1a] underline mt-1 inline-block">
                Create a Goal →
              </Link>
            </div>
          ) : (
            <ul className="space-y-3.5">
              {recentGoals.slice(0, 4).map((g) => (
                <li key={g._id} className="p-3 bg-[#fafafa] rounded-xl border border-[#f0f0f0]">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <p className="text-xs font-bold text-[#1a1a1a] truncate">{g.title}</p>
                    <span className="shrink-0">{statusBadge(g.status)}</span>
                  </div>
                  <ProgressBar value={g.progress || 0} max={100} showPercent />
                  {g.targetDate && (
                    <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                      <Calendar size={10} />
                      Due {safeFormatDate(g.targetDate)}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Recent Coordinator Interactions */}
        <Card>
          <CardHeader
            title="Coordinator Guidance & Interactions 🤝"
            subtitle="Notes from mentorship and center check-ins"
            action={
              <Link to="/student/support">
                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                  Support <ArrowRight size={12} />
                </Button>
              </Link>
            }
          />
          {recentInteractions.length === 0 ? (
            <div className="py-8 text-center">
              <Brain size={32} className="text-[#d1d1d1] mx-auto mb-2" />
              <p className="text-xs text-[#6b7280]">No recent coordinator meetings logged.</p>
              <p className="text-[11px] text-gray-400 mt-1">Check-in notes with your center coordinator will appear here.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {recentInteractions.slice(0, 4).map((i) => (
                <li key={i._id} className="p-3 bg-[#fafafa] rounded-xl border border-[#f0f0f0] flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#1a1a1a] text-[#AAFF00] flex items-center justify-center shrink-0 mt-0.5">
                    <Brain size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-[#1a1a1a] capitalize">
                        {i.type?.replace(/_/g, ' ')}
                      </p>
                      <p className="text-[10px] text-gray-400 shrink-0">
                        {safeFormatDate(i.interactionDate)}
                      </p>
                    </div>
                    <p className="text-xs text-[#4b5563] mt-0.5 line-clamp-2">{i.notes || 'No meeting notes recorded'}</p>
                    {i.coordinatorId?.name && (
                      <p className="text-[10px] text-emerald-700 font-medium mt-1">
                        Coordinator: {i.coordinatorId.name}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Quick Action Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { to: '/student/academic-records', icon: BookOpen, label: 'Add Record', desc: 'Exam Marks' },
          { to: '/student/skills', icon: Star, label: 'Add Skill', desc: 'Certifications' },
          { to: '/student/goals', icon: Target, label: 'Add Goal', desc: 'Milestones' },
          { to: '/student/career', icon: Award, label: 'Career Profile', desc: 'Readiness Score' },
          { to: '/student/ai', icon: Brain, label: 'AI Insights', desc: 'Action Roadmap' },
        ].map(({ to, icon: Icon, label, desc }) => (
          <Link key={to} to={to}>
            <div className="border border-[#e5e5e5] bg-white rounded-2xl p-4 flex flex-col items-center gap-1.5 hover:border-[#AAFF00] hover:bg-[#AAFF00]/5 transition-all cursor-pointer text-center group shadow-2xs">
              <div className="w-9 h-9 rounded-xl bg-[#f5f5f0] group-hover:bg-[#AAFF00] flex items-center justify-center transition-colors">
                <Icon size={17} className="text-[#1a1a1a]" />
              </div>
              <span className="text-xs font-bold text-[#1a1a1a]">{label}</span>
              <span className="text-[10px] text-gray-400">{desc}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
