import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 navbar-glass rounded-none">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 py-4 flex items-center justify-between">
        <Link to="/" className="text-lg font-bold tracking-[0.2em] text-white uppercase hover:text-[#4ADE80] transition-colors">
          KHADAMNI
        </Link>
        <nav className="flex items-center gap-1 sm:gap-3">
          <a href="#hero" className="nav-link-dark active">Home</a>
          <a href="#services" className="nav-link-dark">Services</a>
          <a href="#about" className="nav-link-dark">About Us</a>
          <a href="#providers" className="nav-link-dark">Providers</a>
          <a href="#reviews" className="nav-link-dark">Reviews</a>
          <a href="#support" className="nav-link-dark">Support</a>
        </nav>
      </div>
    </header>
  );
}
