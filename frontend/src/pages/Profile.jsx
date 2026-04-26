import { useContext, useState, useEffect, useRef } from 'react';
import { Navigate, useParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import AuthContext from '../context/AuthContext';
import api from '../api/axios';
import { removeDevices } from '../api/auth';
import { getProfile, updateProfile, getPublicProfileById, getPublicUserById, uploadAvatar, changePassword } from '../api/profile';
import { getPortfolio, addPortfolioItem, deletePortfolioItem } from '../api/portfolio';
import { createRequest } from '../api/request';
import { getUserRatings } from '../api/ratings';
import SideDrawer from '../components/SideDrawer';
import ThemeToggle from '../components/ThemeToggle';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const IN_PLACE_CATEGORIES = [
  'Plumbing', 'Electrical', 'Cleaning', 'Painting',
  'Carpentry', 'Gardening', 'Moving', 'Other',
];
const REMOTE_CATEGORIES = [
  'Tutoring', 'IT Support', 'Cooking', 'Delivery',
  'Graphic Design', 'Translation', 'Web Development',
  'Video Editing', 'Data Entry', 'Other',
];
function getCategoriesForJobType(jobType) {
  if (jobType === 'in_place') return IN_PLACE_CATEGORIES;
  if (jobType === 'remote') return REMOTE_CATEGORIES;
  const merged = [...new Set([...IN_PLACE_CATEGORIES, ...REMOTE_CATEGORIES])];
  return [...merged.filter(c => c !== 'Other'), 'Other'];
}

function LocationPicker({ onLocationSet }) {
  useMapEvents({ click(e) { onLocationSet([e.latlng.lat, e.latlng.lng]); } });
  return null;
}

function FlyToLocation({ position }) {
  const map = useMapEvents({});
  useEffect(() => { map.flyTo(position, 13); }, [position]);
  return null;
}

function PortfolioCard({ images, description, isOwnProfile, onDelete }) {
  const [idx, setIdx] = useState(0);
  const total = images.length;
  const prev = (e) => { e.stopPropagation(); setIdx(i => (i - 1 + total) % total); };
  const next = (e) => { e.stopPropagation(); setIdx(i => (i + 1) % total); };

  return (
    <div className="group flex flex-col rounded-[16px] overflow-hidden bg-[#0F172A] border border-white/8">
      {/* Image carousel */}
      <div className="relative aspect-video overflow-hidden">
        <img
          src={`/uploads/${images[idx]}`}
          alt={description}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Prev / Next — only when multiple images */}
        {total > 1 && (
          <>
            <button onClick={prev}
              className="absolute left-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 z-10"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button onClick={next}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 z-10"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            {/* Dot indicators */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
              {images.map((_, i) => (
                <button key={i} onClick={(e) => { e.stopPropagation(); setIdx(i); }}
                  className={`rounded-full transition-all duration-200 ${i === idx ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/70'}`}
                />
              ))}
            </div>
            {/* Counter pill */}
            <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-black/50 backdrop-blur-sm text-white text-[10px] font-semibold z-10">
              {idx + 1}/{total}
            </div>
          </>
        )}

        {/* Delete overlay */}
        {isOwnProfile && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-start justify-end p-2 z-20 pointer-events-none group-hover:pointer-events-auto">
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="w-7 h-7 rounded-full bg-red-500/90 flex items-center justify-center hover:bg-red-500 transition shadow-lg"
            >
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Description — always visible below */}
      {description && (
        <div className="px-3 py-2.5">
          <p className="text-white/60 text-xs leading-relaxed">{description}</p>
        </div>
      )}
    </div>
  );
}

export default function Profile() {
  const { id } = useParams();
  const { user, login } = useContext(AuthContext);
  const [profileData, setProfileData] = useState(null);
  const [portfolio, setPortfolio] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState(false);
  const [message, setMessage] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Edit mode
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editMapOpen, setEditMapOpen] = useState(false);
  const [editFlyTarget, setEditFlyTarget] = useState([33.8869, 9.5375]);
  const [editLocationSearch, setEditLocationSearch] = useState('');
  const [editLocationResults, setEditLocationResults] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Portfolio upload
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadFiles, setUploadFiles] = useState([]); // array of File objects
  const [uploading, setUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);

  // Avatar upload
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef(null);

  // Password change
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm: '' });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  // Request modal (for clients viewing a provider's profile)
  const [reqModalOpen, setReqModalOpen] = useState(false);
  const [reqDesc, setReqDesc] = useState('');
  const [reqSending, setReqSending] = useState(false);
  const [reqSent, setReqSent] = useState(false);
  const [reqError, setReqError] = useState('');

  const isOwnProfile = !id || id === user?._id;

  useEffect(() => { fetchData(); }, [id, user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let data;
      if (isOwnProfile) {
        const res = await getProfile();
        data = res.data;
      } else {
        try {
          const res = await getPublicProfileById(id);
          data = res.data;
        } catch {
          // Not a provider profile ID — try plain user lookup (e.g. client viewed by provider)
          const res = await getPublicUserById(id);
          data = res.data;
        }
      }
      setProfileData(data);

      const targetUserId = isOwnProfile ? user._id : (data._id || data.user_id || id);
      if (data.role === 'provider' || data.provider_profile) {
        const [portfolioRes, ratingsRes] = await Promise.all([
          getPortfolio(targetUserId),
          getUserRatings(targetUserId),
        ]);
        setPortfolio(portfolioRes.data);
        setRatings(ratingsRes.data);
      } else {
        const ratingsRes = await getUserRatings(targetUserId);
        setRatings(ratingsRes.data);
      }
    } catch (err) {
      console.error('Error fetching profile data:', err);
      setProfileData(null);
    } finally {
      setLoading(false);
    }
  };

  if (!user && isOwnProfile) return <Navigate to="/login" replace />;

  const handleRemoveDevices = async () => {
    if (!window.confirm('Remove all trusted devices? You will need OTP on next login.')) return;
    setRevoking(true);
    try {
      await removeDevices();
      localStorage.removeItem('device_token');
      setMessage('All trusted devices removed.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setRevoking(false);
    }
  };

  const toggleAvailability = async () => {
    if (!profileData?.provider_profile || !isOwnProfile) return;
    const newStatus = !profileData.provider_profile.is_available;
    try {
      await updateProfile({ is_available: newStatus });
      setProfileData({
        ...profileData,
        provider_profile: { ...profileData.provider_profile, is_available: newStatus },
      });
    } catch (err) { console.error(err); }
  };

  const enterEditMode = () => {
    const pp = profileData?.provider_profile || {};
    setEditForm({
      first_name: profileData?.first_name || '',
      last_name: profileData?.last_name || '',
      phone: profileData?.phone || '',
      bio: pp.bio || profileData?.bio || '',
      service_categories: pp.service_categories || profileData?.service_categories || [],
      custom_category: pp.custom_category || '',
      hourly_rate: pp.hourly_rate || profileData?.hourly_rate || '',
      experience_years: pp.experience_years || profileData?.experience_years || '',
      latitude: pp.latitude || profileData?.latitude || null,
      longitude: pp.longitude || profileData?.longitude || null,
      job_type: pp.job_type || 'in_place', // read-only — locked at registration
    });
    const lat = pp.latitude || profileData?.latitude;
    const lng = pp.longitude || profileData?.longitude;
    if (lat && lng) setEditFlyTarget([lat, lng]);
    setSaveError('');
    setEditMode(true);
  };

  const handleEditLocationSearch = async (val) => {
    setEditLocationSearch(val);
    if (val.length < 2) { setEditLocationResults([]); return; }
    try {
      // Use backend proxy to avoid CORS and browser geolocation permission prompts
      const res = await api.get(`/providers/geocode?q=${encodeURIComponent(val)}`);
      setEditLocationResults(res.data);
    } catch (e) {
      setEditLocationResults([]);
    }
  };

  const handleSave = async () => {
    setSaveError('');
    if (isProvider) {
      if (!editForm.service_categories?.length) {
        setSaveError('Please select at least one service category.');
        return;
      }
      if (editForm.service_categories.includes('Other') && !editForm.custom_category?.trim()) {
        setSaveError('Please describe your profession in the "Other" field.');
        return;
      }
    }
    setSaving(true);
    try {
      const payload = {
        first_name: editForm.first_name || undefined,
        last_name: editForm.last_name || undefined,
        phone: editForm.phone || undefined,
        bio: editForm.bio || undefined,
        service_categories: editForm.service_categories?.length ? editForm.service_categories : undefined,
        custom_category: editForm.service_categories?.includes('Other') && editForm.custom_category?.trim()
          ? editForm.custom_category.trim()
          : undefined,
        hourly_rate: editForm.hourly_rate ? parseFloat(editForm.hourly_rate) : undefined,
        experience_years: editForm.experience_years ? String(editForm.experience_years) : undefined,
        latitude: editForm.latitude || undefined,
        longitude: editForm.longitude || undefined,
      };
      await updateProfile(payload);
      await fetchData();
      // Refresh auth context so Map.jsx picks up new job_type immediately
      const meRes = await api.get('/auth/me');
      const freshUser = meRes.data;
      localStorage.setItem('user', JSON.stringify(freshUser));
      login(freshUser, localStorage.getItem('access_token'), localStorage.getItem('refresh_token'));
      setEditMode(false);
      setEditMapOpen(false);
    } catch (err) {
      setSaveError(err.response?.data?.detail || 'Failed to save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePortfolioUpload = async (e) => {
    e.preventDefault();
    if (!uploadFiles.length || !uploadDesc.trim()) return;
    setUploading(true);
    try {
      const formData = new FormData();
      uploadFiles.forEach(f => formData.append('images', f));
      formData.append('description', uploadDesc);
      await addPortfolioItem(formData);
      setUploadDesc('');
      setUploadFiles([]);
      setShowUploadForm(false);
      const res = await getPortfolio(user._id);
      setPortfolio(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePortfolio = async (itemId) => {
    if (!window.confirm('Delete this portfolio item?')) return;
    try {
      await deletePortfolioItem(itemId);
      setPortfolio(prev => prev.filter(p => p._id !== itemId));
    } catch (err) { console.error(err); }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await uploadAvatar(fd);
      setProfileData(prev => ({ ...prev, avatar: res.data.avatar }));
    } catch (err) {
      console.error(err);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwError('');
    if (pwForm.new_password !== pwForm.confirm) { setPwError('Passwords do not match'); return; }
    if (pwForm.new_password.length < 8) { setPwError('New password must be at least 8 characters'); return; }
    setPwSaving(true);
    try {
      await changePassword({ current_password: pwForm.current_password, new_password: pwForm.new_password });
      setPwSuccess(true);
      setPwForm({ current_password: '', new_password: '', confirm: '' });
      setTimeout(() => { setPwSuccess(false); setShowPasswordForm(false); }, 2000);
    } catch (err) {
      setPwError(err.response?.data?.detail || 'Failed to change password');
    } finally {
      setPwSaving(false);
    }
  };

  const handleSendRequest = async () => {
    if (!reqDesc.trim()) return;
    setReqSending(true);
    setReqError('');
    try {
      await createRequest({ provider_id: id, description: reqDesc.trim() });
      setReqSent(true);
      setReqDesc('');
      setTimeout(() => { setReqSent(false); setReqModalOpen(false); }, 2000);
    } catch (err) {
      setReqError(err.response?.data?.detail || 'Failed to send request. Try again.');
    } finally {
      setReqSending(false);
    }
  };

  const fullName = profileData ? `${profileData.first_name || ''} ${profileData.last_name || ''}` : '';
  const isProvider = profileData?.role === 'provider' || !!profileData?.provider_profile;

  const Skeleton = ({ className }) => <div className={`animate-pulse bg-white/5 rounded-lg ${className}`} />;
  const inputClass = 'w-full px-4 py-3 rounded-[20px] bg-[#0F172A] border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:border-transparent transition';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] text-white px-6 py-10">
        <div className="max-w-4xl mx-auto space-y-8">
          <Skeleton className="h-48 w-full rounded-[20px]" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-32 w-full rounded-[20px]" />
            <Skeleton className="h-32 w-full rounded-[20px]" />
            <Skeleton className="h-32 w-full rounded-[20px]" />
          </div>
          <Skeleton className="h-64 w-full rounded-[20px]" />
        </div>
      </div>
    );
  }

  if (!loading && !profileData) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center gap-4">
        <p className="text-5xl">👤</p>
        <p className="text-white font-semibold text-lg">User not found</p>
        <p className="text-white/40 text-sm">This profile doesn't exist or was removed.</p>
        <button onClick={() => window.history.back()} className="mt-2 px-5 py-2 rounded-[20px] bg-white/10 text-white/70 text-sm hover:bg-white/20 transition">
          Go back
        </button>
      </div>
    );
  }

  // ─── EDIT MODE ────────────────────────────────────────────────────────────────
  if (editMode) {
    return (
      <div className="min-h-screen bg-[#0F172A] text-white px-6 py-10">
        <div className="max-w-2xl mx-auto space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">Edit Profile</h1>
            <button
              onClick={() => { setEditMode(false); setEditMapOpen(false); }}
              className="text-white/40 hover:text-white transition text-sm"
            >
              Cancel
            </button>
          </div>

          {saveError && (
            <div className="p-3 rounded-[20px] bg-red-500/20 border border-red-500/30 text-red-300 text-sm">
              {saveError}
            </div>
          )}

          {/* Personal Info */}
          <div className="bg-[#1E293B] border border-white/10 rounded-[20px] p-6 space-y-4">
            <h3 className="text-sm font-semibold text-white/40 uppercase tracking-widest">Personal Info</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-white/60 mb-1">First name</label>
                <input className={inputClass} value={editForm.first_name}
                  onChange={e => setEditForm({ ...editForm, first_name: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs text-white/60 mb-1">Last name</label>
                <input className={inputClass} value={editForm.last_name}
                  onChange={e => setEditForm({ ...editForm, last_name: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-xs text-white/60 mb-1">Phone</label>
              <input className={inputClass} value={editForm.phone}
                onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                placeholder="+216..." />
            </div>
          </div>

          {/* Provider Info */}
          {isProvider && (
            <div className="bg-[#1E293B] border border-white/10 rounded-[20px] p-6 space-y-4">
              <h3 className="text-sm font-semibold text-white/40 uppercase tracking-widest">Provider Details</h3>

              <div>
                <label className="block text-xs text-white/60 mb-1">Bio</label>
                <textarea className={inputClass + ' resize-none'} rows={4}
                  value={editForm.bio}
                  onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                  placeholder="Tell clients about yourself..." />
              </div>

              <div>
                <label className="block text-xs text-white/60 mb-1">Service Categories</label>
                <p className="text-white/30 text-[10px] mb-2">
                  {editForm.job_type === 'in_place' && 'In-place service categories'}
                  {editForm.job_type === 'remote' && 'Remote / online service categories'}
                  {editForm.job_type === 'both' && 'All service categories'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {getCategoriesForJobType(editForm.job_type).map(cat => (
                    <button key={cat} type="button"
                      onClick={() => setEditForm(prev => ({
                        ...prev,
                        service_categories: prev.service_categories.includes(cat)
                          ? prev.service_categories.filter(c => c !== cat)
                          : [...prev.service_categories, cat],
                      }))}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
                        editForm.service_categories.includes(cat)
                          ? cat === 'Other' ? 'bg-amber-500 text-white' : 'bg-[#22C55E] text-white'
                          : 'bg-[#0F172A] text-white/60 border border-white/10 hover:border-[#22C55E]/50'
                      }`}
                    >{cat === 'Other' ? '✏️ Other' : cat}</button>
                  ))}
                </div>
                {editForm.service_categories.includes('Other') && (
                  <input
                    type="text"
                    className={inputClass + ' mt-3'}
                    value={editForm.custom_category}
                    onChange={e => setEditForm({ ...editForm, custom_category: e.target.value })}
                    placeholder="Describe your profession (e.g. Piano teacher, Tattoo artist...)"
                    maxLength={80}
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-white/60 mb-1">Experience (years)</label>
                  <input type="number" min="0" className={inputClass}
                    value={editForm.experience_years}
                    onChange={e => setEditForm({ ...editForm, experience_years: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs text-white/60 mb-1">Hourly Rate (DT)</label>
                  <input type="number" min="0" className={inputClass}
                    value={editForm.hourly_rate}
                    onChange={e => setEditForm({ ...editForm, hourly_rate: e.target.value })} />
                </div>
              </div>

              {/* Work type — locked at registration */}
              <div>
                <label className="block text-xs text-white/60 mb-2">Work Type</label>
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-[12px] bg-[#0F172A] border border-white/10 w-fit">
                  <span>
                    {editForm.job_type === 'in_place' ? '📍' : editForm.job_type === 'remote' ? '💻' : '🌐'}
                  </span>
                  <span className="text-xs font-semibold text-white/70 capitalize">
                    {editForm.job_type === 'in_place' ? 'In-Place' : editForm.job_type === 'remote' ? 'Remote' : 'Both'}
                  </span>
                  <span className="text-[10px] text-white/30 ml-1">· locked at registration</span>
                </div>
              </div>

              {/* Location Picker — hidden for remote-only providers */}
              {editForm.job_type !== 'remote' && <div>
                <label className="block text-xs text-white/60 mb-1">Location</label>
                {!editMapOpen ? (
                  <button type="button" onClick={() => setEditMapOpen(true)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-[20px] bg-[#0F172A] border border-white/10 text-white/60 hover:border-[#22C55E]/50 transition"
                  >
                    <svg className="w-4 h-4 text-red-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                    {editForm.latitude
                      ? <span className="text-[#4ADE80] font-medium text-sm">✓ {editForm.latitude.toFixed(4)}, {editForm.longitude.toFixed(4)}</span>
                      : <span className="text-sm">Click to update location</span>}
                  </button>
                ) : (
                  <div className="rounded-[20px] overflow-hidden border border-white/10" style={{ position: 'relative' }}>
                    {/* Search */}
                    <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', zIndex: 1000, width: '80%' }}>
                      <input type="text" placeholder="Search location..."
                        value={editLocationSearch}
                        onChange={e => handleEditLocationSearch(e.target.value)}
                        className="w-full px-4 py-2 rounded-[20px] bg-[#1E293B] border border-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#22C55E] shadow-lg text-sm" />
                      {editLocationResults.length > 0 && (
                        <div style={{ backgroundColor: '#1E293B', borderRadius: '12px', marginTop: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>
                          {editLocationResults.map(r => (
                            <div key={r.place_id} onClick={() => {
                              const loc = [parseFloat(r.lat), parseFloat(r.lon)];
                              setEditFlyTarget(loc);
                              setEditForm({ ...editForm, latitude: loc[0], longitude: loc[1] });
                              setEditLocationSearch(r.display_name.split(',').slice(0, 2).join(','));
                              setEditLocationResults([]);
                            }}
                              style={{ padding: '8px 14px', color: 'rgba(255,255,255,0.85)', cursor: 'pointer', fontSize: '13px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                              {r.display_name.split(',').slice(0, 2).join(',')}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <MapContainer center={editFlyTarget} zoom={6} style={{ height: '260px', width: '100%' }} zoomControl={false}>
                      <TileLayer url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png" />
                      <FlyToLocation position={editFlyTarget} />
                      <LocationPicker onLocationSet={loc => setEditForm({ ...editForm, latitude: loc[0], longitude: loc[1] })} />
                      {editForm.latitude && <Marker position={[editForm.latitude, editForm.longitude]} />}
                    </MapContainer>
                    <div style={{ backgroundColor: '#1E293B', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: editForm.latitude ? '#4ADE80' : 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
                        {editForm.latitude ? `✓ ${editForm.latitude.toFixed(4)}, ${editForm.longitude.toFixed(4)}` : 'Click on the map to pin your location'}
                      </span>
                      <button type="button" onClick={() => setEditMapOpen(false)}
                        style={{ backgroundColor: '#22C55E', color: 'white', border: 'none', borderRadius: '20px', padding: '6px 16px', fontSize: '13px', cursor: 'pointer', fontWeight: '600' }}>
                        Done
                      </button>
                    </div>
                  </div>
                )}
              </div>}
            </div>
          )}

          {/* Save */}
          <button onClick={handleSave} disabled={saving}
            className="w-full py-3.5 rounded-[20px] bg-gradient-to-r from-[#22C55E] to-[#4ADE80] hover:from-[#16A34A] hover:to-[#22C55E] disabled:opacity-50 text-white font-semibold shadow-lg shadow-[#22C55E]/30 transition-all duration-200"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    );
  }

  // ─── VIEW MODE ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0F172A] text-white px-6 py-10 relative">
      <div className="fixed inset-0 bg-gradient-to-br from-[#22C55E]/5 via-transparent to-[#4ADE80]/5 pointer-events-none z-0" />
      <SideDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* Menu button + Theme toggle */}
      <div className="fixed top-6 left-6 z-40 flex items-center gap-2">
        <button onClick={() => setDrawerOpen(true)}
          className="w-10 h-10 rounded-[15px] bg-[#1E293B] border border-white/10 shadow-lg flex items-center justify-center text-white hover:bg-[#22C55E] transition-all duration-300"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <ThemeToggle />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">

        {/* HEADER CARD */}
        <div className="bg-[#1E293B] border border-white/10 rounded-[20px] p-6 md:p-8 shadow-xl relative overflow-hidden mb-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#22C55E]/5 rounded-full blur-[80px] -z-10" />
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-28 h-28 rounded-full border-2 border-[#22C55E]/30 overflow-hidden bg-white/5 flex items-center justify-center shadow-lg">
                {profileData?.avatar ? (
                  <img src={`/uploads/${profileData.avatar}`} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-bold text-white/20 capitalize">{fullName.charAt(0) || '?'}</span>
                )}
              </div>
              {isOwnProfile && (
                <>
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={avatarUploading}
                    className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#22C55E] border-2 border-[#0F172A] flex items-center justify-center hover:bg-[#16A34A] transition-all shadow-lg"
                    title="Change avatar"
                  >
                    {avatarUploading
                      ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    }
                  </button>
                  <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />
                </>
              )}
            </div>

            <div className="flex-1 w-full">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-white/90">{fullName}</h1>
                  <div className="flex flex-wrap gap-3 mt-2">
                    <span className="text-white/50 text-sm flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeWidth="2"/></svg>
                      {profileData?.email}
                    </span>
                    {isProvider && (
                      <span className="text-white/50 text-sm flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeWidth="2"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" strokeWidth="2"/></svg>
                        {(profileData?.provider_profile?.experience_years || profileData?.experience_years)
                          ? `${profileData.provider_profile?.experience_years || profileData.experience_years} yrs experience`
                          : 'Professional Provider'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3">
                  <div className="px-3.5 py-1.5 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#4ADE80] font-semibold text-sm capitalize">
                    {profileData?.role || 'User'} Account
                  </div>
                  {isProvider && (
                    <button onClick={isOwnProfile ? toggleAvailability : undefined}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        (profileData?.provider_profile?.is_available || profileData?.is_available)
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      } ${!isOwnProfile ? 'cursor-default' : ''}`}
                    >
                      <div className={`w-2 h-2 rounded-full animate-pulse ${(profileData?.provider_profile?.is_available || profileData?.is_available) ? 'bg-emerald-400' : 'bg-red-400'}`} />
                      {(profileData?.provider_profile?.is_available || profileData?.is_available) ? 'Available Now' : 'Unavailable'}
                    </button>
                  )}
                  {isOwnProfile && isProvider && (
                    <button onClick={enterEditMode}
                      className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#4ADE80] text-xs font-semibold hover:bg-[#22C55E]/20 transition-all"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Profile
                    </button>
                  )}
                  {!isOwnProfile && isProvider && user?.role === 'client' && (() => {
                    const available = profileData?.provider_profile?.is_available ?? profileData?.is_available ?? true;
                    return available ? (
                      <button
                        onClick={() => setReqModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#22C55E]/20 border border-[#22C55E]/40 text-[#4ADE80] text-xs font-semibold hover:bg-[#22C55E]/30 transition-all shadow-lg shadow-[#22C55E]/10"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Send Request
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/30 text-xs font-semibold cursor-not-allowed select-none">
                        <div className="w-1.5 h-1.5 rounded-full bg-white/20 flex-shrink-0" />
                        Not taking requests
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {isProvider ? (
            <>
              <div className="bg-[#1E293B] border border-white/10 p-6 rounded-[20px] text-center">
                <p className="text-3xl font-bold text-[#22C55E]">{profileData?.rating_avg?.toFixed(1) || '0.0'}</p>
                <p className="text-white/40 text-xs font-medium uppercase tracking-wider mt-1">Rating Score</p>
              </div>
              <div className="bg-[#1E293B] border border-white/10 p-6 rounded-[20px] text-center">
                <p className="text-3xl font-bold text-white/90">{profileData?.total_reviews || ratings.length || 0}</p>
                <p className="text-white/40 text-xs font-medium uppercase tracking-wider mt-1">Total Reviews</p>
              </div>
              <div className="bg-[#1E293B] border border-white/10 p-6 rounded-[20px] text-center">
                <p className="text-3xl font-bold text-white/90">{profileData?.completed_jobs || 0}</p>
                <p className="text-white/40 text-xs font-medium uppercase tracking-wider mt-1">Completed Jobs</p>
              </div>
              {(() => {
                const jt = profileData?.provider_profile?.job_type || 'in_place';
                const map = { in_place: { label: 'In-Place', icon: '📍', color: '#22C55E' }, remote: { label: 'Remote', icon: '💻', color: '#6366F1' }, both: { label: 'Both', icon: '🌐', color: '#F59E0B' } };
                const { label, icon, color } = map[jt] || map.in_place;
                return (
                  <div className="bg-[#1E293B] border border-white/10 p-6 rounded-[20px] text-center">
                    <p className="text-3xl font-bold" style={{ color }}>{icon}</p>
                    <p className="text-white/90 text-sm font-semibold mt-1">{label}</p>
                    <p className="text-white/40 text-xs font-medium uppercase tracking-wider mt-0.5">Work Type</p>
                  </div>
                );
              })()}
            </>
          ) : (
            <>
              <div className="bg-[#1E293B] border border-white/10 p-6 rounded-[20px] text-center">
                <p className="text-3xl font-bold text-[#22C55E]">{profileData?.rating_avg?.toFixed(1) || '0.0'}</p>
                <p className="text-white/40 text-xs font-medium uppercase tracking-wider mt-1">Rating Score</p>
              </div>
              <div className="bg-[#1E293B] border border-white/10 p-6 rounded-[20px] text-center">
                <p className="text-3xl font-bold text-white/90">{profileData?.total_reviews ?? ratings.length}</p>
                <p className="text-white/40 text-xs font-medium uppercase tracking-wider mt-1">Total Reviews</p>
              </div>
              <div className="bg-[#1E293B] border border-white/10 p-6 rounded-[20px] text-center">
                <p className="text-3xl font-bold text-white/90">{profileData?.total_requests || 0}</p>
                <p className="text-white/40 text-xs font-medium uppercase tracking-wider mt-1">Total Requests</p>
              </div>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* LEFT: INFO */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-[#1E293B] border border-white/10 p-6 rounded-[20px]">
              <h3 className="text-sm font-semibold text-white/40 uppercase tracking-widest mb-4">About</h3>
              {isProvider ? (
                <>
                  <div className="mb-4">
                    <p className="text-xs text-white/40 mb-1">Service Categories</p>
                    <div className="flex flex-wrap gap-2">
                      {(profileData?.provider_profile?.service_categories || profileData?.service_categories || []).map(cat => {
                        const customCat = profileData?.provider_profile?.custom_category;
                        const label = cat === 'Other' && customCat ? customCat : cat;
                        return (
                          <span key={cat} className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20">
                            {label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-white/40 mb-1">Hourly Rate</p>
                    <p className="text-lg font-bold text-emerald-400">{profileData?.provider_profile?.hourly_rate || profileData?.hourly_rate || 0} DT/hr</p>
                  </div>
                </>
              ) : (
                <p className="text-sm text-white/60">Account dashboard and service request history.</p>
              )}
            </div>

            {isOwnProfile && (
              <div className="bg-[#1E293B] border border-white/10 p-6 rounded-[20px] space-y-4">
                <h3 className="text-sm font-semibold text-white/40 uppercase tracking-widest">Security</h3>

                {/* Password change */}
                <div>
                  <button
                    onClick={() => { setShowPasswordForm(v => !v); setPwError(''); setPwSuccess(false); }}
                    className="w-full py-2 rounded-lg bg-white/5 border border-white/10 text-white/60 text-xs font-medium hover:bg-white/10 transition-all text-left px-3 flex items-center justify-between"
                  >
                    <span>Change Password</span>
                    <svg className={`w-3.5 h-3.5 transition-transform ${showPasswordForm ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {showPasswordForm && (
                    <form onSubmit={handlePasswordChange} className="mt-3 space-y-2">
                      {pwError && <p className="text-xs text-red-400">{pwError}</p>}
                      {pwSuccess && <p className="text-xs text-emerald-400">Password changed successfully!</p>}
                      <input
                        type="password" placeholder="Current password" required
                        value={pwForm.current_password}
                        onChange={e => setPwForm(p => ({ ...p, current_password: e.target.value }))}
                        className="w-full px-3 py-2 rounded-[12px] bg-[#0F172A] border border-white/10 text-white text-xs placeholder-white/30 outline-none focus:border-[#22C55E]/50"
                      />
                      <input
                        type="password" placeholder="New password (min 8 chars)" required
                        value={pwForm.new_password}
                        onChange={e => setPwForm(p => ({ ...p, new_password: e.target.value }))}
                        className="w-full px-3 py-2 rounded-[12px] bg-[#0F172A] border border-white/10 text-white text-xs placeholder-white/30 outline-none focus:border-[#22C55E]/50"
                      />
                      <input
                        type="password" placeholder="Confirm new password" required
                        value={pwForm.confirm}
                        onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                        className="w-full px-3 py-2 rounded-[12px] bg-[#0F172A] border border-white/10 text-white text-xs placeholder-white/30 outline-none focus:border-[#22C55E]/50"
                      />
                      <button type="submit" disabled={pwSaving}
                        className="w-full py-2 rounded-[12px] bg-[#22C55E]/20 border border-[#22C55E]/40 text-[#4ADE80] text-xs font-semibold hover:bg-[#22C55E]/30 transition-all disabled:opacity-50"
                      >
                        {pwSaving ? 'Saving...' : 'Update Password'}
                      </button>
                    </form>
                  )}
                </div>

                {/* Revoke devices */}
                <div>
                  <p className="text-xs text-white/50 mb-2">Revoke all trusted devices (forces re-login everywhere).</p>
                  {message && <p className="text-xs text-emerald-400 mb-2">{message}</p>}
                  <button onClick={handleRemoveDevices} disabled={revoking}
                    className="w-full py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium hover:bg-red-500/20 transition-all disabled:opacity-50"
                  >
                    {revoking ? 'Removing...' : 'Untrust All Devices'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: MAIN CONTENT */}
          <div className="md:col-span-2 space-y-6">
            {isProvider ? (
              <>
                <div className="bg-[#1E293B] border border-white/10 p-6 rounded-[20px]">
                  <h2 className="text-lg font-bold mb-4">Service Description</h2>
                  <p className="text-white/60 text-sm leading-relaxed whitespace-pre-wrap">
                    {profileData?.provider_profile?.bio || profileData?.bio || 'No description provided yet.'}
                  </p>
                </div>

                {/* PORTFOLIO */}
                <div className="bg-[#1E293B] border border-white/10 p-6 rounded-[20px]">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold">Portfolio</h2>
                    {isOwnProfile && (
                      <button onClick={() => setShowUploadForm(v => !v)}
                        className="text-xs text-[#22C55E] hover:underline font-medium flex items-center gap-1"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Image
                      </button>
                    )}
                  </div>

                  {/* Upload form */}
                  {showUploadForm && isOwnProfile && (
                    <form onSubmit={handlePortfolioUpload} className="mb-4 p-4 rounded-[15px] bg-[#0F172A] border border-white/5 space-y-3">
                      {/* File picker */}
                      <label className="flex flex-col items-center justify-center gap-2 w-full h-24 rounded-[12px] border-2 border-dashed border-white/10 hover:border-[#22C55E]/40 cursor-pointer transition-colors">
                        <svg className="w-6 h-6 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-white/40 text-xs">{uploadFiles.length ? `${uploadFiles.length} photo${uploadFiles.length > 1 ? 's' : ''} selected` : 'Click to select photos (up to 8)'}</span>
                        <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden"
                          onChange={e => setUploadFiles(Array.from(e.target.files).slice(0, 8))} />
                      </label>
                      {/* Previews */}
                      {uploadFiles.length > 0 && (
                        <div className="flex gap-2 flex-wrap">
                          {uploadFiles.map((f, i) => (
                            <div key={i} className="relative w-16 h-16 rounded-[10px] overflow-hidden border border-white/10 group/thumb">
                              <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                              <button type="button"
                                onClick={() => setUploadFiles(prev => prev.filter((_, j) => j !== i))}
                                className="absolute inset-0 bg-black/50 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity"
                              >
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <input type="text" placeholder="Description for this post..."
                        value={uploadDesc} onChange={e => setUploadDesc(e.target.value)}
                        className="w-full px-3 py-2 rounded-[12px] bg-[#1E293B] border border-white/10 text-white text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#22C55E]" />
                      <button type="submit" disabled={uploading || !uploadFiles.length || !uploadDesc.trim()}
                        className="w-full py-2 rounded-[12px] bg-[#22C55E] text-white text-sm font-semibold disabled:opacity-50 hover:bg-[#16A34A] transition"
                      >
                        {uploading ? 'Uploading...' : `Upload ${uploadFiles.length > 1 ? `${uploadFiles.length} photos` : 'photo'}`}
                      </button>
                    </form>
                  )}

                  {portfolio.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                      {portfolio.map(item => {
                        const images = item.image_paths?.length ? item.image_paths : (item.image_path ? [item.image_path] : []);
                        return (
                          <PortfolioCard
                            key={item._id}
                            images={images}
                            description={item.description}
                            isOwnProfile={isOwnProfile}
                            onDelete={() => handleDeletePortfolio(item._id)}
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <div className="h-32 flex items-center justify-center border-2 border-dashed border-white/5 rounded-xl">
                      <p className="text-white/20 text-sm">No portfolio items yet.</p>
                    </div>
                  )}
                </div>

                {/* REVIEWS — always visible for providers */}
                <div className="bg-[#1E293B] border border-white/10 p-6 rounded-[20px]">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold">Reviews</h2>
                    {ratings.length > 0 && (
                      <span className="text-xs text-white/40 bg-white/5 px-2 py-0.5 rounded-full">
                        {ratings.length} review{ratings.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  {ratings.length > 0 ? (
                    <div className="space-y-3">
                      {ratings.slice(0, 10).map(r => (
                        <div key={r._id} className="p-3 rounded-[12px] bg-[#0F172A] border border-white/5">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="flex gap-0.5">
                              {[1,2,3,4,5].map(s => (
                                <svg key={s} className={`w-3 h-3 ${s <= r.score ? 'text-yellow-400' : 'text-white/10'}`} fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                </svg>
                              ))}
                            </div>
                            <span className="text-white/30 text-[10px]">
                              {r.created_at ? new Date(r.created_at).toLocaleDateString() : ''}
                            </span>
                          </div>
                          {r.comment && <p className="text-white/60 text-xs leading-relaxed">{r.comment}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-32 flex flex-col items-center justify-center gap-2">
                      <svg className="w-8 h-8 text-white/10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                      <p className="text-white/25 text-sm">No reviews yet</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-[#1E293B] border border-white/10 p-6 rounded-[20px]">
                <h2 className="text-lg font-bold mb-4">Reviews</h2>
                {ratings.length > 0 ? (
                  <div className="space-y-3">
                    {ratings.slice(0, 5).map(r => (
                      <div key={r._id} className="p-3 rounded-[12px] bg-[#0F172A] border border-white/5">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="flex gap-0.5">
                            {[1,2,3,4,5].map(s => (
                              <svg key={s} className={`w-3 h-3 ${s <= r.score ? 'text-yellow-400' : 'text-white/10'}`} fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                              </svg>
                            ))}
                          </div>
                          <span className="text-white/30 text-[10px]">{new Date(r.created_at).toLocaleDateString()}</span>
                        </div>
                        {r.comment && <p className="text-white/60 text-xs">{r.comment}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="min-h-[200px] flex flex-col items-center justify-center text-center">
                    <svg className="w-12 h-12 text-white/5 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    <p className="text-white/30 text-sm">No reviews yet</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── REQUEST MODAL ──────────────────────────────────────────────────── */}
      {reqModalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center px-4"
          style={{ backgroundColor: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(8px)' }}>
          <div className="bg-[#1E293B] border border-white/10 rounded-[24px] p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-white">Send a Request</h2>
                <p className="text-white/40 text-xs mt-0.5">to {fullName}</p>
              </div>
              <button
                onClick={() => { setReqModalOpen(false); setReqDesc(''); setReqError(''); setReqSent(false); }}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {reqSent ? (
              <div className="py-8 flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-[#22C55E]/20 border border-[#22C55E]/40 flex items-center justify-center">
                  <svg className="w-7 h-7 text-[#4ADE80]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-[#4ADE80] font-semibold">Request sent!</p>
                <p className="text-white/40 text-xs text-center">The provider will review and respond shortly.</p>
              </div>
            ) : (
              <>
                {reqError && (
                  <div className="mb-4 p-3 rounded-[12px] bg-red-500/15 border border-red-500/30 text-red-300 text-xs">
                    {reqError}
                  </div>
                )}
                <textarea
                  value={reqDesc}
                  onChange={e => setReqDesc(e.target.value)}
                  placeholder="Describe what you need (e.g. Fix a leaking pipe in the kitchen, need it done this week...)"
                  rows={4}
                  className="w-full px-4 py-3 rounded-[16px] bg-[#0F172A] border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#22C55E] resize-none text-sm mb-4 transition"
                />
                <button
                  onClick={handleSendRequest}
                  disabled={reqSending || !reqDesc.trim()}
                  className="w-full py-3 rounded-[16px] bg-gradient-to-r from-[#22C55E] to-[#4ADE80] text-white font-semibold text-sm disabled:opacity-40 hover:from-[#16A34A] hover:to-[#22C55E] transition-all shadow-lg shadow-[#22C55E]/20"
                >
                  {reqSending ? 'Sending...' : 'Send Request'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
