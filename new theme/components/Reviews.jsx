const reviewsData = [
  { name: 'Ahmed Al-Mansouri', role: 'Home Owner', review: 'Found an excellent plumber within minutes. Professional and affordable.' },
  { name: 'Fatima Al-Zahra', role: 'Business Owner', review: 'The platform is so easy to use. Best service for our office needs.' },
  { name: 'Mohammed Hassan', role: 'Service Provider', review: 'Loving the steady flow of customers. Great way to grow my business.' },
];

export default function Reviews() {
  return (
    <section id="reviews" className="min-h-screen flex flex-col items-center justify-center px-6 py-20 relative z-10">
      <div className="max-w-6xl mx-auto w-full">
        <h2 className="text-5xl sm:text-6xl font-extrabold text-white mb-6 text-center">What Customers Say</h2>
        <p className="text-white/80 text-lg text-center mb-16 max-w-2xl mx-auto">
          Real stories from our satisfied customers and trusted professionals.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {reviewsData.map((item, i) => (
            <div key={i} className="bg-gradient-to-br from-[#22C55E]/20 to-[#16A34A]/10 rounded-2xl p-8 ring-1 ring-[#4ADE80]/30">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, j) => (
                  <span key={j} className="text-[#22C55E] text-xl">★</span>
                ))}
              </div>
              <p className="text-white/80 mb-6 italic">"{item.review}"</p>
              <div>
                <p className="text-white font-semibold">{item.name}</p>
                <p className="text-[#4ADE80] text-sm">{item.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
