import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { loginUser, registerUser } from '../api/auth';
import useAuth from '../hooks/useAuth';

const TAB_LOGIN = 'login';
const TAB_SIGNUP = 'signup';

/** Demo account for testing (create this user in your backend if needed) */
const DEMO_EMAIL = 'demo@khadamni.com';
const DEMO_PASSWORD = 'Demo123!';

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  const [tab, setTab] = useState(TAB_LOGIN);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (searchParams.get('tab') === 'signup') setTab(TAB_SIGNUP);
  }, [searchParams]);

  const handleLoginChange = (e) => {
    setLoginForm({ ...loginForm, [e.target.name]: e.target.value });
    setError('');
  };
  const handleSignupChange = (e) => {
    setSignupForm({ ...signupForm, [e.target.name]: e.target.value });
    setError('');
  };

  const handleLoginSubmit = async (e) => {
    e?.preventDefault();
    setError('');
    setLoading(true);
    const credentials = e ? loginForm : { email: DEMO_EMAIL, password: DEMO_PASSWORD };
    try {
      const res = await loginUser(credentials);
      login(res.data.user, res.data.access_token, res.data.refresh_token);
      navigate('/app');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setLoginForm({ email: DEMO_EMAIL, password: DEMO_PASSWORD });
    setError('');
    handleLoginSubmit(null);
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (signupForm.password !== signupForm.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (signupForm.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      const parts = signupForm.name.trim().split(/\s+/);
      const first_name = parts[0] || signupForm.name;
      const last_name = parts.slice(1).join(' ') || '';
      await registerUser({
        first_name,
        last_name,
        email: signupForm.email,
        password: signupForm.password,
        role: 'client',
      });
      const res = await loginUser({ email: signupForm.email, password: signupForm.password });
      login(res.data.user, res.data.access_token, res.data.refresh_token);
      navigate('/app');
    } catch (err) {
      setError(err.response?.data?.detail || 'Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full px-4 py-3 rounded-[20px] bg-[#1E293B] border border-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:border-transparent transition shadow-sm';

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#22C55E]/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#4ADE80]/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <h1 className="text-3xl font-bold text-white tracking-tight uppercase hover:text-[#4ADE80] transition-colors">
              KHADAMNI
            </h1>
          </Link>
          <p className="text-white/60 mt-2 text-sm">One platform for all services</p>
        </div>

        <div className="bg-[#1E293B] rounded-[20px] shadow-xl border border-white/10 p-8">
          {/* Tabs */}
          <div className="flex rounded-[20px] bg-[#0F172A] p-1 mb-6">
            <button
              type="button"
              onClick={() => { setTab(TAB_LOGIN); setError(''); }}
              className={`flex-1 py-2.5 rounded-[16px] text-sm font-semibold transition-all duration-200 ${
                tab === TAB_LOGIN
                  ? 'bg-[#22C55E] text-white shadow-lg shadow-[#22C55E]/30'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => { setTab(TAB_SIGNUP); setError(''); }}
              className={`flex-1 py-2.5 rounded-[16px] text-sm font-semibold transition-all duration-200 ${
                tab === TAB_SIGNUP
                  ? 'bg-[#22C55E] text-white shadow-lg shadow-[#22C55E]/30'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-[20px] bg-red-500/20 border border-red-500/30 text-red-300 text-sm">
              {error}
            </div>
          )}

          {tab === TAB_LOGIN ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label htmlFor="login-email" className="block text-sm font-medium text-white/80 mb-1">
                  Email
                </label>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  required
                  value={loginForm.email}
                  onChange={handleLoginChange}
                  placeholder="you@example.com"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="login-password" className="block text-sm font-medium text-white/80 mb-1">
                  Password
                </label>
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  required
                  value={loginForm.password}
                  onChange={handleLoginChange}
                  placeholder="••••••••"
                  className={inputClass}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-[20px] bg-gradient-to-r from-[#22C55E] to-[#4ADE80] hover:from-[#16A34A] hover:to-[#22C55E] disabled:opacity-50 text-white font-semibold shadow-lg shadow-[#22C55E]/30 transition-all duration-200"
              >
                {loading ? 'Signing in...' : 'Login'}
              </button>
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={loading}
                className="w-full py-3 rounded-[20px] border-2 border-dashed border-white/30 text-white/80 hover:border-[#4ADE80] hover:text-[#4ADE80] hover:bg-[#22C55E]/10 font-medium transition-all duration-200 disabled:opacity-50"
              >
                Try demo account
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignupSubmit} className="space-y-4">
              <div>
                <label htmlFor="signup-name" className="block text-sm font-medium text-white/80 mb-1">
                  Name
                </label>
                <input
                  id="signup-name"
                  name="name"
                  type="text"
                  required
                  value={signupForm.name}
                  onChange={handleSignupChange}
                  placeholder="Your name"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="signup-email" className="block text-sm font-medium text-white/80 mb-1">
                  Email
                </label>
                <input
                  id="signup-email"
                  name="email"
                  type="email"
                  required
                  value={signupForm.email}
                  onChange={handleSignupChange}
                  placeholder="you@example.com"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="signup-password" className="block text-sm font-medium text-white/80 mb-1">
                  Password
                </label>
                <input
                  id="signup-password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  value={signupForm.password}
                  onChange={handleSignupChange}
                  placeholder="Min. 8 characters"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="signup-confirm" className="block text-sm font-medium text-white/80 mb-1">
                  Confirm password
                </label>
                <input
                  id="signup-confirm"
                  name="confirmPassword"
                  type="password"
                  required
                  value={signupForm.confirmPassword}
                  onChange={handleSignupChange}
                  placeholder="Repeat password"
                  className={inputClass}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-[20px] bg-gradient-to-r from-[#22C55E] to-[#4ADE80] hover:from-[#16A34A] hover:to-[#22C55E] disabled:opacity-50 text-white font-semibold shadow-lg shadow-[#22C55E]/30 transition-all duration-200"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          )}

          <p className="text-center text-sm text-white/60 mt-6">
            {tab === TAB_LOGIN ? (
              <>
                Don't have an account?{' '}
                <button type="button" onClick={() => { setTab(TAB_SIGNUP); setError(''); }} className="text-[#4ADE80] font-medium hover:underline">
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button type="button" onClick={() => { setTab(TAB_LOGIN); setError(''); }} className="text-[#4ADE80] font-medium hover:underline">
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
