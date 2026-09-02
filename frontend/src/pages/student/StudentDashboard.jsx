import { useEffect, useState } from 'react';
import api from '../../lib/api';
import StatCard from '../../components/ui/StatCard';
import Card, { CardHeader } from '../../components/ui/Card';
import ProgressBar from '../../components/ui/ProgressBar';
import { statusBadge } from '../../components/ui/Badge';
import { BookOpen, Brain, HelpCircle, Star, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import { format } from 'date-fns';

export default function StudentDashboard() {
  const [dash, setDash] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/students/me/dashboard')
      .then(({ data }) => setDash(data.data || data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-[#AAFF00] border-t-transparent rounded-full animate-spin" /></div>;

  const student = dash?.student || {};
  const progress = dash?.progress || {};
  const recentGoals = dash?.recentGoals || [];
  const recentInteractions = dash?.recentInteractions || [];

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="bg-[#1a1a1a] rounded-2xl p-6 flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm mb-1">Welcome back 👋</p>
          <h2 className="text-2xl font-black text-white">{student.name || 'Student'}</h2>
          <p className="text-gray-400 text-sm mt-1">
            {student.program} · {student.stage}
          </p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-[#AAFF00] text-4xl font-black">{student.profileCompletion || 20}%</p>
          <p className="text-gray-400 text-xs mt-1">Profile complete</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Goals" value={progress.totalGoals ?? '—'} icon={Target} />
        <StatCard title="Skills" value={progress.totalSkills ?? '—'} icon={Star} />
        <StatCard title="Academic Records" value={progress.totalAcademicRecords ?? '—'} icon={BookOpen} />
        <StatCard title="Support Requests" value={progress.totalSupportRequests ?? '—'} icon={HelpCircle} />
      </div>

      {/* Profile Completion */}
      <Card>
        <CardHeader title="Profile Completion" action={
          <Link to="/student/profile"><Button variant="outline" size="sm">Complete Profile</Button></Link>
        } />
        <ProgressBar value={student.profileCompletion || 20} showPercent />
        <p className="text-xs text-[#6b7280] mt-2">Complete your profile to get better AI recommendations.</p>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Goals */}
        <Card>
          <CardHeader title="Recent Goals" action={
            <Link to="/student/goals"><Button variant="ghost" size="sm">View all</Button></Link>
          } />
          {recentGoals.length === 0 ? (
            <p className="text-sm text-[#6b7280] text-center py-6">No goals yet. <Link to="/student/goals" className="text-[#1a1a1a] font-medium underline underline-offset-2">Create one →</Link></p>
          ) : (
            <ul className="space-y-3">
              {recentGoals.slice(0, 4).map((g) => (
                <li key={g._id} className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1a1a1a] truncate">{g.title}</p>
                    <ProgressBar value={g.progress} max={100} showPercent={false} />
                  </div>
                  <span className="shrink-0">{statusBadge(g.status)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Recent Interactions */}
        <Card>
          <CardHeader title="Recent Interactions" />
          {recentInteractions.length === 0 ? (
            <p className="text-sm text-[#6b7280] text-center py-6">No interactions logged yet.</p>
          ) : (
            <ul className="space-y-3">
              {recentInteractions.slice(0, 4).map((i) => (
                <li key={i._id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#f5f5f0] flex items-center justify-center shrink-0">
                    <Brain size={14} className="text-[#1a1a1a]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#1a1a1a] capitalize">{i.type?.replace('_', ' ')}</p>
                    <p className="text-xs text-[#6b7280]">{i.notes?.slice(0, 60)}{i.notes?.length > 60 ? '…' : ''}</p>
                    <p className="text-xs text-[#9ca3af] mt-0.5">{i.interactionDate ? format(new Date(i.interactionDate), 'dd MMM yyyy') : ''}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { to: '/student/academic-records', icon: BookOpen, label: 'Add Record' },
          { to: '/student/skills', icon: Star, label: 'Add Skill' },
          { to: '/student/goals', icon: Target, label: 'Add Goal' },
          { to: '/student/ai', icon: Brain, label: 'AI Insights' },
        ].map(({ to, icon: Icon, label }) => (
          <Link key={to} to={to}>
            <div className="border border-[#e5e5e5] rounded-2xl p-4 flex flex-col items-center gap-2 hover:border-[#AAFF00] hover:bg-[#AAFF00]/5 transition-all cursor-pointer">
              <div className="w-9 h-9 rounded-xl bg-[#f5f5f0] flex items-center justify-center">
                <Icon size={17} className="text-[#1a1a1a]" />
              </div>
              <span className="text-xs font-medium text-[#1a1a1a]">{label}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
