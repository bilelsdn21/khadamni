import { Link } from 'react-router-dom';
import { useContext } from 'react';
import AuthContext from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 navbar-glass rounded-none">
      <div className="w-full px-6 md:px-12 lg:px-16 py-4 flex items-center justify-between">
        <Link
          to="/"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="text-xl font-bold tracking-[0.2em] text-white uppercase hover:text-[#4ADE80] transition-colors"
        >
          KHADAMNI
        </Link>
        <nav className="flex items-center gap-1 sm:gap-3">
          <a href="#hero" className="nav-link-dark active hidden sm:block">Home</a>
          <a href="#services" className="nav-link-dark hidden sm:block">Services</a>
          <a href="#about" className="nav-link-dark hidden lg:block">About Us</a>
          <a href="#providers" className="nav-link-dark hidden sm:block">Providers</a>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200 text-white/60 hover:text-[#22C55E]"
          >
            {isDark ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 5a7 7 0 000 14A7 7 0 0012 5z"
                />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            )}
          </button>

          {user ? (
            <div className="flex items-center gap-3 ml-1">
              <Link to="/profile" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
                Profile
              </Link>
              <button onClick={logout} className="text-sm font-medium text-white/70 hover:text-white transition-colors">
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className="ml-1 text-sm font-medium border border-white/20 px-4 py-1.5 rounded-full hover:bg-white/10 transition-colors text-white">
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
