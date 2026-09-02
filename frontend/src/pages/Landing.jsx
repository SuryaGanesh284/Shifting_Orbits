import { ArrowRight, BookOpen, Brain, Target, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';

const features = [
  { icon: BookOpen, title: 'Track Academics', desc: 'Monitor grades, attendance and academic progress across all terms.' },
  { icon: Target,   title: 'Set & Hit Goals', desc: 'Define milestones, track progress and celebrate every win.' },
  { icon: Brain,    title: 'AI-Powered Insights', desc: 'Get personalised career matches and action plans powered by AI.' },
  { icon: Users,    title: 'Coordinator Support', desc: 'Stay connected with your coordinator for guidance and follow-ups.' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-[#e5e5e5]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#1a1a1a] flex items-center justify-center">
            <span className="text-[#AAFF00] font-black text-sm">SO</span>
          </div>
          <div>
            <p className="text-xs font-black text-[#1a1a1a] leading-tight tracking-tight">SHIFTING ORBITS</p>
            <p className="text-[9px] text-[#6b7280] tracking-widest uppercase">Foundation</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="outline" size="sm">Log in</Button>
          </Link>
          <Link to="/register">
            <Button variant="primary" size="sm">Sign up</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-8 pt-24 pb-20 flex flex-col lg:flex-row items-center gap-16">
        <div className="flex-1 max-w-xl">
          <span className="inline-block bg-[#AAFF00]/20 text-[#3a6e00] text-xs font-semibold px-3 py-1 rounded-full mb-6 border border-[#AAFF00]/40">
            Student Lifecycle Platform
          </span>
          <h1 className="text-5xl lg:text-6xl font-black text-[#1a1a1a] leading-[1.1] mb-6">
            Welcome to<br />
            <span className="relative">
              Shifting
              <span className="text-[#AAFF00]"> Orbits</span>
            </span>
          </h1>
          <p className="text-[#6b7280] text-lg leading-relaxed mb-8">
            A unified platform where students, coordinators and mentors come together to navigate the journey from Grade 11 to employment.
          </p>
          <div className="flex items-center gap-3">
            <Link to="/register">
              <Button variant="primary" size="lg" className="gap-2">
                Get started <ArrowRight size={16} />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg">Log in</Button>
            </Link>
          </div>
        </div>

        {/* Illustration placeholder */}
        <div className="flex-1 flex items-center justify-center">
          <div className="relative w-80 h-80">
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#e5e5e5] animate-spin" style={{ animationDuration: '30s' }} />
            <div className="absolute inset-8 rounded-full border-2 border-dashed border-[#AAFF00]/30 animate-spin" style={{ animationDuration: '20s', animationDirection: 'reverse' }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-28 h-28 rounded-2xl bg-[#1a1a1a] flex flex-col items-center justify-center shadow-2xl">
                <span className="text-[#AAFF00] font-black text-3xl">SO</span>
                <span className="text-[#6b7280] text-[9px] tracking-widest mt-1">FOUNDATION</span>
              </div>
            </div>
            {[BookOpen, Target, Brain, Users].map((Icon, i) => {
              const angles = [0, 90, 180, 270];
              const rad = (angles[i] * Math.PI) / 180;
              const r = 130;
              const x = 160 + r * Math.cos(rad) - 20;
              const y = 160 + r * Math.sin(rad) - 20;
              return (
                <div
                  key={i}
                  className="absolute w-10 h-10 rounded-xl bg-white border border-[#e5e5e5] shadow-md flex items-center justify-center"
                  style={{ left: x, top: y }}
                >
                  <Icon size={18} className="text-[#1a1a1a]" />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-[#F5F5F0] py-20">
        <div className="max-w-6xl mx-auto px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-[#1a1a1a] mb-3">Everything you need to grow</h2>
            <p className="text-[#6b7280]">Built for students on their journey from school to career.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-6 border border-[#e5e5e5] hover:shadow-md hover:-translate-y-1 transition-all duration-200">
                <div className="w-10 h-10 rounded-xl bg-[#1a1a1a] flex items-center justify-center mb-4">
                  <Icon size={18} className="text-[#AAFF00]" />
                </div>
                <h3 className="text-sm font-bold text-[#1a1a1a] mb-2">{title}</h3>
                <p className="text-xs text-[#6b7280] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Programmes */}
      <section className="max-w-6xl mx-auto px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-[#1a1a1a] rounded-3xl p-8 text-white">
            <span className="inline-block bg-[#AAFF00] text-[#1a1a1a] text-xs font-bold px-3 py-1 rounded-full mb-4">Sethu</span>
            <h3 className="text-2xl font-black mb-3">School to Higher Education</h3>
            <p className="text-gray-400 text-sm leading-relaxed">Supporting students in Grade 11 & 12 through academic tracking, career discovery and college readiness.</p>
          </div>
          <div className="bg-[#F5F5F0] rounded-3xl p-8">
            <span className="inline-block bg-[#1a1a1a] text-white text-xs font-bold px-3 py-1 rounded-full mb-4">Stambha</span>
            <h3 className="text-2xl font-black text-[#1a1a1a] mb-3">Career & Employment Track</h3>
            <p className="text-[#6b7280] text-sm leading-relaxed">Guiding students from higher education through skill development, internships and into employment.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#1a1a1a] py-20">
        <div className="max-w-xl mx-auto text-center px-8">
          <h2 className="text-4xl font-black text-white mb-4">Ready to shift your orbit?</h2>
          <p className="text-gray-400 mb-8">Join students and coordinators already using the platform.</p>
          <Link to="/register">
            <Button variant="lime" size="lg">Create your account</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#e5e5e5] py-6 px-8 flex items-center justify-between text-xs text-[#9ca3af]">
        <span>© 2026 Shifting Orbits Foundation</span>
        <span>Built with ♥ for student success</span>
      </footer>
    </div>
  );
}
