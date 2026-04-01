import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';
import api from '../api/axios';
import { createRequest } from '../api/request';
import SideDrawer from '../components/SideDrawer';
import useAuth from '../hooks/useAuth';
import { Link } from 'react-router-dom';

// ─── Custom Markers ───────────────────────────────────────────────────────────

const userIcon = L.divIcon({
  className: '',
  html: `
    <div style="position:relative; width:20px; height:20px;">
      <div style="
        position:absolute; inset:0;
        background:#3B82F6;
        border-radius:50%;
        border:2px solid white;
        box-shadow:0 0 0 4px rgba(59,130,246,0.3);
      "></div>
      <div style="
        position:absolute; inset:-6px;
        border-radius:50%;
        background:rgba(59,130,246,0.15);
        animation:pulse-ring 2s ease-out infinite;
      "></div>
    </div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -14],
});

const pendingIcon = L.divIcon({
  className: '',
  html: `
    <div style="
      width:14px; height:14px;
      background:#F59E0B;
      border-radius:50%;
      border:2px solid white;
      box-shadow:0 0 0 3px rgba(245,158,11,0.3);
    "></div>
  `,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  popupAnchor: [0, -10],
});

// ─── Map helpers ──────────────────────────────────────────────────────────────

function LocationPicker({ onLocationSet }) {
  useMapEvents({
    click(e) {
      onLocationSet([e.latlng.lat, e.latlng.lng]);
    }
  });
  return null;
}

function FlyToLocation({ position }) {
  const map = useMapEvents({});
  useEffect(() => {
    map.flyTo(position, 14);
  }, [position]);
  return null;
}

// ─── Service Config & Icons ───────────────────────────────────────────────────

const getServiceIconUrl = (serviceName) => {
  const s = serviceName.toLowerCase();

  // Primary Categories
  if (s.includes('plumb')) return 'https://cdn-icons-png.flaticon.com/512/15364/15364725.png';
  if (s.includes('electr')) return 'https://cdn-icons-png.flaticon.com/512/6946/6946476.png';
  if (s.includes('clean')) return 'https://cdn-icons-png.flaticon.com/512/994/994928.png';
  if (s.includes('paint')) return 'https://cdn-icons-png.flaticon.com/512/681/681582.png';

  // Professional & Education
  if (s.includes('tutor') || s.includes('teach') || s.includes('lesson')) return 'https://img.icons8.com/color/48/teacher.png';
  if (s.includes('it ') || s.includes('support') || s.includes('compute') || s.includes('tech')) return 'https://img.icons8.com/color/48/monitor--v1.png';

  // Manual Labor & Trades
  if (s.includes('carpent') || s.includes('wood') || s.includes('hammer')) return 'https://cdn-icons-png.flaticon.com/512/939/939525.png';
  if (s.includes('garden') || s.includes('lawn') || s.includes('plant')) return 'https://cdn-icons-png.flaticon.com/512/10144/10144798.png';
  if (s.includes('mov') || s.includes('pack')) return 'https://cdn-icons-png.flaticon.com/512/602/602251.png';

  // Logistics & Food
  if (s.includes('deliver') || s.includes('courier') || s.includes('scooter')) return 'https://cdn-icons-png.flaticon.com/512/9561/9561839.png';
  if (s.includes('cook') || s.includes('chef') || s.includes('meal')) return 'https://cdn-icons-png.flaticon.com/512/5600/5600920.png';

  // Specialized (Existing)
  if (s.includes('ac ') || s.includes('air cond')) return 'https://img.icons8.com/color/48/air-conditioner.png';
  if (s.includes('lock') || s.includes('key')) return 'https://img.icons8.com/color/48/locksmith.png';

  return 'https://img.icons8.com/color/48/services.png'; // Default for "Other"
};

const SERVICE_LIST = [
  { name: 'All', icon: 'https://img.icons8.com/color/48/services.png', color: '#94A3B8' },
  { name: 'Plumbing', icon: 'https://cdn-icons-png.flaticon.com/512/15364/15364725.png', color: '#3B82F6' },
  { name: 'Electrical', icon: 'https://cdn-icons-png.flaticon.com/512/6946/6946476.png', color: '#F59E0B' },
  { name: 'Cleaning', icon: 'https://cdn-icons-png.flaticon.com/512/994/994928.png', color: '#22C55E' },
  { name: 'Painting', icon: 'https://cdn-icons-png.flaticon.com/512/681/681582.png', color: '#EC4899' },
  { name: 'Tutoring', icon: 'https://img.icons8.com/color/48/teacher.png', color: '#8B5CF6' },
  { name: 'Delivery', icon: 'https://cdn-icons-png.flaticon.com/512/9561/9561839.png', color: '#EF4444' },
  { name: 'IT Support', icon: 'https://img.icons8.com/color/48/monitor--v1.png', color: '#06B6D4' },
  { name: 'Carpentry', icon: 'https://cdn-icons-png.flaticon.com/512/939/939525.png', color: '#D97706' },
  { name: 'Gardening', icon: 'https://cdn-icons-png.flaticon.com/512/10144/10144798.png', color: '#10B981' },
  { name: 'Moving', icon: 'https://cdn-icons-png.flaticon.com/512/602/602251.png', color: '#6366F1' },
  { name: 'Cooking', icon: 'https://cdn-icons-png.flaticon.com/512/5600/5600920.png', color: '#F97316' },
  { name: 'AC Repair', icon: 'https://img.icons8.com/color/48/air-conditioner.png', color: '#38BDF8' },
  { name: 'Locksmith', icon: 'https://img.icons8.com/color/48/locksmith.png', color: '#475569' },
];

const createProviderIcon = (provider) => {
  const serviceName = (provider.service_categories && provider.service_categories.length > 0)
    ? provider.service_categories[0]
    : 'Service';

  const iconUrl = getServiceIconUrl(serviceName);

  const htmlString = `
    <div class="group flex flex-col items-center justify-center -mt-8 cursor-pointer relative z-10 w-24 h-24">
      <div class="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-[0_8px_16px_rgba(0,0,0,0.6)] transition-transform duration-300 transform group-hover:scale-110 group-hover:-translate-y-1 z-20 border-[3px] border-white relative overflow-hidden group-hover:shadow-[0_4px_25px_rgba(255,255,255,0.4)]">
        <img src="${iconUrl}" alt="${serviceName}" class="w-8 h-8 object-contain" />
      </div>
      <div class="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-white transition-transform duration-300 group-hover:-translate-y-1 -mt-[1px] z-10 drop-shadow-md"></div>
      <div class="mt-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#1E293B]/90 text-white shadow-sm whitespace-nowrap uppercase tracking-wider relative z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">${serviceName}</div>
    </div>
  `;

  return L.divIcon({
    html: htmlString,
    className: 'bg-transparent border-none',
    iconSize: [96, 96],
    iconAnchor: [48, 64],
    popupAnchor: [0, -64]
  });
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function Map() {
  const { user } = useAuth();
  const isProvider = user?.role === 'provider';
  const [providers, setProviders] = useState([]);
  const [userLocation, setUserLocation] = useState([36.737232, 3.086472]);
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [locating, setLocating] = useState(false);
  const [pickingLocation, setPickingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [pendingLocation, setPendingLocation] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [requestDescription, setRequestDescription] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState(() => {
    const saved = localStorage.getItem('recent_map_searches');
    return saved ? JSON.parse(saved) : [];
  });
  const [isSearching, setIsSearching] = useState(false);
  const [overlayQuery, setOverlayQuery] = useState('');
  const [overlayResults, setOverlayResults] = useState([]);
  const [overlayPicked, setOverlayPicked] = useState(null);

  const handleOverlaySearch = async (val) => {
    setOverlayQuery(val);
    if (val.length < 2) {
      setOverlayResults([]);
      return;
    }
    try {
      const res = await api.get(`/providers/all_providers?search=${val}&include_offline=true`);
      setOverlayResults(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    localStorage.setItem('recent_map_searches', JSON.stringify(recentSearches.slice(0, 5)));
  }, [recentSearches]);

  const loadProviders = async (category = 'All') => {
    try {
      const res = await api.get(`/providers/all_providers${category !== 'All' ? `?category=${category}` : ''}`);
      const dbProviders = res.data.providers || res.data;
      setProviders(dbProviders);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
      (err) => console.error('Location denied', err)
    );
    loadProviders(categoryFilter);
  }, [categoryFilter]);

  // Debounced search for DB
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    setSuggestionsOpen(true);
    setIsSearching(true);
    const counter = setTimeout(async () => {
      try {
        const res = await api.get(`/providers/all_providers?search=${searchQuery}&include_offline=true`);
        setSearchResults(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 400);
    return () => clearTimeout(counter);
  }, [searchQuery]);

  const handleSelectLocation = (provider, name) => {
    setPendingLocation([parseFloat(provider.latitude), parseFloat(provider.longitude)]);
    setSearchQuery(name);
    setSuggestionsOpen(false);
    // Add to recent
    setRecentSearches(prev => {
      const filtered = prev.filter(s => s._id !== provider._id);
      return [provider, ...filtered];
    });
  };

  const handleUseGPS = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
        setLocationConfirmed(true);
        setLocating(false);
      },
      () => {
        setLocating(false);
      }
    );
  };
  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length < 2) return setSearchResults([]);
    const res = await api.get(`/providers/all_providers?search=${query}&include_offline=true`);
    setSearchResults(res.data);
  };

  const handleSendRequest = async () => {
    if (!requestDescription.trim()) return;
    setSending(true);
    try {
      await createRequest({ provider_id: selectedProvider._id, description: requestDescription });
      setRequestSent(true);
      setTimeout(() => {
        setSelectedProvider(null);
        setRequestDescription('');
        setRequestSent(false);
      }, 1800);
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  if (!locationConfirmed) {
    return (
      <div className="relative w-full h-screen bg-[#0F172A] flex items-center justify-center p-4">
        <style>{`
          @keyframes pulse-ring {
            0%   { transform: scale(1); opacity: 0.6; }
            100% { transform: scale(2.5); opacity: 0; }
          }
          .leaflet-popup-content-wrapper {
            background: #1E293B !important;
            border: 1px solid rgba(255,255,255,0.1) !important;
            border-radius: 14px !important;
            box-shadow: 0 8px 32px rgba(0,0,0,0.5) !important;
            padding: 0 !important;
          }
          .leaflet-popup-content {
            margin: 0 !important;
            color: white !important;
          }
          .leaflet-popup-tip {
            background: #1E293B !important;
          }
          .leaflet-popup-close-button {
            color: rgba(255,255,255,0.5) !important;
            top: 8px !important;
            right: 8px !important;
          }
        `}</style>
        
        <div style={{
          position: 'fixed', inset: 0, zIndex: 3000,
          backgroundColor: 'rgba(15,23,42,0.92)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            backgroundColor: '#1E293B', borderRadius: '24px',
            padding: '32px', width: '400px', maxWidth: '90vw',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 0 60px rgba(34,197,94,0.1)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📍</div>
              <div style={{ color: 'white', fontWeight: '700', fontSize: '18px', marginBottom: '6px' }}>
                Confirm your location
              </div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px' }}>
                We need your location to show you nearby providers
              </div>
            </div>

            <button
              onClick={handleUseGPS}
              disabled={locating}
              style={{
                width: '100%', padding: '12px',
                background: 'linear-gradient(to right, #22C55E, #4ADE80)',
                color: 'white', border: 'none', borderRadius: '20px',
                fontWeight: '600', fontSize: '14px', cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(34,197,94,0.3)',
                marginBottom: '12px', opacity: locating ? 0.7 : 1,
              }}
            >
              {locating ? 'Detecting...' : '📡 Use my current location'}
            </button>

            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '12px', marginBottom: '12px' }}>
              or search manually
            </div>

            <input
              type="text"
              placeholder="Search your city or address..."
              value={overlayQuery}
              onChange={(e) => handleOverlaySearch(e.target.value)}
              style={{
                width: '100%', padding: '12px 16px', boxSizing: 'border-box',
                backgroundColor: '#0F172A', color: 'white',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px',
                fontSize: '14px', outline: 'none',
              }}
            />

            {overlayResults.length > 0 && (
              <div style={{
                backgroundColor: '#0F172A', borderRadius: '12px',
                marginTop: '6px', border: '1px solid rgba(255,255,255,0.08)',
                maxHeight: '180px', overflowY: 'auto'
              }}>
                {overlayResults.map((r) => (
                  <div
                    key={r._id}
                    onClick={() => {
                      setOverlayPicked([parseFloat(r.latitude), parseFloat(r.longitude)]);
                      setOverlayQuery(r.full_name);
                      setOverlayResults([]);
                    }}
                    style={{
                      padding: '10px 14px', color: 'rgba(255,255,255,0.8)',
                      cursor: 'pointer', fontSize: '13px',
                      borderBottom: '1px solid rgba(255,255,255,0.05)'
                    }}
                  >
                    <div className="font-bold">{r.full_name}</div>
                    <div className="text-[10px] text-white/40">{r.service_categories?.join(', ')}</div>
                  </div>
                ))}
              </div>
            )}

            {overlayPicked && (
              <button
                onClick={() => {
                  setUserLocation(overlayPicked);
                  setLocationConfirmed(true);
                }}
                style={{
                  width: '100%', padding: '12px', marginTop: '10px',
                  background: 'linear-gradient(to right, #22C55E, #4ADE80)',
                  color: 'white', border: 'none', borderRadius: '20px',
                  fontWeight: '600', fontSize: '14px', cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(34,197,94,0.3)',
                }}
              >
                ✅ Confirm this location
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-[#0F172A] overflow-hidden">
          <SideDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
          
          {/* TOP NAVIGATION & FILTER BAR */}
          <div className="absolute top-0 left-0 right-0 z-[1000] p-4 flex flex-col gap-4 pointer-events-none">
            <div className="flex items-center gap-4 pointer-events-auto">
              <button
                onClick={() => setDrawerOpen(true)}
                className="w-10 h-10 rounded-[20px] bg-[#1E293B]/90 backdrop-blur-md border border-white/10 shadow-lg flex items-center justify-center text-white hover:bg-[#22C55E] transition-all duration-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
          {/* SEARCH BAR CONTAINER */}
          <div className="relative w-full max-w-[320px]">
            <div className={`flex items-center bg-[#1E293B]/95 backdrop-blur-md border border-white/10 shadow-2xl transition-all duration-300 ${suggestionsOpen ? 'rounded-t-[20px]' : 'rounded-[20px]'}`}>
              <div className="pl-4 text-white/40">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search services or locations..."
                value={searchQuery}
                onFocus={() => setSuggestionsOpen(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Escape' && setSuggestionsOpen(false)}
                className="w-full px-3 py-3 bg-transparent text-white placeholder-white/40 text-sm outline-none font-medium"
              />
              {searchQuery && (
                <button 
                  onClick={() => { setSearchQuery(''); setSuggestionsOpen(false); }}
                  className="pr-4 text-white/30 hover:text-white/60 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* SUGGESTIONS DROPDOWN */}
            {suggestionsOpen && (
              <div className="absolute top-full left-0 right-0 bg-[#0F172A]/98 backdrop-blur-xl border-x border-b border-white/10 rounded-b-[20px] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="max-h-[400px] overflow-y-auto">
                  
                  {/* LOCAL SEARCH / RECENT SECTION */}
                  <div className="py-2 border-b border-white/5">
                    <div className="px-4 py-2 text-[10px] uppercase tracking-widest text-[#22C55E] font-bold">
                      {searchQuery ? 'Provider Results' : 'Recent Searches'}
                    </div>
                    
                    {isSearching ? (
                      [1,2].map(i => (
                        <div key={i} className="px-4 py-3 flex gap-3 animate-pulse">
                          <div className="w-8 h-8 rounded-full bg-white/5" />
                          <div className="flex-1 space-y-2 py-1">
                            <div className="h-2 bg-white/10 rounded w-3/4" />
                            <div className="h-2 bg-white/5 rounded w-1/2" />
                          </div>
                        </div>
                      ))
                    ) : (
                      (searchQuery ? searchResults : recentSearches).map((res, i) => (
                        <button
                          key={i}
                          onClick={() => handleSelectLocation(res, res.full_name || res.display_name)}
                          className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/[0.05] group transition-all duration-200 text-left border-l-2 border-transparent hover:border-[#22C55E]"
                        >
                          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 group-hover:bg-[#22C55E]/10 group-hover:text-[#22C55E] transition-colors overflow-hidden">
                            {res.service_categories ? (
                              <img src={getServiceIconUrl(res.service_categories[0])} alt="" className="w-5 h-5 object-contain opacity-50 group-hover:opacity-100" />
                            ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            )}
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <div className="text-sm text-white font-medium truncate">{res.full_name || res.display_name}</div>
                            <div className="text-[11px] text-white/40 truncate">{res.service_categories?.join(' · ') || 'Location'}</div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>

                  {/* SERVICES SECTION */}
                  <div className="py-2">
                    <div className="px-4 py-2 text-[10px] uppercase tracking-widest text-[#22C55E] font-bold">Services</div>
                    {SERVICE_LIST.filter(s => s.name !== 'All' && s.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5).map((service, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setCategoryFilter(service.name);
                          setSearchQuery(service.name);
                          setSuggestionsOpen(false);
                        }}
                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/[0.05] group transition-all duration-200 text-left border-l-2 border-transparent hover:border-[#22C55E]"
                      >
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center p-1.5 transition-transform group-hover:scale-110"
                          style={{ backgroundColor: `${service.color}15` }}
                        >
                          <img src={service.icon} alt={service.name} className="w-full h-full object-contain" />
                        </div>
                        <div className="flex-1 text-sm text-white font-medium">{service.name}</div>
                        <svg className="w-4 h-4 text-white/20 group-hover:text-[#22C55E] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* HORIZONTAL FILTER BAR */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-2 pointer-events-auto">
          {SERVICE_LIST.map((service) => (
            <button
              key={service.name}
              onClick={() => setCategoryFilter(service.name)}
              style={{
                backgroundColor: categoryFilter === service.name ? service.color : '#1E293B',
                boxShadow: categoryFilter === service.name ? `0 4px 12px ${service.color}40` : 'none',
                borderColor: categoryFilter === service.name ? 'transparent' : 'rgba(255,255,255,0.08)'
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold whitespace-nowrap transition-all duration-300 hover:scale-105 active:scale-95 ${categoryFilter === service.name ? 'text-white' : 'text-white/60 hover:text-white hover:border-white/20'}`}
            >
              <img src={service.icon} alt={service.name} className="w-4 h-4 object-contain" />
              {service.name}
            </button>
          ))}
        </div>
      </div>

      {/* CLICK OUTSIDE HANDLER */}
      {suggestionsOpen && (
        <div 
          className="fixed inset-0 z-[999] bg-transparent"
          onClick={() => setSuggestionsOpen(false)}
        />
      )}

      {/* Confirmation buttons for new locations */}
      {pendingLocation && !searchOpen && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-[320px] px-4">
          <button
            onClick={async () => {
              setUserLocation(pendingLocation);
              setPendingLocation(null);
              if (isProvider) {
                try {
                  await api.put('/providers/location', {
                    latitude: pendingLocation[0],
                    longitude: pendingLocation[1],
                  });
                } catch (err) { console.error(err); }
              }
            }}
            className="w-full py-4 rounded-3xl bg-gradient-to-r from-[#22C55E] to-[#4ADE80] text-white font-bold shadow-2xl shadow-[#22C55E]/40"
          >
            ✅ Confirm Your Location
          </button>
        </div>
      )}
      <MapContainer
        center={userLocation}
        zoom={13}
        style={{ height: '100vh', width: '100%' }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png" />

        <FlyToLocation position={pendingLocation || userLocation} />

        {pickingLocation && (
          <LocationPicker onLocationSet={(loc) => {
            setUserLocation(loc);
            setPickingLocation(false);
          }} />
        )}

        {pendingLocation && (
          <Marker position={pendingLocation} icon={pendingIcon}>
            <Popup>
              <div style={{ padding: '10px 14px', fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>
                📍 Confirm this location?
              </div>
            </Popup>
          </Marker>
        )}

        <Marker position={userLocation} icon={userIcon}>
          <Popup>
            <div style={{ padding: '10px 14px', fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>
              📍 You are here
            </div>
          </Popup>
        </Marker>

        {providers.map((provider) => {
          const lat = provider.latitude;
          const lng = provider.longitude;

          if (lat === undefined || lng === undefined) return null;

          return (
            <Marker
              key={provider._id || index}
              position={[lat, lng]}
              icon={createProviderIcon(provider)}
            >
              <Popup>
                <div className="p-4 w-60">
                  <div className="flex items-center gap-3 mb-3 border-b border-white/10 pb-3">
                    <div className="w-10 h-10 rounded-full bg-white/5 border border-[#22C55E]/30 flex items-center justify-center font-bold text-white/50 text-sm uppercase shrink-0">
                      {provider.full_name ? provider.full_name.charAt(0) : '?'}
                    </div>
                    <div>
                      <h3 className="font-bold text-white/90 text-sm leading-tight">
                        {provider.full_name || 'Provider'}
                      </h3>
                      <p className="text-[10px] text-[#4ADE80] mt-0.5 capitalize font-medium">{provider.service_categories?.[0] || 'Expert'}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs text-white/60 mb-1">
                      <strong className="text-white/80 font-medium">Services:</strong> {provider.service_categories && provider.service_categories.length > 0 ? provider.service_categories.join(', ') : 'General Maintenance'}
                    </p>
                    <p className="text-xs text-white/60 flex items-center gap-1">
                      <strong className="text-white/80 font-medium">Rating:</strong>
                      <span className="text-[#4ADE80]">★ {provider.rating || '5.0'}</span>
                      <span className="opacity-50 ml-1">({provider.experience_years || 1} yrs exp)</span>
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedProvider(provider)}
                      className="flex-1 py-1.5 rounded-[8px] bg-gradient-to-r from-[#22C55E] to-[#16A34A] text-white text-[11px] font-semibold text-center shadow-lg shadow-[#22C55E]/20 hover:shadow-[#22C55E]/40 hover:scale-[1.02] transition-all duration-300 pointer-events-auto"
                    >
                      Request
                    </button>
                    <Link
                      to={`/provider/${provider._id}`}
                      className="flex-1 py-1.5 rounded-[8px] bg-white/10 border border-white/20 text-white text-[11px] font-semibold text-center hover:bg-white/20 hover:scale-[1.02] transition-all duration-300 pointer-events-auto flex items-center justify-center"
                    >
                      Profile
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Request modal */}
      {selectedProvider && (
        <div style={{
          position: 'fixed', inset: 0,
          backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 2000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: '#1E293B', borderRadius: '20px',
            padding: '28px', width: '380px',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 0 60px rgba(34,197,94,0.15)'
          }}>
            {requestSent ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>✅</div>
                <div style={{ color: 'white', fontWeight: '600', fontSize: '16px' }}>Request sent!</div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginTop: '4px' }}>
                  Waiting for {selectedProvider.full_name} to respond
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
                   <div style={{
                    width: '44px', height: '44px', borderRadius: '50%',
                    background: 'linear-gradient(135deg,#22C55E,#4ADE80)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '15px', fontWeight: '700', color: 'white', flexShrink: 0
                  }}>
                    {selectedProvider.full_name ? selectedProvider.full_name.charAt(0) : '?'}
                  </div>
                  <div>
                    <div style={{ color: 'white', fontWeight: '600', fontSize: '15px' }}>{selectedProvider.full_name}</div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>
                      {selectedProvider.service_categories?.join(' · ')}
                    </div>
                  </div>
                </div>
                <textarea
                  placeholder="Describe what you need..."
                  value={requestDescription}
                  onChange={(e) => setRequestDescription(e.target.value)}
                  style={{
                    width: '100%', height: '100px', padding: '12px',
                    backgroundColor: '#0F172A', color: 'white',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
                    fontSize: '14px', resize: 'none', outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                  <button
                    onClick={() => { setSelectedProvider(null); setRequestDescription(''); }}
                    style={{
                      flex: 1, padding: '10px', backgroundColor: '#0F172A',
                      color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '20px', cursor: 'pointer', fontSize: '14px'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendRequest}
                    disabled={sending || !requestDescription.trim()}
                    style={{
                      flex: 1, padding: '10px',
                      background: sending || !requestDescription.trim()
                        ? 'rgba(34,197,94,0.4)'
                        : 'linear-gradient(to right, #22C55E, #4ADE80)',
                      color: 'white', border: 'none',
                      borderRadius: '20px', cursor: sending ? 'not-allowed' : 'pointer',
                      fontWeight: '600', fontSize: '14px',
                      boxShadow: '0 4px 15px rgba(34,197,94,0.3)'
                    }}
                  >
                    {sending ? 'Sending...' : 'Send Request'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
