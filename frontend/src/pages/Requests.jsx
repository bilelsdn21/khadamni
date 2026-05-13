import { useEffect, useState, useRef } from 'react';
import { getMyRequests, acceptRequest, rejectRequest, getRequestById } from '../api/request';
import useAuth from '../hooks/useAuth';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import ChatPanel from '../components/ChatPanel';
import { useToast } from '../components/Toast';

// ── Unread tracking (localStorage) ─────────────────────────────────────────
const SEEN_KEY = 'req_seen';
const getSeenMap = () => { try { return JSON.parse(localStorage.getItem(SEEN_KEY) || '{}'); } catch { return {}; } };
const persistSeen = (map) => { try { localStorage.setItem(SEEN_KEY, JSON.stringify(map)); } catch {} };

const STATUS_COLORS = {
  pending:     { bg: 'bg-yellow-500/10 border border-yellow-500/30', text: 'text-yellow-400', label: 'Pending' },
  in_progress: { bg: 'bg-[#22C55E]/10 border border-[#22C55E]/30',  text: 'text-[#4ADE80]',  label: 'Active' },
  confirmed:   { bg: 'bg-blue-500/10 border border-blue-500/30',     text: 'text-blue-400',   label: 'Confirmed' },
  completed:   { bg: 'bg-purple-500/10 border border-purple-500/30', text: 'text-purple-400', label: 'Done' },
  rejected:    { bg: 'bg-red-500/10 border border-red-500/30',       text: 'text-red-400',    label: 'Rejected' },
  cancelled:   { bg: 'bg-white/5 border border-white/10',            text: 'text-white/40',   label: 'Cancelled' },
};

const AVATAR_GRADIENTS = [
  'from-[#22C55E] to-[#16A34A]', 'from-blue-500 to-blue-700',
  'from-purple-500 to-purple-700', 'from-orange-500 to-orange-700',
  'from-pink-500 to-pink-700', 'from-cyan-500 to-cyan-700',
];

function avatarColor(name) {
  if (!name) return AVATAR_GRADIENTS[0];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_GRADIENTS[Math.abs(h) % AVATAR_GRADIENTS.length];
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)     return 'Just now';
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 172800) return 'Yesterday';
  return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

const RECOMMENDATION_COLORS = {
  client_favored:        { bg: 'bg-blue-500/10 border-blue-500/30',    text: 'text-blue-400',   label: 'Client favored' },
  provider_favored:      { bg: 'bg-[#22C55E]/10 border-[#22C55E]/30',  text: 'text-[#4ADE80]',  label: 'Provider favored' },
  neutral:               { bg: 'bg-yellow-500/10 border-yellow-500/30', text: 'text-yellow-400', label: 'Neutral' },
  insufficient_evidence: { bg: 'bg-white/5 border-white/10',            text: 'text-white/40',   label: 'Insufficient evidence' },
};

const FILTERS = ['All', 'Active', 'Done'];

export default function Requests() {
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [requests,      setRequests]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [search,        setSearch]        = useState('');
  const [filter,        setFilter]        = useState('All');
  const [selectedId,    setSelectedId]    = useState(null);
  const [reportModal,   setReportModal]   = useState(null);
  const [reportReason,  setReportReason]  = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  const [reportResult,  setReportResult]  = useState(null);
  const [seenMap,       setSeenMap]       = useState(getSeenMap);

  const pollingRef = useRef(null);
  const toast = useToast();

  const markSeen = (id) => {
    setSeenMap(prev => {
      const next = { ...prev, [id]: Date.now() };
      persistSeen(next);
      return next;
    });
  };

  const hasUnread = (r) => {
    if (!r.updated_at) return false;
    const lastSeen = seenMap[r._id];
    if (!lastSeen) return ['in_progress', 'confirmed', 'pending'].includes(r.status);
    return new Date(r.updated_at).getTime() > lastSeen;
  };

  const fetchRequests = async () => {
    try {
      const res = await getMyRequests();
      setRequests(res.data);
      setError(null);
    } catch {
      setError('Failed to load requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  // Auto-select first active conversation on desktop
  useEffect(() => {
    if (loading || selectedId) return;
    const first = requests.find(r => ['in_progress', 'confirmed'].includes(r.status));
    if (first && window.innerWidth >= 768) { markSeen(first._id); setSelectedId(first._id); }
  }, [requests, loading]);

  // Status updates are handled in real-time via ChatPanel's onStatusChange callback (WebSocket)

  const handleAccept = async (id) => {
    try {
      await acceptRequest(id);
      setRequests(prev => prev.map(r => r._id === id ? { ...r, status: 'in_progress' } : r));
      markSeen(id);
      setSelectedId(id);
      toast('Request accepted!', 'success');
    } catch { toast('Failed to accept request', 'error'); }
  };

  const handleReject = async (id) => {
    try {
      await rejectRequest(id);
      setRequests(prev => prev.map(r => r._id === id ? { ...r, status: 'rejected' } : r));
      toast('Request rejected', 'info');
    } catch { toast('Failed to reject request', 'error'); }
  };

  const handleReport = async () => {
    if (!reportReason.trim() || !reportModal) return;
    setReportLoading(true);
    try {
      const res = await api.post('/ai/report', { request_id: reportModal, reason: reportReason });
      setReportResult(res.data);
    } catch {
      setReportResult({ error: 'AI unavailable. Your report has been recorded.' });
    } finally {
      setReportLoading(false);
    }
  };

  const otherName = (r) => user?.role === 'provider' ? r.client_name : r.provider_name;

  // On mobile navigate; on desktop open inline
  const handleSelect = (id) => {
    markSeen(id);
    if (window.innerWidth < 768) navigate(`/chat/${id}`);
    else setSelectedId(id);
  };

  const canOpenChat = (r) => {
    if (['in_progress', 'confirmed', 'completed'].includes(r.status)) return true;
    // Clients can open pending convos to check the description/profile
    if (r.status === 'pending' && user?.role === 'client') return true;
    return false;
  };

  const filtered = requests.filter(r => {
    const name = otherName(r) || '';
    const matchSearch =
      name.toLowerCase().includes(search.toLowerCase()) ||
      (r.description || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.service_category || '').toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === 'Active' ? ['pending', 'in_progress', 'confirmed'].includes(r.status) :
      filter === 'Done'   ? ['completed', 'rejected', 'cancelled'].includes(r.status) : true;
    return matchSearch && matchFilter;
  });

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="h-screen bg-[#0F172A] flex flex-col">

      {/* Fixed header — stays as-is */}
      <div className="bg-[#1E293B] border-b border-white/10 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-white font-bold text-lg">
            {user?.role === 'provider' ? 'Requests' : 'Messages'}
          </h1>
          <p className="text-white/40 text-xs">
            {requests.length} conversation{requests.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          to="/map"
          className="px-3 py-1.5 rounded-[20px] bg-[#0F172A] border border-white/10 text-[#4ADE80] text-xs font-semibold hover:border-[#22C55E]/50 transition-all"
        >
          ← Map
        </Link>
      </div>

      {/* Body: split on desktop, list-only on mobile */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── Left panel: conversation list ── */}
        <div className={`flex flex-col bg-[#0A1628] border-r border-white/10 flex-shrink-0 w-full md:w-80 ${selectedId ? 'hidden md:flex' : 'flex'}`}>

          {/* Search */}
          <div className="px-3 pt-3 pb-2">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full bg-[#1E293B] border border-white/10 rounded-[20px] pl-9 pr-4 py-2 text-white text-sm placeholder-white/30 focus:outline-none focus:border-[#22C55E]/50"
              />
            </div>
          </div>

          {/* Filter tabs */}
          <div className="px-3 pb-3 flex gap-2">
            {FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  filter === f ? 'bg-[#22C55E] text-white' : 'bg-[#1E293B] text-white/50 hover:text-white border border-white/10'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {loading && Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-3 border-b border-white/5 animate-pulse">
                <div className="w-11 h-11 rounded-full bg-white/8 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-white/8 rounded-full" style={{ width: `${55 + (i * 7) % 30}%` }} />
                  <div className="h-2 bg-white/5 rounded-full" style={{ width: `${35 + (i * 11) % 25}%` }} />
                </div>
                <div className="w-10 h-4 bg-white/5 rounded-full flex-shrink-0" />
              </div>
            ))}
            {error   && <p className="text-red-400 text-sm text-center mt-10">{error}</p>}
            {!loading && !error && filtered.length === 0 && (
              <div className="text-center py-16 px-6">
                <p className="text-4xl mb-3">💬</p>
                <p className="text-white/50 text-sm font-medium">
                  {search ? 'No results found' : filter !== 'All' ? `No ${filter.toLowerCase()} conversations` : 'No conversations yet'}
                </p>
                <p className="text-white/25 text-xs mt-1 mb-6">
                  {search ? 'Try a different search term' : 'Your chats will appear here once you make a request'}
                </p>
                {filter === 'All' && !search && (
                  <Link to="/map"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-[20px] bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#4ADE80] text-sm font-semibold hover:bg-[#22C55E]/20 transition-all">
                    Find a Provider →
                  </Link>
                )}
              </div>
            )}

            {filtered.map(r => {
              const status   = STATUS_COLORS[r.status] || STATUS_COLORS.pending;
              const name     = otherName(r);
              const gradient = avatarColor(name);
              const isActive = ['in_progress', 'confirmed'].includes(r.status);
              const isPending = r.status === 'pending';
              const isSelected = r._id === selectedId;
              const hasChat  = canOpenChat(r);

              return (
                <div
                  key={r._id}
                  className={`border-b border-white/5 transition-colors
                    ${isSelected ? 'bg-[#1E293B]' : ''}
                    ${isActive ? 'border-l-2 border-l-[#22C55E]' : isPending ? 'border-l-2 border-l-yellow-500/50' : ''}`}
                >
                  {/* Row */}
                  <div
                    onClick={() => hasChat && handleSelect(r._id)}
                    className={`flex items-center gap-3 px-3 py-3 transition-colors
                      ${hasChat ? 'cursor-pointer' : 'cursor-default'}
                      ${!isSelected && hasChat ? 'hover:bg-white/5' : ''}`}
                  >
                    {/* Avatar */}
                    {r.other_party_avatar ? (
                      <img
                        src={`/uploads/${r.other_party_avatar}`}
                        alt={name}
                        className="w-11 h-11 rounded-full object-cover flex-shrink-0 border border-white/10"
                      />
                    ) : (
                      <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0 text-white font-bold`}>
                        {name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="text-white font-semibold text-sm truncate">{name || '—'}</p>
                        <span className="text-white/25 text-[10px] ml-1 flex-shrink-0">{timeAgo(r.updated_at)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-white/45 text-xs truncate">{r.description}</p>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0 border ${status.bg} ${status.text}`}>
                          {status.label}
                        </span>
                      </div>
                      {r.service_category && (
                        <p className="text-white/25 text-[10px] mt-0.5">{r.service_category}</p>
                      )}
                    </div>
                    {isSelected
                      ? <div className="w-1.5 h-1.5 rounded-full bg-[#22C55E] flex-shrink-0" />
                      : hasUnread(r)
                        ? <div className="w-2 h-2 rounded-full bg-[#22C55E] flex-shrink-0 shadow-[0_0_6px_rgba(34,197,94,0.8)]" />
                        : null
                    }
                  </div>

                  {/* Provider: accept / reject */}
                  {user?.role === 'provider' && isPending && (
                    <div className="flex gap-2 px-3 pb-3">
                      <button onClick={() => handleAccept(r._id)}
                        className="flex-1 py-1.5 rounded-[20px] bg-[#22C55E]/10 border border-[#22C55E]/40 text-[#4ADE80] font-semibold text-xs hover:bg-[#22C55E]/20 transition-all">
                        Accept
                      </button>
                      <button onClick={() => handleReject(r._id)}
                        className="flex-1 py-1.5 rounded-[20px] bg-red-500/10 border border-red-500/30 text-red-400 font-semibold text-xs hover:bg-red-500/20 transition-all">
                        Reject
                      </button>
                    </div>
                  )}

                  {/* Client: waiting */}
                  {user?.role === 'client' && isPending && (
                    <div className="px-3 pb-3 flex items-center gap-1.5 text-yellow-400/60 text-xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                      Waiting for provider...
                    </div>
                  )}

                  {/* Track (on-site active) */}
                  {isActive && r.job_type !== 'remote' && (
                    <div className="px-3 pb-3">
                      <Link to={`/tracking/${r._id}`}
                        className="block text-center py-1.5 rounded-[20px] bg-blue-500/10 border border-blue-500/30 text-blue-400 font-semibold text-xs hover:bg-blue-500/20 transition-all">
                        Track Location
                      </Link>
                    </div>
                  )}

                  {/* Completed: rate + report */}
                  {r.status === 'completed' && (
                    <div className="flex gap-2 px-3 pb-3">
                      <button onClick={() => handleSelect(r._id)}
                        className="flex-1 py-1.5 rounded-[20px] bg-purple-500/10 border border-purple-500/30 text-purple-400 font-semibold text-xs hover:bg-purple-500/20 transition-all">
                        View & Rate
                      </button>
                      <button onClick={() => { setReportModal(r._id); setReportReason(''); setReportResult(null); }}
                        className="flex-1 py-1.5 rounded-[20px] bg-red-500/10 border border-red-500/30 text-red-400 font-semibold text-xs hover:bg-red-500/20 transition-all">
                        Report
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Right panel: ChatPanel or placeholder ── */}
        <div className={`flex-1 ${selectedId ? 'flex' : 'hidden md:flex'} flex-col`}>
          {selectedId ? (
            <ChatPanel
              key={selectedId}
              requestId={selectedId}
              onStatusChange={(id, status) =>
                setRequests(prev => prev.map(r => r._id === id ? { ...r, status } : r))
              }
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
              <div className="w-16 h-16 rounded-full bg-[#1E293B] border border-white/10 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
                </svg>
              </div>
              <p className="text-white/40 text-sm">Select a conversation to start chatting</p>
            </div>
          )}
        </div>
      </div>

      {/* Report Modal */}
      {reportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 px-4 pb-4 sm:pb-0">
          <div className="bg-[#1E293B] rounded-[24px] border border-white/10 p-6 w-full max-w-sm shadow-2xl">
            {!reportResult ? (
              <>
                <h3 className="text-white font-bold text-base mb-1">Report this job</h3>
                <p className="text-white/40 text-xs mb-4">Describe the issue — AI will analyze the chat history and generate a dispute summary.</p>
                <textarea value={reportReason} onChange={e => setReportReason(e.target.value)}
                  placeholder="Describe the issue..." rows={4}
                  className="w-full bg-[#0F172A] border border-white/10 rounded-[12px] px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-[#22C55E]/50 resize-none mb-4"/>
                <div className="flex gap-3">
                  <button onClick={() => setReportModal(null)}
                    className="flex-1 py-2.5 rounded-[20px] bg-white/5 border border-white/10 text-white/70 font-semibold text-sm hover:bg-white/10 transition-all">
                    Cancel
                  </button>
                  <button onClick={handleReport} disabled={reportLoading || !reportReason.trim()}
                    className="flex-1 py-2.5 rounded-[20px] bg-[#22C55E] text-white font-semibold text-sm hover:bg-[#22C55E]/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    {reportLoading
                      ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> Analyzing...</>
                      : 'Analyze with AI →'}
                  </button>
                </div>
              </>
            ) : (
              <>
                {reportResult.error
                  ? <p className="text-white/60 text-sm text-center py-4">{reportResult.error}</p>
                  : (
                    <div className="space-y-3">
                      <p className="text-[#4ADE80] font-semibold text-sm">✓ Report submitted & analyzed</p>
                      <p className="text-white/70 text-sm leading-relaxed">{reportResult.summary}</p>
                      {reportResult.recommendation && (() => {
                        const chip = RECOMMENDATION_COLORS[reportResult.recommendation] || RECOMMENDATION_COLORS.neutral;
                        return <div className={`inline-flex items-center px-3 py-1 rounded-full border text-xs font-semibold ${chip.bg} ${chip.text}`}>{chip.label}</div>;
                      })()}
                      {reportResult.suggested_action && <p className="text-white/40 text-xs italic">{reportResult.suggested_action}</p>}
                    </div>
                  )
                }
                <button onClick={() => setReportModal(null)}
                  className="w-full mt-4 py-2.5 rounded-[20px] bg-white/5 border border-white/10 text-white font-semibold text-sm hover:bg-white/10 transition-all">
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
