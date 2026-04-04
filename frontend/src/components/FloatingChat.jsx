import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getMyRequests } from '../api/request';
import useAuth from '../hooks/useAuth';

export default function FloatingChat() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [chats, setChats] = useState([]);
  const panelRef = useRef(null);

  const hidden = location.pathname.startsWith('/chat/') || location.pathname.startsWith('/tracking/');

  const fetchChats = async () => {
    if (!localStorage.getItem('access_token')) return;
    try {
      const res = await getMyRequests();
      const active = res.data.filter(r =>
        ['in_progress', 'confirmed', 'completed'].includes(r.status)
      );
      setChats(active);
    } catch {}
  };

  useEffect(() => {
    if (hidden || !isAuthenticated) return;
    fetchChats();
  }, [location.pathname, isAuthenticated, hidden]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Hide on chat/tracking pages — after all hooks
  if (hidden || !isAuthenticated) return null;

  const statusStyle = {
    in_progress: { label: 'Active',     color: '#22C55E' },
    confirmed:   { label: 'Agreed',     color: '#3B82F6' },
    completed:   { label: 'Completed',  color: '#8B5CF6' },
  };

  return (
    <div className="fixed bottom-6 right-6 z-[3000]" ref={panelRef}>
      {/* Panel */}
      {open && (
        <div className="absolute bottom-16 right-0 w-72 bg-[#1E293B] border border-white/10 rounded-[20px] shadow-2xl overflow-hidden mb-2">
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between">
            <span className="text-white font-semibold text-sm">Messages</span>
            <span className="text-white/30 text-xs">{chats.length} conversation{chats.length !== 1 ? 's' : ''}</span>
          </div>

          <div className="max-h-[320px] overflow-y-auto">
            {chats.length === 0 ? (
              <div className="flex flex-col items-center py-8 gap-2">
                <span className="text-3xl">💬</span>
                <p className="text-white/40 text-sm">No active chats</p>
                <p className="text-white/25 text-xs">Start by requesting a service</p>
              </div>
            ) : (
              chats.map(r => {
                const s = statusStyle[r.status] || statusStyle.in_progress;
                const other = user?.role === 'provider' ? r.client_name : r.provider_name;
                return (
                  <button
                    key={r._id}
                    onClick={() => { setOpen(false); navigate(`/chat/${r._id}`); }}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/[0.04] transition-all duration-150 text-left border-b border-white/5 last:border-0"
                  >
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0"
                      style={{ background: `linear-gradient(135deg, ${s.color}60, ${s.color}30)`, border: `1px solid ${s.color}40` }}
                    >
                      {other?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-semibold truncate">{other}</p>
                      <p className="text-white/40 text-[11px] truncate mt-0.5">{r.description?.slice(0, 40)}…</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ color: s.color, background: `${s.color}18`, border: `1px solid ${s.color}30` }}
                      >
                        {s.label}
                      </span>
                      {r.unread_count > 0 && (
                        <span className="min-w-[16px] h-4 px-1 bg-[#22C55E] rounded-full text-white text-[9px] font-bold flex items-center justify-center">
                          {r.unread_count > 9 ? '9+' : r.unread_count}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* FAB button */}
      <button
        onClick={() => { setOpen(o => !o); if (!open) fetchChats(); }}
        className="w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
        style={{
          background: open ? '#1E293B' : 'linear-gradient(135deg, #22C55E, #16A34A)',
          border: open ? '1px solid rgba(255,255,255,0.15)' : 'none',
          boxShadow: open ? '0 8px 32px rgba(0,0,0,0.4)' : '0 8px 32px rgba(34,197,94,0.4)',
        }}
      >
        {open ? (
          <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        )}
        {/* Unread dot */}
        {!open && chats.reduce((sum, r) => sum + (r.unread_count || 0), 0) > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#F59E0B] rounded-full border-2 border-[#0F172A] text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
            {chats.reduce((sum, r) => sum + (r.unread_count || 0), 0) > 9 ? '9+' : chats.reduce((sum, r) => sum + (r.unread_count || 0), 0)}
          </span>
        )}
      </button>
    </div>
  );
}
