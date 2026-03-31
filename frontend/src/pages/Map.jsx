import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';
import { createRequest } from '../api/request';
import SideDrawer from '../components/SideDrawer';
import useAuth from '../hooks/useAuth';

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

function providerIcon(name) {
  const initials = name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return L.divIcon({
    className: '',
    html: `
      <div style="
        width:36px; height:36px;
        background:linear-gradient(135deg,#22C55E,#4ADE80);
        border-radius:50%;
        border:2px solid white;
        box-shadow:0 0 0 3px rgba(34,197,94,0.3), 0 4px 12px rgba(34,197,94,0.4);
        display:flex; align-items:center; justify-content:center;
        font-size:12px; font-weight:700; color:white;
        font-family:system-ui,sans-serif;
      ">${initials}</div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -22],
  });
}

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

  // overlay search state
  const [overlayQuery, setOverlayQuery] = useState('');
  const [overlayResults, setOverlayResults] = useState([]);
  const [overlayPicked, setOverlayPicked] = useState(null);

  useEffect(() => {
    axios.get('/api/providers/all_providers')
      .then(res => setProviders(res.data.providers || res.data))
      .catch(err => console.error(err));
  }, []);

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

  const handleOverlaySearch = async (query) => {
    setOverlayQuery(query);
    if (query.length < 3) return setOverlayResults([]);
    const res = await axios.get(
      `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=5`
    );
    setOverlayResults(res.data);
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length < 3) return setSearchResults([]);
    const res = await axios.get(
      `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=5`
    );
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

  return (
    <>
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

      {/* Location confirmation overlay */}
      {!locationConfirmed && (
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

            {/* GPS button */}
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

            {/* Manual search */}
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
                    key={r.place_id}
                    onClick={() => {
                      setOverlayPicked([parseFloat(r.lat), parseFloat(r.lon)]);
                      setOverlayQuery(r.display_name.split(',').slice(0, 2).join(','));
                      setOverlayResults([]);
                    }}
                    style={{
                      padding: '10px 14px', color: 'rgba(255,255,255,0.8)',
                      cursor: 'pointer', fontSize: '13px',
                      borderBottom: '1px solid rgba(255,255,255,0.05)'
                    }}
                  >
                    {r.display_name.split(',').slice(0, 2).join(',')}
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
      )}

      <SideDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* Menu button */}
      <button
        onClick={() => setDrawerOpen(true)}
        style={{ position: 'absolute', top: 16, left: 16, zIndex: 1000 }}
        className="w-10 h-10 rounded-[20px] bg-[#1E293B] border border-white/10 shadow-lg flex items-center justify-center text-white hover:bg-[#22C55E] transition"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Search panel */}
      <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
        <button
          onClick={() => { setSearchOpen(!searchOpen); setPickingLocation(false); }}
          className={`w-10 h-10 rounded-[20px] border border-white/10 shadow-lg flex items-center justify-center text-white transition ${searchOpen ? 'bg-[#22C55E]' : 'bg-[#1E293B] hover:bg-[#22C55E]'}`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        {searchOpen && (
          <div style={{ width: '280px' }}>
            <input
              type="text"
              placeholder="Search location..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchResults.length > 0) {
                  setPendingLocation([parseFloat(searchResults[0].lat), parseFloat(searchResults[0].lon)]);
                  setSearchQuery(searchResults[0].display_name);
                  setSearchResults([]);
                }
              }}
              autoFocus
              className="w-full px-4 py-3 rounded-[20px] bg-[#1E293B] border border-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#22C55E] shadow-lg"
              style={{ fontSize: '14px' }}
            />
            {searchResults.length > 0 && (
              <div style={{ backgroundColor: '#1E293B', borderRadius: '12px', marginTop: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>
                {searchResults.map((result) => (
                  <div
                    key={result.place_id}
                    onClick={() => {
                      setPendingLocation([parseFloat(result.lat), parseFloat(result.lon)]);
                      setSearchQuery(result.display_name);
                      setSearchResults([]);
                    }}
                    style={{ padding: '10px 14px', color: 'rgba(255,255,255,0.85)', cursor: 'pointer', fontSize: '13px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    {result.display_name.split(',').slice(0, 2).join(',')}
                  </div>
                ))}
              </div>
            )}
            {pendingLocation && (
              <button
                onClick={async () => {
                  setUserLocation(pendingLocation);
                  setPendingLocation(null);
                  setSearchOpen(false);
                  if (isProvider) {
                    try {
                      await axios.put('/api/providers/location', {
                        latitude: pendingLocation[0],
                        longitude: pendingLocation[1],
                      }, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
                      });
                      // update the provider's marker on the map
                      setProviders(prev => prev.map(p =>
                        p.user_id === user._id || p._id === user?.provider_profile?._id
                          ? { ...p, latitude: pendingLocation[0], longitude: pendingLocation[1] }
                          : p
                      ));
                    } catch (err) {
                      console.error('Failed to update location', err);
                    }
                  }
                }}
                className="w-full py-2.5 rounded-[20px] bg-gradient-to-r from-[#22C55E] to-[#4ADE80] text-white font-semibold shadow-lg shadow-[#22C55E]/30 transition-all duration-200 cursor-pointer"
                style={{ marginTop: '8px', fontSize: '14px', border: 'none' }}
              >
                ✅ Set as my location
              </button>
            )}
            <button
              onClick={() => { setPickingLocation(!pickingLocation); setSearchOpen(false); }}
              className={`w-full mt-2 py-2.5 rounded-[20px] border font-semibold text-sm transition-all duration-200 cursor-pointer ${pickingLocation ? 'bg-[#22C55E] border-[#22C55E] text-white' : 'bg-[#1E293B] border-white/10 text-white/80 hover:border-[#22C55E]/50'}`}
            >
              {pickingLocation ? '📍 Click anywhere on map' : '📍 Click on map to set location'}
            </button>
          </div>
        )}
      </div>

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

        {providers.map((provider) => (
          <Marker
            key={provider._id}
            position={[provider.latitude, provider.longitude]}
            icon={providerIcon(provider.full_name)}
          >
            <Popup>
              <div style={{ padding: '14px 16px', minWidth: '200px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '50%',
                    background: 'linear-gradient(135deg,#22C55E,#4ADE80)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '14px', fontWeight: '700', color: 'white', flexShrink: 0
                  }}>
                    {provider.full_name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '14px', color: 'white' }}>{provider.full_name}</div>
                    <div style={{ fontSize: '12px', color: '#22C55E' }}>
                      ⭐ {provider.rating_avg?.toFixed(1) ?? '0.0'} · {provider.experience_years} yrs
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '12px' }}>
                  {provider.service_categories?.join(' · ')}
                </div>
                {!isProvider && (
                  <button
                    onClick={() => setSelectedProvider(provider)}
                    style={{
                      width: '100%', padding: '8px',
                      background: 'linear-gradient(to right, #22C55E, #4ADE80)',
                      color: 'white', border: 'none', borderRadius: '20px',
                      fontWeight: '600', fontSize: '13px', cursor: 'pointer',
                    }}
                  >
                    Request Service
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
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
                    {selectedProvider.full_name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
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
    </>
  );
}
