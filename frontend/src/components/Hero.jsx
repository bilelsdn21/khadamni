import { Link } from 'react-router-dom';
import { WrenchIcon, LightningIcon, TruckIcon, CleaningIcon, CarIcon, LocationPinIcon } from './Icons';

const serviceItems = [
  { label: 'Plumber', angle: 0, Icon: WrenchIcon },
  { label: 'Electrician', angle: 60, Icon: LightningIcon },
  { label: 'Delivery', angle: 120, Icon: TruckIcon },
  { label: 'Cleaning', angle: 180, Icon: CleaningIcon },
  { label: 'Car service', angle: 240, Icon: CarIcon },
  { label: 'Location', angle: 300, Icon: LocationPinIcon },
];

const PARTICLE_POSITIONS = [
  { left: '10%', top: '20%', delay: 0 },
  { left: '85%', top: '15%', delay: 1 },
  { left: '70%', top: '70%', delay: 2 },
  { left: '20%', top: '80%', delay: 0.5 },
  { left: '50%', top: '40%', delay: 1.5 },
  { left: '30%', top: '55%', delay: 2.5 },
  { left: '90%', top: '45%', delay: 0.8 },
  { left: '15%', top: '35%', delay: 1.2 },
  { left: '60%', top: '25%', delay: 2 },
  { left: '75%', top: '85%', delay: 0.3 },
];

export default function Hero() {
  return (
    <div id="hero" className="min-h-screen flex flex-col lg:flex-row relative z-10">
      {/* Left – Hero content */}
      <div className="w-full lg:w-[50%] flex flex-col justify-between pl-6 pr-6 sm:pl-10 sm:pr-10 pt-24 pb-8 lg:pt-28 lg:pb-10 relative z-20">
        <main className="flex-1 flex flex-col justify-center py-8 lg:py-0">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-white leading-[1.08] tracking-tight uppercase">
            All Services.
            <br />
            <span className="text-[#4ADE80]">One Platform.</span>
          </h1>
          <p className="mt-6 text-white/80 text-base sm:text-lg max-w-md leading-relaxed">
            Find trusted professionals near you, post requests, and connect instantly.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              to="/login"
              className="inline-flex items-center justify-center min-w-[130px] px-8 py-4 rounded-[20px] bg-gradient-to-br from-[#22C55E] to-[#16A34A] text-white font-semibold shadow-lg shadow-[#22C55E]/40 hover:shadow-[#22C55E]/60 hover:-translate-y-0.5 transition-all duration-200 ring-1 ring-[#4ADE80]/30"
            >
              Log In
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center justify-center min-w-[130px] px-8 py-4 rounded-[20px] bg-gradient-to-br from-[#22C55E] to-[#16A34A] text-white font-semibold shadow-lg shadow-[#22C55E]/40 hover:shadow-[#22C55E]/60 hover:-translate-y-0.5 transition-all duration-200 ring-1 ring-[#4ADE80]/30"
            >
              Sign Up
            </Link>
            <Link
              to="/map"
              className="inline-flex items-center justify-center min-w-[130px] px-8 py-4 rounded-[20px] bg-gradient-to-br from-white/95 to-white/85 text-[#22C55E] font-semibold shadow-lg shadow-white/20 hover:shadow-white/40 hover:-translate-y-0.5 transition-all duration-200 ring-1 ring-white/30"
            >
              View Map
            </Link>
          </div>
        </main>

        <div className="flex flex-wrap gap-6 text-sm text-white/60 pt-6 border-t border-white/10">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-[#22C55E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Verified Pros
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-[#22C55E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Transparent Pricing
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-[#22C55E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Secure Payments
          </div>
        </div>
      </div>

      {/* Right – Dark futuristic hub with particles + glowing center + floating icons */}
      <div className="hidden lg:flex lg:w-[50%] relative overflow-hidden items-center justify-center min-h-[50vh] lg:min-h-screen z-10">
        <div className="particles-bg">
          {PARTICLE_POSITIONS.map((p, i) => (
            <span key={i} className="particle" style={{ left: p.left, top: p.top, animationDelay: `${p.delay}s` }} />
          ))}
        </div>

        <div className="relative w-[340px] h-[340px] flex items-center justify-center">
          <div className="absolute inset-0 hero-orbit-ring">
            {serviceItems.map((item) => {
              const radius = 145;
              const rad = ((item.angle - 90) * Math.PI) / 180;
              const x = Math.cos(rad) * radius;
              const y = Math.sin(rad) * radius;
              return (
                <div
                  key={item.label}
                  className="absolute w-14 h-14 rounded-full flex items-center justify-center hero-float bg-[#22C55E]/90 text-white shadow-lg border border-white/10"
                  style={{
                    left: `calc(50% + ${x}px - 28px)`,
                    top: `calc(50% + ${y}px - 28px)`,
                    boxShadow: '0 0 20px rgba(34, 197, 94, 0.5)',
                    animationDelay: `${item.angle * 0.08}s`,
                  }}
                  title={item.label}
                >
                  <item.Icon />
                </div>
              );
            })}
          </div>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#22C55E] to-[#16A34A] flex flex-col items-center justify-center text-white hero-glow-green ring-4 ring-[#4ADE80]/30">
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
              <span className="text-[11px] font-bold tracking-widest mt-1 opacity-95">CLIENT</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
