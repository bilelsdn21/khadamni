import { useEffect, useState } from "react";
import api from "../api/axios";

export default function ReviewList({ providerUserId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!providerUserId) return;
    const fetchReviews = async () => {
      try {
        const res = await api.get(`/ratings/user/${providerUserId}`);
        setReviews(res.data);
      } catch (err) {
        console.error("Failed to fetch reviews:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, [providerUserId]);

  if (loading) return <div className="text-white/30 text-sm">Loading reviews...</div>;

  if (reviews.length === 0) {
    return (
      <div className="bg-[#1E293B] border border-white/10 p-8 rounded-[20px] text-center">
        <p className="text-white/40 text-sm">No reviews yet for this provider.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reviews.map((r) => (
        <div key={r._id} className="bg-[#1E293B] border border-white/10 p-5 rounded-[20px] shadow-md hover:border-white/20 transition-colors duration-300">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/5">
            <span className="font-medium text-white/90">
              {r.client_name || "Client"}
            </span>
            <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-[#22C55E]/10 text-[#4ADE80] border border-[#22C55E]/20">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
              {r.rating}.0
            </span>
          </div>
          <p className="text-sm text-white/80 leading-relaxed">{r.comment}</p>
        </div>
      ))}
    </div>
  );
}