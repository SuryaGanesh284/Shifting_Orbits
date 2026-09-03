import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Select } from '../components/ui/Input';
import toast from 'react-hot-toast';
import { GraduationCap, Users, Star, BookOpen } from 'lucide-react';
import OtpVerification from '../components/auth/OtpVerification';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState('form'); // 'form' | 'otp'
  const [targetEmail, setTargetEmail] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', role: 'student', phone: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'Minimum 8 characters';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const res = await register({ name: form.name, email: form.email, password: form.password, role: form.role, phone: form.phone });
      if (res?.requiresVerification) {
        setTargetEmail(res.email || form.email);
        setStep('otp');
        toast.success('6-digit code sent to your email!');
      } else {
        toast.success(`Account created! Welcome, ${res.name}`);
        navigate(res.role === 'student' ? '/student/dashboard' : '/coordinator/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left */}
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

        <div className="max-w-xs text-center">
          {/* Stick figure group illustration placeholder */}
          <div className="flex items-end justify-center gap-3 mb-8">
            {[GraduationCap, Users, Star, BookOpen].map((Icon, i) => (
              <div key={i} className={`rounded-2xl bg-white border border-[#e5e5e5] shadow flex items-center justify-center ${i === 1 ? 'w-14 h-14' : 'w-10 h-10'}`}>
                <Icon size={i === 1 ? 24 : 18} className={i === 1 ? 'text-[#AAFF00]' : 'text-[#1a1a1a]'} />
              </div>
            ))}
          </div>
          <h2 className="text-2xl font-black text-[#1a1a1a] mb-3">Join us today!</h2>
          <p className="text-[#6b7280] text-sm">Start your journey with Shifting Orbits Foundation. Track your growth, get mentored, and build your future.</p>
        </div>

        <div className="absolute bottom-12 left-12 right-12 text-center text-xs text-[#9ca3af]">
          By signing up, you agree to our Terms and Conditions & Privacy Policy
        </div>
      </div>

      {/* Right */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="flex justify-center mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-[#1a1a1a] flex items-center justify-center">
              <span className="text-[#AAFF00] font-black">SO</span>
            </div>
          </div>

          {step === 'otp' ? (
            <OtpVerification
              email={targetEmail}
              userName={form.name}
              onCancel={() => setStep('form')}
              onSuccess={(user) => {
                navigate(user.role === 'student' ? '/student/dashboard' : '/coordinator/dashboard');
              }}
            />
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-black text-[#1a1a1a]">Create account</h1>
                <p className="text-[#6b7280] text-sm mt-1">Join Shifting Orbits today</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input label="Full name *" placeholder="Your full name" value={form.name} onChange={set('name')} error={errors.name} />
                <Input label="Email *" type="email" placeholder="Enter your email" value={form.email} onChange={set('email')} error={errors.email} />
                <Input label="Phone" type="tel" placeholder="Phone number (optional)" value={form.phone} onChange={set('phone')} />
                <Select label="I am a *" value={form.role} onChange={set('role')}>
                  <option value="student">Student</option>
                  <option value="coordinator">Coordinator</option>
                </Select>
                <Input label="Password *" type="password" placeholder="Min. 8 characters" value={form.password} onChange={set('password')} error={errors.password} />
                <Input label="Confirm password *" type="password" placeholder="Repeat password" value={form.confirm} onChange={set('confirm')} error={errors.confirm} />
                <Button type="submit" loading={loading} className="w-full mt-2" size="lg">
                  Create account
                </Button>
              </form>

              <p className="text-center text-sm text-[#6b7280] mt-6">
                Already have an account?{' '}
                <Link to="/login" className="text-[#1a1a1a] font-semibold hover:text-[#AAFF00] transition-colors">
                  Log in
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
