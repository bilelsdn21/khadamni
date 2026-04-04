import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useNotifications from '../hooks/useNotifications';

export default function NotificationBell({ className = '' }) {
  const navigate = useNavigate();
  const { notifications, unseenCount, markAllSeen } = useNotifications();
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const toggle = () => {
    if (!open) markAllSeen();
    setOpen(o => !o);
  };

  const handleClick = (link) => {
    setOpen(false);
    navigate(link);
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={toggle}
        title="Notifications"
        className={`relative w-10 h-10 rounded-[20px] bg-[#1E293B]/90 backdrop-blur-md border shadow-lg flex items-center justify-center transition-all duration-300 ${
          unseenCount > 0
            ? 'border-[#22C55E]/50 text-[#4ADE80]'
            : 'border-white/10 text-white/60 hover:text-[#22C55E] hover:border-[#22C55E]/40'
        } ${className}`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unseenCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-[#22C55E] rounded-full text-white text-[10px] font-bold flex items-center justify-center shadow-lg animate-pulse">
            {unseenCount > 9 ? '9+' : unseenCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute left-0 top-12 w-80 z-[2000] bg-[#1E293B] border border-white/10 rounded-[20px] shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between">
            <span className="text-white font-semibold text-sm">Notifications</span>
            {notifications.length > 0 && (
              <button
                onClick={() => { navigate('/requests'); setOpen(false); }}
                className="text-[#4ADE80] text-xs hover:underline"
              >
                View all
              </button>
            )}
          </div>

          {/* Items */}
          <div className="max-h-[360px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <span className="text-3xl">🔔</span>
                <p className="text-white/40 text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map(n => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n.link)}
                  className="w-full px-4 py-3 flex items-start gap-3 hover:bg-white/[0.04] transition-all duration-150 text-left border-b border-white/5 last:border-0"
                >
                  {/* Icon circle */}
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-base shrink-0 mt-0.5"
                    style={{ background: `${n.color}18`, border: `1px solid ${n.color}30` }}
                  >
                    {n.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-semibold truncate">{n.title}</p>
                    <p className="text-white/50 text-[11px] leading-relaxed mt-0.5 line-clamp-2">{n.body}</p>
                  </div>
                  {/* Arrow */}
                  <svg className="w-3.5 h-3.5 text-white/20 shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
