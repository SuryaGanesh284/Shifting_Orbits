import { useEffect, useState, useCallback } from 'react';
import api from '../../lib/api';
import StatCard from '../../components/ui/StatCard';
import Card, { CardHeader } from '../../components/ui/Card';
import { priorityBadge, statusBadge } from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Textarea } from '../../components/ui/Input';
import { AlertTriangle, ClipboardList, Users, RotateCw, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { getSocket } from '../../lib/socket';
import toast from 'react-hot-toast';

export default function CoordinatorDashboard() {
  const [dash, setDash] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [resolvingReq, setResolvingReq] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [savingAction, setSavingAction] = useState(false);

  const fetchDashboard = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const { data } = await api.get('/coordinator/dashboard');
      setDash(data.data || data);
    } catch {
      if (!isSilent) toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard(false);

    const socket = getSocket();
    if (!socket) return;

    const handleUpdate = () => {
      fetchDashboard(true);
    };

    socket.on('support_request.created', handleUpdate);
    socket.on('support_request.updated', handleUpdate);

    return () => {
      socket.off('support_request.created', handleUpdate);
      socket.off('support_request.updated', handleUpdate);
    };
  }, [fetchDashboard]);

  const handleUpdateStatus = async (requestId, newStatus, notes = '') => {
    setSavingAction(true);
    try {
      await api.put(`/support-requests/${requestId}`, {
        status: newStatus,
        resolutionNotes: notes
      });
      toast.success(newStatus === 'resolved' ? 'Support request resolved!' : 'Request marked in progress');
      setResolvingReq(null);
      setResolutionNotes('');
      fetchDashboard(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update support request');
    } finally {
      setSavingAction(false);
    }
  };

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
          <Button variant="outline" size="sm" onClick={() => fetchDashboard(false)} disabled={refreshing} className="gap-1.5 text-white border-gray-700 hover:bg-gray-800">
            <RotateCw size={13} className={refreshing ? 'animate-spin' : ''} /> Refresh
          </Button>
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
          <CardHeader title="Student Support Requests 🆘" subtitle="Inquiries and help requests from students" action={
            <Button variant="ghost" size="sm" onClick={() => fetchDashboard(true)} className="gap-1 text-xs">
              <RotateCw size={11} className={refreshing ? 'animate-spin' : ''} /> Sync
            </Button>
          } />
          {supportRequests.length === 0 ? (
            <p className="text-sm text-[#6b7280] text-center py-6">No pending support requests.</p>
          ) : (
            <ul className="space-y-3">
              {supportRequests.slice(0, 5).map((r) => {
                const studentName = r.studentId?.userId?.name || r.studentId?.name || 'Student';
                const studentId = r.studentId?._id || r.studentId;
                return (
                  <li key={r._id} className="p-3.5 bg-[#fafafa] rounded-xl border border-[#f0f0f0] space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span className="text-xs font-bold text-[#1a1a1a]">{studentName}</span>
                          {priorityBadge(r.priority)}
                          {statusBadge(r.status)}
                          <span className="text-[10px] uppercase text-gray-500 border border-gray-200 px-1.5 py-0.5 rounded">{r.category}</span>
                        </div>
                        <p className="text-xs font-bold text-gray-800">{r.title}</p>
                        <p className="text-xs text-gray-600 line-clamp-2 mt-0.5">{r.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1.5 border-t border-gray-100">
                      <Link to={`/coordinator/students/${studentId}`} className="text-xs text-[#1a1a1a] font-medium hover:underline">
                        View 360° Profile →
                      </Link>
                      <div className="flex items-center gap-1.5">
                        {r.status === 'pending' && (
                          <Button variant="ghost" size="xs" onClick={() => handleUpdateStatus(r._id, 'in_progress')} disabled={savingAction} className="text-xs text-amber-700 hover:bg-amber-50">
                            Start Review
                          </Button>
                        )}
                        <Button variant="lime" size="xs" onClick={() => { setResolvingReq(r); setResolutionNotes(''); }} className="text-xs gap-1">
                          <CheckCircle2 size={12} /> Resolve
                        </Button>
                      </div>
                    </div>
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

      {/* Resolve Support Request Modal */}
      <Modal isOpen={!!resolvingReq} onClose={() => setResolvingReq(null)} title="Resolve Support Request">
        {resolvingReq && (
          <form onSubmit={(e) => { e.preventDefault(); handleUpdateStatus(resolvingReq._id, 'resolved', resolutionNotes); }} className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Student & Request</p>
              <p className="text-sm font-bold text-gray-900 mt-1">{resolvingReq.studentId?.userId?.name || resolvingReq.studentId?.name || 'Student'}</p>
              <p className="text-xs text-gray-700 font-medium">{resolvingReq.title}</p>
              <p className="text-xs text-gray-600 mt-1 p-2.5 bg-gray-50 rounded-lg border border-gray-100">{resolvingReq.description}</p>
            </div>
            <Textarea
              label="Resolution Notes *"
              placeholder="Explain how the issue was resolved (e.g., Connected student with the scholarship committee and arranged financial counseling)..."
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              required
              rows={3}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setResolvingReq(null)}>Cancel</Button>
              <Button type="submit" variant="lime" size="sm" loading={savingAction}>Confirm Resolution</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
