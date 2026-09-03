import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import toast from 'react-hot-toast';
import { BookOpen, Brain, Target, Users } from 'lucide-react';
import OtpVerification from '../components/auth/OtpVerification';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [needsOtp, setNeedsOtp] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email address';
    if (!form.password) e.password = 'Password is required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const res = await login(form.email, form.password);
      if (res?.requiresVerification) {
        setNeedsOtp(true);
        toast('Please enter the verification code sent to your email.');
        return;
      }
      toast.success(`Welcome back, ${res.name}!`);
      navigate(res.role === 'student' ? '/student/dashboard' : '/coordinator/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left illustration panel */}
      <div className="hidden lg:flex flex-1 bg-[#F5F5F0] items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-8 left-8 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#1a1a1a] flex items-center justify-center">
            <span className="text-[#AAFF00] font-black text-sm">SO</span>
          </div>
          <div>
            <p className="text-xs font-black text-[#1a1a1a] leading-tight">SHIFTING ORBITS</p>
            <p className="text-[9px] text-[#6b7280] tracking-widest uppercase">Foundation</p>
          </div>
        </div>

        <div className="relative w-72 h-72">
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#d1d1d1] animate-spin" style={{ animationDuration: '25s' }} />
          <div className="absolute inset-12 rounded-full border-2 border-dashed border-[#AAFF00]/40 animate-spin" style={{ animationDuration: '15s', animationDirection: 'reverse' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 rounded-2xl bg-[#1a1a1a] flex flex-col items-center justify-center shadow-xl">
              <span className="text-[#AAFF00] font-black text-2xl">SO</span>
            </div>
          </div>
          {[BookOpen, Target, Brain, Users].map((Icon, i) => {
            const angles = [45, 135, 225, 315];
            const rad = (angles[i] * Math.PI) / 180;
            const r = 115;
            const x = 144 + r * Math.cos(rad) - 18;
            const y = 144 + r * Math.sin(rad) - 18;
            return (
              <div key={i} className="absolute w-9 h-9 rounded-xl bg-white border border-[#e5e5e5] shadow flex items-center justify-center" style={{ left: x, top: y }}>
                <Icon size={16} className="text-[#1a1a1a]" />
              </div>
            );
          })}
        </div>

        <div className="absolute bottom-12 left-12 right-12 text-center">
          <p className="text-[#6b7280] text-sm">Empowering students from <span className="font-semibold text-[#1a1a1a]">Grade 11 to Employment</span></p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex justify-center mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-[#1a1a1a] flex items-center justify-center">
              <span className="text-[#AAFF00] font-black">SO</span>
            </div>
          </div>

          {needsOtp ? (
            <OtpVerification
              email={form.email}
              onCancel={() => setNeedsOtp(false)}
              onSuccess={(user) => {
                navigate(user.role === 'student' ? '/student/dashboard' : '/coordinator/dashboard');
              }}
            />
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-black text-[#1a1a1a]">Welcome back</h1>
                <p className="text-[#6b7280] text-sm mt-1">Log in to continue your journey</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Email *"
                  type="email"
                  placeholder="Enter your email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  error={errors.email}
                />
                <Input
                  label="Password *"
                  type="password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  error={errors.password}
                />
                <Button type="submit" loading={loading} className="w-full mt-2" size="lg">
                  Continue
                </Button>
              </form>

              <p className="text-center text-sm text-[#6b7280] mt-6">
                Don't have an account?{' '}
                <Link to="/register" className="text-[#1a1a1a] font-semibold hover:text-[#AAFF00] transition-colors">
                  Sign up
                </Link>
              </p>

              <Link to="/" className="block text-center text-xs text-[#9ca3af] mt-4 hover:text-[#6b7280] transition-colors">
                ← Back to home
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
