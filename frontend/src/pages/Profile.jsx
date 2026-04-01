import { useContext, useState, useEffect } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { removeDevices } from '../api/auth';
import { getProfile, updateProfile, getPublicProfileById } from '../api/profile';
import { getPortfolio } from '../api/portfolio';
import { getUserRatings } from '../api/ratings';
import SideDrawer from '../components/SideDrawer';

export default function Profile() {
  const { id } = useParams(); // For public view
  const { user } = useContext(AuthContext);
  const [profileData, setProfileData] = useState(null);
  const [portfolio, setPortfolio] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState(false);
  const [message, setMessage] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isOwnProfile = !id || id === user?._id;

  useEffect(() => {
    fetchData();
  }, [id, user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let data;
      if (isOwnProfile) {
        const res = await getProfile();
        data = res.data;
      } else {
        const res = await getPublicProfileById(id);
        data = res.data;
      }
      
      setProfileData(data);

      // Fetch additional data for providers (either own or public)
      if (data.role === 'provider' || data.provider_profile) {
        const targetUserId = isOwnProfile ? user._id : (data.user_id || id);
        const [portfolioRes, ratingsRes] = await Promise.all([
          getPortfolio(targetUserId),
          getUserRatings(targetUserId)
        ]);
        setPortfolio(portfolioRes.data);
        setRatings(ratingsRes.data);
      }
    } catch (err) {
      console.error('Error fetching profile data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user && isOwnProfile) {
    return <Navigate to="/login" replace />;
  }

  const handleRemoveDevices = async () => {
    if (!window.confirm('Are you sure you want to remove all trusted devices? You will need to verify via OTP on your next login.')) return;
    
    setRevoking(true);
    try {
      await removeDevices();
      localStorage.removeItem('device_token');
      setMessage('All trusted devices removed successfully.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error(err);
      alert('Failed to remove devices. Please try again.');
    } finally {
      setRevoking(false);
    }
  };

  const toggleAvailability = async () => {
    if (!profileData?.provider_profile || !isOwnProfile) return;
    const newStatus = !profileData.provider_profile.is_available;
    try {
      await updateProfile({ is_available: newStatus });
      setProfileData({
        ...profileData,
        provider_profile: { ...profileData.provider_profile, is_available: newStatus }
      });
    } catch (err) {
      console.error(err);
    }
  };

  const fullName = profileData ? `${profileData.first_name || ''} ${profileData.last_name || ''}` : '';
  const isProvider = profileData?.role === 'provider' || !!profileData?.provider_profile;

  // SKELETON COMPONENT
  const Skeleton = ({ className }) => (
    <div className={`animate-pulse bg-white/5 rounded-lg ${className}`}></div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] text-white px-6 py-10">
        <div className="max-w-4xl mx-auto space-y-8">
          <Skeleton className="h-48 w-full rounded-[20px]" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-32 w-full rounded-[20px]" />
            <Skeleton className="h-32 w-full rounded-[20px]" />
            <Skeleton className="h-32 w-full rounded-[20px]" />
          </div>
          <Skeleton className="h-64 w-full rounded-[20px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A] text-white px-6 py-10 relative">
      <div className="fixed inset-0 bg-gradient-to-br from-[#22C55E]/5 via-transparent to-[#4ADE80]/5 pointer-events-none z-0" />
      
      <SideDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* Menu button */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="fixed top-6 left-6 z-40 w-10 h-10 rounded-[15px] bg-[#1E293B] border border-white/10 shadow-lg flex items-center justify-center text-white hover:bg-[#22C55E] transition-all duration-300"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div className="max-w-4xl mx-auto relative z-10">
        
        {/* HEADER CARD */}
        <div className="bg-[#1E293B] border border-white/10 rounded-[20px] p-6 md:p-8 shadow-xl relative overflow-hidden mb-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#22C55E]/5 rounded-full blur-[80px] -z-10"></div>
          
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            {/* Avatar */}
            <div className="w-28 h-28 rounded-full border-2 border-[#22C55E]/30 overflow-hidden bg-white/5 flex items-center justify-center shrink-0 shadow-lg relative group">
              {profileData?.avatar ? (
                <img src={`/uploads/${profileData.avatar}`} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-bold text-white/20 capitalize">{fullName.charAt(0) || '?'}</span>
              )}
              {isOwnProfile && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" strokeWidth="2"/><path d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" strokeWidth="2"/></svg>
                </div>
              )}
            </div>

            <div className="flex-1 w-full">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-white/90">{fullName}</h1>
                  <div className="flex flex-wrap gap-3 mt-2">
                    <span className="text-white/50 text-sm flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeWidth="2"/></svg>
                      {profileData?.email}
                    </span>
                    {isProvider && (
                       <span className="text-white/50 text-sm flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeWidth="2"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" strokeWidth="2"/></svg>
                        {profileData?.provider_profile?.experience_years || profileData?.experience_years ? `${profileData.provider_profile?.experience_years || profileData?.experience_years} Experience` : 'Professional Provider'}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-3">
                  <div className="px-3.5 py-1.5 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#4ADE80] font-semibold text-sm shadow-[0_0_15px_rgba(34,197,94,0.1)] capitalize">
                    {profileData?.role || 'User'} Account
                  </div>
                  {isProvider && (
                    <button 
                      onClick={isOwnProfile ? toggleAvailability : undefined}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        (profileData?.provider_profile?.is_available || profileData?.is_available) 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      } ${!isOwnProfile ? 'cursor-default' : ''}`}
                    >
                      <div className={`w-2 h-2 rounded-full animate-pulse ${(profileData?.provider_profile?.is_available || profileData?.is_available) ? 'bg-emerald-400' : 'bg-red-400'}`}></div>
                      {(profileData?.provider_profile?.is_available || profileData?.is_available) ? 'Available Now' : 'Currently Unavailable'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* STATS STRIP */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {isProvider ? (
            <>
              <div className="bg-[#1E293B] border border-white/10 p-6 rounded-[20px] text-center">
                <p className="text-3xl font-bold text-[#22C55E]">{profileData?.rating_avg?.toFixed(1) || profileData?.rating?.toFixed(1) || '0.0'}</p>
                <p className="text-white/40 text-xs font-medium uppercase tracking-wider mt-1">Rating Score</p>
              </div>
              <div className="bg-[#1E293B] border border-white/10 p-6 rounded-[20px] text-center">
                <p className="text-3xl font-bold text-white/90">{profileData?.total_reviews || ratings.length || 0}</p>
                <p className="text-white/40 text-xs font-medium uppercase tracking-wider mt-1">Total Reviews</p>
              </div>
              <div className="bg-[#1E293B] border border-white/10 p-6 rounded-[20px] text-center">
                <p className="text-3xl font-bold text-white/90">{profileData?.completed_jobs || 0}</p>
                <p className="text-white/40 text-xs font-medium uppercase tracking-wider mt-1">Completed Jobs</p>
              </div>
            </>
          ) : (
            <>
              <div className="bg-[#1E293B] border border-white/10 p-6 rounded-[20px] text-center">
                <p className="text-3xl font-bold text-[#22C55E]">{profileData?.total_requests || 0}</p>
                <p className="text-white/40 text-xs font-medium uppercase tracking-wider mt-1">Total Requests</p>
              </div>
              <div className="bg-[#1E293B] border border-white/10 p-6 rounded-[20px] text-center">
                <p className="text-3xl font-bold text-white/90">{profileData?.active_requests || 0}</p>
                <p className="text-white/40 text-xs font-medium uppercase tracking-wider mt-1">Active Requests</p>
              </div>
              <div className="bg-[#1E293B] border border-white/10 p-6 rounded-[20px] text-center">
                <p className="text-xl font-bold text-white/90 mt-2">{profileData?.member_since || 'March 2026'}</p>
                <p className="text-white/40 text-xs font-medium uppercase tracking-wider mt-1">Member Since</p>
              </div>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* LEFT COL: INFO */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-[#1E293B] border border-white/10 p-6 rounded-[20px]">
              <h3 className="text-sm font-semibold text-white/40 uppercase tracking-widest mb-4">About</h3>
              {isProvider ? (
                <>
                   <div className="mb-4">
                    <p className="text-xs text-white/40 mb-1">Service Categories</p>
                    <div className="flex flex-wrap gap-2">
                       {profileData?.provider_profile?.service_categories?.map(cat => (
                         <span key={cat} className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20">{cat}</span>
                       )) || profileData?.service_categories?.map(cat => (
                        <span key={cat} className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20">{cat}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-white/40 mb-1">Hourly Rate</p>
                    <p className="text-lg font-bold text-emerald-400">${profileData?.provider_profile?.hourly_rate || profileData?.hourly_rate || 0}/hr</p>
                  </div>
                </>
              ) : (
                <p className="text-sm text-white/60">Professional profile details and account management dashboard.</p>
              )}
            </div>

            {/* TRUSTED DEVICES BOX - ONLY SHOW FOR OWN PROFILE */}
            {isOwnProfile && (
              <div className="bg-[#1E293B] border border-white/10 p-6 rounded-[20px]">
                 <h3 className="text-sm font-semibold text-white/40 uppercase tracking-widest mb-4">Security</h3>
                 <p className="text-xs text-white/50 mb-4">Revoke access for all trusted devices.</p>
                 {message && <p className="text-xs text-emerald-400 mb-2">{message}</p>}
                 <button 
                    onClick={handleRemoveDevices}
                    disabled={revoking}
                    className="w-full py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium hover:bg-red-500/20 transition-all disabled:opacity-50"
                 >
                   {revoking ? 'Removing...' : 'Untrust All Devices'}
                 </button>
              </div>
            )}
          </div>

          {/* RIGHT COL: MAIN CONTENT */}
          <div className="md:col-span-2 space-y-6">
            {isProvider ? (
              <>
                 <div className="bg-[#1E293B] border border-white/10 p-6 rounded-[20px]">
                    <h2 className="text-lg font-bold mb-4">Service Description</h2>
                    <p className="text-white/60 text-sm leading-relaxed whitespace-pre-wrap">
                      {profileData?.provider_profile?.bio || profileData?.bio || 'No description provided yet.'}
                    </p>
                 </div>

                 {/* PORTFOLIO */}
                 <div className="bg-[#1E293B] border border-white/10 p-6 rounded-[20px]">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-bold">Portfolio</h2>
                      {isOwnProfile && <button className="text-xs text-[#22C55E] hover:underline font-medium">Manage Items</button>}
                    </div>
                    {portfolio.length > 0 ? (
                      <div className="grid grid-cols-2 gap-4">
                        {portfolio.map(item => (
                          <div key={item._id} className="group relative aspect-video rounded-xl overflow-hidden bg-white/5">
                            <img src={`/uploads/${item.filename}`} alt={item.description} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex items-end">
                               <p className="text-xs text-white truncate">{item.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-32 flex items-center justify-center border-2 border-dashed border-white/5 rounded-xl">
                        <p className="text-white/20 text-sm">No portfolio items added yet.</p>
                      </div>
                    )}
                 </div>
              </>
            ) : (
               <div className="bg-[#1E293B] border border-white/10 p-6 rounded-[20px] min-h-[300px] flex flex-col items-center justify-center text-center">
                  <svg className="w-16 h-16 text-white/5 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" strokeWidth="1.5"/></svg>
                  <h2 className="text-xl font-bold text-white/80">Activity Dashboard</h2>
                  <p className="text-white/40 text-sm mt-2 max-w-xs">{isOwnProfile ? "You haven't made any service requests yet." : "This user has no public activity to display."}</p>
                  {isOwnProfile && <a href="/map" className="mt-6 px-6 py-2 rounded-full bg-[#22C55E] text-white font-semibold text-sm hover:scale-105 transition-transform">Start Searching</a>}
               </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}