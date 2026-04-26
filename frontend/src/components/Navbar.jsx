import { Link } from 'react-router-dom';
import { useContext } from 'react';
import AuthContext from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const NAV_LINKS = [
  { href: '#hero',      label: 'Home' },
  { href: '#services',  label: 'Services' },
  { href: '#providers', label: 'Providers' },
  { href: '#about',     label: 'About' },
];

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 navbar-glass">
      <div className="w-full px-6 md:px-12 lg:px-20 h-16 flex items-center justify-between">

        {/* ── Brand ── */}
        <Link
          to="/"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-2.5 group"
        >
          {/* Logo mark */}
          <img
            src="/icon.svg"
            alt="Khadamni"
            className="w-8 h-8 drop-shadow-[0_0_8px_rgba(34,197,94,0.45)] group-hover:drop-shadow-[0_0_12px_rgba(34,197,94,0.65)] transition-all"
          />
          <span className="text-white font-bold tracking-widest text-sm uppercase">
            Khadamni
          </span>
        </Link>

        {/* ── Center nav links ── */}
        <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
          {NAV_LINKS.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="relative px-4 py-2 rounded-full text-sm font-medium text-white/60 hover:text-white hover:bg-white/8 transition-all duration-200"
            >
              {label}
            </a>
          ))}
        </nav>

        {/* ── Right side ── */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/8 transition-all duration-200"
          >
            {isDark ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 5a7 7 0 000 14A7 7 0 0012 5z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {user ? (
            <>
              <Link
                to="/map"
                className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#22C55E]/15 border border-[#22C55E]/25 text-[#4ADE80] text-sm font-semibold hover:bg-[#22C55E]/25 transition-all duration-200"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Open App
              </Link>
              <button
                onClick={logout}
                className="w-9 h-9 rounded-full flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
                title="Sign out"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-4 py-2 rounded-full text-sm font-medium text-white/70 hover:text-white hover:bg-white/8 transition-all duration-200"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-full bg-[#22C55E] text-white text-sm font-semibold hover:bg-[#16A34A] transition-colors shadow-lg shadow-[#22C55E]/20"
              >
                Get started
              </Link>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
