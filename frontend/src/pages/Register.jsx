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
    'w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition';

  return (
    <>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Create account</h2>
      <p className="text-gray-400 text-sm mb-6">Join Khadamni today</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="first_name" className="block text-sm font-medium text-gray-600 mb-1">
              First name
            </label>
            <input
              id="first_name" name="first_name" type="text" required
              value={form.first_name} onChange={handleChange}
              placeholder="Ahmed" className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="last_name" className="block text-sm font-medium text-gray-600 mb-1">
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
          <label htmlFor="email" className="block text-sm font-medium text-gray-600 mb-1">
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
          <label htmlFor="phone" className="block text-sm font-medium text-gray-600 mb-1">
            Phone number <span className="text-gray-400">(optional)</span>
          </label>
          <input
            id="phone" name="phone" type="tel"
            value={form.phone} onChange={handleChange}
            placeholder="+213 555 123 456" className={inputClass}
          />
        </div>

        {/* Role selector */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">I want to</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setForm({ ...form, role: 'client' })}
              className={`py-3 px-4 rounded-lg border-2 text-sm font-medium transition cursor-pointer ${
                form.role === 'client'
                  ? 'border-blue-500 bg-blue-50 text-blue-600'
                  : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
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
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-600'
                  : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
              }`}
            >
              Offer services
              <span className="block text-xs mt-0.5 opacity-70">I'm a provider</span>
            </button>
          </div>
        </div>

        {/* Provider-specific fields */}
        {form.role === 'provider' && (
          <div className="space-y-4 border-t border-gray-100 pt-4">
            <p className="text-sm font-medium text-blue-500">Provider details</p>

            {/* Bio */}
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-600 mb-1">
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
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Service categories <span className="text-red-400">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {SERVICE_CATEGORIES.map((cat) => (
                  <button
                    key={cat} type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
                      form.service_categories.includes(cat)
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
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
                <label htmlFor="experience_years" className="block text-sm font-medium text-gray-600 mb-1">
                  Experience (years) <span className="text-red-400">*</span>
                </label>
                <input
                  id="experience_years" name="experience_years" type="number" min="0"
                  value={form.experience_years} onChange={handleChange}
                  placeholder="e.g. 5" className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="hourly_rate" className="block text-sm font-medium text-gray-600 mb-1">
                  Hourly rate (DA) <span className="text-gray-400">(opt.)</span>
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
          <label htmlFor="password" className="block text-sm font-medium text-gray-600 mb-1">
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
          <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-600 mb-1">
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
            className="w-4 h-4 mt-0.5 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-500">
            I agree to the{' '}
            <span className="text-blue-500 hover:text-blue-600 cursor-pointer">Terms of Service</span>{' '}
            and{' '}
            <span className="text-blue-500 hover:text-blue-600 cursor-pointer">Privacy Policy</span>
          </span>
        </label>

        {/* Submit */}
        <button
          type="submit" disabled={loading}
          className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition cursor-pointer"
        >
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      {/* Login link */}
      <p className="text-center text-sm text-gray-400 mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-blue-500 hover:text-blue-600 font-medium transition">
          Sign in
        </Link>
      </p>
    </>
  );
}
