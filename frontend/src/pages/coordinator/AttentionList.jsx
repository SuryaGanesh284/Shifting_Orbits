import { useEffect, useState } from 'react';
import api from '../../lib/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import { AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AttentionList() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/coordinator/attention')
      .then(({ data }) => setStudents(data.data || data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-[#AAFF00] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-center gap-3">
        <AlertTriangle size={20} className="text-orange-500 shrink-0" />
        <p className="text-sm text-orange-700">These students have been flagged based on risk factors like low academic scores, missed follow-ups, or overdue goals.</p>
      </div>

      {students.length === 0 ? (
        <EmptyState icon={AlertTriangle} title="No students need attention" description="All students are on track right now." />
      ) : (
        <div className="space-y-3">
          {students.map((s) => {
            const id = s._id || s.student?._id;
            const name = s.name || s.user?.name || 'Student';
            const stage = s.stage || s.student?.stage;
            const riskScore = s.riskScore || s.risk?.score;
            const reasons = s.reasons || s.risk?.reasons || [];

            return (
              <Card key={id} hover>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                      <span className="text-orange-600 font-black text-sm">{name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#1a1a1a]">{name}</p>
                      {stage && <p className="text-xs text-[#6b7280]">{stage}</p>}
                      {reasons.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {reasons.slice(0, 3).map((r, i) => (
                            <span key={i} className="text-[10px] bg-red-50 text-red-500 border border-red-100 px-2 py-0.5 rounded-full">{r}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {riskScore !== undefined && (
                      <div className="text-right">
                        <p className="text-xl font-black text-orange-500">{riskScore}</p>
                        <p className="text-[10px] text-[#9ca3af]">Risk Score</p>
                      </div>
                    )}
                    <Link to={`/coordinator/students/${id}`}>
                      <Button variant="outline" size="sm">View</Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
