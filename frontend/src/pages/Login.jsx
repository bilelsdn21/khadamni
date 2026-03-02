import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../api/auth';
import useAuth from '../hooks/useAuth';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await loginUser(form);
      login(res.data.user, res.data.access_token, res.data.refresh_token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h2 className="text-2xl font-bold text-white mb-1">Welcome back</h2>
      <p className="text-slate-400 text-sm mb-6">Sign in to your account</p>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm rounded-lg px-4 py-3 mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            value={form.password}
            onChange={handleChange}
            placeholder="••••••••"
            className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>

        {/* Remember me + Forgot */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
            />
            <span className="text-sm text-slate-400">Remember me</span>
          </label>
          <Link to="/forgot-password" className="text-sm text-blue-400 hover:text-blue-300 transition">
            Forgot password?
          </Link>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition cursor-pointer"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      {/* Register link */}
      <p className="text-center text-sm text-slate-400 mt-6">
        Don't have an account?{' '}
        <Link to="/register" className="text-blue-400 hover:text-blue-300 font-medium transition">
          Create one
        </Link>
      </p>
    </>
  );
}
