import { useState } from 'react';
import api from '../../lib/api';
import Card, { CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';
import { Brain, Lightbulb, Map, Target, Zap } from 'lucide-react';

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

  const renderContent = (content) => {
    if (!content) return null;
    if (typeof content === 'string') return <p className="text-sm text-[#2d2d2d] whitespace-pre-wrap leading-relaxed">{content}</p>;
    return <pre className="text-xs text-[#2d2d2d] whitespace-pre-wrap bg-[#fafafa] p-4 rounded-xl border border-[#f0f0f0] overflow-x-auto">{JSON.stringify(content, null, 2)}</pre>;
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Hero */}
      <div className="bg-[#1a1a1a] rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#AAFF00] flex items-center justify-center">
            <Brain size={20} className="text-[#1a1a1a]" />
          </div>
          <div>
            <h2 className="text-white font-black text-lg">AI-Powered Insights</h2>
            <p className="text-gray-400 text-sm">Personalised recommendations just for you</p>
          </div>
        </div>
      </div>

      {/* Nudges */}
      <Card>
        <CardHeader
          title="Smart Nudges"
          subtitle="Quick personalised recommendations"
          action={<Button onClick={fetchNudges} loading={loading.nudges} size="sm" className="gap-1.5"><Zap size={13} /> Get Nudges</Button>}
        />
        {nudges ? renderContent(nudges) : (
          <div className="py-8 text-center">
            <Lightbulb size={32} className="text-[#d1d1d1] mx-auto mb-3" />
            <p className="text-sm text-[#6b7280]">Click "Get Nudges" to receive personalised tips.</p>
          </div>
        )}
      </Card>

      {/* Action Plan */}
      <Card>
        <CardHeader title="Action Plan Generator" subtitle="A structured plan based on your profile" />
        <div className="flex gap-3 mb-4">
          <input
            className="flex-1 px-4 py-2.5 border border-[#e5e5e5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#AAFF00]"
            placeholder="Focus area (optional): e.g. Academics, Skills, Career…"
            value={focusArea}
            onChange={(e) => setFocusArea(e.target.value)}
          />
          <Button onClick={fetchPlan} loading={loading.plan} size="sm" className="gap-1.5 shrink-0"><Map size={13} /> Generate</Button>
        </div>
        {actionPlan ? renderContent(actionPlan) : (
          <div className="py-8 text-center">
            <Target size={32} className="text-[#d1d1d1] mx-auto mb-3" />
            <p className="text-sm text-[#6b7280]">Generate a personalised action plan to reach your goals.</p>
          </div>
        )}
      </Card>

      {/* Career Match */}
      <Card>
        <CardHeader title="Career Match" subtitle="See how well your profile matches a career" />
        <div className="flex gap-3 mb-4">
          <input
            className="flex-1 px-4 py-2.5 border border-[#e5e5e5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#AAFF00]"
            placeholder="Target career (optional): e.g. Data Scientist…"
            value={targetCareer}
            onChange={(e) => setTargetCareer(e.target.value)}
          />
          <Button onClick={fetchCareer} loading={loading.career} size="sm" className="gap-1.5 shrink-0"><Brain size={13} /> Match</Button>
        </div>
        {careerMatch ? renderContent(careerMatch) : (
          <div className="py-8 text-center">
            <Brain size={32} className="text-[#d1d1d1] mx-auto mb-3" />
            <p className="text-sm text-[#6b7280]">Discover how your skills and aspirations align with a career path.</p>
          </div>
        )}
      </Card>
    </div>
  );
}
