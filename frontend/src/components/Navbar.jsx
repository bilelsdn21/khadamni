import { Link } from 'react-router-dom';
import { useContext } from 'react';
import AuthContext from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);

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
          
          {user ? (
            <div className="flex items-center gap-3 ml-2">
              <Link to="/profile" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
                Profile
              </Link>
              <button onClick={logout} className="text-sm font-medium text-white/70 hover:text-white transition-colors">
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className="ml-2 text-sm font-medium border border-white/20 px-4 py-1.5 rounded-full hover:bg-white/10 transition-colors text-white">
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
