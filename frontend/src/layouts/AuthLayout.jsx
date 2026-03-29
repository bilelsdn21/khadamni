import { Outlet } from 'react-router-dom';
import { Link } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#22C55E]/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#4ADE80]/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/">
            <h1 className="text-4xl font-bold text-white tracking-tight uppercase hover:text-[#4ADE80] transition-colors">
              KHADAMNI
            </h1>
          </Link>
          <p className="text-white/60 mt-2 text-sm">Find services near you, instantly</p>
        </div>

        <div className="bg-[#1E293B] border border-white/10 rounded-[20px] shadow-xl p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
