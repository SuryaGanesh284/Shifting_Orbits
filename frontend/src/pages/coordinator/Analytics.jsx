import { useEffect, useState, useCallback } from 'react';
import api from '../../lib/api';
import { getSocket } from '../../lib/socket';
import StatCard from '../../components/ui/StatCard';
import Card, { CardHeader } from '../../components/ui/Card';
import ProgressBar from '../../components/ui/ProgressBar';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';
import {
  BarChart2,
  TrendingUp,
  Users,
  ShieldAlert,
  Award,
  CalendarCheck,
  CheckCircle2,
  RotateCw,
  MapPin,
  Compass
} from 'lucide-react';

export default function Analytics() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = useCallback(async (isSilent = false) => {
    if (isSilent) setRefreshing(true);
    else setLoading(true);

    try {
      const { data } = await api.get('/analytics/overview');
      setOverview(data.data || data);
      if (isSilent) toast.success('Analytics updated!');
    } catch (err) {
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics(false);

    // Listen for real-time changes
    const socket = getSocket();
    if (socket) {
      const handleUpdate = () => fetchAnalytics(true);
      socket.on('support_request.created', handleUpdate);
      socket.on('support_request.updated', handleUpdate);
      socket.on('interaction.created', handleUpdate);
      socket.on('followup.created', handleUpdate);

      return () => {
        socket.off('support_request.created', handleUpdate);
        socket.off('support_request.updated', handleUpdate);
        socket.off('interaction.created', handleUpdate);
        socket.off('followup.created', handleUpdate);
      };
    }
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#AAFF00] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const summary = overview?.summary || overview?.stats || overview || {};

  // Safe normalized array conversions
  const stageDistribution = Array.isArray(overview?.stagesList)
    ? overview.stagesList
    : Array.isArray(overview?.stageDistribution)
    ? overview.stageDistribution
    : Object.entries(overview?.stageDistribution || {}).map(([stage, count]) => ({ stage, _id: stage, count }));

  const programDistribution = Array.isArray(overview?.programsList)
    ? overview.programsList
    : Array.isArray(overview?.programDistribution)
    ? overview.programDistribution
    : Object.entries(overview?.programDistribution || {}).map(([program, count]) => ({ program, _id: program, count }));

  const centerDistribution = Array.isArray(overview?.centersList)
    ? overview.centersList
    : Array.isArray(overview?.centerDistribution)
    ? overview.centerDistribution
    : Object.entries(overview?.centerDistribution || {}).map(([center, count]) => ({ center, _id: center, count }));

  const priority = overview?.supportPriorityDistribution || { LOW: 0, MODERATE: 0, HIGH: 0, URGENT: 0 };
  const totalPriorityStudents = (priority.LOW || 0) + (priority.MODERATE || 0) + (priority.HIGH || 0) + (priority.URGENT || 0) || summary.totalStudents || 1;

  const totalStudents = summary.totalStudents || 0;
  const activeStudents = summary.activeStudents || totalStudents;
  const totalInteractions = summary.totalInteractions ?? summary.totalInteractionsLogged ?? 0;
  const totalFollowUps = summary.totalFollowUps ?? 0;
  const totalRequests = summary.totalSupportRequests ?? 0;

  return (
    <div className="space-y-6">
      {/* Header with live sync */}
      <div className="bg-[#1a1a1a] rounded-2xl p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#AAFF00] flex items-center justify-center">
            <BarChart2 size={20} className="text-[#1a1a1a]" />
          </div>
          <div>
            <h2 className="text-white font-black text-lg">Institutional Analytics & Metrics</h2>
            <p className="text-gray-400 text-sm">Real-time intelligence across students, interventions, and centers</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchAnalytics(true)}
          disabled={refreshing}
          className="gap-2 text-white border-gray-700 hover:bg-gray-800"
        >
          <RotateCw size={13} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Syncing...' : 'Refresh'}
        </Button>
      </div>

      {/* Main KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={totalStudents}
          subtext={`${activeStudents} active profiles`}
          icon={Users}
          accent
        />
        <StatCard
          title="Interactions Logged"
          value={totalInteractions}
          subtext="Direct mentor touchpoints"
          icon={TrendingUp}
        />
        <StatCard
          title="Follow-up Completion"
          value={summary.followUpCompletionRate || '0%'}
          subtext={`${summary.completedFollowUps || 0} of ${totalFollowUps} resolved`}
          icon={CalendarCheck}
        />
        <StatCard
          title="Support Resolution"
          value={summary.supportRequestResolutionRate || '0%'}
          subtext={`${summary.resolvedSupportRequests || 0} of ${totalRequests} resolved`}
          icon={CheckCircle2}
        />
      </div>

      {/* Health & Priority Risk Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Support Risk / Priority Distribution */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Student Support Priority & Risk Distribution"
            subtitle="AI-calculated risk level based on academics, attendance, and support requests"
          />
          <div className="space-y-4 pt-1">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-center">
                <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Low Risk</p>
                <p className="text-2xl font-black text-emerald-900 mt-1">{priority.LOW || 0}</p>
                <p className="text-[10px] text-emerald-600 mt-0.5">On track</p>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-center">
                <p className="text-xs font-bold text-blue-800 uppercase tracking-wider">Moderate</p>
                <p className="text-2xl font-black text-blue-900 mt-1">{priority.MODERATE || 0}</p>
                <p className="text-[10px] text-blue-600 mt-0.5">Monitoring</p>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-center">
                <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">High Risk</p>
                <p className="text-2xl font-black text-amber-900 mt-1">{priority.HIGH || 0}</p>
                <p className="text-[10px] text-amber-600 mt-0.5">Needs intervention</p>
              </div>
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-center">
                <p className="text-xs font-bold text-rose-800 uppercase tracking-wider">Urgent</p>
                <p className="text-2xl font-black text-rose-900 mt-1">{priority.URGENT || 0}</p>
                <p className="text-[10px] text-rose-600 mt-0.5">Immediate action</p>
              </div>
            </div>

            {/* Stacked Risk Progress Bar */}
            <div className="pt-2">
              <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${((priority.LOW || 0) / totalPriorityStudents) * 100}%` }}
                  className="bg-emerald-500 transition-all duration-500"
                  title={`Low: ${priority.LOW || 0}`}
                />
                <div
                  style={{ width: `${((priority.MODERATE || 0) / totalPriorityStudents) * 100}%` }}
                  className="bg-blue-500 transition-all duration-500"
                  title={`Moderate: ${priority.MODERATE || 0}`}
                />
                <div
                  style={{ width: `${((priority.HIGH || 0) / totalPriorityStudents) * 100}%` }}
                  className="bg-amber-500 transition-all duration-500"
                  title={`High: ${priority.HIGH || 0}`}
                />
                <div
                  style={{ width: `${((priority.URGENT || 0) / totalPriorityStudents) * 100}%` }}
                  className="bg-rose-500 transition-all duration-500"
                  title={`Urgent: ${priority.URGENT || 0}`}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Foundation Academic Health */}
        <Card>
          <CardHeader title="Foundation Averages" subtitle="Aggregate benchmark performance" />
          <div className="space-y-6 pt-2">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <Award size={14} className="text-amber-500" /> Average Academic Score
                </span>
                <span className="text-sm font-black text-gray-900">{summary.foundationAvgScore || 0}%</span>
              </div>
              <ProgressBar value={summary.foundationAvgScore || 0} max={100} showPercent={false} />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <CalendarCheck size={14} className="text-emerald-500" /> Attendance Benchmark
                </span>
                <span className="text-sm font-black text-gray-900">{summary.foundationAvgAttendance || 0}%</span>
              </div>
              <ProgressBar value={summary.foundationAvgAttendance || 0} max={100} showPercent={false} />
            </div>

            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between text-xs text-gray-600">
              <span>Coordinators on Platform:</span>
              <span className="font-bold text-gray-900">{summary.totalCoordinators || 1} active</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Stage, Program, and Center Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stage Distribution */}
        <Card>
          <CardHeader title="Stage Distribution" subtitle="Progression along educational phases" />
          <div className="space-y-3 pt-2">
            {stageDistribution.length === 0 ? (
              <p className="text-xs text-center text-gray-400 py-4">No stage records available</p>
            ) : (
              stageDistribution.map((item) => {
                const name = item.stage || item._id || 'Grade 11';
                const count = item.count || 0;
                return (
                  <div key={name}>
                    <div className="flex justify-between text-xs font-bold text-gray-700 mb-1">
                      <span>{name}</span>
                      <span>{count} ({Math.round((count / (totalStudents || 1)) * 100)}%)</span>
                    </div>
                    <ProgressBar value={count} max={totalStudents || 1} showPercent={false} />
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Program Distribution */}
        <Card>
          <CardHeader title="Programme Distribution" subtitle="Enrolment across key initiatives" />
          <div className="space-y-3 pt-2">
            {programDistribution.length === 0 ? (
              <p className="text-xs text-center text-gray-400 py-4">No program data available</p>
            ) : (
              programDistribution.map((item) => {
                const name = item.program || item._id || 'Sethu';
                const count = item.count || 0;
                const isSethu = name.toLowerCase().includes('sethu');
                return (
                  <div key={name} className="p-3 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3.5 h-3.5 rounded-full ${isSethu ? 'bg-[#AAFF00]' : 'bg-[#1a1a1a]'}`} />
                      <div>
                        <p className="text-sm font-bold text-[#1a1a1a]">{name}</p>
                        <p className="text-[11px] text-gray-500">
                          {isSethu ? 'High School & Pre-University' : 'Higher Education & Career'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-black text-gray-900">{count}</span>
                      <p className="text-[10px] text-gray-400">students</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Center Distribution */}
        <Card>
          <CardHeader title="Learning Centers" subtitle="Active community hub presence" />
          <div className="space-y-3 pt-2">
            {centerDistribution.length === 0 ? (
              <p className="text-xs text-center text-gray-400 py-4">No center data</p>
            ) : (
              centerDistribution.map((c) => {
                const name = c.center || c._id || 'SOF-BLR-01';
                const count = c.count || 0;
                return (
                  <div key={name} className="flex items-center justify-between p-3 rounded-xl bg-[#fafafa] border border-gray-100">
                    <div className="flex items-center gap-2.5">
                      <MapPin size={14} className="text-[#1a1a1a]" />
                      <span className="text-xs font-bold text-[#1a1a1a]">{name}</span>
                    </div>
                    <span className="text-xs font-black text-gray-800 px-2 py-0.5 bg-white border border-gray-200 rounded-full">
                      {count} students
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
