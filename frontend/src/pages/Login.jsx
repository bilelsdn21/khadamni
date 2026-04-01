import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser, verifyOtp } from '../api/auth';
import useAuth from '../hooks/useAuth';

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [remember, setRemember] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/map');
    }
  }, [isAuthenticated, navigate]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP step
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const formatError = (err) => {
    const detail = err.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) return detail[0]?.msg || 'Validation error';
    if (typeof detail === 'object' && detail !== null) return JSON.stringify(detail);
    return 'An unexpected error occurred. Please try again.';
  };

  // Step 1 — submit email + password
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const deviceToken = localStorage.getItem('device_token');
      const res = await loginUser({ ...form, remember_me: remember, device_token: deviceToken });

      if (res.data.access_token) {
        // trusted device — skip OTP
        login(res.data.user, res.data.access_token, null);
        navigate('/map');
      } else {
        setOtpStep(true);
      }
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  };

  // Step 2 — submit OTP code
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await verifyOtp({ email: form.email, code: otpCode, remember_me: remember });

      if (res.data.device_token) {
        localStorage.setItem('device_token', res.data.device_token);
      }
      
      if (remember) {
        localStorage.setItem('remember_me', 'true');
      } else {
        localStorage.removeItem('remember_me');
      }

      login(res.data.user, res.data.access_token, res.data.refresh_token);
      navigate('/map');
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full px-4 py-3 rounded-[20px] bg-[#1E293B] border border-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:border-transparent transition shadow-sm';

  // OTP Screen
  if (otpStep) {
    return (
      <>
        <h2 className="text-2xl font-bold text-white mb-1">Check your email</h2>
        <p className="text-white/60 text-sm mb-6">
          We sent a 6-digit code to <span className="text-blue-500">{form.email}</span>
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-[20px] bg-red-500/20 border border-red-500/30 text-red-300 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleOtpSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">
              Verification Code
            </label>
            <input
              type="text" maxLength={6} required
              value={otpCode} onChange={(e) => setOtpCode(e.target.value)}
              placeholder="Enter 6-digit code" className={inputClass}
            />
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full py-3.5 rounded-[20px] bg-gradient-to-r from-[#22C55E] to-[#4ADE80] hover:from-[#16A34A] hover:to-[#22C55E] disabled:opacity-50 text-white font-semibold shadow-lg shadow-[#22C55E]/30 transition-all duration-200 cursor-pointer"
          >
            {loading ? 'Verifying...' : 'Verify Code'}
          </button>
        </form>

        <p className="text-center text-sm text-white/60 mt-4">
          Didn't receive the code?{' '}
          <button onClick={() => setOtpStep(false)} className="text-[#4ADE80] font-medium hover:underline">
            Go back
          </button>
        </p>
      </>
    );
  }

  // Login Screen
  return (
    <>
      <h2 className="text-2xl font-bold text-white mb-1">Welcome back</h2>
      <p className="text-white/60 text-sm mb-6">Sign in to your account</p>

      {error && (
        <div className="mb-4 p-3 rounded-[20px] bg-red-500/20 border border-red-500/30 text-red-300 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-1">
            Email
          </label>
          <input
            id="email" name="email" type="email" required
            value={form.email} onChange={handleChange}
            placeholder="you@example.com" className={inputClass}
          />
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-1">
            Password
          </label>
          <input
            id="password" name="password" type="password" required
            value={form.password} onChange={handleChange}
            placeholder="Enter your password" className={inputClass}
          />
        </div>

        {/* Remember me + Forgot */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox" checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
            />
            <span className="text-sm text-white/60">Remember me</span>
          </label>
          <Link to="/forgot-password" className="text-sm text-[#4ADE80] hover:underline transition">
            Forgot password?
          </Link>
        </div>

        {/* Submit */}
        <button
          type="submit" disabled={loading}
          className="w-full py-3.5 rounded-[20px] bg-gradient-to-r from-[#22C55E] to-[#4ADE80] hover:from-[#16A34A] hover:to-[#22C55E] disabled:opacity-50 text-white font-semibold shadow-lg shadow-[#22C55E]/30 transition-all duration-200 cursor-pointer"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      {/* Register link */}
      <p className="text-center text-sm text-white/60 mt-6">
        Don't have an account?{' '}
        <Link to="/register" className="text-[#4ADE80] font-medium hover:underline transition">
          Create one
        </Link>
      </p>
    </>
  );
}
