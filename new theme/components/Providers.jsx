export default function Providers() {
  return (
    <section id="providers" className="min-h-screen flex flex-col items-center justify-center px-6 py-20 relative z-10">
      <div className="max-w-6xl mx-auto w-full">
        <h2 className="text-5xl sm:text-6xl font-extrabold text-white mb-6 text-center">Our Providers</h2>
        <p className="text-white/80 text-lg text-center mb-16 max-w-2xl mx-auto">
          Join thousands of skilled professionals earning on their own terms with Khadamni.
        </p>
        <div className="bg-gradient-to-br from-[#22C55E]/20 to-[#16A34A]/10 rounded-3xl p-12 ring-1 ring-[#4ADE80]/30 space-y-6">
          <h3 className="text-3xl font-bold text-white">Why Join Khadamni?</h3>
          <ul className="space-y-4 text-white/80 text-lg">
            <li className="flex items-start gap-4">
              <span className="text-[#22C55E] text-2xl">✓</span>
              <span>Set your own rates and working hours</span>
            </li>
            <li className="flex items-start gap-4">
              <span className="text-[#22C55E] text-2xl">✓</span>
              <span>Access a steady stream of verified customers</span>
            </li>
            <li className="flex items-start gap-4">
              <span className="text-[#22C55E] text-2xl">✓</span>
              <span>Secure and transparent payment system</span>
            </li>
            <li className="flex items-start gap-4">
              <span className="text-[#22C55E] text-2xl">✓</span>
              <span>Build your reputation with customer reviews</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
