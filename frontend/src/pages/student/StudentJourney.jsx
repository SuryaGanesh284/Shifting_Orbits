import { useEffect, useState } from 'react';
import api from '../../lib/api';
import Card from '../../components/ui/Card';
import ProgressBar from '../../components/ui/ProgressBar';
import Button from '../../components/ui/Button';
import {
  CheckCircle2,
  Compass,
  ArrowRight,
  GraduationCap,
  BookOpen,
  Briefcase,
  Star,
  Award
} from 'lucide-react';
import { Link } from 'react-router-dom';

const STAGE_DETAILS = {
  grade_11: {
    icon: BookOpen,
    color: 'emerald',
    program: 'Sethu Foundation',
    timeline: 'Year 1',
    milestones: [
      'Core stream selection (Science / Commerce / Arts)',
      'Baseline academic diagnostic evaluation',
      'Initial foundation mentor assignment',
      'Term examination score tracking'
    ],
    actionText: 'Log Grade 11 Marks',
    actionUrl: '/student/academic-records'
  },
  grade_12: {
    icon: GraduationCap,
    color: 'blue',
    program: 'Sethu Senior Secondary',
    timeline: 'Year 2',
    milestones: [
      'Board examination preparation and tracking',
      'Competitive entrance exam registrations (JEE, NEET, CUET, KCET)',
      'Higher education counseling and college selection',
      'Scholarship application readiness'
    ],
    actionText: 'Track Goals & Milestones',
    actionUrl: '/student/goals'
  },
  higher_education: {
    icon: Compass,
    color: 'purple',
    program: 'Stambha Program',
    timeline: 'Years 3 - 5 / Degree',
    milestones: [
      'College enrollment & degree pursuit',
      'Semester-wise CGPA and attendance monitoring',
      'Financial scholarship disbursement & sponsorship review',
      'Academic support interventions and tutoring'
    ],
    actionText: 'View Academics',
    actionUrl: '/student/academic-records'
  },
  skill_development: {
    icon: Star,
    color: 'amber',
    program: 'Industry Readiness',
    timeline: 'Pre-Final / Final Year',
    milestones: [
      'Technical proficiencies and hands-on projects',
      'Industry-recognized certifications',
      'Soft skills, resume workshop, and mock interviews',
      'Career benchmark gap analysis alignment'
    ],
    actionText: 'Manage Skills',
    actionUrl: '/student/skills'
  },
  internship: {
    icon: Briefcase,
    color: 'teal',
    program: 'Practical Exposure',
    timeline: 'Final Year / Capstone',
    milestones: [
      'Real-world corporate internship or industry project',
      'Industry mentor weekly check-ins and feedback',
      'Practical problem-solving capstone submission',
      'Pre-placement evaluation & conversion review'
    ],
    actionText: 'Career Match Analysis',
    actionUrl: '/student/career'
  },
  employment: {
    icon: Award,
    color: 'green',
    program: 'Career Launch',
    timeline: 'Placement & Beyond',
    milestones: [
      'Full-time offer acceptance and onboarding',
      'Sustainable career launch breaking cycle of poverty',
      'Alumni network engagement and peer mentoring',
      'First-year professional retention monitoring'
    ],
    actionText: 'AI Career Guidance',
    actionUrl: '/student/ai'
  }
};

export default function StudentJourney() {
  const [journeyData, setJourneyData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/students/me/journey')
      .then(({ data }) => setJourneyData(data.data || data))
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

  const stages = journeyData?.stages || [];
  const currentStage = journeyData?.currentStage || 'Grade 11';
  const program = journeyData?.program || 'Sethu';

  const completedCount = stages.filter((s) => s.isCompleted).length;
  const progressPercent = Math.round((completedCount / (stages.length || 6)) * 100);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header Banner */}
      <div className="bg-[#1a1a1a] rounded-2xl p-6 text-white relative overflow-hidden shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-[#AAFF00] font-bold uppercase tracking-wider bg-[#AAFF00]/15 px-2.5 py-0.5 rounded-full">
                {program} Program Journey
              </span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-300 font-medium">6 Comprehensive Stages</span>
            </div>
            <h2 className="text-2xl font-black text-white">
              Lifecycle Journey Roadmap 🚀
            </h2>
            <p className="text-gray-400 text-xs mt-1 max-w-xl">
              From Grade 11 foundational learning through higher education, professional skill development, and full employment placement.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-right shrink-0">
            <p className="text-2xl font-black text-[#AAFF00]">{progressPercent}%</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Overall Journey Completion</p>
            <p className="text-xs text-gray-300 mt-0.5 font-semibold">Active: {currentStage}</p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <Card>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#1a1a1a]">Progression Milestone</span>
            <span className="text-gray-500 font-bold">{completedCount} of {stages.length} Stages Completed</span>
          </div>
          <ProgressBar value={progressPercent} max={100} showPercent />
        </div>
      </Card>

      {/* Stages Timeline List */}
      <div className="space-y-4">
        {stages.map((stage, idx) => {
          const detail = STAGE_DETAILS[stage.id] || {};
          const Icon = detail.icon || Compass;
          const isCompleted = stage.isCompleted;
          const isCurrent = stage.isCurrent;

          return (
            <div
              key={stage.id}
              className={`rounded-2xl border transition-all p-5 ${
                isCurrent
                  ? 'bg-white border-[#1a1a1a] shadow-md ring-2 ring-[#AAFF00]/40'
                  : isCompleted
                  ? 'bg-[#fafafa] border-[#e5e5e5]'
                  : 'bg-white border-[#e5e5e5] opacity-75'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                {/* Icon & Title */}
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isCompleted
                        ? 'bg-emerald-100 text-emerald-700'
                        : isCurrent
                        ? 'bg-[#1a1a1a] text-[#AAFF00]'
                        : 'bg-[#f0f0f0] text-gray-400'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 size={20} /> : <Icon size={20} />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-gray-400">Step {idx + 1}</span>
                      <span className="text-xs text-gray-300">·</span>
                      <span className="text-xs text-gray-500 font-medium">{detail.program}</span>
                      <span className="text-xs text-gray-300">·</span>
                      <span className="text-xs text-gray-400">{detail.timeline}</span>
                    </div>

                    <h3 className="text-base font-black text-[#1a1a1a] mt-0.5 flex items-center gap-2">
                      {stage.title}
                      {isCurrent && (
                        <span className="px-2 py-0.5 bg-[#AAFF00] text-black text-[10px] font-bold rounded-full uppercase tracking-wider">
                          Current Stage
                        </span>
                      )}
                      {isCompleted && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full uppercase tracking-wider">
                          Completed ✓
                        </span>
                      )}
                    </h3>

                    <p className="text-xs text-[#4b5563] mt-1 leading-relaxed">
                      {stage.description}
                    </p>

                    {/* Milestones Checklist */}
                    {detail.milestones && (
                      <div className="mt-3 pt-3 border-t border-[#f0f0f0]">
                        <p className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider mb-2">
                          Key Deliverables & Milestones
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {detail.milestones.map((m, mIdx) => (
                            <div key={mIdx} className="flex items-center gap-2 text-xs text-[#374151]">
                              <span className={`w-1.5 h-1.5 rounded-full ${isCompleted ? 'bg-emerald-500' : isCurrent ? 'bg-[#1a1a1a]' : 'bg-gray-300'}`} />
                              <span>{m}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Direct Action Link */}
                {detail.actionUrl && (
                  <div className="sm:self-center shrink-0">
                    <Link to={detail.actionUrl}>
                      <Button
                        size="sm"
                        variant={isCurrent ? 'primary' : 'outline'}
                        className="gap-1.5 text-xs w-full sm:w-auto"
                      >
                        {detail.actionText || 'Open Module'}
                        <ArrowRight size={13} />
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
