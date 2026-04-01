import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

export default function Providers() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProviders() {
      try {
        const response = await api.get('/providers/all_providers');
        setProviders(response.data.slice(0, 3));
      } catch (error) {
        console.error('Error fetching providers:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchProviders();
  }, []);

  return (
    <section id="providers" className="min-h-screen flex flex-col items-center justify-center px-6 py-20 relative z-10">
      <div className="max-w-6xl mx-auto w-full">
        <h2 className="text-5xl sm:text-6xl font-extrabold text-white mb-6 text-center">Our Providers</h2>
        <p className="text-white/80 text-lg text-center mb-16 max-w-2xl mx-auto">
          Explore professionals ready to assist, or join thousands of skilled experts earning on their own terms.
        </p>

        {/* FEATURED PROVIDERS */}
        {!loading && providers.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {providers.map((provider) => (
              <div key={provider._id} className="bg-[#1E293B] border border-white/10 rounded-[20px] p-6 shadow-xl hover:border-[#4ADE80]/30 hover:shadow-[#22C55E]/10 transition-all duration-300 flex flex-col">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full border border-[#22C55E]/30 bg-white/5 flex items-center justify-center font-bold text-white/50 text-xl uppercase shrink-0">
                      {provider.first_name ? provider.first_name.charAt(0) : '?'}
                    </div>
                    <div>
                      <h3 className="font-bold text-white/90 text-lg leading-tight">
                        {provider.first_name} {provider.last_name}
                      </h3>
                      <p className="text-xs text-white/40 mt-0.5 capitalize">{provider.role || 'Provider'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#4ADE80] shrink-0 shadow-sm">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    <span className="font-bold text-xs">{provider.rating || '5.0'}</span>
                  </div>
                </div>
                
                <p className="text-sm text-white/70 leading-relaxed mb-5 line-clamp-3 flex-1">
                  {provider.bio || 'Experienced and highly rated professional ready to deliver top-quality service.'}
                </p>

                <div className="flex flex-wrap gap-2 mb-6">
                  {provider.service_categories && provider.service_categories.length > 0 ? (
                    provider.service_categories.slice(0, 3).map((skill, i) => (
                      <span key={i} className="text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-md bg-white/5 text-white/60">
                        {skill}
                      </span>
                    ))
                  ) : (
                     <span className="text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-md bg-white/5 text-white/60">
                        General Maintenance
                     </span>
                  )}
                </div>

                <Link
                  to={`/provider/${provider._id}`}
                  className="mt-auto w-full py-2.5 rounded-[12px] bg-gradient-to-r from-[#22C55E] to-[#16A34A] text-white text-sm font-semibold text-center shadow-lg shadow-[#22C55E]/20 hover:shadow-[#22C55E]/40 hover:scale-[1.02] transition-all duration-300"
                >
                  View Profile
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* WHY JOIN SECTION */}
        <div className="bg-[#1E293B] border border-white/10 rounded-[24px] p-8 md:p-12 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center gap-10">
          <div className="absolute -top-32 -right-32 w-[600px] h-[600px] bg-[#22C55E]/10 rounded-full blur-[100px] pointer-events-none"></div>
          
          <div className="flex-1 relative z-10 w-full">
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white mb-6">Ready to offer your skills?</h3>
            <ul className="space-y-4 text-white/80 text-lg">
              <li className="flex items-start gap-4">
                <span className="text-[#4ADE80] mt-1"><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg></span>
                <span>Set your own rates and flexible working hours</span>
              </li>
              <li className="flex items-start gap-4">
                <span className="text-[#4ADE80] mt-1"><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg></span>
                <span>Access a steady stream of verified customers locally</span>
              </li>
              <li className="flex items-start gap-4">
                <span className="text-[#4ADE80] mt-1"><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg></span>
                <span>Secure, escrow-secured transparent payment system</span>
              </li>
            </ul>
            <div className="mt-10">
              <Link to="/register" className="inline-block border border-white/20 text-white hover:bg-white/10 px-8 py-3 rounded-full font-medium transition-colors">
                Apply as a Provider
              </Link>
            </div>
          </div>

          <div className="hidden md:flex w-[350px] shrink-0 justify-center">
            {/* Visual aesthetic decoration for exactly matching existing platform premium dark/green style */}
            <div className="w-64 h-64 rounded-full border border-white/5 flex items-center justify-center relative">
               <div className="w-48 h-48 rounded-full border border-[#22C55E]/30 flex items-center justify-center">
                 <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#22C55E]/40 to-[#16A34A]/20 flex items-center justify-center shadow-[0_0_50px_rgba(34,197,94,0.3)]">
                    <svg className="w-12 h-12 text-[#4ADE80]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                 </div>
               </div>
               <div className="absolute top-4 left-6 w-8 h-8 rounded-full bg-[#1E293B] border border-white/10 flex items-center justify-center shadow-lg"><span className="text-[#4ADE80] text-xs">★</span></div>
               <div className="absolute bottom-6 right-6 w-10 h-10 rounded-full bg-[#1E293B] border border-white/10 flex items-center justify-center shadow-lg"><span className="text-[#4ADE80] text-sm">✓</span></div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
