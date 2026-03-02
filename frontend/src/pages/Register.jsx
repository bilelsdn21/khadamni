import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../api/auth';

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
    role: 'client',
  });
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirm_password) {
      setError('Passwords do not match');
      return;
    }

    if (!agreed) {
      setError('You must agree to the terms of service');
      return;
    }

    setLoading(true);

    try {
      await registerUser({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role: form.role,
      });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h2 className="text-2xl font-bold text-white mb-1">Create account</h2>
      <p className="text-slate-400 text-sm mb-6">Join Khadamni today</p>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm rounded-lg px-4 py-3 mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="first_name" className="block text-sm font-medium text-slate-300 mb-1">
              First name
            </label>
            <input
              id="first_name"
              name="first_name"
              type="text"
              required
              value={form.first_name}
              onChange={handleChange}
              placeholder="Ahmed"
              className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
          <div>
            <label htmlFor="last_name" className="block text-sm font-medium text-slate-300 mb-1">
              Last name
            </label>
            <input
              id="last_name"
              name="last_name"
              type="text"
              required
              value={form.last_name}
              onChange={handleChange}
              placeholder="Benali"
              className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
        </div>

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

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-slate-300 mb-1">
            Phone number
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            value={form.phone}
            onChange={handleChange}
            placeholder="+213 555 123 456"
            className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>

        {/* Role selector */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            I want to
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setForm({ ...form, role: 'client' })}
              className={`py-3 px-4 rounded-lg border-2 text-sm font-medium transition cursor-pointer ${
                form.role === 'client'
                  ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                  : 'border-slate-600 bg-slate-700/30 text-slate-400 hover:border-slate-500'
              }`}
            >
              Find services
              <span className="block text-xs mt-0.5 opacity-70">I'm a client</span>
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, role: 'provider' })}
              className={`py-3 px-4 rounded-lg border-2 text-sm font-medium transition cursor-pointer ${
                form.role === 'provider'
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                  : 'border-slate-600 bg-slate-700/30 text-slate-400 hover:border-slate-500'
              }`}
            >
              Offer services
              <span className="block text-xs mt-0.5 opacity-70">I'm a provider</span>
            </button>
          </div>
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
            minLength={8}
            value={form.password}
            onChange={handleChange}
            placeholder="Min. 8 characters"
            className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>

        {/* Confirm password */}
        <div>
          <label htmlFor="confirm_password" className="block text-sm font-medium text-slate-300 mb-1">
            Confirm password
          </label>
          <input
            id="confirm_password"
            name="confirm_password"
            type="password"
            required
            value={form.confirm_password}
            onChange={handleChange}
            placeholder="••••••••"
            className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>

        {/* Terms */}
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="w-4 h-4 mt-0.5 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
          />
          <span className="text-sm text-slate-400">
            I agree to the{' '}
            <span className="text-blue-400 hover:text-blue-300 cursor-pointer">Terms of Service</span>{' '}
            and{' '}
            <span className="text-blue-400 hover:text-blue-300 cursor-pointer">Privacy Policy</span>
          </span>
        </label>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition cursor-pointer"
        >
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      {/* Login link */}
      <p className="text-center text-sm text-slate-400 mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium transition">
          Sign in
        </Link>
      </p>
    </>
  );
}
