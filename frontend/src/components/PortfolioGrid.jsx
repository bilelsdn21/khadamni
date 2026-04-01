import { useEffect, useState } from "react";
import api from "../api/axios";

export default function PortfolioGrid({ providerUserId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!providerUserId) return;
    const fetchPortfolio = async () => {
      try {
        const res = await api.get(`/portfolio/${providerUserId}`);
        setItems(res.data);
      } catch (err) {
        console.error("Failed to fetch portfolio:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPortfolio();
  }, [providerUserId]);

  if (loading) return <div className="text-white/30 text-sm">Loading portfolio...</div>;

  if (items.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-[20px] p-8 text-center bg-[#1E293B]">
        <p className="text-white/40 text-sm">No portfolio items shared yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {items.map((item) => (
        <div key={item._id} className="group bg-[#1E293B] border border-white/10 rounded-[20px] overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer aspect-square relative">
          <img 
            src={`/uploads/${item.image_path}`} 
            alt={item.description || "Portfolio work"} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
          />
          {item.description && (
            <div className="absolute inset-x-0 bottom-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-2">
              <p className="text-[10px] text-white line-clamp-2">{item.description}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}