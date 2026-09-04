import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { getChatRoom, sendOffer, updateOfferStatus, confirmAgreement, cancelRequest } from '../api/chat';
import { completeRequest } from '../api/request';
import { submitRating, getJobRatings } from '../api/ratings';
import api from '../api/axios';
import { useToast } from './Toast';

export default function ChatPanel({ requestId, onStatusChange }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [roomData, setRoomData]           = useState(null);
  const [messages, setMessages]           = useState([]);
  const [inputText, setInputText]         = useState('');
  const [isConnected, setIsConnected]     = useState(false);
  const [isTyping, setIsTyping]           = useState(false);
  const [showOfferPanel, setShowOfferPanel] = useState(false);
  const [offerAmount, setOfferAmount]     = useState('');
  const [offerNote, setOfferNote]         = useState('');
  const [priceStats, setPriceStats]       = useState(null);
  const [priceStatsFetched, setPriceStatsFetched] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [bothConfirmed, setBothConfirmed] = useState(false);
  const [userConfirmed, setUserConfirmed] = useState(false);
  const [isCompleted, setIsCompleted]     = useState(false);
  const [hasRated, setHasRated]           = useState(false);
  const [ratingScore, setRatingScore]     = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [loading, setLoading]             = useState(true);
  const [otherOnline, setOtherOnline]     = useState(false);

  const messagesEndRef    = useRef(null);
  const wsRef             = useRef(null);
  const typingTimeoutRef  = useRef(null);
  const userIdRef         = useRef(user?._id);
  const navigateRef       = useRef(navigate);
  const fetchRoomRef        = useRef(null); // stable ref so WS handler can call it
  const scrollContainerRef  = useRef(null);
  const cancelledLocallyRef = useRef(false); // prevents duplicate handling when we cancel ourselves
  const toast = useToast();

  useEffect(() => { userIdRef.current = user?._id; }, [user?._id]);
  useEffect(() => { navigateRef.current = navigate; }, [navigate]);

  // ── WebSocket ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token || !requestId) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(
      `${protocol}//${window.location.host}/api/chat/ws/${requestId}?token=${token}`
    );
    wsRef.current = ws;

    ws.onopen  = () => {
      setIsConnected(true);
      // Re-fetch room on reconnect to catch any status changes missed while offline
      if (fetchRoomRef.current) fetchRoomRef.current();
    };
    ws.onclose = () => setIsConnected(false);
    ws.onerror = () => setIsConnected(false);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case 'history':
          setMessages(data.messages);
          break;
        case 'presence_init':
          // Server tells us who's already connected when we join
          // other party is online if any ID in online_users is not ours
          setOtherOnline((data.online_users || []).some(id => id !== userIdRef.current));
          break;
        case 'presence':
          if (data.user_id !== userIdRef.current) {
            setOtherOnline(data.status === 'online');
          }
          break;
        case 'text':
          setMessages(prev => {
            // Replace matching optimistic message when server echo arrives
            if (data.message.sender_id === userIdRef.current) {
              let idx = -1;
              for (let i = prev.length - 1; i >= 0; i--) {
                if (prev[i]._optimistic && prev[i].message === data.message.message) { idx = i; break; }
              }
              if (idx !== -1) return [...prev.slice(0, idx), ...prev.slice(idx + 1), data.message];
            }
            return [...prev, data.message];
          });
          break;
        case 'typing':
          if (data.user_id !== userIdRef.current) {
            setIsTyping(true);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2000);
          }
          break;
        case 'offer':
          setMessages(prev => [...prev, data.message]);
          if (data.message.sender_id !== userIdRef.current) toast('New price offer received', 'info');
          break;
        case 'offer_update':
          setMessages(prev => prev.map(m => m._id === data.message._id ? data.message : m));
          if (data.message?.offer_status === 'accepted') {
            setRoomData(prev => prev
              ? { ...prev, room: { ...prev.room, agreed_price: data.message.offer_amount } }
              : prev
            );
          }
          break;
        case 'system':
          setMessages(prev => [...prev, {
            _id: Date.now().toString(),
            message_type: 'system',
            message: data.message,
            timestamp: new Date().toISOString(),
          }]);
          break;
        case 'confirmed':
          setBothConfirmed(true);
          toast('Agreement confirmed by both parties!', 'success');
          setMessages(prev => [...prev, {
            _id: Date.now().toString(),
            message_type: 'system',
            message: 'Both parties have confirmed the agreement',
            timestamp: new Date().toISOString(),
          }]);
          break;
        case 'cancelled':
          setRoomData(prev => prev ? { ...prev, room: { ...(prev.room || {}), status: 'cancelled' } } : prev);
          if (!cancelledLocallyRef.current) {
            // Other party cancelled — show message and navigate
            setMessages(prev => [...prev, {
              _id: Date.now().toString(),
              message_type: 'system',
              message: data.message || 'Request was cancelled',
              timestamp: new Date().toISOString(),
            }]);
            setTimeout(() => navigateRef.current('/requests'), 2500);
          }
          break;
        case 'request_accepted':
          setRoomData(prev => prev ? { ...prev, request_status: 'in_progress' } : prev);
          onStatusChange?.(requestId, 'in_progress');
          toast('Provider accepted your request!', 'success');
          break;
        case 'job_completed':
          setIsCompleted(true);
          setBothConfirmed(true);
          onStatusChange?.(requestId, 'completed');
          break;
        case 'confirmed':
          onStatusChange?.(requestId, 'confirmed');
          break;
      }
    };

    return () => {
      ws.close();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [requestId]);

  // ── Fetch room ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!requestId) return;
    setLoading(true);
    setMessages([]);
    setRoomData(null);
    setBothConfirmed(false);
    setUserConfirmed(false);
    setIsCompleted(false);
    setHasRated(false);
    setRatingScore(0);
    setRatingComment('');
    setShowOfferPanel(false);
    setPriceStats(null);
    setPriceStatsFetched(false);

    const fetchRoom = async () => {
      try {
        const res = await getChatRoom(requestId);
        setRoomData(res.data);
        // Only overwrite messages on initial load (don't clobber WS messages on reconnect)
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN)
          setMessages(res.data.messages || []);

        if (res.data.room?.status === 'confirmed') setBothConfirmed(true);

        if (res.data.request_status === 'completed') {
          setIsCompleted(true);
          setBothConfirmed(true);
          try {
            const ratingsRes = await getJobRatings(requestId);
            if (ratingsRes.data.some(r => r.rater_id === user?._id)) setHasRated(true);
          } catch {}
        }

        if (user?._id === res.data.room?.client_id   && res.data.room?.client_confirmed)   setUserConfirmed(true);
        if (user?._id === res.data.room?.provider_id  && res.data.room?.provider_confirmed) setUserConfirmed(true);
      } catch (err) {
        console.error('Failed to fetch chat room:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRoomRef.current = fetchRoom;
    fetchRoom();
  }, [requestId]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const distFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    const lastMsg = messages[messages.length - 1];
    const isOwnMsg = lastMsg?.sender_id === userIdRef.current || lastMsg?._optimistic;
    // Only auto-scroll if near bottom OR it's the user's own message
    if (distFromBottom < 200 || isOwnMsg) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const send = (payload) => {
    if (wsRef.current?.readyState === WebSocket.OPEN)
      wsRef.current.send(JSON.stringify(payload));
  };

  const handleSendMessage = () => {
    const text = inputText.trim();
    if (!text) return;
    // Optimistic update — shows message instantly before server echo
    setMessages(prev => [...prev, {
      _id: `_opt_${Date.now()}`,
      sender_id: userIdRef.current,
      message: text,
      message_type: 'text',
      timestamp: new Date().toISOString(),
      _optimistic: true,
    }]);
    send({ type: 'text', content: text });
    setInputText('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    send({ type: 'typing' });
  };

  const handleSendOffer = async () => {
    if (!offerAmount || isNaN(parseFloat(offerAmount))) return;
    try {
      await sendOffer(requestId, parseFloat(offerAmount), offerNote);
      // Backend broadcasts the offer to both parties via WS
      setOfferAmount(''); setOfferNote(''); setShowOfferPanel(false);
    } catch (err) { console.error(err); }
  };

  const handleUpdateOffer = async (messageId, status) => {
    try {
      await updateOfferStatus(requestId, messageId, status);
      // Backend broadcasts the update to both parties via WS
    } catch (err) { console.error(err); }
  };

  const handleConfirm = async () => {
    try {
      const res = await confirmAgreement(requestId);
      setUserConfirmed(true);
      // If both confirmed, backend broadcasts {type:'confirmed'} — WS handler sets bothConfirmed
      if (res.data.status === 'both_confirmed') setBothConfirmed(true);
    } catch (err) { console.error(err); }
  };

  const handleComplete = async () => {
    try {
      await completeRequest(requestId);
      setIsCompleted(true);
      setRoomData(prev => prev ? { ...prev, request_status: 'completed' } : prev);
      // Backend broadcasts {type:'job_completed'} to the client in real-time
    } catch (err) { console.error(err); }
  };

  const handleSubmitRating = async () => {
    if (!ratingScore) return;
    try {
      await submitRating({ job_id: requestId, score: ratingScore, comment: ratingComment });
      setHasRated(true);
    } catch (err) { console.error(err); }
  };

  const handleCancel = async () => {
    try {
      const res = await cancelRequest(requestId);
      const msg = `Request was cancelled by ${res.data.cancelled_by || 'you'}`;
      // Mark that WE initiated cancel — prevents duplicate handling from WS broadcast
      cancelledLocallyRef.current = true;
      // Update local state immediately so the canceller's UI updates without waiting for WS
      setRoomData(prev => prev ? { ...prev, room: { ...(prev.room || {}), status: 'cancelled' } } : prev);
      setMessages(prev => [...prev, {
        _id: `_sys_${Date.now()}`,
        message_type: 'system',
        message: msg,
        timestamp: new Date().toISOString(),
      }]);
      setShowCancelModal(false);
      toast('Request cancelled', 'info');
      setTimeout(() => navigateRef.current('/requests'), 2500);
      // Backend broadcasts to the OTHER party automatically
    } catch (err) {
      console.error(err);
      toast('Failed to cancel request', 'error');
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const formatTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const formatDate = (ts) => {
    const d = new Date(ts);
    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === today.toDateString())     return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
  };

  const showDateSep = (cur, prev) => {
    if (!prev) return true;
    return new Date(cur.timestamp).toDateString() !== new Date(prev.timestamp).toDateString();
  };

  const isMyMessage = (msg) => msg.sender_id === user?._id;

  // ── Derived state ──────────────────────────────────────────────────────────
  const agreedPrice = roomData?.room?.agreed_price;
  const isProvider  = user?.role === 'provider';
  const isClient    = user?.role === 'client';
  const canConfirm  = agreedPrice && !bothConfirmed && !userConfirmed;
  const isCancelled = roomData?.room?.status === 'cancelled';
  const isPending   = roomData?.request_status === 'pending';

  // Profile link works for both roles
  const profileLink = (() => {
    if (!roomData) return null;
    if (roomData.other_party_role === 'provider' && roomData.provider_profile_id)
      return `/profile/${roomData.provider_profile_id}`;
    if (roomData.other_party_id)
      return `/profile/${roomData.other_party_id}`;
    return null;
  })();

  const otherAvatar = roomData?.other_party_avatar;
  const otherName   = roomData?.other_party_name || 'Chat';

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0F172A]">
        <p className="text-white/40 text-sm">Loading chat...</p>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-[#0F172A]">

      {/* ── Sub-header ── */}
      <div className="bg-[#1E293B] border-b border-white/10 px-4 py-2.5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          {otherAvatar ? (
            <img
              src={`/uploads/${otherAvatar}`}
              alt={otherName}
              className="w-9 h-9 rounded-full object-cover border border-white/10 flex-shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#22C55E] to-[#16A34A] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {otherName.charAt(0).toUpperCase()}
            </div>
          )}

          {/* Name + status */}
          <div>
            {profileLink ? (
              <button
                onClick={() => navigate(profileLink)}
                className="text-white font-semibold text-sm hover:text-[#4ADE80] transition-colors text-left"
              >
                {otherName}
              </button>
            ) : (
              <p className="text-white font-semibold text-sm">{otherName}</p>
            )}
            <div className="flex items-center gap-2">
              <span className="text-white/40 text-xs">{roomData?.service_category}</span>
              <span className="text-white/20 text-xs">·</span>
              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${otherOnline ? 'bg-[#22C55E] animate-pulse' : 'bg-white/20'}`} />
              <span className={`text-xs font-medium ${otherOnline ? 'text-[#4ADE80]' : 'text-white/35'}`}>
                {otherOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              {[
                { label: 'Pending', done: true },
                { label: 'Active',  done: !isPending },
                { label: 'Done',    done: isCompleted },
              ].map((step, i, arr) => (
                <span key={step.label} className="flex items-center gap-1">
                  <span className={`text-[9px] font-semibold ${step.done ? 'text-[#4ADE80]' : 'text-white/25'}`}>{step.label}</span>
                  {i < arr.length - 1 && <span className="text-white/15 text-[8px]">›</span>}
                </span>
              ))}
            </div>
          </div>
        </div>

        {!bothConfirmed && !isCancelled && (
          <button
            onClick={() => setShowCancelModal(true)}
            className="px-3 py-1.5 rounded-[20px] bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-all"
          >
            Cancel
          </button>
        )}
      </div>

      {/* ── Banners ── */}
      {agreedPrice && !bothConfirmed && (
        <div className="bg-[#22C55E]/10 border-b border-[#22C55E]/30 px-4 py-2 flex-shrink-0">
          <p className="text-[#4ADE80] text-sm font-semibold text-center">
            Agreed Price: {agreedPrice} DT — Waiting for confirmation
          </p>
        </div>
      )}
      {bothConfirmed && (
        <div className="bg-[#22C55E]/20 border-b border-[#22C55E]/40 px-4 py-2 flex-shrink-0">
          <p className="text-[#4ADE80] text-sm font-semibold text-center">✓ Agreement Confirmed</p>
        </div>
      )}

      {/* ── Messages ── */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-4xl mb-3">👋</p>
            <p className="text-white/40 text-sm">
              {isPending ? 'Waiting for provider to accept...' : 'No messages yet'}
            </p>
            <p className="text-white/25 text-xs mt-1">
              {isPending ? "They'll accept your request soon" : 'Start the conversation!'}
            </p>
          </div>
        )}
        {messages.map((msg, index) => {
          const isMine   = isMyMessage(msg);
          const isSystem = msg.message_type === 'system';
          const isOffer  = msg.message_type === 'offer';

          return (
            <div key={msg._id}>
              {showDateSep(msg, messages[index - 1]) && (
                <div className="flex justify-center my-4">
                  <div className="bg-white/10 px-3 py-1 rounded-full">
                    <span className="text-white/50 text-xs">{formatDate(msg.timestamp)}</span>
                  </div>
                </div>
              )}

              {isSystem && (
                <div className="flex justify-center my-2">
                  <p className="text-white/40 text-xs italic">{msg.message}</p>
                </div>
              )}

              {isOffer && (
                <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-3`}>
                  <div className={`max-w-[85%] rounded-[20px] p-4 ${
                    isMine ? 'bg-[#22C55E]/20 border border-[#22C55E]/40' : 'bg-[#1E293B] border border-white/10'
                  }`}>
                    <p className="text-white/60 text-xs mb-2">Price Offer</p>
                    <p className="text-white text-2xl font-bold mb-1">{msg.offer_amount} DT</p>
                    {msg.offer_note && <p className="text-white/50 text-sm mb-3">{msg.offer_note}</p>}
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        msg.offer_status === 'accepted'   ? 'bg-[#22C55E]/20 text-[#4ADE80]' :
                        msg.offer_status === 'negotiating'? 'bg-yellow-500/20 text-yellow-400' :
                                                            'bg-white/10 text-white/60'
                      }`}>
                        {msg.offer_status === 'accepted' ? '✓ Accepted' :
                         msg.offer_status === 'negotiating' ? 'Negotiating' : 'Pending'}
                      </span>
                      <span className="text-white/40 text-xs">{formatTime(msg.timestamp)}</span>
                    </div>
                    {isClient && msg.offer_status === 'pending' && (
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => handleUpdateOffer(msg._id, 'accepted')}
                          className="flex-1 py-2 rounded-[20px] bg-[#22C55E] text-white text-sm font-semibold hover:bg-[#22C55E]/90 transition-all">
                          Accept Offer
                        </button>
                        <button onClick={() => handleUpdateOffer(msg._id, 'negotiating')}
                          className="flex-1 py-2 rounded-[20px] bg-[#1E293B] border border-white/20 text-white text-sm font-semibold hover:bg-white/10 transition-all">
                          Negotiate
                        </button>
                      </div>
                    )}
                    {msg.offer_status === 'negotiating' && (
                      <p className="text-yellow-400 text-xs mt-2 italic">Client wants to negotiate</p>
                    )}
                  </div>
                </div>
              )}

              {!isSystem && !isOffer && (
                <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-2`}>
                  <div className={`max-w-[75%] rounded-[20px] px-4 py-2.5 ${
                    isMine ? 'bg-[#22C55E] text-white' : 'bg-[#1E293B] text-white border border-white/10'
                  }`}>
                    <p className="text-sm leading-relaxed">{msg.message}</p>
                    <div className={`flex items-center justify-end gap-1 mt-1 ${isMine ? 'text-white/70' : 'text-white/40'}`}>
                      <span className="text-xs">{formatTime(msg.timestamp)}</span>
                      {isMine && (msg._optimistic
                        ? <div className="w-3 h-3 border border-white/40 border-t-transparent rounded-full animate-spin" />
                        : msg.is_read
                          ? <svg className="w-4 h-4 text-[#4ADE80]" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z"/>
                            </svg>
                          : null
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {isTyping && (
          <div className="flex justify-start mb-2">
            <div className="bg-[#1E293B] rounded-[20px] px-4 py-3 border border-white/10">
              <div className="flex gap-1">
                {[0, 150, 300].map(d => (
                  <div key={d} className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Confirm ── */}
      {canConfirm && (
        <div className="px-4 pb-2 flex-shrink-0">
          <button onClick={handleConfirm}
            className="w-full py-3 rounded-[20px] bg-[#22C55E] text-white font-semibold hover:bg-[#22C55E]/90 transition-all">
            Confirm Agreement
          </button>
        </div>
      )}

      {/* ── Summary Card ── */}
      {bothConfirmed && (
        <div className="mx-4 mb-4 bg-[#1E293B] rounded-[20px] border border-[#22C55E]/30 p-4 flex-shrink-0">
          <p className="text-[#4ADE80] font-semibold text-center mb-3">Agreement Summary</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-white/60">Service:</span>
              <span className="text-white">{roomData?.service_category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Agreed Price:</span>
              <span className="text-white font-semibold">{agreedPrice} DT</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Client:</span>
              <span className="text-white">{roomData?.room?.client_id === user?._id ? 'You' : otherName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Provider:</span>
              <span className="text-white">{roomData?.room?.provider_id === user?._id ? 'You' : otherName}</span>
            </div>
          </div>
          {isProvider && !isCompleted && (
            <button onClick={handleComplete}
              className="w-full mt-4 py-2.5 rounded-[20px] bg-[#22C55E] text-white font-semibold text-sm hover:bg-[#22C55E]/90 transition-all flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
              </svg>
              Mark Job as Complete
            </button>
          )}
          {isCompleted && (
            <div className="mt-4 flex items-center justify-center gap-2 text-[#4ADE80] text-sm font-semibold">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Job Completed
            </div>
          )}
        </div>
      )}

      {/* ── Rating ── */}
      {isCompleted && !hasRated && (
        <div className="mx-4 mb-4 bg-[#1E293B] rounded-[20px] border border-white/10 p-4 flex-shrink-0">
          <p className="text-white font-semibold text-center text-sm">Rate {otherName}</p>
          <p className="text-white/40 text-xs text-center mt-1 mb-4">How was your experience?</p>
          <div className="flex justify-center gap-3 mb-4">
            {[1,2,3,4,5].map(star => (
              <button key={star} onClick={() => setRatingScore(star)}>
                <svg className="w-8 h-8 transition-colors"
                  fill={star <= ratingScore ? '#22C55E' : 'none'}
                  stroke={star <= ratingScore ? '#22C55E' : '#ffffff40'}
                  viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                </svg>
              </button>
            ))}
          </div>
          <textarea value={ratingComment} onChange={e => setRatingComment(e.target.value)}
            placeholder="Leave a comment (optional)" rows={2}
            className="w-full bg-[#0F172A] border border-white/10 rounded-[12px] px-4 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-[#22C55E]/50 resize-none mb-3"/>
          <button onClick={handleSubmitRating} disabled={!ratingScore}
            className="w-full py-2.5 rounded-[20px] bg-[#22C55E] text-white font-semibold text-sm hover:bg-[#22C55E]/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
            Submit Rating
          </button>
        </div>
      )}

      {isCompleted && hasRated && (
        <div className="mx-4 mb-4 flex items-center justify-center gap-2 text-[#4ADE80] text-sm font-semibold py-3">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
          </svg>
          Thank you for your rating!
        </div>
      )}

      {/* ── Offer Panel (Provider) ── */}
      {isProvider && !bothConfirmed && !isCancelled && (
        <div className="border-t border-white/10 flex-shrink-0">
          <button
            onClick={() => {
              const next = !showOfferPanel;
              setShowOfferPanel(next);
              if (next && !priceStatsFetched && roomData?.service_category) {
                setPriceStatsFetched(true);
                api.get(`/ai/price-stats/${encodeURIComponent(roomData.service_category)}`)
                  .then(res => { if (res.data?.available) setPriceStats(res.data); })
                  .catch(() => {});
              }
            }}
            className="w-full px-4 py-2 text-left text-white/60 text-sm hover:text-white transition-colors flex items-center justify-between"
          >
            <span>Suggest a Price</span>
            <svg className={`w-4 h-4 transition-transform ${showOfferPanel ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
            </svg>
          </button>
          {showOfferPanel && (
            <div className="px-4 pb-4 space-y-3">
              {priceStats && (
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-[12px] bg-blue-500/8 border border-blue-500/20">
                  <span className="text-base mt-0.5">📊</span>
                  <div className="text-xs text-white/70">
                    <span className="text-white/90 font-semibold">On Khadamni</span>
                    <span className="text-white/40"> ({priceStats.count} similar jobs): </span>
                    <span className="text-[#4ADE80] font-semibold">{priceStats.min} – {priceStats.max} DT</span>
                    <span className="text-white/40"> · avg </span>
                    <span className="text-white font-semibold">{priceStats.avg} DT</span>
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <input type="number" value={offerAmount} onChange={e => setOfferAmount(e.target.value)}
                  placeholder="Amount"
                  className="flex-1 bg-[#1E293B] border border-white/10 rounded-[12px] px-4 py-2.5 text-white placeholder-white/40 focus:outline-none focus:border-[#22C55E]/50"/>
                <span className="flex items-center text-white/60 text-sm">DT</span>
              </div>
              <textarea value={offerNote} onChange={e => setOfferNote(e.target.value)}
                placeholder="Add a note (optional)" rows={2}
                className="w-full bg-[#1E293B] border border-white/10 rounded-[12px] px-4 py-2.5 text-white placeholder-white/40 focus:outline-none focus:border-[#22C55E]/50 resize-none"/>
              <button onClick={handleSendOffer}
                disabled={!offerAmount || isNaN(parseFloat(offerAmount))}
                className="w-full py-2.5 rounded-[20px] bg-[#22C55E] text-white font-semibold hover:bg-[#22C55E]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                Send Offer
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Pending waiting state ── */}
      {isPending && isClient && (
        <div className="border-t border-white/10 bg-[#0F172A] px-4 py-4 flex-shrink-0 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse flex-shrink-0" />
          <p className="text-white/40 text-sm">Waiting for the provider to accept your request...</p>
        </div>
      )}

      {/* ── Input Bar ── */}
      {!isCancelled && !isPending && (
        <div className="border-t border-white/10 bg-[#1E293B] px-4 py-3 flex-shrink-0">
          {isCompleted && (
            <p className="text-white/30 text-[11px] text-center mb-2">
              Job completed · Chat stays open in case you need anything
            </p>
          )}
          <div className="flex gap-2">
            <input type="text" value={inputText} onChange={handleInputChange} onKeyPress={handleKeyPress}
              placeholder={isCompleted ? 'Follow up if needed...' : 'Type a message...'}
              className="flex-1 bg-[#0F172A] border border-white/10 rounded-[20px] px-4 py-2.5 text-white placeholder-white/40 focus:outline-none focus:border-[#22C55E]/50"/>
            <button onClick={handleSendMessage} disabled={!inputText.trim()}
              className="px-4 py-2.5 rounded-[20px] bg-[#22C55E] text-white font-semibold hover:bg-[#22C55E]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ── Cancel Modal ── */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-[#1E293B] rounded-[20px] border border-white/10 p-6 max-w-sm w-full">
            <h3 className="text-white font-semibold text-lg mb-2">Cancel Request?</h3>
            <p className="text-white/60 text-sm mb-6">Are you sure? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2.5 rounded-[20px] bg-white/10 text-white font-semibold hover:bg-white/20 transition-all">
                Go Back
              </button>
              <button onClick={handleCancel}
                className="flex-1 py-2.5 rounded-[20px] bg-red-500 text-white font-semibold hover:bg-red-600 transition-all">
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
