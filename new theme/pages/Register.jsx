import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../api/auth';

const SERVICE_CATEGORIES = [
  'Plumbing', 'Electrical', 'Cleaning', 'Painting',
  'Tutoring', 'Delivery', 'IT Support', 'Carpentry',
  'Gardening', 'Moving', 'Cooking', 'Other',
];

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
    // Provider-specific
    bio: '',
    service_categories: [],
    hourly_rate: '',
    experience_years: '',
  });
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const toggleCategory = (cat) => {
    setForm((prev) => ({
      ...prev,
      service_categories: prev.service_categories.includes(cat)
        ? prev.service_categories.filter((c) => c !== cat)
        : [...prev.service_categories, cat],
    }));
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

    if (form.role === 'provider') {
      if (!form.bio.trim()) {
        setError('Please add a bio about yourself');
        return;
      }
      if (form.service_categories.length === 0) {
        setError('Please select at least one service category');
        return;
      }
      if (!form.experience_years) {
        setError('Please enter your years of experience');
        return;
      }
    }

    setLoading(true);

    try {
      const payload = {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone || null,
        password: form.password,
        role: form.role,
      };

      if (form.role === 'provider') {
        payload.bio = form.bio;
        payload.service_categories = form.service_categories;
        payload.experience_years = parseInt(form.experience_years);
        if (form.hourly_rate) payload.hourly_rate = parseFloat(form.hourly_rate);
      }

      await registerUser(payload);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full px-4 py-2.5 bg-[#0F172A] border border-white/10 rounded-[20px] text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:border-transparent transition';

  return (
    <>
      <h2 className="text-2xl font-bold text-white mb-1">Create account</h2>
      <p className="text-white/60 text-sm mb-6">Join Khadamni today</p>

      {error && (
        <div className="bg-red-500/20 border border-red-500/30 text-red-300 text-sm rounded-[20px] px-4 py-3 mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="first_name" className="block text-sm font-medium text-white/80 mb-1">
              First name
            </label>
            <input
              id="first_name" name="first_name" type="text" required
              value={form.first_name} onChange={handleChange}
              placeholder="Ahmed" className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="last_name" className="block text-sm font-medium text-white/80 mb-1">
              Last name
            </label>
            <input
              id="last_name" name="last_name" type="text" required
              value={form.last_name} onChange={handleChange}
              placeholder="Benali" className={inputClass}
            />
          </div>
        </div>

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

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-white/80 mb-1">
            Phone number <span className="text-white/50">(optional)</span>
          </label>
          <input
            id="phone" name="phone" type="tel"
            value={form.phone} onChange={handleChange}
            placeholder="+213 555 123 456" className={inputClass}
          />
        </div>

        {/* Role selector */}
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">I want to</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setForm({ ...form, role: 'client' })}
              className={`py-3 px-4 rounded-lg border-2 text-sm font-medium transition cursor-pointer ${
                form.role === 'client'
                  ? 'border-[#22C55E] bg-[#22C55E]/20 text-[#4ADE80]'
                  : 'border-white/20 bg-[#0F172A] text-white/60 hover:border-white/40'
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
                  ? 'border-[#22C55E] bg-[#22C55E]/20 text-[#4ADE80]'
                  : 'border-white/20 bg-[#0F172A] text-white/60 hover:border-white/40'
              }`}
            >
              Offer services
              <span className="block text-xs mt-0.5 opacity-70">I'm a provider</span>
            </button>
          </div>
        </div>

        {/* Provider-specific fields */}
        {form.role === 'provider' && (
          <div className="space-y-4 border-t border-white/10 pt-4">
            <p className="text-sm font-medium text-[#4ADE80]">Provider details</p>

            {/* Bio */}
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-white/80 mb-1">
                Bio <span className="text-red-400">*</span>
              </label>
              <textarea
                id="bio" name="bio" required rows={3}
                value={form.bio} onChange={handleChange}
                placeholder="Tell clients about yourself, your skills, and experience..."
                className={inputClass + ' resize-none'}
              />
            </div>

            {/* Service categories */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Service categories <span className="text-red-400">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {SERVICE_CATEGORIES.map((cat) => (
                  <button
                    key={cat} type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
                      form.service_categories.includes(cat)
                        ? 'bg-[#22C55E] text-white'
                        : 'bg-[#0F172A] text-white/70 border border-white/10 hover:border-[#22C55E]/50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Experience + Rate row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="experience_years" className="block text-sm font-medium text-white/80 mb-1">
                  Experience (years) <span className="text-red-400">*</span>
                </label>
                <input
                  id="experience_years" name="experience_years" type="number" min="0"
                  value={form.experience_years} onChange={handleChange}
                  placeholder="e.g. 5" className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="hourly_rate" className="block text-sm font-medium text-white/80 mb-1">
                  Hourly rate (DA) <span className="text-white/50">(opt.)</span>
                </label>
                <input
                  id="hourly_rate" name="hourly_rate" type="number" min="0"
                  value={form.hourly_rate} onChange={handleChange}
                  placeholder="e.g. 2000" className={inputClass}
                />
              </div>
            </div>
          </div>
        )}

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-1">
            Password
          </label>
          <input
            id="password" name="password" type="password" required minLength={8}
            value={form.password} onChange={handleChange}
            placeholder="Min. 8 characters" className={inputClass}
          />
        </div>

        {/* Confirm password */}
        <div>
          <label htmlFor="confirm_password" className="block text-sm font-medium text-white/80 mb-1">
            Confirm password
          </label>
          <input
            id="confirm_password" name="confirm_password" type="password" required
            value={form.confirm_password} onChange={handleChange}
            placeholder="Repeat your password" className={inputClass}
          />
        </div>

        {/* Terms */}
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox" checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="w-4 h-4 mt-0.5 rounded border-white/30 text-[#22C55E] focus:ring-[#22C55E]"
          />
          <span className="text-sm text-white/60">
            I agree to the{' '}
            <span className="text-[#4ADE80] hover:underline cursor-pointer">Terms of Service</span>{' '}
            and{' '}
            <span className="text-[#4ADE80] hover:underline cursor-pointer">Privacy Policy</span>
          </span>
        </label>

        {/* Submit */}
        <button
          type="submit" disabled={loading}
          className="w-full py-2.5 bg-gradient-to-r from-[#22C55E] to-[#4ADE80] hover:from-[#16A34A] hover:to-[#22C55E] disabled:opacity-50 text-white font-semibold rounded-[20px] transition cursor-pointer"
        >
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      {/* Login link */}
      <p className="text-center text-sm text-white/60 mt-6">
        Already have an account?{' '}
        <Link to="/auth" className="text-[#4ADE80] hover:underline font-medium transition">
          Sign in
        </Link>
      </p>
    </>
  );
}
