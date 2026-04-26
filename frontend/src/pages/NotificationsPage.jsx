import { useNavigate } from 'react-router-dom';
import useNotifications from '../hooks/useNotifications';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { notifications, dismissNotification, dismissAll } = useNotifications();

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/10 bg-[#1E293B]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-[14px] flex items-center justify-center text-white/60 hover:bg-white/10 hover:text-white transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-white font-bold text-lg">Notifications</h1>
        </div>
        {notifications.length > 0 && (
          <button
            onClick={dismissAll}
            className="text-xs text-white/40 hover:text-red-400 transition px-3 py-1.5 rounded-[10px] hover:bg-red-500/10 border border-transparent hover:border-red-500/20"
          >
            Clear all
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex-1 max-w-lg w-full mx-auto px-4 py-4 space-y-2">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-3xl">🔔</div>
            <p className="text-white/40 text-sm font-medium">You're all caught up</p>
            <p className="text-white/25 text-xs">No notifications right now</p>
          </div>
        ) : (
          notifications.map(n => (
            <div
              key={n.id}
              className="flex items-start gap-3 px-4 py-3.5 rounded-[16px] bg-[#1E293B] border border-white/8 group"
            >
              {/* Icon */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-base shrink-0 mt-0.5"
                style={{ background: `${n.color}18`, border: `1px solid ${n.color}30` }}
              >
                {n.icon}
              </div>

              {/* Content */}
              <button
                className="flex-1 text-left min-w-0"
                onClick={() => { dismissNotification(n.id); navigate(n.link); }}
              >
                <p className="text-white text-sm font-semibold truncate">{n.title}</p>
                <p className="text-white/50 text-xs leading-relaxed mt-0.5">{n.body}</p>
              </button>

              {/* Delete */}
              <button
                onClick={() => dismissNotification(n.id)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-red-500/10 transition shrink-0 opacity-0 group-hover:opacity-100"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
