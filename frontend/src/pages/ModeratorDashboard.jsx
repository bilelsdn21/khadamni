import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import useAuth from '../hooks/useAuth';

// ─── Icons ───────────────────────────────────────────────────────────────────
function UsersIcon() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
}
function ClipboardIcon() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>;
}
function CheckCircleIcon() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
}
function ClockIcon() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
}
function FlagIcon() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>;
}
function BanIcon() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>;
}
function ShieldIcon() {
  return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;
}
function SearchIcon() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
}
function BackIcon() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const DURATION_OPTIONS = [
  { label: '1 Day',    value: '1d' },
  { label: '3 Days',   value: '3d' },
  { label: '1 Week',   value: '1w' },
  { label: '1 Month',  value: '1m' },
  { label: 'Permanent',value: 'permanent' },
];

const RECOMMENDATION_COLORS = {
  client_favored:        { bg: 'bg-blue-500/15',   border: 'border-blue-500/30',   text: 'text-blue-400',   label: 'Client Favored' },
  provider_favored:      { bg: 'bg-purple-500/15',  border: 'border-purple-500/30', text: 'text-purple-400', label: 'Provider Favored' },
  neutral:               { bg: 'bg-yellow-500/15',  border: 'border-yellow-500/30', text: 'text-yellow-400', label: 'Neutral' },
  insufficient_evidence: { bg: 'bg-white/5',         border: 'border-white/10',      text: 'text-white/50',   label: 'Insufficient Evidence' },
};

function timeLeft(isoString) {
  if (!isoString) return 'Permanent';
  const diff = new Date(isoString) - Date.now();
  if (diff <= 0) return 'Expired';
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  if (d > 0) return `${d}d ${h}h left`;
  const m = Math.floor((diff % 3600000) / 60000);
  return `${h}h ${m}m left`;
}

function avatarInitials(u) {
  return `${u.first_name?.[0] ?? ''}${u.last_name?.[0] ?? ''}`.toUpperCase();
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color = 'green', sub }) {
  const colors = {
    green:  { ring: 'ring-[#22C55E]/20', icon: 'text-[#4ADE80] bg-[#22C55E]/10', val: 'text-[#4ADE80]' },
    blue:   { ring: 'ring-blue-500/20',  icon: 'text-blue-400  bg-blue-500/10',  val: 'text-blue-400' },
    yellow: { ring: 'ring-yellow-500/20',icon: 'text-yellow-400 bg-yellow-500/10',val: 'text-yellow-400' },
    red:    { ring: 'ring-red-500/20',   icon: 'text-red-400   bg-red-500/10',   val: 'text-red-400' },
    purple: { ring: 'ring-purple-500/20',icon: 'text-purple-400 bg-purple-500/10',val: 'text-purple-400' },
    orange: { ring: 'ring-orange-500/20',icon: 'text-orange-400 bg-orange-500/10',val: 'text-orange-400' },
  };
  const c = colors[color];
  return (
    <div className={`bg-[#1E293B] rounded-[20px] border border-white/10 p-5 ring-1 ${c.ring} flex flex-col gap-3 hover:border-white/20 transition-all duration-200`}>
      <div className="flex items-center justify-between">
        <span className="text-white/50 text-sm font-medium">{label}</span>
        <div className={`w-9 h-9 rounded-[12px] flex items-center justify-center ${c.icon}`}>{icon}</div>
      </div>
      <div>
        <p className={`text-3xl font-bold ${c.val}`}>{value ?? '—'}</p>
        {sub && <p className="text-white/40 text-xs mt-1">{sub}</p>}
      </div>
    </div>
  );
}

function CategoryBar({ label, count, max }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-white/80 font-medium">{label}</span>
        <span className="text-[#4ADE80] font-bold">{count}</span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#22C55E] to-[#4ADE80] rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ModeratorDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Stats
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Users
  const [users, setUsers] = useState([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersPage, setUsersPage] = useState(1);
  const [usersPages, setUsersPages] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [usersLoading, setUsersLoading] = useState(false);

  // Reports
  const [reports, setReports] = useState([]);
  const [reportsTotal, setReportsTotal] = useState(0);
  const [reportsPage, setReportsPage] = useState(1);
  const [reportsPages, setReportsPages] = useState(1);
  const [reportFilter, setReportFilter] = useState('pending');
  const [reportsLoading, setReportsLoading] = useState(false);

  // Active section tab
  const [activeSection, setActiveSection] = useState('users');

  // Suspend modal
  const [suspendModal, setSuspendModal] = useState(null); // { userId, name }
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendDuration, setSuspendDuration] = useState('1d');
  const [suspendLoading, setSuspendLoading] = useState(false);

  // Edit modal
  const [editModal, setEditModal] = useState(null); // user object
  const [editFields, setEditFields] = useState({});
  const [editLoading, setEditLoading] = useState(false);

  // Delete confirm
  const [deleteModal, setDeleteModal] = useState(null); // { userId, name }
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Review modal
  const [reviewModal, setReviewModal] = useState(null); // report object
  const [reviewNote, setReviewNote] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  // Expanded report
  const [expandedReport, setExpandedReport] = useState(null);

  // ─── Fetch stats ───────────────────────────────────────────────────────────
  useEffect(() => {
    setStatsLoading(true);
    api.get('/moderator/stats')
      .then(r => setStats(r.data))
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, []);

  // ─── Fetch users ───────────────────────────────────────────────────────────
  const fetchUsers = useCallback(() => {
    setUsersLoading(true);
    const suspended = roleFilter === 'suspended' ? 'true' : 'all';
    const role = roleFilter === 'suspended' ? 'all' : roleFilter;
    api.get('/moderator/users', { params: { search, role, suspended, page: usersPage, per_page: 15 } })
      .then(r => {
        setUsers(r.data.users);
        setUsersTotal(r.data.total);
        setUsersPages(r.data.pages);
      })
      .catch(() => {})
      .finally(() => setUsersLoading(false));
  }, [search, roleFilter, usersPage]);

  useEffect(() => { if (activeSection === 'users') fetchUsers(); }, [fetchUsers, activeSection]);

  // ─── Fetch reports ─────────────────────────────────────────────────────────
  const fetchReports = useCallback(() => {
    setReportsLoading(true);
    api.get('/moderator/reports', { params: { status: reportFilter, page: reportsPage, per_page: 10 } })
      .then(r => {
        setReports(r.data.reports);
        setReportsTotal(r.data.total);
        setReportsPages(r.data.pages);
      })
      .catch(() => {})
      .finally(() => setReportsLoading(false));
  }, [reportFilter, reportsPage]);

  useEffect(() => { if (activeSection === 'reports') fetchReports(); }, [fetchReports, activeSection]);

  // ─── Actions ──────────────────────────────────────────────────────────────
  const handleSuspend = async () => {
    if (!suspendReason.trim()) return;
    setSuspendLoading(true);
    try {
      await api.patch(`/moderator/users/${suspendModal.userId}/suspend`, {
        reason: suspendReason,
        duration: suspendDuration,
      });
      setSuspendModal(null);
      setSuspendReason('');
      setSuspendDuration('1d');
      fetchUsers();
      api.get('/moderator/stats').then(r => setStats(r.data));
    } catch {}
    setSuspendLoading(false);
  };

  const handleActivate = async (userId) => {
    try {
      await api.patch(`/moderator/users/${userId}/activate`);
      fetchUsers();
      api.get('/moderator/stats').then(r => setStats(r.data));
    } catch {}
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`/moderator/users/${deleteModal.userId}`);
      setDeleteModal(null);
      fetchUsers();
      api.get('/moderator/stats').then(r => setStats(r.data));
    } catch {}
    setDeleteLoading(false);
  };

  const handleEdit = async () => {
    const body = Object.fromEntries(Object.entries(editFields).filter(([, v]) => v !== ''));
    if (!Object.keys(body).length) { setEditModal(null); return; }
    setEditLoading(true);
    try {
      await api.patch(`/moderator/users/${editModal._id}`, body);
      setEditModal(null);
      setEditFields({});
      fetchUsers();
    } catch {}
    setEditLoading(false);
  };

  const handleReview = async () => {
    setReviewLoading(true);
    try {
      await api.patch(`/moderator/reports/${reviewModal._id}/review`, { moderator_note: reviewNote });
      setReviewModal(null);
      setReviewNote('');
      fetchReports();
      api.get('/moderator/stats').then(r => setStats(r.data));
    } catch {}
    setReviewLoading(false);
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  const maxInplace = stats?.top_inplace?.[0]?.count || 1;
  const maxRemote = stats?.top_remote?.[0]?.count || 1;

  return (
    <div className="min-h-screen bg-[#0F172A] text-white">
      {/* ── Header ── */}
      <div className="sticky top-0 z-40 bg-[#0F172A]/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-[12px] bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition"
          >
            <BackIcon />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[12px] bg-[#22C55E]/10 border border-[#22C55E]/30 flex items-center justify-center text-[#4ADE80]">
              <ShieldIcon />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-wide">Moderator Panel</h1>
              <p className="text-white/40 text-xs">{user?.first_name} {user?.last_name}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">

        {/* ── Stat Cards ── */}
        {statsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-[#1E293B] rounded-[20px] border border-white/10 p-5 h-28 animate-pulse" />
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard icon={<UsersIcon />}      label="Total Users"     value={stats.users.total}            color="green"  sub={`${stats.users.clients} clients · ${stats.users.providers} providers`} />
            <StatCard icon={<ClipboardIcon />}  label="Total Requests"  value={stats.requests.total}         color="blue"   sub={`${stats.requests.pending} pending`} />
            <StatCard icon={<CheckCircleIcon />} label="Jobs Completed"  value={stats.requests.completed}     color="green"  sub="All time" />
            <StatCard icon={<ClockIcon />}       label="In Progress"     value={stats.requests.in_progress}   color="yellow" sub={`${stats.requests.cancelled} cancelled`} />
            <StatCard icon={<FlagIcon />}        label="Reports"         value={stats.reports.pending}        color="orange" sub={`${stats.reports.reviewed} reviewed`} />
            <StatCard icon={<BanIcon />}         label="Suspended"       value={stats.users.suspended}        color="red"    sub="Active suspensions" />
          </div>
        ) : null}

        {/* ── Top Categories ── */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#1E293B] rounded-[20px] border border-white/10 p-5 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-[#22C55E]" />
                <h3 className="text-sm font-semibold text-white/80">Top In-Place Jobs</h3>
              </div>
              {stats.top_inplace.length > 0 ? stats.top_inplace.map(item => (
                <CategoryBar key={item.category} label={item.category} count={item.count} max={maxInplace} />
              )) : <p className="text-white/30 text-sm">No completed in-place jobs yet.</p>}
            </div>
            <div className="bg-[#1E293B] rounded-[20px] border border-white/10 p-5 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-purple-400" />
                <h3 className="text-sm font-semibold text-white/80">Top Remote Jobs</h3>
              </div>
              {stats.top_remote.length > 0 ? stats.top_remote.map(item => (
                <div key={item.category} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/80 font-medium">{item.category}</span>
                    <span className="text-purple-400 font-bold">{item.count}</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full transition-all duration-700"
                      style={{ width: `${Math.round((item.count / maxRemote) * 100)}%` }} />
                  </div>
                </div>
              )) : <p className="text-white/30 text-sm">No completed remote jobs yet.</p>}
            </div>
          </div>
        )}

        {/* ── Section Tabs ── */}
        <div className="flex gap-2 bg-[#1E293B] p-1.5 rounded-[16px] border border-white/10 w-fit">
          {[{ id: 'users', label: 'Users' }, { id: 'reports', label: 'Reports' }].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`px-5 py-2 rounded-[12px] text-sm font-semibold transition-all duration-200 ${
                activeSection === tab.id
                  ? 'bg-[#22C55E]/15 text-[#4ADE80] border border-[#22C55E]/30'
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              {tab.label}
              {tab.id === 'reports' && stats?.reports?.pending > 0 && (
                <span className="ml-2 inline-flex items-center justify-center w-4 h-4 bg-orange-500 text-white text-[9px] font-bold rounded-full">
                  {stats.reports.pending > 9 ? '9+' : stats.reports.pending}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Users Section ── */}
        {activeSection === 'users' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30"><SearchIcon /></span>
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setUsersPage(1); }}
                  className="w-full bg-[#1E293B] border border-white/10 rounded-[14px] pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#22C55E]/40"
                />
              </div>
              <div className="flex gap-1.5 bg-[#1E293B] p-1 rounded-[14px] border border-white/10 flex-wrap">
                {['all', 'client', 'provider', 'suspended'].map(f => (
                  <button
                    key={f}
                    onClick={() => { setRoleFilter(f); setUsersPage(1); }}
                    className={`px-3 py-1.5 rounded-[10px] text-xs font-semibold capitalize transition-all ${
                      roleFilter === f
                        ? f === 'suspended'
                          ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                          : 'bg-[#22C55E]/15 text-[#4ADE80] border border-[#22C55E]/30'
                        : 'text-white/40 hover:text-white/70'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Users count */}
            <p className="text-white/40 text-xs px-1">{usersTotal} users found</p>

            {/* Users list */}
            {usersLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="bg-[#1E293B] rounded-[16px] border border-white/10 p-4 h-16 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-2.5">
                {users.map(u => (
                  <div key={u._id} className="bg-[#1E293B] rounded-[16px] border border-white/10 p-4 flex items-center gap-4 hover:border-white/20 transition group">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#22C55E]/30 to-[#22C55E]/10 border border-[#22C55E]/20 flex items-center justify-center text-[#4ADE80] text-sm font-bold shrink-0">
                      {avatarInitials(u)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-white">{u.first_name} {u.last_name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          u.role === 'provider'
                            ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                            : u.role === 'moderator'
                            ? 'bg-[#22C55E]/10 border-[#22C55E]/30 text-[#4ADE80]'
                            : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                        }`}>{u.role}</span>
                        {u.suspended && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-red-500/10 border-red-500/30 text-red-400">
                            {u.suspended_until ? `Suspended · ${timeLeft(u.suspended_until)}` : 'Suspended · Permanent'}
                          </span>
                        )}
                      </div>
                      <p className="text-white/40 text-xs truncate">{u.email}</p>
                      {u.suspended && u.suspended_reason && (
                        <p className="text-orange-400/70 text-xs mt-0.5 truncate">Reason: {u.suspended_reason}</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      {u.suspended ? (
                        <button
                          onClick={() => handleActivate(u._id)}
                          className="px-3 py-1.5 rounded-[10px] text-xs font-semibold bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#4ADE80] hover:bg-[#22C55E]/20 transition"
                          title="Activate"
                        >
                          Activate
                        </button>
                      ) : (
                        <button
                          onClick={() => { setSuspendModal({ userId: u._id, name: `${u.first_name} ${u.last_name}` }); setSuspendReason(''); setSuspendDuration('1d'); }}
                          className="px-3 py-1.5 rounded-[10px] text-xs font-semibold bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20 transition"
                          title="Suspend"
                        >
                          Suspend
                        </button>
                      )}
                      <button
                        onClick={() => { setEditModal(u); setEditFields({ first_name: u.first_name, last_name: u.last_name, email: u.email, role: u.role }); }}
                        className="px-3 py-1.5 rounded-[10px] text-xs font-semibold bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 transition"
                        title="Edit"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteModal({ userId: u._id, name: `${u.first_name} ${u.last_name}` })}
                        className="px-3 py-1.5 rounded-[10px] text-xs font-semibold bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition"
                        title="Delete"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                {users.length === 0 && !usersLoading && (
                  <div className="text-center py-12 text-white/30 text-sm">No users found.</div>
                )}
              </div>
            )}

            {/* Pagination */}
            {usersPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-2">
                <button disabled={usersPage === 1} onClick={() => setUsersPage(p => p - 1)}
                  className="px-4 py-2 rounded-[12px] text-sm border border-white/10 text-white/60 hover:bg-white/5 disabled:opacity-30 transition">
                  Prev
                </button>
                <span className="text-white/40 text-sm">{usersPage} / {usersPages}</span>
                <button disabled={usersPage === usersPages} onClick={() => setUsersPage(p => p + 1)}
                  className="px-4 py-2 rounded-[12px] text-sm border border-white/10 text-white/60 hover:bg-white/5 disabled:opacity-30 transition">
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Reports Section ── */}
        {activeSection === 'reports' && (
          <div className="space-y-4">
            {/* Filter */}
            <div className="flex gap-1.5 bg-[#1E293B] p-1 rounded-[14px] border border-white/10 w-fit">
              {['pending', 'reviewed'].map(f => (
                <button
                  key={f}
                  onClick={() => { setReportFilter(f); setReportsPage(1); }}
                  className={`px-4 py-1.5 rounded-[10px] text-xs font-semibold capitalize transition-all ${
                    reportFilter === f
                      ? f === 'pending'
                        ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
                        : 'bg-[#22C55E]/15 text-[#4ADE80] border border-[#22C55E]/30'
                      : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <p className="text-white/40 text-xs px-1">{reportsTotal} reports</p>

            {reportsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-[#1E293B] rounded-[20px] border border-white/10 p-5 h-40 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map(r => {
                  const rec = RECOMMENDATION_COLORS[r.ai_analysis?.recommendation] || RECOMMENDATION_COLORS.neutral;
                  const isExpanded = expandedReport === r._id;
                  return (
                    <div key={r._id} className="bg-[#1E293B] rounded-[20px] border border-white/10 overflow-hidden hover:border-white/20 transition">
                      {/* ── Header: who reported who ── */}
                      <div className="p-5 space-y-3">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="space-y-2 flex-1 min-w-0">
                            {/* Parties */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-white/40 text-xs font-mono">Job #{r.request_id?.slice(-6)}</span>
                              <span className="text-white/20 text-xs">·</span>
                              <span className="text-white/60 text-xs">
                                <span className={`font-semibold ${r.reporter_role === 'client' ? 'text-blue-400' : 'text-purple-400'}`}>
                                  {r.reporter_name}
                                </span>
                                <span className="text-white/30"> ({r.reporter_role})</span>
                                <span className="text-white/40 mx-1">reported</span>
                                <span className={`font-semibold ${r.reported_user_role === 'client' ? 'text-blue-400' : 'text-purple-400'}`}>
                                  {r.reported_user_name}
                                </span>
                                <span className="text-white/30"> ({r.reported_user_role})</span>
                              </span>
                            </div>

                            {/* AI recommendation badge */}
                            {r.ai_analysis?.recommendation && (
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${rec.bg} ${rec.border} ${rec.text}`}>
                                {rec.label}
                              </span>
                            )}

                            {/* Report reason (the actual text user submitted) */}
                            <div className="bg-[#0F172A] rounded-[12px] p-3 border border-white/5">
                              <p className="text-white/30 text-[10px] uppercase tracking-wider mb-1">Report reason</p>
                              <p className="text-white/80 text-sm leading-relaxed">{r.reason || '—'}</p>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col gap-1.5 shrink-0">
                            {r.status === 'pending' && (
                              <button
                                onClick={() => { setReviewModal(r); setReviewNote(''); }}
                                className="px-3 py-1.5 rounded-[10px] text-xs font-semibold bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#4ADE80] hover:bg-[#22C55E]/20 transition whitespace-nowrap"
                              >
                                Mark Reviewed
                              </button>
                            )}
                            {r.reported_user_id && r.reported_user_name !== 'Deleted user' && (
                              <>
                                {!r.reported_user_suspended ? (
                                  <button
                                    onClick={() => {
                                      setSuspendModal({ userId: r.reported_user_id, name: r.reported_user_name });
                                      setSuspendReason('');
                                      setSuspendDuration('1d');
                                    }}
                                    className="px-3 py-1.5 rounded-[10px] text-xs font-semibold bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20 transition whitespace-nowrap"
                                  >
                                    Suspend {r.reported_user_name.split(' ')[0]}
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleActivate(r.reported_user_id)}
                                    className="px-3 py-1.5 rounded-[10px] text-xs font-semibold bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#4ADE80] hover:bg-[#22C55E]/20 transition whitespace-nowrap"
                                  >
                                    Activate {r.reported_user_name.split(' ')[0]}
                                  </button>
                                )}
                                <button
                                  onClick={() => setDeleteModal({ userId: r.reported_user_id, name: r.reported_user_name })}
                                  className="px-3 py-1.5 rounded-[10px] text-xs font-semibold bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition whitespace-nowrap"
                                >
                                  Delete {r.reported_user_name.split(' ')[0]}
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* AI summary (collapsed until expanded) */}
                        <button
                          onClick={() => setExpandedReport(isExpanded ? null : r._id)}
                          className="flex items-center gap-2 text-xs text-white/40 hover:text-white/60 transition"
                        >
                          <svg className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          {isExpanded ? 'Hide AI analysis' : 'Show AI analysis'}
                        </button>

                        {r.moderator_note && (
                          <p className="text-blue-400 text-xs bg-blue-500/5 border border-blue-500/20 rounded-[10px] px-3 py-2">
                            Mod note: {r.moderator_note}
                          </p>
                        )}
                      </div>

                      {/* ── AI Analysis (expandable) ── */}
                      {isExpanded && r.ai_analysis && (
                        <div className="border-t border-white/5 bg-[#0F172A]/60 p-5 space-y-3">
                          <p className="text-white/30 text-[10px] uppercase tracking-wider">AI Analysis</p>

                          {r.ai_analysis.summary && (
                            <p className="text-white/70 text-sm leading-relaxed">{r.ai_analysis.summary}</p>
                          )}

                          {r.ai_analysis.suggested_action && (
                            <p className="text-[#4ADE80] text-xs">→ {r.ai_analysis.suggested_action}</p>
                          )}

                          {r.ai_analysis.confidence !== undefined && (
                            <div className="flex items-center gap-2">
                              <span className="text-white/30 text-xs">Confidence:</span>
                              <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden max-w-[100px]">
                                <div
                                  className="h-full bg-gradient-to-r from-[#22C55E] to-[#4ADE80] rounded-full"
                                  style={{ width: `${Math.round(r.ai_analysis.confidence * 100)}%` }}
                                />
                              </div>
                              <span className="text-white/40 text-xs">{Math.round(r.ai_analysis.confidence * 100)}%</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                {reports.length === 0 && !reportsLoading && (
                  <div className="text-center py-12 text-white/30 text-sm">
                    {reportFilter === 'pending' ? 'No pending reports.' : 'No reviewed reports yet.'}
                  </div>
                )}
              </div>
            )}

            {reportsPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-2">
                <button disabled={reportsPage === 1} onClick={() => setReportsPage(p => p - 1)}
                  className="px-4 py-2 rounded-[12px] text-sm border border-white/10 text-white/60 hover:bg-white/5 disabled:opacity-30 transition">
                  Prev
                </button>
                <span className="text-white/40 text-sm">{reportsPage} / {reportsPages}</span>
                <button disabled={reportsPage === reportsPages} onClick={() => setReportsPage(p => p + 1)}
                  className="px-4 py-2 rounded-[12px] text-sm border border-white/10 text-white/60 hover:bg-white/5 disabled:opacity-30 transition">
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* Suspend Modal */}
      {suspendModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 px-4 pb-4 sm:pb-0">
          <div className="bg-[#1E293B] rounded-[24px] border border-white/10 p-6 w-full max-w-sm shadow-2xl space-y-5">
            <div>
              <h3 className="text-white font-bold text-lg">Suspend Account</h3>
              <p className="text-white/50 text-sm mt-1">
                Suspending <span className="text-orange-400 font-medium">{suspendModal.name}</span>
              </p>
            </div>

            {/* Reason */}
            <div>
              <label className="text-white/60 text-xs font-medium block mb-1.5">Reason</label>
              <textarea
                rows={3}
                value={suspendReason}
                onChange={e => setSuspendReason(e.target.value)}
                placeholder="Explain why this account is being suspended..."
                className="w-full bg-[#0F172A] border border-white/10 rounded-[14px] px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-orange-500/40 resize-none"
              />
            </div>

            {/* Duration */}
            <div>
              <label className="text-white/60 text-xs font-medium block mb-2">Duration</label>
              <div className="flex flex-wrap gap-2">
                {DURATION_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setSuspendDuration(opt.value)}
                    className={`px-3 py-1.5 rounded-[10px] text-xs font-semibold border transition-all ${
                      suspendDuration === opt.value
                        ? 'bg-red-500/15 border-red-500/40 text-red-400'
                        : 'bg-white/5 border-white/10 text-white/50 hover:border-white/20 hover:text-white/70'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {suspendDuration !== 'permanent' && (
                <p className="text-white/30 text-xs mt-2">
                  Account will auto-reactivate after the period expires.
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setSuspendModal(null)}
                className="flex-1 py-2.5 rounded-[14px] border border-white/10 text-white/60 hover:bg-white/5 text-sm font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSuspend}
                disabled={!suspendReason.trim() || suspendLoading}
                className="flex-1 py-2.5 rounded-[14px] bg-red-500/15 border border-red-500/40 text-red-400 hover:bg-red-500/25 text-sm font-semibold transition disabled:opacity-40"
              >
                {suspendLoading ? 'Suspending...' : 'Suspend'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 px-4 pb-4 sm:pb-0">
          <div className="bg-[#1E293B] rounded-[24px] border border-white/10 p-6 w-full max-w-sm shadow-2xl space-y-4">
            <div>
              <h3 className="text-white font-bold text-lg">Edit Account</h3>
              <p className="text-white/50 text-sm mt-1">{editModal.email}</p>
            </div>

            {[
              { key: 'first_name', label: 'First Name' },
              { key: 'last_name',  label: 'Last Name' },
              { key: 'email',      label: 'Email' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-white/60 text-xs font-medium block mb-1.5">{f.label}</label>
                <input
                  type="text"
                  value={editFields[f.key] || ''}
                  onChange={e => setEditFields(prev => ({ ...prev, [f.key]: e.target.value }))}
                  className="w-full bg-[#0F172A] border border-white/10 rounded-[12px] px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#22C55E]/40"
                />
              </div>
            ))}

            <div>
              <label className="text-white/60 text-xs font-medium block mb-1.5">Role</label>
              <select
                value={editFields.role || ''}
                onChange={e => setEditFields(prev => ({ ...prev, role: e.target.value }))}
                className="w-full bg-[#0F172A] border border-white/10 rounded-[12px] px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#22C55E]/40"
              >
                <option value="client">Client</option>
                <option value="provider">Provider</option>
                <option value="moderator">Moderator</option>
              </select>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setEditModal(null)}
                className="flex-1 py-2.5 rounded-[14px] border border-white/10 text-white/60 hover:bg-white/5 text-sm font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={handleEdit}
                disabled={editLoading}
                className="flex-1 py-2.5 rounded-[14px] bg-blue-500/15 border border-blue-500/30 text-blue-400 hover:bg-blue-500/25 text-sm font-semibold transition disabled:opacity-40"
              >
                {editLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 px-4 pb-4 sm:pb-0">
          <div className="bg-[#1E293B] rounded-[24px] border border-white/10 p-6 w-full max-w-sm shadow-2xl space-y-4">
            <div>
              <h3 className="text-white font-bold text-lg">Delete Account</h3>
              <p className="text-white/50 text-sm mt-1">
                This will permanently delete <span className="text-red-400 font-medium">{deleteModal.name}</span>.
                This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal(null)}
                className="flex-1 py-2.5 rounded-[14px] border border-white/10 text-white/60 hover:bg-white/5 text-sm font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex-1 py-2.5 rounded-[14px] bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition disabled:opacity-40 shadow-lg shadow-red-500/20"
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 px-4 pb-4 sm:pb-0">
          <div className="bg-[#1E293B] rounded-[24px] border border-white/10 p-6 w-full max-w-sm shadow-2xl space-y-4">
            <div>
              <h3 className="text-white font-bold text-lg">Mark as Reviewed</h3>
              <p className="text-white/50 text-sm mt-1">Optionally add a moderator note.</p>
            </div>
            <textarea
              rows={3}
              value={reviewNote}
              onChange={e => setReviewNote(e.target.value)}
              placeholder="Moderator note (optional)..."
              className="w-full bg-[#0F172A] border border-white/10 rounded-[14px] px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#22C55E]/40 resize-none"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setReviewModal(null)}
                className="flex-1 py-2.5 rounded-[14px] border border-white/10 text-white/60 hover:bg-white/5 text-sm font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={handleReview}
                disabled={reviewLoading}
                className="flex-1 py-2.5 rounded-[14px] bg-[#22C55E]/15 border border-[#22C55E]/30 text-[#4ADE80] hover:bg-[#22C55E]/25 text-sm font-semibold transition disabled:opacity-40"
              >
                {reviewLoading ? 'Saving...' : 'Confirm Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
