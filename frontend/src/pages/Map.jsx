import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import api from '../api/axios';
import { createRequest, getMyRequests } from '../api/request';
import SideDrawer from '../components/SideDrawer';
import NotificationBell from '../components/NotificationBell';
import ThemeToggle from '../components/ThemeToggle';
import useAuth from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
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

  // Remote-specific categories
  if (s.includes('graphic') || s.includes('design')) return 'https://img.icons8.com/color/48/design.png';
  if (s.includes('translat')) return 'https://img.icons8.com/color/48/translation.png';
  if (s.includes('web') || s.includes('develop')) return 'https://img.icons8.com/color/48/code.png';
  if (s.includes('video')) return 'https://img.icons8.com/color/48/video-editing.png';
  if (s.includes('data')) return 'https://img.icons8.com/color/48/data-sheet.png';

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
  // Remote-specific
  { name: 'Graphic Design', icon: 'https://img.icons8.com/color/48/design.png', color: '#EC4899' },
  { name: 'Translation', icon: 'https://img.icons8.com/color/48/translation.png', color: '#0EA5E9' },
  { name: 'Web Development', icon: 'https://img.icons8.com/color/48/code.png', color: '#6366F1' },
  { name: 'Video Editing', icon: 'https://img.icons8.com/color/48/video-editing.png', color: '#EF4444' },
  { name: 'Data Entry', icon: 'https://img.icons8.com/color/48/data-sheet.png', color: '#64748B' },
];

const createProviderIcon = (provider) => {
  const serviceName = (provider.service_categories && provider.service_categories.length > 0)
    ? provider.service_categories[0]
    : 'Service';

  const iconUrl = getServiceIconUrl(serviceName);
  const isAvailable = provider.is_available !== false;
  const dotColor = isAvailable ? '#22C55E' : '#94A3B8';
  const dotShadow = isAvailable ? '0 0 6px rgba(34,197,94,0.9)' : 'none';

  const htmlString = `
    <div class="group flex flex-col items-center justify-center -mt-8 cursor-pointer relative z-10 w-24 h-24">
      <div class="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-[0_8px_16px_rgba(0,0,0,0.6)] transition-transform duration-300 transform group-hover:scale-110 group-hover:-translate-y-1 z-20 border-[3px] border-white relative overflow-hidden group-hover:shadow-[0_4px_25px_rgba(255,255,255,0.4)]">
        <img src="${iconUrl}" alt="${serviceName}" class="w-8 h-8 object-contain" />
        <div style="position:absolute;bottom:1px;right:1px;width:10px;height:10px;border-radius:50%;background:${dotColor};border:2px solid white;box-shadow:${dotShadow};"></div>
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
  const { theme } = useTheme();
  const isProvider = user?.role === 'provider';
  const isClient = user?.role === 'client';
  const isRemoteProvider = isProvider && user?.provider_profile?.job_type === 'remote';
  const tileUrl = theme === 'light'
    ? 'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png'
    : 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png';
  const providerHasLocation = isProvider && user?.provider_profile?.latitude && user?.provider_profile?.longitude;
  const [providers, setProviders] = useState([]);
  const savedClientLocation = (() => {
    try { const s = localStorage.getItem('client_location'); return s ? JSON.parse(s) : null; } catch { return null; }
  })();
  const [userLocation, setUserLocation] = useState(
    providerHasLocation
      ? [user.provider_profile.latitude, user.provider_profile.longitude]
      : savedClientLocation || [36.737232, 3.086472]
  );
  const [locationConfirmed, setLocationConfirmed] = useState(isProvider || !!savedClientLocation);
  const [pickingLocation, setPickingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [pendingLocation, setPendingLocation] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [requestDescription, setRequestDescription] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [pendingProviderIds, setPendingProviderIds] = useState(new Set());
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [categoryPanelOpen, setCategoryPanelOpen] = useState(false);
  const [viewMode, setViewMode] = useState('in_place'); // 'in_place' | 'remote'
  const [remoteProviders, setRemoteProviders] = useState([]);
  const [loadingRemote, setLoadingRemote] = useState(false);
  const [remoteSearch, setRemoteSearch] = useState('');
  const [providerPage, setProviderPage] = useState(1);
  const [providerTotal, setProviderTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [recentSearches, setRecentSearches] = useState(() => {
    const saved = localStorage.getItem('recent_map_searches');
    return saved ? JSON.parse(saved) : [];
  });
  const [isSearching, setIsSearching] = useState(false);
  const [locationSearchResults, setLocationSearchResults] = useState([]);
  // AI search bar (clients only) — state is persisted in sessionStorage so
  // navigating to a provider profile and coming back restores the suggestions.
  const [aiOpen, setAiOpen] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [aiRemoteSuggestions, setAiRemoteSuggestions] = useState([]);
  const [aiStep, setAiStep] = useState(null); // null | 'analyzing' | 'finding' | 'done'
  const [aiPlatformPrices, setAiPlatformPrices] = useState(null); // { min, max, avg }
  const [recentAiSearches, setRecentAiSearches] = useState(() => {
    try { return JSON.parse(localStorage.getItem('recent_ai_searches') || '[]'); } catch { return []; }
  });

  const REMOTE_CATEGORIES = new Set(['IT Support', 'Tutoring', 'Cooking', 'Delivery', 'Graphic Design', 'Translation', 'Web Development', 'Video Editing', 'Data Entry', 'Other']);
  const AI_EXAMPLE_QUERIES = [
    { emoji: '🚿', text: 'My shower is leaking and needs fixing' },
    { emoji: '💡', text: 'Need an electrician for wiring installation' },
    { emoji: '🖥️', text: 'Laptop not turning on, need IT help' },
    { emoji: '🏠', text: 'Deep cleaning for a 3-room apartment' },
  ];
  const [overlayQuery, setOverlayQuery] = useState('');
  const [overlayResults, setOverlayResults] = useState([]);
  const [overlayPicked, setOverlayPicked] = useState(null);
  const [overlayMapTarget, setOverlayMapTarget] = useState([36.737232, 3.086472]);

  // ── Remote Hub state (only used when isRemoteProvider) ──────────────────────
  const [hubAvailable, setHubAvailable] = useState(user?.provider_profile?.is_available ?? true);
  const [hubRequests, setHubRequests] = useState([]);
  const [toggling, setToggling] = useState(false);

  const handleOverlaySearch = (val) => {
    setOverlayQuery(val);
    if (val.length < 2) { setOverlayResults([]); return; }
    clearTimeout(window._overlaySearchTimer);
    window._overlaySearchTimer = setTimeout(async () => {
      try {
        const res = await api.get(`/providers/geocode?q=${encodeURIComponent(val)}`);
        setOverlayResults(res.data);
      } catch (err) {
        console.error(err);
      }
    }, 400);
  };

  // Persist recent AI searches to localStorage
  useEffect(() => {
    localStorage.setItem('recent_ai_searches', JSON.stringify(recentAiSearches.slice(0, 5)));
  }, [recentAiSearches]);

  // Restore AI panel state when returning from a provider profile page
  useEffect(() => {
    if (!isClient) return;
    try {
      const saved = sessionStorage.getItem('ai_panel_state');
      if (!saved) return;
      const { query, result, suggestions, remoteSuggestions, platformPrices } = JSON.parse(saved);
      sessionStorage.removeItem('ai_panel_state');
      setAiOpen(true);
      setAiQuery(query || '');
      setAiResult(result || null);
      setAiSuggestions(suggestions || []);
      setAiRemoteSuggestions(remoteSuggestions || []);
      setAiPlatformPrices(platformPrices || null);
      if (result) setAiStep('done');
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    localStorage.setItem('recent_map_searches', JSON.stringify(recentSearches.slice(0, 5)));
  }, [recentSearches]);

  const loadProviders = async (category = 'All', page = 1, append = false) => {
    try {
      const params = new URLSearchParams({ page, per_page: 30 });
      if (category !== 'All') params.set('category', category);
      const res = await api.get(`/providers/all_providers?${params}`);
      const { providers: list, total } = res.data;
      setProviders(prev => append ? [...prev, ...list] : list);
      setProviderTotal(total);
      setProviderPage(page);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadProviders(categoryFilter, 1, false);
  }, [categoryFilter]);

  useEffect(() => {
    if (viewMode !== 'remote' || isProvider) return;
    setLoadingRemote(true);
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      if (categoryFilter !== 'All') params.set('category', categoryFilter);
      if (remoteSearch.trim()) params.set('search', remoteSearch.trim());
      const qs = params.toString();
      api.get(`/providers/remote${qs ? `?${qs}` : ''}`)
        .then(res => setRemoteProviders(res.data))
        .catch(() => {})
        .finally(() => setLoadingRemote(false));
    }, remoteSearch ? 350 : 0);
    return () => clearTimeout(timer);
  }, [viewMode, categoryFilter, remoteSearch]);

  useEffect(() => {
    if (isProvider) return;
    getMyRequests().then(res => {
      const ids = new Set(
        res.data
          .filter(r => r.status === 'pending')
          .map(r => r.provider_id)
      );
      setPendingProviderIds(ids);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isRemoteProvider) return;
    const fetch = () => getMyRequests().then(res => setHubRequests(res.data)).catch(() => {});
    fetch();
    const interval = setInterval(fetch, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectPlace = (place) => {
    const loc = [parseFloat(place.lat), parseFloat(place.lon)];
    setPendingLocation(loc);
    setSearchQuery(place.display_name.split(',').slice(0, 2).join(','));
    setSuggestionsOpen(false);
    setLocationSearchResults([]);
  };

  // Debounced search for DB + Nominatim places
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      setLocationSearchResults([]);
      return;
    }
    setSuggestionsOpen(true);
    setIsSearching(true);
    const counter = setTimeout(async () => {
      try {
        const [providerRes, placeRes] = await Promise.all([
          api.get(`/providers/all_providers?search=${searchQuery}&include_offline=true`).catch(() => ({ data: [] })),
          fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=3`).then(r => r.json()).catch(() => []),
        ]);
        setSearchResults(providerRes.data?.providers || providerRes.data || []);
        setLocationSearchResults(placeRes);
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


  const handleSendRequest = async () => {
    if (!requestDescription.trim()) return;
    setSending(true);
    try {
      await createRequest({ provider_id: selectedProvider._id, description: requestDescription });
      setPendingProviderIds(prev => new Set([...prev, selectedProvider._id]));
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

  const _haversine = (lat1, lng1, lat2, lng2) => {
    const R = 6371000;
    const toRad = d => d * Math.PI / 180;
    const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  const _nameGrad = (name) => {
    const colors = ['#22C55E,#16A34A','#3B82F6,#1D4ED8','#F59E0B,#D97706','#EC4899,#BE185D','#8B5CF6,#6D28D9','#EF4444,#B91C1C','#06B6D4,#0E7490'];
    let h = 0; for (let i = 0; i < (name||'').length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
    return `linear-gradient(135deg,${colors[h % colors.length]})`;
  };

  const handleAiSearch = async (queryOverride) => {
    const q = (queryOverride ?? aiQuery).trim();
    if (!q) return;
    if (queryOverride) setAiQuery(queryOverride);
    setAiLoading(true);
    setAiStep('analyzing');
    setAiSuggestions([]);
    setAiRemoteSuggestions([]);
    setAiPlatformPrices(null);
    try {
      const res = await api.post('/ai/analyze-request', { description: q });
      setAiResult(res.data);
      setAiStep('finding');
      const category = res.data.category;
      if (category) setCategoryFilter(category);
      if (res.data.structured_description) setRequestDescription(res.data.structured_description);

      if (!category) { setAiStep('done'); return; }

      // Save to recent searches
      setRecentAiSearches(prev => {
        const filtered = prev.filter(s => s.query !== q);
        return [{ query: q, category }, ...filtered].slice(0, 5);
      });

      // Get client location
      let clientLat = null, clientLng = null;
      try {
        const stored = localStorage.getItem('client_location');
        if (stored) { const [la, ln] = JSON.parse(stored); clientLat = la; clientLng = ln; }
      } catch {}

      // ── Parallel: providers + real platform prices ──
      const [provRes, remoteRes, priceRes] = await Promise.all([
        api.get(`/providers/all_providers?category=${encodeURIComponent(category)}&per_page=50`).catch(() => ({ data: [] })),
        REMOTE_CATEGORIES.has(category)
          ? api.get(`/providers/remote?category=${encodeURIComponent(category)}`).catch(() => ({ data: [] }))
          : Promise.resolve({ data: [] }),
        api.get(`/ai/price-stats/${encodeURIComponent(category)}`).catch(() => null),
      ]);

      if (priceRes?.data?.available && priceRes.data.min != null) setAiPlatformPrices(priceRes.data);

      // ── In-place providers — top 5 by distance (60%) + quality (40%) ──
      const inPlaceList = provRes.data?.providers || provRes.data || [];
      const scored = inPlaceList
        .filter(p => p.is_available !== false && p.latitude && p.longitude)
        .map(p => {
          const dist = clientLat != null ? _haversine(clientLat, clientLng, p.latitude, p.longitude) : null;
          const distScore = dist != null ? Math.max(0, 1 - dist / 20000) : 0.5;
          const qualityScore = ((p.avg_rating || 0) / 5) * 0.7 + Math.min((p.total_jobs || 0) / 50, 1) * 0.3;
          return { ...p, _dist: dist, _score: distScore * 0.6 + qualityScore * 0.4, _remote: false };
        })
        .sort((a, b) => b._score - a._score)
        .slice(0, 5);
      setAiSuggestions(scored);

      // ── Remote providers — top 5 by quality ──
      const remoteList = Array.isArray(remoteRes.data) ? remoteRes.data : [];
      const scoredRemote = remoteList
        .filter(p => p.is_available !== false)
        .map(p => {
          const qualityScore = ((p.avg_rating || 0) / 5) * 0.7 + Math.min((p.total_jobs || 0) / 50, 1) * 0.3;
          return { ...p, _dist: null, _score: qualityScore, _remote: true };
        })
        .sort((a, b) => b._score - a._score)
        .slice(0, 5);
      setAiRemoteSuggestions(scoredRemote);

      setAiStep('done');
    } catch (err) {
      console.error('AI search failed:', err);
      setAiStep(null);
    } finally {
      setAiLoading(false);
    }
  };

  // ── Remote Provider Hub ───────────────────────────────────────────────────────
  if (isRemoteProvider) {
    const activeRequests = hubRequests.filter(r => ['pending', 'in_progress', 'confirmed'].includes(r.status));
    const statusMap = {
      pending:     { label: 'Pending',     color: '#F59E0B' },
      in_progress: { label: 'In Progress', color: '#22C55E' },
      confirmed:   { label: 'Confirmed',   color: '#3B82F6' },
    };

    return (
      <div className="min-h-screen bg-[#0F172A]">
        <SideDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

        {/* Top bar */}
        <div className="sticky top-0 z-50 bg-[#0F172A]/95 backdrop-blur-md border-b border-white/5 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setDrawerOpen(true)}
            className="w-9 h-9 rounded-[16px] bg-[#1E293B] border border-white/10 flex items-center justify-center text-white hover:bg-[#22C55E] transition-all duration-300"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <NotificationBell />
          <ThemeToggle />
          <div className="ml-1">
            <h1 className="text-white font-bold text-base leading-tight">Remote Hub</h1>
            <p className="text-white/40 text-[11px]">Your remote workspace</p>
          </div>
        </div>

        <div className="px-4 py-6 max-w-2xl mx-auto flex flex-col gap-5">

          {/* Availability toggle card */}
          <div className={`rounded-[24px] border p-6 transition-all duration-500 ${hubAvailable ? 'bg-[#22C55E]/5 border-[#22C55E]/30 shadow-[0_0_40px_rgba(34,197,94,0.06)]' : 'bg-[#1E293B] border-white/10'}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${hubAvailable ? 'bg-[#22C55E] shadow-[0_0_8px_rgba(34,197,94,0.8)]' : 'bg-white/20'}`} />
                  <span className={`text-sm font-bold ${hubAvailable ? 'text-[#4ADE80]' : 'text-white/40'}`}>
                    {hubAvailable ? 'Available for work' : 'Offline'}
                  </span>
                </div>
                <p className="text-white/40 text-xs">
                  {hubAvailable ? 'Clients can find and request you' : 'You are hidden from clients'}
                </p>
              </div>
              <button
                onClick={async () => {
                  setToggling(true);
                  try {
                    const res = await api.post('/providers/toggle-availability');
                    setHubAvailable(res.data.is_available);
                  } catch {}
                  setToggling(false);
                }}
                disabled={toggling}
                className={`relative w-14 h-7 rounded-full transition-all duration-300 focus:outline-none ${hubAvailable ? 'bg-[#22C55E]' : 'bg-white/10'}`}
              >
                <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 ${hubAvailable ? 'left-[calc(100%-26px)]' : 'left-0.5'}`} />
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Rating',    value: (user?.provider_profile?.rating_avg || 0).toFixed(1), sub: `${user?.provider_profile?.rating_count || 0} reviews`, icon: '⭐' },
              { label: 'Jobs Done', value: user?.provider_profile?.total_jobs || 0,               sub: 'completed',                                             icon: '✓'  },
              { label: 'Active',    value: activeRequests.length,                                 sub: 'requests',                                              icon: '💬' },
            ].map(stat => (
              <div key={stat.label} className="bg-[#1E293B] border border-white/8 rounded-[16px] p-4 text-center">
                <div className="text-lg mb-1">{stat.icon}</div>
                <div className="text-white font-bold text-xl">{stat.value}</div>
                <div className="text-white/40 text-[10px] uppercase tracking-wider mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Services */}
          <div className="bg-[#1E293B] border border-white/8 rounded-[20px] p-4">
            <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold mb-3">Your Services</p>
            <div className="flex flex-wrap gap-2">
              {(user?.provider_profile?.service_categories || []).map(cat => (
                <span key={cat} className="px-3 py-1 rounded-full bg-[#6366F1]/15 border border-[#6366F1]/30 text-[#818CF8] text-xs font-medium">
                  {cat}
                </span>
              ))}
            </div>
          </div>

          {/* Active requests feed */}
          <div>
            <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold mb-3">Active Requests</p>
            {activeRequests.length === 0 ? (
              <div className="bg-[#1E293B] border border-white/8 rounded-[20px] p-8 text-center">
                <div className="text-3xl mb-2">📭</div>
                <p className="text-white/40 text-sm">No active requests</p>
                <p className="text-white/25 text-xs mt-1">When clients request your service, they'll appear here</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {activeRequests.map(r => {
                  const s = statusMap[r.status] || statusMap.pending;
                  return (
                    <div key={r._id} className="bg-[#1E293B] border border-white/8 rounded-[20px] p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#0F172A] flex items-center justify-center text-white/60 font-bold text-sm shrink-0">
                        {r.client_name?.charAt(0) || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-sm truncate">{r.client_name}</p>
                        <p className="text-white/40 text-xs truncate mt-0.5">{r.description}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ color: s.color, background: `${s.color}15`, border: `1px solid ${s.color}40` }}
                        >
                          {s.label}
                        </span>
                        <Link
                          to={`/chat/${r._id}`}
                          className="px-3 py-1.5 rounded-[12px] bg-[#6366F1]/20 border border-[#6366F1]/40 text-[#818CF8] text-xs font-semibold hover:bg-[#6366F1]/30 transition-all duration-200"
                        >
                          Chat
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    );
  }

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
            padding: '28px', width: '460px', maxWidth: '95vw',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 0 60px rgba(34,197,94,0.1)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>📍</div>
              <div style={{ color: 'white', fontWeight: '700', fontSize: '18px', marginBottom: '4px' }}>
                Where are you?
              </div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px' }}>
                Search or click on the map to set your location
              </div>
            </div>

            {/* Use current location button */}
            <button
              onClick={() => {
                if (!navigator.geolocation) return;
                navigator.geolocation.getCurrentPosition(
                  (pos) => {
                    const loc = [pos.coords.latitude, pos.coords.longitude];
                    setOverlayPicked(loc);
                    setOverlayMapTarget(loc);
                    setOverlayQuery('');
                  },
                  () => alert('Could not get your location. Please allow location access.')
                );
              }}
              style={{
                width: '100%', padding: '10px', marginBottom: '12px',
                background: 'rgba(59,130,246,0.15)',
                color: '#60A5FA',
                border: '1px solid rgba(59,130,246,0.3)', borderRadius: '20px',
                fontWeight: '600', fontSize: '13px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.25)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(59,130,246,0.15)'}
            >
              <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2a10 10 0 100 20A10 10 0 0012 2zm0 0v4m0 12v4M2 12h4m12 0h4" />
              </svg>
              Use my current location
            </button>

            {/* Search input */}
            <div style={{ position: 'relative', marginBottom: '8px' }}>
              <input
                type="text"
                placeholder="Search city or address..."
                value={overlayQuery}
                onChange={(e) => handleOverlaySearch(e.target.value)}
                style={{
                  width: '100%', padding: '12px 16px', boxSizing: 'border-box',
                  backgroundColor: '#0F172A', color: 'white',
                  border: '1px solid rgba(255,255,255,0.15)', borderRadius: '20px',
                  fontSize: '14px', outline: 'none',
                }}
              />
              {overlayResults.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 9999,
                  backgroundColor: '#0F172A', borderRadius: '12px',
                  marginTop: '4px', border: '1px solid rgba(255,255,255,0.08)',
                  maxHeight: '160px', overflowY: 'auto',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
                }}>
                  {overlayResults.map((r) => (
                    <div
                      key={r.place_id}
                      onClick={() => {
                        const loc = [parseFloat(r.lat), parseFloat(r.lon)];
                        setOverlayPicked(loc);
                        setOverlayMapTarget(loc);
                        setOverlayQuery(r.display_name.split(',').slice(0, 2).join(','));
                        setOverlayResults([]);
                      }}
                      style={{
                        padding: '10px 14px', color: 'rgba(255,255,255,0.8)',
                        cursor: 'pointer', fontSize: '13px',
                        borderBottom: '1px solid rgba(255,255,255,0.05)'
                      }}
                    >
                      {r.display_name.split(',').slice(0, 3).join(',')}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Mini map */}
            <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '12px' }}>
              <MapContainer center={overlayMapTarget} zoom={12} style={{ height: '240px', width: '100%' }} zoomControl={false}>
                <TileLayer url={tileUrl} />
                <FlyToLocation position={overlayMapTarget} />
                <LocationPicker onLocationSet={(loc) => {
                  setOverlayPicked(loc);
                  setOverlayMapTarget(loc);
                  setOverlayQuery('');
                }} />
                {overlayPicked && <Marker position={overlayPicked} />}
              </MapContainer>
            </div>

            <button
              disabled={!overlayPicked}
              onClick={() => {
                setUserLocation(overlayPicked);
                setLocationConfirmed(true);
                localStorage.setItem('client_location', JSON.stringify(overlayPicked));
              }}
              style={{
                width: '100%', padding: '12px',
                background: overlayPicked
                  ? 'linear-gradient(to right, #22C55E, #4ADE80)'
                  : 'rgba(255,255,255,0.1)',
                color: overlayPicked ? 'white' : 'rgba(255,255,255,0.3)',
                border: 'none', borderRadius: '20px',
                fontWeight: '600', fontSize: '14px',
                cursor: overlayPicked ? 'pointer' : 'not-allowed',
                boxShadow: overlayPicked ? '0 4px 15px rgba(34,197,94,0.3)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              {overlayPicked ? '✅ Confirm location' : 'Select a location first'}
            </button>
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
              <NotificationBell />
              <ThemeToggle />
              {/* AI magic wand button — clients only */}
              {isClient && (
                <button
                  onClick={() => {
                    if (aiOpen) {
                      // Closing — clear everything
                      setAiOpen(false);
                      setAiResult(null);
                      setAiQuery('');
                      setAiSuggestions([]);
                      setAiRemoteSuggestions([]);
                      setAiStep(null);
                      setAiPlatformPrices(null);
                      sessionStorage.removeItem('ai_panel_state');
                    } else {
                      setAiOpen(true);
                    }
                  }}
                  title="Describe what you need — AI will find the right category"
                  className={`w-10 h-10 rounded-[20px] backdrop-blur-md border shadow-lg flex items-center justify-center transition-all duration-300 text-base ${aiOpen ? 'bg-[#22C55E] border-[#22C55E] text-white' : 'bg-[#1E293B]/90 border-white/10 text-white/60 hover:text-[#22C55E] hover:border-[#22C55E]/40'}`}
                >
                  ✨
                </button>
              )}
              {!isProvider && (
                <div className="flex items-center bg-[#1E293B]/90 backdrop-blur-md border border-white/10 rounded-[20px] p-1 shadow-lg">
                  <button
                    onClick={() => { setViewMode('in_place'); setRemoteSearch(''); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[16px] text-xs font-semibold transition-all duration-200 ${viewMode === 'in_place' ? 'bg-[#22C55E] text-white shadow-sm' : 'text-white/50 hover:text-white'}`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    In-Place
                  </button>
                  <button
                    onClick={() => setViewMode('remote')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[16px] text-xs font-semibold transition-all duration-200 ${viewMode === 'remote' ? 'bg-[#6366F1] text-white shadow-sm' : 'text-white/50 hover:text-white'}`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
                    </svg>
                    Remote
                  </button>
                </div>
              )}
              {!isProvider && (
                <button
                  onClick={() => {
                    localStorage.removeItem('client_location');
                    setLocationConfirmed(false);
                    setOverlayPicked(null);
                    setOverlayQuery('');
                  }}
                  title="Reset my location"
                  className="ml-auto w-10 h-10 rounded-[20px] bg-[#1E293B]/90 backdrop-blur-md border border-white/10 shadow-lg flex items-center justify-center text-white/60 hover:text-[#22C55E] hover:border-[#22C55E]/40 transition-all duration-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              )}
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

                  {/* LOCATIONS SECTION */}
                  {locationSearchResults.length > 0 && (
                    <div className="py-2 border-b border-white/5">
                      <div className="px-4 py-2 text-[10px] uppercase tracking-widest text-[#22C55E] font-bold">Locations</div>
                      {locationSearchResults.map((place) => (
                        <button
                          key={place.place_id}
                          onClick={() => handleSelectPlace(place)}
                          className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/[0.05] group transition-all duration-200 text-left border-l-2 border-transparent hover:border-[#22C55E]"
                        >
                          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 group-hover:bg-[#22C55E]/10 group-hover:text-[#22C55E] transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <div className="text-sm text-white font-medium truncate">{place.display_name.split(',').slice(0, 2).join(',')}</div>
                            <div className="text-[11px] text-white/40 truncate">{place.display_name.split(',').slice(2, 4).join(',')}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

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

        {/* AI SEARCH PANEL — clients only, visible when aiOpen */}
        {isClient && aiOpen && (
          <div className="pointer-events-auto w-full max-w-md">
            <div className="bg-[#1E293B]/95 backdrop-blur-md border border-[#22C55E]/30 rounded-[20px] shadow-2xl overflow-hidden">
              {/* Input row */}
              <div className="flex items-center gap-2 px-4 py-3">
                <span className="text-base">✨</span>
                <input
                  type="text"
                  value={aiQuery}
                  onChange={e => setAiQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAiSearch()}
                  placeholder="Describe what you need in any language..."
                  className="flex-1 bg-transparent text-white placeholder-white/40 text-sm outline-none"
                  autoFocus
                />
                {aiQuery && (
                  <button onClick={() => setAiQuery('')} className="text-white/30 hover:text-white/60 text-lg leading-none">×</button>
                )}
                <button
                  onClick={() => handleAiSearch()}
                  disabled={aiLoading || !aiQuery.trim()}
                  className="w-8 h-8 rounded-full bg-[#22C55E] flex items-center justify-center text-white disabled:opacity-40 transition-opacity flex-shrink-0"
                >
                  {aiLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Example queries — shown when no result yet */}
              {!aiResult && !aiLoading && (
                <div className="px-4 pb-3 space-y-2">
                  <p className="text-white/30 text-[10px] uppercase tracking-wider font-semibold">Try asking</p>
                  <div className="flex flex-wrap gap-1.5">
                    {AI_EXAMPLE_QUERIES.map((ex, i) => (
                      <button
                        key={i}
                        onClick={() => handleAiSearch(ex.text)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/60 text-[11px] hover:bg-white/10 hover:text-white/80 transition-all"
                      >
                        <span>{ex.emoji}</span>
                        <span className="truncate max-w-[160px]">{ex.text}</span>
                      </button>
                    ))}
                  </div>
                  {/* Recent searches */}
                  {recentAiSearches.length > 0 && (
                    <div className="pt-1">
                      <p className="text-white/30 text-[10px] uppercase tracking-wider font-semibold mb-1.5">Recent</p>
                      <div className="flex flex-wrap gap-1.5">
                        {recentAiSearches.map((s, i) => (
                          <button
                            key={i}
                            onClick={() => handleAiSearch(s.query)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#4ADE80] text-[11px] hover:bg-[#22C55E]/20 transition-all"
                          >
                            <span className="text-[10px]">🕐</span>
                            <span className="truncate max-w-[160px]">{s.query}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Multi-step loading display */}
              {aiLoading && (
                <div className="border-t border-white/5 px-4 py-4 space-y-2">
                  {[
                    { key: 'analyzing', label: 'Analyzing your request with AI...', done: aiStep === 'finding' || aiStep === 'done' },
                    { key: 'finding',   label: 'Finding best providers near you...', done: aiStep === 'done' },
                  ].map((step, i) => {
                    const active = aiStep === step.key;
                    const pending = !active && !step.done;
                    return (
                      <div key={i} className="flex items-center gap-2">
                        {step.done ? (
                          <div className="w-4 h-4 rounded-full bg-[#22C55E] flex items-center justify-center flex-shrink-0">
                            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        ) : active ? (
                          <div className="w-4 h-4 border-2 border-[#22C55E] border-t-transparent rounded-full animate-spin flex-shrink-0" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-white/20 flex-shrink-0" />
                        )}
                        <span className={`text-xs ${step.done ? 'text-[#4ADE80]' : active ? 'text-white' : 'text-white/30'}`}>{step.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Result card */}
              {aiResult && !aiLoading && (
                <div className="border-t border-[#22C55E]/20 px-4 py-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[#4ADE80] text-xs font-semibold">✓ AI understood your request</span>
                    <button
                      onClick={() => { setAiResult(null); setAiSuggestions([]); setAiRemoteSuggestions([]); setAiPlatformPrices(null); setAiStep(null); }}
                      className="text-white/30 hover:text-white/60 text-lg leading-none"
                    >×</button>
                  </div>
                  <div className="flex items-center gap-2 text-sm flex-wrap">
                    <span className="text-white/50">Category:</span>
                    <span className="text-white font-semibold">{aiResult.category}</span>
                    <span className="text-white/20">·</span>
                    <span className={`text-xs font-semibold ${aiResult.urgency === 'high' ? 'text-red-400' : aiResult.urgency === 'medium' ? 'text-yellow-400' : 'text-green-400'}`}>
                      {aiResult.urgency} urgency
                    </span>
                  </div>

                  {/* Price box: AI estimate + real platform prices */}
                  {(aiResult.price_min && aiResult.price_max) || aiPlatformPrices ? (
                    <div className="flex gap-2">
                      {aiResult.price_min && aiResult.price_max && (
                        <div className="flex-1 rounded-[10px] bg-white/5 border border-white/10 px-3 py-2">
                          <p className="text-white/40 text-[9px] uppercase tracking-wider font-semibold mb-0.5">AI Estimate</p>
                          <p className="text-white text-xs font-bold">{aiResult.price_min}–{aiResult.price_max} DT</p>
                        </div>
                      )}
                      {aiPlatformPrices && (
                        <div className="flex-1 rounded-[10px] bg-[#22C55E]/8 border border-[#22C55E]/20 px-3 py-2">
                          <p className="text-[#4ADE80]/70 text-[9px] uppercase tracking-wider font-semibold mb-0.5">Platform Avg</p>
                          <p className="text-[#4ADE80] text-xs font-bold">{aiPlatformPrices.min}–{aiPlatformPrices.max} DT</p>
                        </div>
                      )}
                    </div>
                  ) : null}

                  {aiResult.key_points?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {aiResult.key_points.map((kp, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-full bg-white/5 text-white/60 text-[11px]">{kp}</span>
                      ))}
                    </div>
                  )}
                  <p className="text-white/30 text-[11px]">Description pre-filled for your request ✓</p>

                  {/* In-place provider suggestions */}
                  {aiStep === 'done' && (
                    <div className="mt-2 pt-2 border-t border-white/10 space-y-1.5">
                      <p className="text-white/50 text-[11px] font-semibold uppercase tracking-wide">📍 Best matches near you</p>
                      {aiSuggestions.length === 0 ? (
                        <div className="py-3 text-center">
                          <p className="text-white/30 text-xs">No available providers found nearby</p>
                          <p className="text-white/20 text-[11px] mt-0.5">Try a different category or check back later</p>
                        </div>
                      ) : aiSuggestions.map((p, idx) => (
                        <div
                          key={p._id}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-[12px] border ${idx === 0 ? 'bg-[#22C55E]/5 border-[#22C55E]/20' : 'bg-white/5 border-transparent'}`}
                        >
                          {/* Avatar */}
                          {p.avatar ? (
                            <img src={`/uploads/${p.avatar}`} alt={p.full_name}
                              className="w-9 h-9 rounded-full object-cover border border-white/10 flex-shrink-0" />
                          ) : (
                            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                              style={{ background: _nameGrad(p.full_name) }}>
                              {p.full_name?.charAt(0) || '?'}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              {idx === 0 && <span className="text-[10px]">🏆</span>}
                              <p className="text-white text-xs font-semibold truncate">{p.full_name}</p>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              {p.avg_rating > 0 && <span className="text-yellow-400 text-[10px]">★ {p.avg_rating.toFixed(1)}</span>}
                              {p._dist != null && (
                                <span className="px-1.5 py-0.5 rounded-full bg-[#22C55E]/15 text-[#4ADE80] text-[9px] font-semibold">
                                  {p._dist < 1000 ? `${Math.round(p._dist)}m` : `${(p._dist/1000).toFixed(1)}km`}
                                </span>
                              )}
                              {p.total_jobs > 0 && <span className="text-white/30 text-[10px]">{p.total_jobs} jobs</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <Link
                              to={`/provider/${p._id}`}
                              onClick={() => {
                                sessionStorage.setItem('ai_panel_state', JSON.stringify({
                                  query: aiQuery, result: aiResult,
                                  suggestions: aiSuggestions, remoteSuggestions: aiRemoteSuggestions,
                                  platformPrices: aiPlatformPrices,
                                }));
                              }}
                              className="px-2 py-1 rounded-[8px] bg-white/10 border border-white/15 text-white/60 text-[10px] font-semibold hover:bg-white/20 transition-all"
                            >
                              Profile
                            </Link>
                            <button
                              onClick={() => { setSelectedProvider(p); setAiOpen(false); }}
                              className="px-2 py-1 rounded-[8px] bg-[#22C55E]/20 border border-[#22C55E]/30 text-[#4ADE80] text-[10px] font-semibold hover:bg-[#22C55E]/30 transition-all"
                            >
                              Request
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Remote provider suggestions */}
                  {aiStep === 'done' && aiRemoteSuggestions.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-white/10 space-y-1.5">
                      <p className="text-white/50 text-[11px] font-semibold uppercase tracking-wide">🌐 Available remotely</p>
                      {aiRemoteSuggestions.map((p, idx) => (
                        <div
                          key={p._id}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-[12px] border ${idx === 0 ? 'bg-[#6366F1]/8 border-[#6366F1]/25' : 'bg-[#6366F1]/5 border-transparent'}`}
                        >
                          {/* Avatar */}
                          {p.avatar ? (
                            <img src={`/uploads/${p.avatar}`} alt={p.full_name}
                              className="w-9 h-9 rounded-full object-cover border border-white/10 flex-shrink-0" />
                          ) : (
                            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                              style={{ background: _nameGrad(p.full_name) }}>
                              {p.full_name?.charAt(0) || '?'}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-white text-xs font-semibold truncate">{p.full_name}</p>
                              <span className="px-1.5 py-0.5 rounded-full bg-[#6366F1]/20 text-[#818CF8] text-[9px] font-bold flex-shrink-0">REMOTE</span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              {p.avg_rating > 0 && <span className="text-yellow-400 text-[10px]">★ {p.avg_rating.toFixed(1)}</span>}
                              {p.total_jobs > 0 && <span className="text-white/30 text-[10px]">{p.total_jobs} jobs</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <Link
                              to={`/provider/${p._id}`}
                              onClick={() => {
                                sessionStorage.setItem('ai_panel_state', JSON.stringify({
                                  query: aiQuery, result: aiResult,
                                  suggestions: aiSuggestions, remoteSuggestions: aiRemoteSuggestions,
                                  platformPrices: aiPlatformPrices,
                                }));
                              }}
                              className="px-2 py-1 rounded-[8px] bg-white/10 border border-white/15 text-white/60 text-[10px] font-semibold hover:bg-white/20 transition-all"
                            >
                              Profile
                            </Link>
                            <button
                              onClick={() => { setSelectedProvider(p); setViewMode('remote'); setAiOpen(false); }}
                              className="px-2 py-1 rounded-[8px] bg-[#6366F1]/20 border border-[#6366F1]/30 text-[#818CF8] text-[10px] font-semibold hover:bg-[#6366F1]/30 transition-all"
                            >
                              Request
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* CATEGORY FILTER BUTTON */}
        <div className="relative pointer-events-auto mt-2">
          <button
            onClick={() => setCategoryPanelOpen(p => !p)}
            className={`flex items-center gap-2 px-4 py-2 rounded-[20px] bg-[#1E293B]/90 backdrop-blur-md border shadow-lg text-sm font-semibold transition-all duration-200 hover:border-[#22C55E]/50 ${
              categoryFilter === 'All' ? 'border-white/10' : 'border-[#22C55E]/40'
            }`}
            style={{
              color: categoryFilter === 'All'
                ? (theme === 'light' ? 'rgba(15,23,42,0.7)' : 'rgba(255,255,255,0.7)')
                : '#16A34A',
            }}
          >
            {categoryFilter !== 'All' && (
              <img
                src={SERVICE_LIST.find(s => s.name === categoryFilter)?.icon}
                alt={categoryFilter}
                className="w-4 h-4 object-contain"
              />
            )}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            {categoryFilter === 'All' ? 'Categories' : categoryFilter}
            <svg
              className={`w-3.5 h-3.5 transition-transform duration-200 ${categoryPanelOpen ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* CATEGORY GRID PANEL */}
          {categoryPanelOpen && (
            <div className="absolute top-full left-0 mt-2 w-72 bg-[#1E293B]/95 backdrop-blur-md border border-white/10 rounded-[16px] shadow-2xl p-3 z-[1100]">
              <div className="grid grid-cols-4 gap-2">
                {SERVICE_LIST.map((service) => {
                  const isActive = categoryFilter === service.name;
                  return (
                    <button
                      key={service.name}
                      onClick={() => { setCategoryFilter(service.name); setCategoryPanelOpen(false); }}
                      title={service.name}
                      className="flex flex-col items-center gap-1 p-2 rounded-[10px] transition-all duration-200 hover:scale-105 active:scale-95"
                      style={{
                        backgroundColor: isActive ? `${service.color}25` : theme === 'light' ? 'rgba(15,23,42,0.04)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${isActive ? service.color + '60' : 'transparent'}`,
                      }}
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center p-1.5"
                        style={{ backgroundColor: isActive ? `${service.color}30` : theme === 'light' ? 'rgba(15,23,42,0.07)' : 'rgba(255,255,255,0.07)' }}
                      >
                        <img src={service.icon} alt={service.name} className="w-full h-full object-contain" />
                      </div>
                      <span
                        className="text-[9px] font-semibold text-center leading-tight"
                        style={{ color: isActive ? '#16A34A' : theme === 'light' ? 'rgba(15,23,42,0.55)' : 'rgba(255,255,255,0.5)' }}
                      >
                        {service.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CLICK OUTSIDE HANDLER */}
      {(suggestionsOpen || categoryPanelOpen) && (
        <div
          className="fixed inset-0 z-[999] bg-transparent"
          onClick={() => { setSuggestionsOpen(false); setCategoryPanelOpen(false); }}
        />
      )}

      {/* Confirmation buttons for new locations */}
      {pendingLocation && !searchOpen && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-[320px] px-4">
          <button
            onClick={async () => {
              const confirmed = pendingLocation;
              setUserLocation(confirmed);
              setPendingLocation(null);
              if (isProvider) {
                try {
                  await api.put('/providers/location', {
                    latitude: confirmed[0],
                    longitude: confirmed[1],
                  });
                  // Reload providers so own icon appears/moves correctly
                  await loadProviders(categoryFilter, 1, false);
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
        <TileLayer url={tileUrl} />

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

        {!isProvider && (
          <Marker position={userLocation} icon={userIcon}>
            <Popup>
              <div style={{ padding: '10px 14px', fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>
                📍 You are here
              </div>
            </Popup>
          </Marker>
        )}

        {providers.map((provider, index) => {
          const lat = provider.latitude;
          const lng = provider.longitude;

          if (!lat || !lng) return null;

          return (
            <Marker
              key={provider._id || index}
              position={[lat, lng]}
              icon={createProviderIcon(provider)}
            >
              <Popup>
                <div className="p-4 w-60">
                  <div className="flex items-center gap-3 mb-3 border-b border-white/10 pb-3">
                    {provider.avatar ? (
                      <img src={`/uploads/${provider.avatar}`} alt={provider.full_name}
                        className="w-10 h-10 rounded-full object-cover border border-[#22C55E]/30 shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-white/5 border border-[#22C55E]/30 flex items-center justify-center font-bold text-white/50 text-sm uppercase shrink-0">
                        {provider.full_name ? provider.full_name.charAt(0) : '?'}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-white/90 text-sm leading-tight">
                        {provider.full_name || 'Provider'}
                      </h3>
                      <p className="text-[10px] text-[#4ADE80] mt-0.5 capitalize font-medium">
                        {provider.service_categories?.[0] === 'Other' && provider.custom_category
                          ? provider.custom_category
                          : provider.service_categories?.[0] || 'Expert'}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs text-white/60 mb-1">
                      <strong className="text-white/80 font-medium">Services:</strong> {provider.service_categories && provider.service_categories.length > 0
                        ? provider.service_categories.map(c => c === 'Other' && provider.custom_category ? provider.custom_category : c).join(', ')
                        : 'General Maintenance'}
                    </p>
                    <p className="text-xs text-white/60 flex items-center gap-1">
                      <strong className="text-white/80 font-medium">Rating:</strong>
                      <span className="text-[#4ADE80]">★ {provider.rating || '5.0'}</span>
                      <span className="opacity-50 ml-1">({provider.experience_years || 1} yrs exp)</span>
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {!isProvider && (
                      pendingProviderIds.has(provider._id) ? (
                        <div className="flex-1 py-1.5 rounded-[8px] flex items-center justify-center gap-1.5 text-[11px] font-semibold"
                          style={{ background: 'rgba(234,179,8,0.15)', border: '1px solid rgba(234,179,8,0.4)', color: '#FCD34D', cursor: 'not-allowed' }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FCD34D', display: 'inline-block', animation: 'pulse-ring 1.5s ease-out infinite' }} />
                          Waiting...
                        </div>
                      ) : (
                        <button
                          onClick={() => setSelectedProvider(provider)}
                          className="flex-1 py-1.5 rounded-[8px] bg-gradient-to-r from-[#22C55E] to-[#16A34A] text-white text-[11px] font-semibold text-center shadow-lg shadow-[#22C55E]/20 hover:shadow-[#22C55E]/40 hover:scale-[1.02] transition-all duration-300 pointer-events-auto"
                        >
                          Request
                        </button>
                      )
                    )}
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

      {/* ── Load More Providers ───────────────────────────────────────────── */}
      {viewMode === 'in_place' && providers.length < providerTotal && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000]">
          <button
            onClick={async () => {
              setLoadingMore(true);
              await loadProviders(categoryFilter, providerPage + 1, true);
              setLoadingMore(false);
            }}
            disabled={loadingMore}
            className="px-5 py-2.5 rounded-[20px] bg-[#1E293B]/95 backdrop-blur-md border border-white/10 text-white/70 text-sm font-semibold shadow-xl hover:border-[#22C55E]/40 hover:text-[#4ADE80] transition-all duration-200 disabled:opacity-50"
          >
            {loadingMore ? 'Loading...' : `Load more (${providers.length}/${providerTotal})`}
          </button>
        </div>
      )}

      {/* ── Remote Providers Grid ─────────────────────────────────────────── */}
      {viewMode === 'remote' && !isProvider && (
        <div className="absolute inset-0 z-[500] bg-[#0F172A]/97 backdrop-blur-sm overflow-y-auto"
          style={{ top: 0, paddingTop: '140px', paddingBottom: '32px' }}
        >
          {/* Remote search bar */}
          <div className="px-4 mb-4">
            <div className="flex items-center gap-2 bg-[#1E293B]/80 backdrop-blur-md border border-white/10 rounded-[20px] px-4 py-2.5 max-w-md">
              <svg className="w-4 h-4 text-white/30 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search remote providers by name or service..."
                value={remoteSearch}
                onChange={e => setRemoteSearch(e.target.value)}
                className="flex-1 bg-transparent text-white placeholder-white/30 text-sm outline-none"
              />
              {remoteSearch && (
                <button onClick={() => setRemoteSearch('')} className="text-white/30 hover:text-white/60 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {loadingRemote ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 border-2 border-[#6366F1] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : remoteProviders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <span className="text-4xl">💻</span>
              <p className="text-white/40 text-sm">No remote providers found</p>
              {(categoryFilter !== 'All' || remoteSearch) && (
                <button onClick={() => { setCategoryFilter('All'); setRemoteSearch(''); }} className="text-[#6366F1] text-xs hover:underline">
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {remoteProviders.map(provider => {
                const isPending = pendingProviderIds.has(provider._id);
                const stars = Math.round(provider.rating_avg || 0);
                return (
                  <div
                    key={provider._id}
                    className="bg-[#1E293B] border border-white/8 rounded-[20px] p-5 flex flex-col gap-4 hover:border-[#6366F1]/40 hover:shadow-[0_0_30px_rgba(99,102,241,0.1)] transition-all duration-300"
                  >
                    {/* Header */}
                    <div className="flex items-start gap-3">
                      {provider.avatar ? (
                        <img
                          src={`/uploads/${provider.avatar}`}
                          alt={provider.full_name}
                          className="w-12 h-12 rounded-full object-cover shrink-0 border border-white/10"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold shrink-0"
                          style={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)' }}>
                          {provider.full_name?.charAt(0) || '?'}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-white font-semibold text-sm truncate">{provider.full_name}</p>
                          <span className="shrink-0 px-1.5 py-0.5 rounded-full bg-[#6366F1]/20 text-[#818CF8] text-[9px] font-bold uppercase tracking-wider">
                            {provider.job_type === 'both' ? 'Remote & In-Place' : 'Remote'}
                          </span>
                        </div>
                        {/* Stars */}
                        <div className="flex items-center gap-1 mt-0.5">
                          <div className="flex">
                            {[1,2,3,4,5].map(s => (
                              <svg key={s} className="w-3 h-3" fill={s <= stars ? '#F59E0B' : 'none'} stroke={s <= stars ? '#F59E0B' : '#ffffff30'} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                              </svg>
                            ))}
                          </div>
                          <span className="text-white/40 text-[10px]">
                            {(provider.rating_avg || 0).toFixed(1)} ({provider.rating_count || 0})
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Categories */}
                    <div className="flex flex-wrap gap-1.5">
                      {(provider.service_categories || []).slice(0, 3).map(cat => (
                        <span key={cat} className="px-2 py-0.5 rounded-full bg-[#0F172A] border border-white/10 text-white/60 text-[10px] font-medium">
                          {cat === 'Other' && provider.custom_category ? provider.custom_category : cat}
                        </span>
                      ))}
                      {(provider.service_categories || []).length > 3 && (
                        <span className="px-2 py-0.5 rounded-full bg-[#0F172A] border border-white/10 text-white/40 text-[10px]">
                          +{provider.service_categories.length - 3}
                        </span>
                      )}
                    </div>

                    {/* Bio */}
                    {provider.bio && (
                      <p className="text-white/50 text-xs leading-relaxed line-clamp-2">{provider.bio}</p>
                    )}

                    {/* Stats row */}
                    <div className="flex items-center gap-3 text-xs">
                      {provider.hourly_rate && (
                        <div className="flex items-center gap-1 text-[#4ADE80] font-semibold">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {provider.hourly_rate} DT/hr
                        </div>
                      )}
                      {provider.experience_years && (
                        <div className="flex items-center gap-1 text-white/40">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          {provider.experience_years}y exp
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-white/40 ml-auto">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {provider.total_jobs || 0} jobs
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-auto pt-1 border-t border-white/5">
                      <Link
                        to={`/provider/${provider._id}`}
                        className="flex-1 py-2 rounded-[12px] bg-white/5 border border-white/10 text-white/60 text-xs font-semibold text-center hover:bg-white/10 transition-all duration-200"
                      >
                        View Profile
                      </Link>
                      <button
                        onClick={() => { setSelectedProvider(provider); setRequestSent(false); setRequestDescription(''); }}
                        disabled={isPending}
                        className="flex-1 py-2 rounded-[12px] text-white text-xs font-semibold transition-all duration-200 disabled:opacity-50"
                        style={{ background: isPending ? 'rgba(99,102,241,0.3)' : 'linear-gradient(135deg,#6366F1,#8B5CF6)', boxShadow: isPending ? 'none' : '0 4px 15px rgba(99,102,241,0.3)' }}
                      >
                        {isPending ? 'Requested ✓' : 'Request'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Request modal — clients only */}
      {selectedProvider && isClient && (
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
            ) : selectedProvider.is_available === false ? (
              /* Safety: provider became unavailable after being cached */
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: '36px', marginBottom: '12px' }}>🚫</div>
                <div style={{ color: 'white', fontWeight: '600', fontSize: '15px' }}>{selectedProvider.full_name}</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginTop: '6px' }}>
                  Not taking requests right now
                </div>
                <button
                  onClick={() => { setSelectedProvider(null); setRequestDescription(''); }}
                  style={{
                    marginTop: '20px', padding: '10px 24px',
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '20px', cursor: 'pointer', fontSize: '14px'
                  }}
                >
                  Go Back
                </button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
                  {selectedProvider.avatar ? (
                    <img
                      src={`/uploads/${selectedProvider.avatar}`}
                      alt={selectedProvider.full_name}
                      style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)', flexShrink: 0 }}
                    />
                  ) : (
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '50%',
                      background: _nameGrad(selectedProvider.full_name),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '15px', fontWeight: '700', color: 'white', flexShrink: 0
                    }}>
                      {selectedProvider.full_name ? selectedProvider.full_name.charAt(0) : '?'}
                    </div>
                  )}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ color: 'white', fontWeight: '600', fontSize: '15px' }}>{selectedProvider.full_name}</div>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 6px rgba(34,197,94,0.8)', flexShrink: 0 }} />
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>
                      {selectedProvider.service_categories?.map(c => c === 'Other' && selectedProvider.custom_category ? selectedProvider.custom_category : c).join(' · ')}
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
