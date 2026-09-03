import { useEffect, useState } from 'react';
import api from '../../lib/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import ProgressBar from '../../components/ui/ProgressBar';
import EmptyState from '../../components/ui/EmptyState';
import { Search, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const programColor = { Sethu: 'green', Stambha: 'blue' };

export default function StudentList() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/coordinator/students')
      .then(({ data }) => {
        const list = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
        setStudents(list);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = students.filter((s) => {
    const name = s.userId?.name || s.name || s.user?.name || '';
    const email = s.userId?.email || s.email || s.user?.email || '';
    return name.toLowerCase().includes(search.toLowerCase()) || email.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-5">
      {/* Header controls & capacity badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative max-w-sm w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your assigned students…"
            className="w-full pl-9 pr-4 py-2.5 border border-[#e5e5e5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#AAFF00]"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto px-3.5 py-1.5 bg-gray-100 rounded-full border border-gray-200">
          <span className="w-2 h-2 rounded-full bg-[#AAFF00]" />
          <span className="text-xs font-bold text-gray-800">
            Assigned: {students.length} / 4 Students
          </span>
          <span className="text-[10px] text-gray-500 font-medium">
            (Max capacity: 4)
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-[#AAFF00] border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title="No students found" description={search ? 'Try a different search term.' : 'No students are assigned to you yet.'} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((s) => {
            const id = s._id || s.student?._id;
            const name = s.userId?.name || s.name || s.user?.name || 'Student';
            const email = s.userId?.email || s.email || s.user?.email;
            const program = s.program || s.student?.program;
            const stage = s.stage || s.student?.stage;
            const completion = s.profileCompletion || s.student?.profileCompletion || 20;

            return (
              <Card key={id} hover>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#AAFF00] flex items-center justify-center shrink-0">
                      <span className="text-[#1a1a1a] font-black text-sm">{name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#1a1a1a]">{name}</p>
                      {email && <p className="text-xs text-[#6b7280]">{email}</p>}
                    </div>
                  </div>
                  {program && <Badge color={programColor[program] || 'gray'}>{program}</Badge>}
                </div>

                {stage && (
                  <p className="text-xs text-[#6b7280] mb-3">
                    <span className="font-medium text-[#1a1a1a]">Stage:</span> {stage}
                  </p>
                )}

                <ProgressBar value={completion} label="Profile" />

                <div className="mt-4">
                  <Link to={`/coordinator/students/${id}`}>
                    <Button variant="outline" size="sm" className="w-full">View Profile</Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
