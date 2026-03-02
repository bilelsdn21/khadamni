import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Decorative background shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Khadamni
          </h1>
          <p className="text-slate-400 mt-2 text-sm">
            خدمني — Find services near you, instantly
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-2xl shadow-2xl p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
