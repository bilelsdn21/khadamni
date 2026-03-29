import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const MENU_ITEMS = [
  { path: '/requests', label: 'My Requests', icon: RequestsIcon },
  { path: '/map', label: 'Map', icon: MapIcon },
];

function MapIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
  );
}
function RequestsIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}
function LogoutIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}

export default function SideDrawer({ open, onClose }) {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    onClose();
    navigate('/');
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/40 z-[2000] transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Drawer */}
      <aside className={`fixed top-0 left-0 h-full w-[280px] max-w-[85vw] bg-[#1E293B] border-r border-white/10 shadow-2xl z-[2001] flex flex-col transition-transform duration-300 ease-out ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}>

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <span className="text-lg font-bold tracking-wider text-white">KHADAMNI</span>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-[20px] flex items-center justify-center text-white/60 hover:bg-white/10 hover:text-white transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* User info */}
        {user && (
          <div className="px-4 py-3 border-b border-white/10">
            <p className="text-white font-semibold">{user.first_name} {user.last_name}</p>
            <p className="text-white/50 text-sm capitalize">{user.role}</p>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {MENU_ITEMS.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-[20px] text-white/85 hover:bg-[#22C55E]/20 hover:text-[#4ADE80] transition-colors duration-200"
            >
              <item.icon />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-white/10">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-[20px] text-red-400 hover:bg-red-500/20 transition-colors duration-200 font-medium"
          >
            <LogoutIcon />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
