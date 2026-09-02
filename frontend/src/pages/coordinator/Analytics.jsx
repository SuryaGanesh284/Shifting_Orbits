import { useEffect, useState } from 'react';
import api from '../../lib/api';
import StatCard from '../../components/ui/StatCard';
import Card, { CardHeader } from '../../components/ui/Card';
import ProgressBar from '../../components/ui/ProgressBar';
import { BarChart2, TrendingUp, Users } from 'lucide-react';

export default function Analytics() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/overview')
      .then(({ data }) => setOverview(data.data || data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-[#AAFF00] border-t-transparent rounded-full animate-spin" /></div>;

  const stats = overview?.stats || overview || {};
  const stageDistribution = overview?.stageDistribution || [];
  const programDistribution = overview?.programDistribution || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#1a1a1a] rounded-2xl p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#AAFF00] flex items-center justify-center">
            <BarChart2 size={20} className="text-[#1a1a1a]" />
          </div>
          <div>
            <h2 className="text-white font-black text-lg">Platform Analytics</h2>
            <p className="text-gray-400 text-sm">Overview of all student activity and engagement</p>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Students" value={stats.totalStudents ?? '—'} icon={Users} accent />
        <StatCard title="Interactions" value={stats.totalInteractions ?? '—'} icon={TrendingUp} />
        <StatCard title="Follow-ups" value={stats.totalFollowUps ?? '—'} icon={BarChart2} />
        <StatCard title="Support Requests" value={stats.totalSupportRequests ?? '—'} icon={Users} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stage Distribution */}
        {stageDistribution.length > 0 && (
          <Card>
            <CardHeader title="Stage Distribution" />
            <div className="space-y-3">
              {stageDistribution.map((item) => (
                <div key={item._id || item.stage}>
                  <ProgressBar
                    label={item._id || item.stage || 'Unknown'}
                    value={item.count}
                    max={stats.totalStudents || 1}
                    showPercent={false}
                  />
                  <p className="text-xs text-right text-[#9ca3af] -mt-1">{item.count} students</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Program Distribution */}
        {programDistribution.length > 0 && (
          <Card>
            <CardHeader title="Programme Distribution" />
            <div className="space-y-4">
              {programDistribution.map((item) => (
                <div key={item._id || item.program} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${item._id === 'Sethu' || item.program === 'Sethu' ? 'bg-[#AAFF00]' : 'bg-[#1a1a1a]'}`} />
                    <span className="text-sm font-medium text-[#1a1a1a]">{item._id || item.program}</span>
                  </div>
                  <span className="text-sm font-black text-[#1a1a1a]">{item.count}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Raw stats fallback */}
        {stageDistribution.length === 0 && programDistribution.length === 0 && (
          <Card className="lg:col-span-2">
            <CardHeader title="Platform Summary" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {Object.entries(stats).filter(([, v]) => typeof v === 'number').map(([k, v]) => (
                <div key={k} className="p-4 bg-[#fafafa] rounded-xl border border-[#f0f0f0] text-center">
                  <p className="text-2xl font-black text-[#1a1a1a]">{v}</p>
                  <p className="text-xs text-[#6b7280] mt-1 capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}</p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
