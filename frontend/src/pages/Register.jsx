import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../api/auth';
import useAuth from '../hooks/useAuth';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});


const SERVICE_CATEGORIES = [
  'Plumbing', 'Electrical', 'Cleaning', 'Painting',
  'Tutoring', 'Delivery', 'IT Support', 'Carpentry',
  'Gardening', 'Moving', 'Cooking', 'Other',
];
function LocationPicker({ onLocationSet }) {
  useMapEvents({
    click(e) {
      onLocationSet([e.latlng.lat, e.latlng.lng]);
    }
  });
  return null;
}

function FlyToLocation({ position }) {
  const map = useMapEvents({});
  useEffect(() => { map.flyTo(position, 13); }, [position]);
  return null;
}

export default function Register() {
  const navigate = useNavigate();
  const { logout } = useAuth();

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
    latitude: null,
    longitude: null,
    job_type: 'in_place',

  });
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [flyTarget, setFlyTarget] = useState([33.8869, 9.5375]);

  const handleLocationSearch = async (query) => {
    setSearchQuery(query);
    if (query.length < 3) return setSearchResults([]);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`
      );
      const data = await res.json();
      setSearchResults(data);
    } catch (e) {
      console.error('Search failed', e);
    }
  };
  

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
      if (form.job_type !== 'remote' && (!form.latitude || !form.longitude)) {
        setError('Please set your location on the map');
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
        payload.experience_years = String(form.experience_years);
        payload.job_type = form.job_type;
        if (form.latitude) payload.latitude = form.latitude;
        if (form.longitude) payload.longitude = form.longitude;
        if (form.hourly_rate) payload.hourly_rate = parseFloat(form.hourly_rate);
      }

      await registerUser(payload);
      logout();
      navigate('/login');
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        const messages = detail.map(d => d.msg || d.message || JSON.stringify(d)).join(', ');
        setError(`Validation error: ${messages}`);
      } else {
        setError(detail || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full px-4 py-3 rounded-[20px] bg-[#1E293B] border border-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:border-transparent transition shadow-sm';

  return (
    <>
      <h2 className="text-2xl font-bold text-white mb-1">Create account</h2>
      <p className="text-white/60 text-sm mb-6">Join Khadamni today</p>

      {error && (
        <div className="mb-4 p-3 rounded-[20px] bg-red-500/20 border border-red-500/30 text-red-300 text-sm">
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
              placeholder="first_name" className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="last_name" className="block text-sm font-medium text-white/80 mb-1">
              Last name
            </label>
            <input
              id="last_name" name="last_name" type="text" required
              value={form.last_name} onChange={handleChange}
              placeholder="last_name" className={inputClass}
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
            Phone number <span className="text-gray-400">(optional)</span>
          </label>
          <input
            id="phone" name="phone" type="tel"
            value={form.phone} onChange={handleChange}
            placeholder="+216...." className={inputClass}
          />
        </div>

        {/* Role selector */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">I want to</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setForm({ ...form, role: 'client' })}
              className={`py-3 px-4 rounded-[20px] border-2 text-sm font-medium transition cursor-pointer ${
                form.role === 'client'
                  ? 'border-[#22C55E] bg-[#22C55E]/10 text-[#4ADE80]'
                  : 'border-white/10 bg-[#0F172A] text-white/60 hover:border-white/30'
              }`}
            >
              Find services
              <span className="block text-xs mt-0.5 opacity-70">I'm a client</span>
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, role: 'provider' })}
              className={`py-3 px-4 rounded-[20px] border-2 text-sm font-medium transition cursor-pointer ${
                form.role === 'provider'
                  ? 'border-[#22C55E] bg-[#22C55E]/10 text-[#4ADE80]'
                  : 'border-white/10 bg-[#0F172A] text-white/60 hover:border-white/30'
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
            {/* Job type */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Work type <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'in_place', label: 'In-Place', icon: '📍', desc: 'Visit client location' },
                  { value: 'remote',   label: 'Remote',   icon: '💻', desc: 'Work online / deliver' },
                  { value: 'both',     label: 'Both',     icon: '🌐', desc: 'Flexible' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm({ ...form, job_type: opt.value, ...(opt.value === 'remote' ? { latitude: null, longitude: null } : {}) })}
                    className={`flex flex-col items-center gap-1 py-3 px-2 rounded-[16px] border-2 text-xs font-medium transition cursor-pointer ${
                      form.job_type === opt.value
                        ? 'border-[#22C55E] bg-[#22C55E]/10 text-[#4ADE80]'
                        : 'border-white/10 bg-[#0F172A] text-white/50 hover:border-white/30'
                    }`}
                  >
                    <span className="text-lg">{opt.icon}</span>
                    <span className="font-semibold">{opt.label}</span>
                    <span className="text-[10px] opacity-70 text-center">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Location picker — hidden for remote-only providers */}
            {form.job_type !== 'remote' && <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Your location <span className="text-red-400">*</span>
              </label>

              {/* Collapsed placeholder */}
              {!mapOpen && (
                <button
                  type="button"
                  onClick={() => setMapOpen(true)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-[20px] bg-[#1E293B] border border-white/10 text-white/60 hover:border-red-400/50 hover:text-white transition"
                >
                  <svg className="w-5 h-5 text-red-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  {form.latitude
                    ? <span className="text-[#4ADE80] font-medium">✓ Location selected</span>
                    : <span>Click to set your location on the map</span>
                  }
                </button>
              )}

              {/* Expanded map */}
              {mapOpen && (
                <div className="rounded-[20px] overflow-hidden border border-white/10" style={{ position: 'relative' }}>
                  {/* Search bar */}
                  <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', zIndex: 1000, width: '80%' }}>
                    <input
                      type="text"
                      placeholder="Search location..."
                      value={searchQuery}
                      onChange={(e) => handleLocationSearch(e.target.value)}
                      className="w-full px-4 py-2 rounded-[20px] bg-[#1E293B] border border-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#22C55E] shadow-lg"
                      style={{ fontSize: '13px' }}
                    />
                    {searchResults.length > 0 && (
                      <div style={{ backgroundColor: '#1E293B', borderRadius: '12px', marginTop: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        {searchResults.map((result) => (
                          <div
                            key={result.place_id}
                            onClick={() => {
                              const loc = [parseFloat(result.lat), parseFloat(result.lon)];
                              setFlyTarget(loc);
                              setForm({ ...form, latitude: loc[0], longitude: loc[1] });
                              setSearchQuery(result.display_name.split(',').slice(0, 2).join(','));
                              setSearchResults([]);
                            }}
                            style={{ padding: '8px 14px', color: 'rgba(255,255,255,0.85)', cursor: 'pointer', fontSize: '13px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                          >
                            {result.display_name.split(',').slice(0, 2).join(',')}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <MapContainer center={flyTarget} zoom={6} style={{ height: '280px', width: '100%' }} zoomControl={false}>
                    <TileLayer url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png" />
                    <FlyToLocation position={flyTarget} />
                    <LocationPicker onLocationSet={(loc) => {
                      setForm({ ...form, latitude: loc[0], longitude: loc[1] });
                    }} />
                    {form.latitude && <Marker position={[form.latitude, form.longitude]} />}
                  </MapContainer>

                  {/* Bottom bar */}
                  <div style={{ backgroundColor: '#1E293B', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: form.latitude ? '#4ADE80' : 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
                      {form.latitude ? `✓ ${form.latitude.toFixed(4)}, ${form.longitude.toFixed(4)}` : 'Click on the map to pin your location'}
                    </span>
                    {form.latitude && (
                      <button
                        type="button"
                        onClick={() => setMapOpen(false)}
                        style={{ backgroundColor: '#22C55E', color: 'white', border: 'none', borderRadius: '20px', padding: '6px 16px', fontSize: '13px', cursor: 'pointer', fontWeight: '600' }}
                      >
                        Confirm
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>}

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
                        ? 'bg-[#22C55E] text-white'
                        : 'bg-[#0F172A] text-white/60 border border-white/10 hover:border-[#22C55E]/50 hover:text-[#4ADE80]'
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
            className="w-4 h-4 mt-0.5 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
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
          className="w-full py-3.5 rounded-[20px] bg-gradient-to-r from-[#22C55E] to-[#4ADE80] hover:from-[#16A34A] hover:to-[#22C55E] disabled:opacity-50 text-white font-semibold shadow-lg shadow-[#22C55E]/30 transition-all duration-200 cursor-pointer"
        >
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      {/* Login link */}
      <p className="text-center text-sm text-white/60 mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-[#4ADE80] font-medium hover:underline transition">
          Sign in
        </Link>
      </p>
    </>
  );
}
