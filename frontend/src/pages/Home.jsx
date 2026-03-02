import { Link } from 'react-router-dom';

const serviceIcons = [
  { icon: '🔧', label: 'Plumbing', angle: 0 },
  { icon: '🚲', label: 'Delivery', angle: 60 },
  { icon: '🚗', label: 'Transport', angle: 120 },
  { icon: '🛒', label: 'Shopping', angle: 180 },
  { icon: '💻', label: 'IT Support', angle: 240 },
  { icon: '💼', label: 'Business', angle: 300 },
];

function Home() {
  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="w-full lg:w-[45%] bg-white flex flex-col justify-between px-10 py-8 relative z-10">
        {/* Logo */}
        <div>
          <h1 className="text-lg font-bold tracking-[0.3em] text-gray-800 uppercase">
            Khadamni
          </h1>
        </div>

        {/* Center Content */}
        <div className="flex gap-16 items-start">
          <div className="flex-1">
            <h2 className="text-4xl lg:text-5xl font-black text-gray-900 leading-tight tracking-tight uppercase">
              All Services.
              <br />
              One Platform.
            </h2>
            <p className="mt-4 text-gray-500 text-base leading-relaxed max-w-sm">
              Find trusted help, post requests, and connect with pros — simplified.
            </p>
            <Link
              to="/register"
              className="mt-8 inline-block bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm uppercase tracking-wider px-8 py-3.5 rounded transition-colors"
            >
              Post Your First Request
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden lg:flex flex-col items-end gap-2 text-sm pt-2">
            {['Home', 'Services', 'Providers', 'Reviews', 'Support'].map(
              (item, i) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className={`py-1 transition-colors ${
                    i === 0
                      ? 'text-blue-500 font-semibold border-b-2 border-blue-500'
                      : i % 2 === 1
                      ? 'text-blue-400 hover:text-blue-500'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {item}
                </a>
              )
            )}
          </nav>
        </div>

        {/* Bottom Badges */}
        <div className="flex gap-6 text-xs text-gray-400">
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Verified Pros
          </div>
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Transparent Pricing
          </div>
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Secure Payments
          </div>
        </div>
      </div>

      {/* Right Panel — Hero Image + Service Hub */}
      <div className="hidden lg:flex w-[55%] relative overflow-hidden bg-gray-800 items-center justify-center">
        {/* Background image overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-l from-gray-900/60 to-gray-800/80" />

        {/* Orbiting Service Icons */}
        <div className="relative w-80 h-80">
          {/* Orbit ring */}
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-blue-400/30" />

          {/* Center — Client icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-28 h-28 rounded-full bg-gradient-to-b from-blue-400 to-blue-600 flex flex-col items-center justify-center shadow-lg shadow-blue-500/30 ring-4 ring-blue-300/30">
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
              <span className="text-white text-xs font-bold tracking-wider mt-0.5">CLIENT</span>
            </div>
          </div>

          {/* Service icons positioned around the circle */}
          {serviceIcons.map((service) => {
            const radius = 155;
            const rad = (service.angle - 90) * (Math.PI / 180);
            const x = Math.cos(rad) * radius;
            const y = Math.sin(rad) * radius;

            return (
              <div
                key={service.label}
                className="absolute w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center text-xl hover:scale-110 transition-transform cursor-pointer group"
                style={{
                  left: `calc(50% + ${x}px - 28px)`,
                  top: `calc(50% + ${y}px - 28px)`,
                }}
                title={service.label}
              >
                {service.icon}
                {/* Tooltip */}
                <span className="absolute -bottom-7 text-[10px] text-white/70 font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {service.label}
                </span>
              </div>
            );
          })}

          {/* Connecting lines (SVG) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {serviceIcons.map((service) => {
              const radius = 155;
              const rad = (service.angle - 90) * (Math.PI / 180);
              const x = Math.cos(rad) * radius + 160;
              const y = Math.sin(rad) * radius + 160;

              return (
                <line
                  key={service.label}
                  x1="160"
                  y1="160"
                  x2={x}
                  y2={y}
                  stroke="rgba(96, 165, 250, 0.25)"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}

export default Home;
