import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser, verifyOtp } from '../api/auth';
import useAuth from '../hooks/useAuth';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP step
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Step 1 — submit email + password
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await loginUser(form);
      setOtpStep(true); // show OTP input
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.');
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
      const res = await verifyOtp({ email: form.email, code: otpCode });
      login(res.data.user, res.data.access_token, res.data.refresh_token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition';

  // OTP Screen
  if (otpStep) {
    return (
      <>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Check your email</h2>
        <p className="text-gray-400 text-sm mb-6">
          We sent a 6-digit code to <span className="text-blue-500">{form.email}</span>
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleOtpSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
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
            className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition cursor-pointer"
          >
            {loading ? 'Verifying...' : 'Verify Code'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-4">
          Didn't receive the code?{' '}
          <button onClick={() => setOtpStep(false)} className="text-blue-500 hover:text-blue-600 font-medium transition">
            Go back
          </button>
        </p>
      </>
    );
  }

  // Login Screen
  return (
    <>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
      <p className="text-gray-400 text-sm mb-6">Sign in to your account</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-600 mb-1">
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
          <label htmlFor="password" className="block text-sm font-medium text-gray-600 mb-1">
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
            <span className="text-sm text-gray-500">Remember me</span>
          </label>
          <Link to="/forgot-password" className="text-sm text-blue-500 hover:text-blue-600 transition">
            Forgot password?
          </Link>
        </div>

        {/* Submit */}
        <button
          type="submit" disabled={loading}
          className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition cursor-pointer"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      {/* Register link */}
      <p className="text-center text-sm text-gray-400 mt-6">
        Don't have an account?{' '}
        <Link to="/register" className="text-blue-500 hover:text-blue-600 font-medium transition">
          Create one
        </Link>
      </p>
    </>
  );
}
