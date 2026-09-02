import { useEffect, useState } from 'react';
import api from '../../lib/api';
import StatCard from '../../components/ui/StatCard';
import Card, { CardHeader } from '../../components/ui/Card';
import { priorityBadge } from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { AlertTriangle, ClipboardList, MessageSquare, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

export default function CoordinatorDashboard() {
  const [dash, setDash] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/coordinator/dashboard')
      .then(({ data }) => setDash(data.data || data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-[#AAFF00] border-t-transparent rounded-full animate-spin" /></div>;

  const stats = dash?.stats || {};
  const followups = dash?.upcomingFollowUps || dash?.pendingFollowUps || [];
  const attention = dash?.studentsNeedingAttention || [];

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="bg-[#1a1a1a] rounded-2xl p-6 flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm mb-1">Coordinator Dashboard</p>
          <h2 className="text-2xl font-black text-white">Good to see you 👋</h2>
          <p className="text-gray-400 text-sm mt-1">Manage your students and track their progress.</p>
        </div>
        <div className="hidden sm:flex gap-3">
          <Link to="/coordinator/students"><Button variant="lime" size="sm">View Students</Button></Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="My Students" value={stats.totalStudents ?? '—'} icon={Users} accent />
        <StatCard title="Interactions" value={stats.totalInteractions ?? '—'} icon={MessageSquare} />
        <StatCard title="Open Follow-ups" value={stats.pendingFollowUps ?? '—'} icon={ClipboardList} />
        <StatCard title="Need Attention" value={stats.studentsNeedingAttention ?? attention.length ?? '—'} icon={AlertTriangle} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Students Needing Attention */}
        <Card>
          <CardHeader title="Needs Attention" subtitle="High-risk students" action={
            <Link to="/coordinator/attention"><Button variant="ghost" size="sm">View all</Button></Link>
          } />
          {attention.length === 0 ? (
            <p className="text-sm text-[#6b7280] text-center py-6">All students are on track 🎉</p>
          ) : (
            <ul className="space-y-3">
              {attention.slice(0, 5).map((s) => (
                <li key={s._id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#AAFF00] flex items-center justify-center shrink-0">
                      <span className="text-[#1a1a1a] font-bold text-xs">{s.name?.charAt(0) || s.student?.name?.charAt(0) || 'S'}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#1a1a1a]">{s.name || s.student?.name}</p>
                      <p className="text-xs text-[#6b7280]">{s.stage || s.student?.stage}</p>
                    </div>
                  </div>
                  <Link to={`/coordinator/students/${s._id || s.student?._id}`}>
                    <Button variant="outline" size="sm">View</Button>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Upcoming Follow-ups */}
        <Card>
          <CardHeader title="Upcoming Follow-ups" action={
            <Link to="/coordinator/followups"><Button variant="ghost" size="sm">View all</Button></Link>
          } />
          {followups.length === 0 ? (
            <p className="text-sm text-[#6b7280] text-center py-6">No upcoming follow-ups.</p>
          ) : (
            <ul className="space-y-3">
              {followups.slice(0, 5).map((f) => (
                <li key={f._id} className="flex items-start gap-3 p-3 bg-[#fafafa] rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-[#f0f0f0] flex items-center justify-center shrink-0">
                    <ClipboardList size={14} className="text-[#1a1a1a]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#1a1a1a]">{f.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {priorityBadge(f.priority)}
                      <span className="text-xs text-[#9ca3af]">{f.dueDate ? format(new Date(f.dueDate), 'dd MMM') : ''}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
