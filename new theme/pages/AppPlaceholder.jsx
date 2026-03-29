import { useState } from 'react';
import { Link } from 'react-router-dom';
import SideDrawer from '../components/SideDrawer';

export default function AppPlaceholder({ title }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col">
      <header className="flex items-center gap-3 p-4 bg-[#1E293B] border-b border-white/10">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="w-10 h-10 rounded-[20px] bg-[#0F172A] border border-white/10 flex items-center justify-center text-white hover:bg-[#22C55E] transition"
          aria-label="Menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <Link to="/app" className="text-sm text-white/60 hover:text-[#4ADE80]">
          ← Back to map
        </Link>
        <h1 className="text-lg font-semibold text-white">{title}</h1>
      </header>
      <main className="flex-1 p-6 flex items-center justify-center">
        <div className="text-center max-w-sm">
          <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
          <p className="text-white/60">This page is a placeholder. Content will be added here.</p>
        </div>
      </main>
      <SideDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
