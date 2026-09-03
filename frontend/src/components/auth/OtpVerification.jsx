import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import toast from 'react-hot-toast';
import { ShieldCheck, ArrowLeft, RefreshCw, Mail } from 'lucide-react';

export default function OtpVerification({ email, userName = 'there', onSuccess, onCancel }) {
  const { verifyOtp, resendOtp } = useAuth();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const inputsRef = useRef([]);

  useEffect(() => {
    // Focus first input on mount
    if (inputsRef.current[0]) {
      inputsRef.current[0].focus();
    }
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleChange = (index, value) => {
    // Handle paste of full 6 digits
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      const nextOtp = [...otp];
      digits.forEach((d, i) => {
        if (i < 6) nextOtp[i] = d;
      });
      setOtp(nextOtp);
      const focusIndex = Math.min(digits.length, 5);
      inputsRef.current[focusIndex]?.focus();
      return;
    }

    const val = value.replace(/\D/g, '');
    const nextOtp = [...otp];
    nextOtp[index] = val;
    setOtp(nextOtp);

    // Auto-advance
    if (val && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    const fullOtp = otp.join('');
    if (fullOtp.length !== 6) {
      toast.error('Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const user = await verifyOtp(email, fullOtp);
      toast.success('Email verified successfully! Welcome 🎉');
      if (onSuccess) onSuccess(user);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setResending(true);
    try {
      await resendOtp(email);
      toast.success('New code sent to your email!');
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
      inputsRef.current[0]?.focus();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-2">
      {onCancel && (
        <button
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 mb-6 transition-colors font-medium"
        >
          <ArrowLeft size={13} /> Back to registration
        </button>
      )}

      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-[#AAFF00]/20 border border-[#AAFF00]/40 flex items-center justify-center mx-auto mb-4 text-[#1a1a1a]">
          <ShieldCheck size={32} className="text-[#326200]" />
        </div>
        <h2 className="text-2xl font-black text-[#1a1a1a]">Check your inbox</h2>
        <p className="text-sm text-gray-500 mt-2">
          We sent a 6-digit verification code to
        </p>
        <div className="inline-flex items-center gap-1.5 mt-1.5 px-3 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-800">
          <Mail size={12} className="text-gray-500" />
          <span>{email}</span>
        </div>
      </div>

      <form onSubmit={handleVerify} className="space-y-6">
        {/* 6-box input */}
        <div className="flex justify-center gap-2 sm:gap-3">
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => (inputsRef.current[i] = el)}
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="w-11 h-13 sm:w-12 sm:h-14 text-center text-2xl font-black text-gray-900 border-2 border-gray-200 rounded-xl focus:border-[#AAFF00] focus:ring-2 focus:ring-[#AAFF00]/20 focus:outline-none transition-all bg-white shadow-sm"
            />
          ))}
        </div>

        <Button
          type="submit"
          variant="lime"
          size="lg"
          className="w-full font-bold shadow-md shadow-[#AAFF00]/20"
          loading={loading}
          disabled={otp.join('').length !== 6}
        >
          Verify & Access Portal
        </Button>
      </form>

      <div className="mt-8 pt-6 border-t border-gray-100 text-center space-y-2">
        <p className="text-xs text-gray-500">
          Didn't receive the email? Check your Spam/Junk folder or
        </p>
        {countdown > 0 ? (
          <p className="text-xs font-semibold text-gray-400">
            Resend available in <span className="text-gray-700 font-bold">{countdown}s</span>
          </p>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-900 hover:text-emerald-700 transition-colors"
          >
            <RefreshCw size={12} className={resending ? 'animate-spin' : ''} /> Resend verification code
          </button>
        )}
      </div>
    </div>
  );
}
