import { useState, useEffect, useRef } from 'react';
import { getMyRequests } from '../api/request';
import useAuth from './useAuth';

export default function useNotifications() {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const intervalRef = useRef(null);
  const seenRef = useRef(new Set(JSON.parse(localStorage.getItem('seen_notif_ids') || '[]')));

  const buildNotifications = (requests, role) => {
    const items = [];

    if (role === 'provider') {
      // New pending requests
      requests.filter(r => r.status === 'pending').forEach(r => {
        items.push({
          id: `pending-${r._id}`,
          type: 'request',
          title: 'New Service Request',
          body: `${r.client_name} needs help — "${r.description?.slice(0, 50)}${r.description?.length > 50 ? '…' : ''}"`,
          link: `/requests`,
          color: '#F59E0B',
          icon: '📋',
          time: r.created_at,
        });
      });
      // Jobs to rate (completed, unrated placeholder)
      requests.filter(r => r.status === 'completed').forEach(r => {
        items.push({
          id: `rate-${r._id}`,
          type: 'rate',
          title: 'Rate your client',
          body: `Job with ${r.client_name} is complete. Leave a rating.`,
          link: `/chat/${r._id}`,
          color: '#8B5CF6',
          icon: '⭐',
          time: r.updated_at,
        });
      });
    } else {
      // Request accepted → in_progress
      requests.filter(r => r.status === 'in_progress').forEach(r => {
        items.push({
          id: `accepted-${r._id}`,
          type: 'accepted',
          title: 'Request Accepted!',
          body: `${r.provider_name} accepted your request. Open chat to get started.`,
          link: `/chat/${r._id}`,
          color: '#22C55E',
          icon: '✅',
          time: r.updated_at,
        });
      });
      // Confirmed agreements
      requests.filter(r => r.status === 'confirmed').forEach(r => {
        items.push({
          id: `confirmed-${r._id}`,
          type: 'confirmed',
          title: 'Agreement Confirmed',
          body: `Your agreement with ${r.provider_name} is locked in.`,
          link: `/chat/${r._id}`,
          color: '#3B82F6',
          icon: '🤝',
          time: r.updated_at,
        });
      });
      // Jobs done → rate
      requests.filter(r => r.status === 'completed').forEach(r => {
        items.push({
          id: `rate-${r._id}`,
          type: 'rate',
          title: 'Rate your provider',
          body: `Job with ${r.provider_name} is complete. Share your experience.`,
          link: `/chat/${r._id}`,
          color: '#8B5CF6',
          icon: '⭐',
          time: r.updated_at,
        });
      });
    }

    return items.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 10);
  };

  const fetchNotifications = async () => {
    if (!localStorage.getItem('access_token')) return;
    try {
      const res = await getMyRequests();
      const items = buildNotifications(res.data, user?.role);
      setNotifications(items);
    } catch {
      // silently fail
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    fetchNotifications();
    intervalRef.current = setInterval(fetchNotifications, 10000);
    return () => clearInterval(intervalRef.current);
  }, [isAuthenticated, user?.role]);

  const markAllSeen = () => {
    const ids = notifications.map(n => n.id);
    ids.forEach(id => seenRef.current.add(id));
    localStorage.setItem('seen_notif_ids', JSON.stringify([...seenRef.current]));
    setNotifications(prev => prev.map(n => ({ ...n, seen: true })));
  };

  const unseenCount = notifications.filter(n => !n.seen && !seenRef.current.has(n.id)).length;

  return { notifications, unseenCount, markAllSeen };
}
