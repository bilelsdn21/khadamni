import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import useAuth from '../hooks/useAuth';
import useNotifications from '../hooks/useNotifications';
import { useTheme } from '../context/ThemeContext';
import { getProfile } from '../api/profile';
import { getMyRequests } from '../api/request';
import api from '../api/axios';

// ─── Icons ────────────────────────────────────────────────────────────────────
function ProfileIcon() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
}
function MapIcon() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>;
}
function RequestsIcon() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>;
}
function ShieldIcon() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;
}
function LogoutIcon() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
}
function BellIcon() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
}
function HelpIcon() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
}

// ─── Avatar helpers ───────────────────────────────────────────────────────────
const GRADIENTS = [
  ['#22C55E','#16A34A'], ['#3B82F6','#1D4ED8'], ['#8B5CF6','#6D28D9'],
  ['#F59E0B','#D97706'], ['#EC4899','#BE185D'], ['#06B6D4','#0E7490'],
];
function nameGradient(name = '') {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  const [a, b] = GRADIENTS[Math.abs(h) % GRADIENTS.length];
  return `linear-gradient(135deg, ${a}, ${b})`;
}

// ─── Star display ─────────────────────────────────────────────────────────────
function Stars({ rating = 0 }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(s => (
        <svg key={s} className="w-3 h-3" fill={s <= Math.round(rating) ? '#F59E0B' : 'none'}
          stroke={s <= Math.round(rating) ? '#F59E0B' : 'rgba(255,255,255,0.2)'} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
        </svg>
      ))}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function SideDrawer({ open, onClose }) {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { unseenCount: notifCount } = useNotifications();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const [providerStats, setProviderStats] = useState(null);   // { is_available, rating_avg, total_reviews, total_jobs }
  const [toggling, setToggling]           = useState(false);
  const [clientStats, setClientStats]     = useState(null);   // { active, completed }

  // Fetch role-specific stats when drawer opens
  useEffect(() => {
    if (!open || !user) return;

    if (user.role === 'provider') {
      getProfile().then(res => {
        const d = res.data;                          // top-level: rating_avg, total_reviews, completed_jobs
        const p = d?.provider_profile;               // nested: is_available
        setProviderStats({
          is_available:  p?.is_available  ?? false,
          rating_avg:    d?.rating_avg    ?? 0,
          total_reviews: d?.total_reviews ?? 0,
          total_jobs:    d?.completed_jobs ?? 0,
        });
      }).catch(() => {});
    }

    if (user.role === 'client') {
      getMyRequests().then(res => {
        const reqs = res.data || [];
        setClientStats({
          active:    reqs.filter(r => ['pending','in_progress','confirmed'].includes(r.status)).length,
          completed: reqs.filter(r => r.status === 'completed').length,
        });
      }).catch(() => {});
    }
  }, [open, user?.role]);

  const handleToggleAvailability = async () => {
    if (toggling) return;
    setToggling(true);
    try {
      const res = await api.post('/providers/toggle-availability');
      setProviderStats(prev => prev ? { ...prev, is_available: res.data.is_available } : prev);
    } catch {}
    setToggling(false);
  };

  const handleLogout = () => { logout(); onClose(); navigate('/'); };

  const fullName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim();

  const NAV_ITEMS = [
    { path: '/profile',       label: 'My Profile',     icon: ProfileIcon },
    ...(user?.role !== 'moderator' ? [{ path: '/requests', label: user?.role === 'provider' ? 'My Jobs' : 'My Requests', icon: RequestsIcon }] : []),
    { path: '/map',           label: 'Explore Map',    icon: MapIcon },
  ];

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose}
        className={`fixed inset-0 bg-black/40 z-[2000] transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      />

      {/* Drawer */}
      <aside className={`fixed top-0 left-0 h-full w-[280px] max-w-[85vw] bg-[#1E293B] border-r border-white/10 shadow-2xl z-[2001] flex flex-col transition-transform duration-300 ease-out ${open ? 'translate-x-0' : '-translate-x-full'}`}>

        {/* ── Header ── */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <span className="text-lg font-bold tracking-wider text-white">KHADAMNI</span>
          <button type="button" onClick={onClose}
            className="w-9 h-9 rounded-[16px] flex items-center justify-center text-white/50 hover:bg-white/10 hover:text-white transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── User card ── */}
        {user && (
          <div className="px-4 py-4 border-b border-white/10 flex items-center gap-3">
            {user.avatar ? (
              <img src={`/uploads/${user.avatar}`} alt={fullName}
                className="w-12 h-12 rounded-full object-cover border-2 border-white/10 flex-shrink-0" />
            ) : (
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                style={{ background: nameGradient(fullName) }}>
                {fullName.charAt(0).toUpperCase() || '?'}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm truncate">{fullName || '—'}</p>
              <p className="text-white/40 text-xs capitalize">{user.role}</p>
              {user.email && <p className="text-white/25 text-[10px] truncate">{user.email}</p>}
            </div>
          </div>
        )}

        {/* ── Provider stats card ── */}
        {user?.role === 'provider' && (
          <div className="mx-3 mt-3 rounded-[16px] border border-white/8 bg-white/[0.03] p-3">
            {/* Availability toggle row */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${providerStats?.is_available ? 'bg-[#22C55E] shadow-[0_0_6px_rgba(34,197,94,0.8)]' : 'bg-white/20'}`} />
                <span className={`text-xs font-semibold ${providerStats?.is_available ? 'text-[#4ADE80]' : 'text-white/40'}`}>
                  {providerStats === null ? 'Loading...' : providerStats.is_available ? 'Available' : 'Unavailable'}
                </span>
              </div>
              <button
                onClick={handleToggleAvailability}
                disabled={toggling || providerStats === null}
                className={`relative w-10 h-5 rounded-full transition-colors duration-300 disabled:opacity-50 ${providerStats?.is_available ? 'bg-[#22C55E]' : 'bg-white/10'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${providerStats?.is_available ? 'left-[calc(100%-18px)]' : 'left-0.5'}`} />
              </button>
            </div>

            {/* Stats row */}
            {providerStats && (
              <div className="flex items-center gap-3 pt-2 border-t border-white/8">
                <div className="flex flex-col items-center flex-1">
                  <Stars rating={providerStats.rating_avg} />
                  <span className="text-[#4ADE80] font-bold text-sm mt-0.5">
                    {providerStats.rating_avg > 0 ? providerStats.rating_avg.toFixed(1) : '—'}
                  </span>
                  <span className="text-white/30 text-[9px]">{providerStats.total_reviews} reviews</span>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div className="flex flex-col items-center flex-1">
                  <span className="text-white font-bold text-xl leading-none">{providerStats.total_jobs}</span>
                  <span className="text-white/30 text-[9px] mt-1">jobs done</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Client stats card ── */}
        {user?.role === 'client' && clientStats !== null && (
          <div className="mx-3 mt-3 rounded-[16px] border border-white/8 bg-white/[0.03] p-3 flex items-center gap-0">
            <div className="flex-1 flex flex-col items-center py-1">
              <span className="text-[#4ADE80] font-bold text-2xl leading-none">{clientStats.active}</span>
              <span className="text-white/35 text-[10px] mt-1">active</span>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="flex-1 flex flex-col items-center py-1">
              <span className="text-white font-bold text-2xl leading-none">{clientStats.completed}</span>
              <span className="text-white/35 text-[10px] mt-1">completed</span>
            </div>
          </div>
        )}

        {/* ── Nav ── */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1 mt-2">
          {NAV_ITEMS.map(item => (
            <Link key={item.path} to={item.path} onClick={onClose}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-[20px] text-white/80 hover:bg-[#22C55E]/20 hover:text-[#4ADE80] transition-colors duration-200">
              <item.icon />
              <span className="font-medium text-sm">{item.label}</span>
              {item.badge > 0 && (
                <span className="ml-auto min-w-[20px] h-5 px-1.5 bg-[#22C55E] rounded-full text-white text-[10px] font-bold flex items-center justify-center">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </Link>
          ))}

          {user?.role === 'moderator' && (
            <Link to="/moderator" onClick={onClose}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-[20px] text-[#4ADE80]/80 hover:bg-[#22C55E]/20 hover:text-[#4ADE80] transition-colors duration-200 border border-[#22C55E]/20 mt-2">
              <ShieldIcon />
              <span className="font-medium text-sm">Moderator Panel</span>
            </Link>
          )}
        </nav>

        {/* ── Help & Support ── */}
        <div className="px-3 pb-1">
          <Link to="/support" onClick={onClose}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-[20px] text-white/50 hover:bg-white/5 hover:text-white/80 transition-colors duration-200">
            <HelpIcon />
            <span className="font-medium text-sm">Help & FAQ</span>
          </Link>
        </div>

        {/* ── Theme toggle ── */}
        <div className="px-3 pb-1">
          <button onClick={toggleTheme}
            className="w-full flex items-center justify-between px-4 py-3 rounded-[20px] text-white/60 hover:bg-white/5 transition-colors duration-200">
            <div className="flex items-center gap-3">
              {isDark ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 5a7 7 0 000 14A7 7 0 0012 5z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
              <span className="font-medium text-sm">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
            </div>
            <div className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${isDark ? 'bg-white/10' : 'bg-[#22C55E]'}`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${isDark ? 'left-0.5' : 'left-[calc(100%-18px)]'}`} />
            </div>
          </button>
        </div>

        {/* ── Logout ── */}
        <div className="p-3 border-t border-white/10">
          <button type="button" onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-[20px] text-red-400 hover:bg-red-500/10 transition-colors duration-200 font-medium text-sm">
            <LogoutIcon />
            Sign out
          </button>
        </div>

      </aside>
    </>
  );
}
