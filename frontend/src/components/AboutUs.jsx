export default function AboutUs() {
  return (
    <section id="about" className="min-h-screen flex flex-col items-center justify-center px-6 py-20 relative z-10">
      <div className="max-w-4xl mx-auto w-full">
        <h2 className="text-5xl sm:text-6xl font-extrabold text-white mb-6 text-center">About Us</h2>
        <div className="bg-gradient-to-br from-[#22C55E]/20 to-[#16A34A]/10 rounded-3xl p-12 ring-1 ring-[#4ADE80]/30 space-y-6">
          <p className="text-white/80 text-lg leading-relaxed">
            Khadamni is a revolutionary platform that bridges the gap between service seekers and skilled professionals. We believe in making quality services accessible to everyone through a transparent, secure, and user-friendly ecosystem.
          </p>
          <p className="text-white/80 text-lg leading-relaxed">
            Our mission is to empower professionals and delight customers by creating a trusted marketplace where skills meet opportunities. Whether you need a plumber, electrician, delivery service, or any other professional, Khadamni connects you instantly.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-[#22C55E] mb-2">1000+</div>
              <p className="text-white/80">Verified Professionals</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-[#22C55E] mb-2">50K+</div>
              <p className="text-white/80">Happy Customers</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-[#22C55E] mb-2">24/7</div>
              <p className="text-white/80">Customer Support</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
