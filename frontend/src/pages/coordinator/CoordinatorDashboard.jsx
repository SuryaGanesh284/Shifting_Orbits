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

  const metrics = dash?.metrics || dash?.stats || {};
  const followups = dash?.overdueFollowUps || dash?.upcomingFollowUps || dash?.pendingFollowUps || [];
  const attention = dash?.studentsNeedingAttention || [];
  const supportRequests = dash?.pendingSupportRequests || [];

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="bg-[#1a1a1a] rounded-2xl p-6 flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm mb-1">Coordinator Dashboard</p>
          <h2 className="text-2xl font-black text-white">Good to see you 👋</h2>
          <p className="text-gray-400 text-sm mt-1">Manage your students, track alerts, and review support requests.</p>
        </div>
        <div className="hidden sm:flex gap-3">
          <Link to="/coordinator/students"><Button variant="lime" size="sm">View Students</Button></Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Students" value={metrics.totalStudents ?? '—'} icon={Users} accent />
        <StatCard title="Active Students" value={metrics.activeStudents ?? metrics.totalStudents ?? '—'} icon={Users} />
        <StatCard title="Open Follow-ups" value={metrics.overdueFollowUpsCount ?? followups.length ?? '—'} icon={ClipboardList} />
        <StatCard title="Pending Requests" value={metrics.pendingSupportRequestsCount ?? supportRequests.length ?? '—'} icon={AlertTriangle} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Students Needing Attention */}
        <Card>
          <CardHeader title="Needs Attention ⚠️" subtitle="High-priority students requiring follow-up" action={
            <Link to="/coordinator/attention"><Button variant="ghost" size="sm">View all</Button></Link>
          } />
          {attention.length === 0 ? (
            <p className="text-sm text-[#6b7280] text-center py-6">All students are on track 🎉</p>
          ) : (
            <ul className="space-y-3">
              {attention.slice(0, 5).map((s) => {
                const st = s.student || s;
                const name = st.userId?.name || st.name || 'Student';
                const stage = st.stage || 'Grade 11';
                const id = st._id || s._id;
                return (
                  <li key={id} className="flex items-center justify-between p-2 rounded-xl hover:bg-[#fafafa]">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 font-bold text-xs">
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#1a1a1a]">{name}</p>
                        <p className="text-xs text-[#6b7280]">{stage} · Score: {s.score || 0}/100</p>
                      </div>
                    </div>
                    <Link to={`/coordinator/students/${id}`}>
                      <Button variant="outline" size="sm">View 360°</Button>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* Pending Student Support Requests */}
        <Card>
          <CardHeader title="Student Support Requests 🆘" subtitle="Inquiries and help requests from students" />
          {supportRequests.length === 0 ? (
            <p className="text-sm text-[#6b7280] text-center py-6">No pending support requests.</p>
          ) : (
            <ul className="space-y-3">
              {supportRequests.slice(0, 5).map((r) => {
                const studentName = r.studentId?.userId?.name || r.studentId?.name || 'Student';
                const studentId = r.studentId?._id || r.studentId;
                return (
                  <li key={r._id} className="p-3 bg-[#fafafa] rounded-xl border border-[#f0f0f0] flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-bold text-[#1a1a1a] truncate">{studentName}</span>
                        {priorityBadge(r.priority)}
                      </div>
                      <p className="text-xs font-medium text-gray-700 truncate">{r.title}</p>
                      <p className="text-[11px] text-gray-500 line-clamp-1">{r.description}</p>
                    </div>
                    <Link to={`/coordinator/students/${studentId}`} className="shrink-0 self-center">
                      <Button variant="outline" size="sm" className="text-xs">Profile</Button>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      {/* Upcoming / Overdue Follow-ups */}
      <Card>
        <CardHeader title="Open Follow-ups & Reminders 📌" action={
          <Link to="/coordinator/followups"><Button variant="ghost" size="sm">View all</Button></Link>
        } />
        {followups.length === 0 ? (
          <p className="text-sm text-[#6b7280] text-center py-6">No open follow-ups.</p>
        ) : (
          <ul className="space-y-3">
            {followups.slice(0, 5).map((f) => {
              const studentName = f.studentId?.userId?.name || f.studentId?.name || 'Student';
              let dateStr = '';
              try { if (f.dueDate) dateStr = format(new Date(f.dueDate), 'dd MMM yyyy'); } catch {}
              return (
                <li key={f._id} className="flex items-start gap-3 p-3 bg-[#fafafa] rounded-xl border border-[#f0f0f0]">
                  <div className="w-8 h-8 rounded-lg bg-[#1a1a1a] text-[#AAFF00] flex items-center justify-center shrink-0 mt-0.5">
                    <ClipboardList size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-[#1a1a1a] truncate">{f.title}</p>
                      {priorityBadge(f.priority)}
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">Student: {studentName}</p>
                    {dateStr && <p className="text-[11px] text-gray-400 mt-0.5">Due: {dateStr}</p>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
