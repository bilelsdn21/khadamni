import { useEffect, useState } from 'react';
import { getMyRequests, acceptRequest, rejectRequest } from '../api/request';
import useAuth from '../hooks/useAuth';
import { Link } from 'react-router-dom';

const STATUS_COLORS = {
  pending:     { bg: 'bg-yellow-500/10 border border-yellow-500/30', text: 'text-yellow-400', label: 'Pending' },
  in_progress: { bg: 'bg-[#22C55E]/10 border border-[#22C55E]/30',  text: 'text-[#4ADE80]',  label: 'In Progress' },
  rejected:    { bg: 'bg-red-500/10 border border-red-500/30',       text: 'text-red-400',    label: 'Rejected' },
  completed:   { bg: 'bg-blue-500/10 border border-blue-500/30',     text: 'text-blue-400',   label: 'Completed' },
};

export default function Requests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyRequests()
      .then(res => setRequests(res.data))
      .finally(() => setLoading(false));
  }, []);

  const handleAccept = async (id) => {
    await acceptRequest(id);
    setRequests(requests.map(r => r._id === id ? { ...r, status: 'in_progress' } : r));
  };

  const handleReject = async (id) => {
    await rejectRequest(id);
    setRequests(requests.map(r => r._id === id ? { ...r, status: 'rejected' } : r));
  };

  return (
    <div className="min-h-screen bg-[#0F172A] px-6 py-8">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {user?.role === 'provider' ? 'Incoming Requests' : 'My Requests'}
            </h1>
            <p className="text-white/60 text-sm mt-1">
              {user?.role === 'provider'
                ? 'Clients requesting your services'
                : 'Services you have requested'}
            </p>
          </div>
          <Link
            to="/map"
            className="px-4 py-2.5 rounded-[20px] bg-[#1E293B] border border-white/10 text-[#4ADE80] text-sm font-semibold hover:border-[#22C55E]/50 transition-all duration-200"
          >
            ← Back to Map
          </Link>
        </div>

        {/* Loading */}
        {loading && (
          <p className="text-white/50 text-center mt-20">Loading...</p>
        )}

        {/* Empty state */}
        {!loading && requests.length === 0 && (
          <div className="text-center py-16 bg-[#1E293B] rounded-[20px] border border-white/10">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-white font-semibold text-base">No requests yet</p>
            <p className="text-white/50 text-sm mt-1">
              {user?.role === 'provider'
                ? 'When clients request your service, they will appear here.'
                : 'Go to the map and request a service from a provider.'}
            </p>
          </div>
        )}

        {/* Request cards */}
        {requests.map(r => {
          const status = STATUS_COLORS[r.status] || STATUS_COLORS.pending;
          return (
            <div
              key={r._id}
              className="bg-[#1E293B] rounded-[20px] border border-white/10 p-5 mb-3"
            >
              {/* Top row */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-white font-semibold text-[15px]">
                    {user?.role === 'provider' ? r.client_name : r.provider_name}
                  </p>
                  <p className="text-white/50 text-xs mt-0.5">
                    {user?.role === 'provider' ? 'Client' : 'Provider'}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.text}`}>
                  {status.label}
                </span>
              </div>

              {/* Description */}
              <p className="text-white/70 text-sm leading-relaxed px-4 py-3 bg-[#0F172A] rounded-[12px] border-l-2 border-[#22C55E] mb-4">
                {r.description}
              </p>

              {/* Accept / Reject — provider only, pending only */}
              {user?.role === 'provider' && r.status === 'pending' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAccept(r._id)}
                    className="flex-1 py-2.5 rounded-[20px] bg-[#22C55E]/10 border border-[#22C55E]/40 text-[#4ADE80] font-semibold text-sm hover:bg-[#22C55E]/20 transition-all duration-200 cursor-pointer"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleReject(r._id)}
                    className="flex-1 py-2.5 rounded-[20px] bg-red-500/10 border border-red-500/30 text-red-400 font-semibold text-sm hover:bg-red-500/20 transition-all duration-200 cursor-pointer"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
