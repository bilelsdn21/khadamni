import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import useAuth from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import api from '../api/axios';

// ─── Haversine distance (metres) ─────────────────────────────────────────────

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(m) {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}

// ─── Markers ─────────────────────────────────────────────────────────────────

const clientIcon = L.divIcon({
  className: '',
  html: `
    <div style="position:relative;width:20px;height:20px;">
      <div style="position:absolute;inset:0;background:#3B82F6;border-radius:50%;border:2px solid white;box-shadow:0 0 0 4px rgba(59,130,246,0.3);"></div>
      <div style="position:absolute;inset:-6px;border-radius:50%;background:rgba(59,130,246,0.15);animation:pulse-ring 2s ease-out infinite;"></div>
    </div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const providerIcon = L.divIcon({
  className: '',
  html: `
    <div style="position:relative;width:22px;height:22px;">
      <div style="position:absolute;inset:0;background:#22C55E;border-radius:50%;border:2px solid white;box-shadow:0 0 0 4px rgba(34,197,94,0.3);"></div>
      <div style="position:absolute;inset:-6px;border-radius:50%;background:rgba(34,197,94,0.15);animation:pulse-ring 2s ease-out infinite;"></div>
    </div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

// ─── Map auto-fit helper ──────────────────────────────────────────────────────

function FitBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length >= 2) {
      map.fitBounds(positions, { padding: [60, 60] });
    } else if (positions.length === 1) {
      map.setView(positions[0], 15);
    }
  }, [positions.map(p => p.join(',')).join('|')]);
  return null;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TrackingPage() {
  const { requestId } = useParams();
  const { user } = useAuth();
  const { theme } = useTheme();
  const isProvider = user?.role === 'provider';
  const tileUrl = theme === 'light'
    ? 'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png'
    : 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png';

  // Pre-seed provider position from their registered profile location so the
  // map shows something useful immediately while GPS is acquiring (or if
  // browser permission is denied).
  const profileLat = user?.provider_profile?.latitude;
  const profileLng = user?.provider_profile?.longitude;
  const profilePos = isProvider && profileLat && profileLng
    ? [profileLat, profileLng]
    : null;

  const [providerPos, setProviderPos] = useState(profilePos);
  const [clientPos, setClientPos]     = useState(null);
  const [routePoints, setRoutePoints] = useState([]);
  const [distance, setDistance]       = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [nearbyBanner, setNearbyBanner] = useState(false);
  const [otherName, setOtherName]     = useState('');
  const [gpsError, setGpsError]       = useState(false);

  // Stable refs — never cause effect re-runs
  const wsRef            = useRef(null);
  const lastSentRef      = useRef(0);
  const lastRouteFetchRef = useRef(null);
  const notifiedRef      = useRef(false);
  const watchIdRef       = useRef(null);
  const myPosRef         = useRef(null);
  // Keep latest user/role accessible inside effects without them as deps
  const isProviderRef    = useRef(isProvider);
  const userRef          = useRef(user);
  useEffect(() => { isProviderRef.current = isProvider; userRef.current = user; });

  // ── Fetch room info ───────────────────────────────────────────────────────
  useEffect(() => {
    api.get(`/chat/${requestId}`).then(res => {
      setOtherName(res.data.other_party_name || '');
    }).catch(() => {});
  }, [requestId]);

  // ── WebSocket (runs once per requestId) ──────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    let active = true;
    let ws = null;

    // setTimeout(0) defeats StrictMode double-invoke:
    // first cleanup fires before this runs → active=false → socket never created
    const timer = setTimeout(() => {
      if (!active) return;

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      ws = new WebSocket(
        `${protocol}//${window.location.host}/api/chat/ws/${requestId}?token=${token}`
      );
      wsRef.current = ws;

      ws.onopen = () => {
        if (!active) return;
        setIsConnected(true);
        if (myPosRef.current) {
          _send(ws, myPosRef.current.lat, myPosRef.current.lng);
        }
      };

      ws.onclose = () => { if (active) setIsConnected(false); };
      ws.onerror = () => { if (active) setIsConnected(false); };

      ws.onmessage = (event) => {
        if (!active) return;
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'provider_location') {
            setProviderPos([data.lat, data.lng]);
            if (data.provider_name) setOtherName(n => n || data.provider_name);
          }
          if (data.type === 'client_location') {
            setClientPos([data.lat, data.lng]);
          }
        } catch {}
      };
    }, 0);

    return () => {
      active = false;
      clearTimeout(timer);
      wsRef.current = null;
      if (ws) ws.close();
    };
  }, [requestId]);

  // ── GPS + fallback (runs once on mount) ──────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) {
      _applyFallback();
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;

        myPosRef.current = { lat, lng };

        if (isProviderRef.current) setProviderPos([lat, lng]);
        else setClientPos([lat, lng]);

        // Only send when WS is open; don't burn the throttle while connecting
        if (wsRef.current?.readyState !== WebSocket.OPEN) return;
        const now = Date.now();
        if (now - lastSentRef.current < 3000) return;
        _send(wsRef.current, lat, lng);
      },
      () => _applyFallback(),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );

    // Heartbeat: resend last known position every 4s so late-joining party always gets it.
    // watchPosition only fires when position changes — static DevTools coords fire once.
    const heartbeat = setInterval(() => {
      if (myPosRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
        _send(wsRef.current, myPosRef.current.lat, myPosRef.current.lng, false);
      }
    }, 4000);

    return () => {
      clearInterval(heartbeat);
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []); // empty — uses refs for user/role

  // ── Helpers (plain functions, not hooks — defined after effects is fine) ──

  function _send(ws, lat, lng, updateThrottle = true) {
    if (ws?.readyState !== WebSocket.OPEN) return;
    const u = userRef.current;
    if (isProviderRef.current) {
      ws.send(JSON.stringify({
        type: 'provider_location', lat, lng,
        provider_name: `${u?.first_name ?? ''} ${u?.last_name ?? ''}`.trim(),
      }));
    } else {
      ws.send(JSON.stringify({ type: 'client_location', lat, lng }));
    }
    if (updateThrottle) lastSentRef.current = Date.now();
  }

  function _applyFallback() {
    if (!isProviderRef.current) {
      // Client: use location stored when they used the Map page
      try {
        const stored = localStorage.getItem('client_location');
        if (stored) {
          const [lat, lng] = JSON.parse(stored);
          myPosRef.current = { lat, lng };
          setClientPos([lat, lng]);
          _send(wsRef.current, lat, lng);
          return;
        }
      } catch {}
      setGpsError(true);
      return;
    }

    // Provider: fall back to their registered profile location so the map
    // still shows something useful while GPS permission is being resolved.
    const u = userRef.current;
    const lat = u?.provider_profile?.latitude;
    const lng = u?.provider_profile?.longitude;
    if (lat && lng) {
      myPosRef.current = { lat, lng };
      setProviderPos([lat, lng]);
      _send(wsRef.current, lat, lng);
      // Don't setGpsError — the map works, we're just using a static pin.
      return;
    }

    setGpsError(true);
  }

  // ── OSRM route — re-fetch at most every 5s, always on position change ────
  useEffect(() => {
    if (!providerPos || !clientPos) return;
    const [pLat, pLng] = providerPos;
    const [cLat, cLng] = clientPos;

    const now = Date.now();
    if (lastRouteFetchRef.current && now - lastRouteFetchRef.current < 5000) return;
    lastRouteFetchRef.current = now;

    api.get('/providers/route', { params: { slat: pLat, slng: pLng, elat: cLat, elng: cLng } })
      .then(res => {
        const coords = res.data?.routes?.[0]?.geometry?.coordinates;
        if (coords) setRoutePoints(coords.map(([lng, lat]) => [lat, lng]));
      })
      .catch(() => {});
  }, [providerPos, clientPos]);

  // ── Distance + proximity notification ────────────────────────────────────
  useEffect(() => {
    if (!providerPos || !clientPos) return;
    const d = haversine(providerPos[0], providerPos[1], clientPos[0], clientPos[1]);
    setDistance(d);
    if (d < 500 && !notifiedRef.current && !isProviderRef.current) {
      notifiedRef.current = true;
      setNearbyBanner(true);
    }
  }, [providerPos, clientPos]);

  const defaultCenter = clientPos || providerPos || [36.737232, 3.086472];
  const fitPositions  = [providerPos, clientPos].filter(Boolean);

  return (
    <div className="relative w-full h-screen bg-[#0F172A] overflow-hidden">

      {/* ── Proximity banner ── */}
      {nearbyBanner && (
        <div className="absolute top-0 left-0 right-0 z-[2000] bg-[#22C55E] px-4 py-3 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <span className="text-xl">📍</span>
            <span className="text-white font-semibold text-sm">
              {otherName || 'Your provider'} is nearby!
            </span>
          </div>
          <button onClick={() => setNearbyBanner(false)} className="text-white/80 hover:text-white text-lg leading-none">×</button>
        </div>
      )}

      {/* ── Top bar ── */}
      <div
        className="absolute left-0 right-0 z-[1000] p-4 flex items-center gap-3 pointer-events-none"
        style={{ top: nearbyBanner ? '48px' : '0' }}
      >
        <Link
          to="/requests"
          className="pointer-events-auto w-10 h-10 rounded-[20px] bg-[#1E293B]/90 backdrop-blur-md border border-white/10 shadow-lg flex items-center justify-center text-white hover:bg-[#22C55E] transition-all duration-300"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>

        <div className="pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-[20px] bg-[#1E293B]/90 backdrop-blur-md border border-white/10 shadow-lg">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#22C55E] animate-pulse' : 'bg-white/20'}`} />
          <span className="text-white/80 text-sm font-medium">
            {isProvider ? 'Sharing your location' : `Tracking ${otherName || 'provider'}`}
          </span>
        </div>

        {distance !== null && (
          <div className="pointer-events-auto ml-auto px-4 py-2 rounded-[20px] bg-[#1E293B]/90 backdrop-blur-md border border-white/10 shadow-lg">
            <span className="text-[#4ADE80] text-sm font-semibold">{formatDistance(distance)}</span>
            <span className="text-white/40 text-xs ml-1">away</span>
          </div>
        )}
      </div>

      {/* ── GPS error ── */}
      {gpsError && (
        <div className="absolute inset-0 z-[500] flex items-center justify-center pointer-events-none">
          <div className="bg-[#1E293B]/90 backdrop-blur-md border border-red-500/30 rounded-[20px] px-6 py-5 text-center shadow-xl max-w-xs">
            <p className="text-2xl mb-2">📍</p>
            <p className="text-white font-semibold text-sm mb-1">Location unavailable</p>
            <p className="text-white/50 text-xs">
              {isProvider
                ? 'Allow location access in your browser settings and reload.'
                : 'Go to the Map page to set your location first, then come back.'}
            </p>
          </div>
        </div>
      )}

      {/* ── Waiting for MY own GPS fix (only shows when no profile fallback) ── */}
      {!gpsError && (isProvider ? !providerPos : !clientPos) && (
        <div className="absolute inset-0 z-[500] flex items-center justify-center pointer-events-none">
          <div className="bg-[#1E293B]/90 backdrop-blur-md border border-white/10 rounded-[20px] px-6 py-4 text-center shadow-xl">
            <div className="w-8 h-8 border-2 border-[#22C55E] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-white/80 text-sm font-medium">Getting GPS signal...</p>
            <p className="text-white/30 text-xs mt-2">Allow location access if prompted · may take a few seconds</p>
          </div>
        </div>
      )}

      {/* ── Waiting for OTHER party (non-blocking chip) ── */}
      {!gpsError && (isProvider ? !!providerPos && !clientPos : !!clientPos && !providerPos) && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[500] pointer-events-none">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#1E293B]/90 backdrop-blur-md border border-white/10 shadow-lg">
            <div className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
            <span className="text-white/60 text-xs">
              Waiting for {isProvider ? 'client' : 'provider'} location...
            </span>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-6 left-4 z-[1000] flex flex-col gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1E293B]/90 backdrop-blur-md border border-white/10">
          <div className="w-3 h-3 rounded-full bg-[#22C55E] border border-white" />
          <span className="text-white/60 text-xs">{isProvider ? 'You' : otherName || 'Provider'}</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1E293B]/90 backdrop-blur-md border border-white/10">
          <div className="w-3 h-3 rounded-full bg-[#3B82F6] border border-white" />
          <span className="text-white/60 text-xs">{isProvider ? otherName || 'Client' : 'You'}</span>
        </div>
      </div>

      {/* ── Map ── */}
      <MapContainer
        center={defaultCenter}
        zoom={14}
        style={{ height: '100vh', width: '100%' }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer url={tileUrl} />
        <FitBounds positions={fitPositions} />

        {routePoints.length > 0 && (
          <Polyline positions={routePoints} pathOptions={{ color: '#22C55E', weight: 4, opacity: 0.8 }} />
        )}
        {providerPos && <Marker position={providerPos} icon={providerIcon} />}
        {clientPos    && <Marker position={clientPos}   icon={clientIcon}   />}
      </MapContainer>
    </div>
  );
}
