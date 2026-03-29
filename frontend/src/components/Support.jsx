const faqData = [
  { q: 'How do I book a service?', a: 'Browse available professionals on the map, click their marker, and send a service request with a description of what you need.' },
  { q: 'What payment methods do you accept?', a: 'We accept all major payment methods including credit cards, debit cards, and digital wallets for your convenience.' },
  { q: 'Is my information secure?', a: 'Yes, we use industry-leading encryption and security measures to protect your personal and payment information.' },
  { q: 'How are service providers verified?', a: 'All professionals go through a thorough verification process including background checks and credential verification.' },
];

export default function Support() {
  return (
    <section id="support" className="min-h-screen flex flex-col items-center justify-center px-6 py-20 relative z-10">
      <div className="max-w-4xl mx-auto w-full">
        <h2 className="text-5xl sm:text-6xl font-extrabold text-white mb-6 text-center">Help & Support</h2>
        <p className="text-white/80 text-lg text-center mb-16 max-w-2xl mx-auto">
          We're here to help! Find answers to common questions or reach out to our support team.
        </p>
        <div className="space-y-6">
          {faqData.map((item, i) => (
            <div key={i} className="bg-gradient-to-br from-[#22C55E]/20 to-[#16A34A]/10 rounded-2xl p-8 ring-1 ring-[#4ADE80]/30">
              <h3 className="text-xl font-bold text-white mb-3">{item.q}</h3>
              <p className="text-white/80">{item.a}</p>
            </div>
          ))}
        </div>
        <div className="mt-16 text-center">
          <p className="text-white/80 mb-6">Still need help? Contact our support team</p>
          <a href="mailto:support@khadamni.com" className="inline-block px-8 py-4 rounded-[20px] bg-gradient-to-br from-[#22C55E] to-[#16A34A] text-white font-semibold shadow-lg shadow-[#22C55E]/40 hover:shadow-[#22C55E]/60 hover:-translate-y-0.5 transition-all duration-200 ring-1 ring-[#4ADE80]/30">
            Contact Support
          </a>
        </div>
      </div>
    </section>
  );
}
