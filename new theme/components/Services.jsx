import { WrenchIcon, LightningIcon, TruckIcon, CleaningIcon, CarIcon, LocationPinIcon } from './Icons';

const serviceItems = [
  { label: 'Plumber', angle: 0, Icon: WrenchIcon },
  { label: 'Electrician', angle: 60, Icon: LightningIcon },
  { label: 'Delivery', angle: 120, Icon: TruckIcon },
  { label: 'Cleaning', angle: 180, Icon: CleaningIcon },
  { label: 'Car service', angle: 240, Icon: CarIcon },
  { label: 'Location', angle: 300, Icon: LocationPinIcon },
];

export default function Services() {
  return (
    <section id="services" className="min-h-screen flex flex-col items-center justify-center px-6 py-20 relative z-10">
      <div className="max-w-6xl mx-auto w-full">
        <h2 className="text-5xl sm:text-6xl font-extrabold text-white mb-6 text-center">Our Services</h2>
        <p className="text-white/80 text-lg text-center mb-16 max-w-2xl mx-auto">
          We connect you with professionals across a wide range of services to meet all your needs.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {serviceItems.map((item) => (
            <div key={item.label} className="bg-gradient-to-br from-[#22C55E]/20 to-[#16A34A]/10 rounded-2xl p-8 ring-1 ring-[#4ADE80]/30 hover:ring-[#4ADE80]/50 transition-all duration-300 hover:shadow-lg hover:shadow-[#22C55E]/20">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#22C55E] to-[#16A34A] flex items-center justify-center mb-4">
                <item.Icon />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">{item.label}</h3>
              <p className="text-white/70">Find trusted {item.label.toLowerCase()} professionals in your area.</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
