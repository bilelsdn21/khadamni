import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';
import { createRequest } from '../api/request';
import SideDrawer from '../components/SideDrawer';

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

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const pendingIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

export default function Map() {
  const [providers, setProviders] = useState([]);
  const [userLocation, setUserLocation] = useState([33.8869, 9.5375]);
  const [pickingLocation, setPickingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [pendingLocation, setPendingLocation] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [requestDescription, setRequestDescription] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
      (err) => console.error('Location denied', err)
    );
    axios.get('http://localhost:8000/api/providers/all_providers')
      .then(res => setProviders(res.data.providers || res.data))
      .catch(err => console.error(err));
  }, []);

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length < 3) return setSearchResults([]);
    const res = await axios.get(
      `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=5`
    );
    setSearchResults(res.data);
  };

  return (
    <>
      <SideDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* Menu button — top left */}
      <button
        onClick={() => setDrawerOpen(true)}
        style={{ position: 'absolute', top: 16, left: 16, zIndex: 1000 }}
        className="w-10 h-10 rounded-[20px] bg-[#1E293B] border border-white/10 shadow-lg flex items-center justify-center text-white hover:bg-[#22C55E] transition"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Pin icon — top right, opens search panel */}
      <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
        <button
          onClick={() => { setSearchOpen(!searchOpen); setPickingLocation(false); }}
          className={`w-10 h-10 rounded-[20px] border border-white/10 shadow-lg flex items-center justify-center text-white transition ${searchOpen ? 'bg-[#22C55E]' : 'bg-[#1E293B] hover:bg-[#22C55E]'}`}
          title="Set my location"
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
              className="w-full px-4 py-3 rounded-[20px] bg-[#1E293B] border border-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:border-transparent shadow-lg"
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
                onClick={() => { setUserLocation(pendingLocation); setPendingLocation(null); setSearchOpen(false); }}
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
        zoom={12}
        style={{ height: '100vh', width: '100%' }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
          attribution='&copy; Stadia Maps &copy; OpenMapTiles &copy; OpenStreetMap contributors'
        />

        <FlyToLocation position={pendingLocation || userLocation} />

        {pickingLocation && (
          <LocationPicker onLocationSet={(loc) => {
            setUserLocation(loc);
            setPickingLocation(false);
          }} />
        )}

        {pendingLocation && (
          <Marker position={pendingLocation} icon={pendingIcon}>
            <Popup>📍 Confirm this location?</Popup>
          </Marker>
        )}

        {userLocation && (
          <Marker position={userLocation} icon={userIcon}>
            <Popup>You are here</Popup>
          </Marker>
        )}

        {providers.map((provider) => (
          <Marker
            key={provider._id}
            position={[provider.latitude, provider.longitude]}
          >
            <Popup>
  <strong>{provider.full_name}</strong><br />
  {provider.service_categories.join(', ')}<br />
  ⭐ {provider.rating_avg} · {provider.experience_years} years exp<br />
  <button onClick={() => setSelectedProvider(provider)}>
    Request Service
  </button>
</Popup>

          </Marker>
        ))}

      </MapContainer>
      {selectedProvider && (
  <div style={{
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 2000,
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  }}>
    <div style={{
      backgroundColor: '#1E293B', borderRadius: '20px',
      padding: '24px', width: '360px', border: '1px solid rgba(255,255,255,0.1)',
      boxShadow: '0 0 40px rgba(34,197,94,0.15)'
    }}>
      <h3 style={{ color: 'white', marginBottom: '8px' }}>
        Request from {selectedProvider.full_name}
      </h3>
      <textarea
        placeholder="Describe what you need..."
        value={requestDescription}
        onChange={(e) => setRequestDescription(e.target.value)}
        style={{
          width: '100%', height: '100px', padding: '10px',
          backgroundColor: '#0F172A', color: 'white',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
          fontSize: '14px', resize: 'none'
        }}
      />
      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        <button
          onClick={() => { setSelectedProvider(null); setRequestDescription(''); }}
          style={{
            flex: 1, padding: '10px', backgroundColor: '#0F172A',
            color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '20px', cursor: 'pointer'
          }}
        >
          Cancel
        </button>
        <button
          onClick={async () => {
            await createRequest({ provider_id: selectedProvider._id, description: requestDescription });
            setSelectedProvider(null);
            setRequestDescription('');
            alert('Request sent!');
          }}
          style={{
            flex: 1, padding: '10px',
            background: 'linear-gradient(to right, #22C55E, #4ADE80)',
            color: 'white', border: 'none',
            borderRadius: '20px', cursor: 'pointer', fontWeight: '600',
            boxShadow: '0 4px 15px rgba(34,197,94,0.3)'
          }}
        >
          Send Request
        </button>
      </div>
    </div>
  </div>
)}

    </>
  );
}
