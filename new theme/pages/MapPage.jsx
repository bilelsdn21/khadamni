import { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import SideDrawer from '../components/SideDrawer';

const DEFAULT_CENTER = [36.7538, 3.0588];
const DEFAULT_ZOOM = 12;

const SERVICES = [
  { id: 'plumber', label: 'Plumber', icon: '🔧' },
  { id: 'electrician', label: 'Electrician', icon: '⚡' },
  { id: 'taxi', label: 'Taxi', icon: '🚕' },
  { id: 'cleaning', label: 'Cleaning', icon: '🧹' },
  { id: 'delivery', label: 'Delivery', icon: '📦' },
  { id: 'mechanic', label: 'Mechanic', icon: '🔩' },
];

// Mock providers for demo (no backend change – UI only)
function getMockProviders(serviceId) {
  const base = [
    { id: '1', name: 'Ahmed M.', rating: 4.9, distance: '0.8 km', lat: 36.758, lng: 3.055, avatar: null },
    { id: '2', name: 'Karim B.', rating: 4.7, distance: '1.2 km', lat: 36.748, lng: 3.062, avatar: null },
    { id: '3', name: 'Sara K.', rating: 4.8, distance: '1.5 km', lat: 36.752, lng: 3.048, avatar: null },
    { id: '4', name: 'Omar T.', rating: 4.6, distance: '2.0 km', lat: 36.762, lng: 3.065, avatar: null },
  ];
  return base.map((p) => ({ ...p, id: `${serviceId}-${p.id}` }));
}

function FixLeafletDefaultIcon() {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
  return null;
}

function MapPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const providers = useMemo(() => {
    if (!selectedService) return [];
    return getMockProviders(selectedService.id);
  }, [selectedService]);

  return (
    <div className="h-screen w-full flex flex-col bg-[#0F172A] relative">
      <FixLeafletDefaultIcon />

      {/* Top bar: search + service chips */}
      <div className="absolute top-0 left-0 right-0 z-[1000] p-4 space-y-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="flex-shrink-0 w-10 h-10 rounded-[20px] bg-[#1E293B] border border-white/10 shadow-lg flex items-center justify-center text-white hover:bg-[#22C55E] transition"
            aria-label="Menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex-1 relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Where and what service?"
              className="w-full pl-12 pr-4 py-3 rounded-[20px] bg-[#1E293B] border border-white/10 shadow-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {SERVICES.map((svc) => (
            <button
              key={svc.id}
              type="button"
              onClick={() => setSelectedService(selectedService?.id === svc.id ? null : svc)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-[20px] text-sm font-medium transition-all duration-200 ${
                selectedService?.id === svc.id
                  ? 'bg-[#22C55E] text-white shadow-lg shadow-[#22C55E]/30'
                  : 'bg-[#1E293B] text-white/80 border border-white/10 hover:border-[#22C55E]/50 hover:text-[#4ADE80]'
              }`}
            >
              <span>{svc.icon}</span>
              {svc.label}
            </button>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 w-full relative">
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          className="h-full w-full rounded-none"
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ZoomControl />
          {providers.map((p) => (
            <Marker key={p.id} position={[p.lat, p.lng]}>
              <Popup>
                <div className="min-w-[200px] p-1">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#22C55E]/20 flex items-center justify-center text-[#22C55E] font-semibold text-lg">
                      {p.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{p.name}</div>
                      <div className="flex items-center gap-1 text-[#22C55E] text-sm">
                        <span>★</span> {p.rating}
                      </div>
                      <div className="text-gray-500 text-sm">{p.distance}</div>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <SideDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}

function ZoomControl() {
  const map = useMap();
  return (
    <div className="leaflet-bottom leaflet-right flex flex-col gap-1 p-2">
      <button
        type="button"
        className="w-10 h-10 rounded-[20px] bg-[#1E293B] border border-white/10 shadow-md flex items-center justify-center text-white hover:bg-[#22C55E]"
        onClick={() => map.zoomIn()}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
      <button
        type="button"
        className="w-10 h-10 rounded-[20px] bg-[#1E293B] border border-white/10 shadow-md flex items-center justify-center text-white hover:bg-[#22C55E]"
        onClick={() => map.zoomOut()}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
        </svg>
      </button>
    </div>
  );
}

export default MapPage;
