import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import ThemeToggle from '../components/ThemeToggle';
import { getChatRoom, sendOffer, updateOfferStatus, confirmAgreement, cancelRequest } from '../api/chat';
import { completeRequest } from '../api/request';
import { submitRating, getJobRatings } from '../api/ratings';
import api from '../api/axios';

export default function ChatPage() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [roomData, setRoomData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const [showOfferPanel, setShowOfferPanel] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [offerNote, setOfferNote] = useState('');
  const [priceStats, setPriceStats] = useState(null);
  const [priceStatsFetched, setPriceStatsFetched] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [bothConfirmed, setBothConfirmed] = useState(false);
  const [userConfirmed, setUserConfirmed] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [ratingScore, setRatingScore] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const wsRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Stable refs so the WS onmessage handler can access latest values without re-creating the socket
  const userIdRef = useRef(user?._id);
  const navigateRef = useRef(navigate);
  useEffect(() => { userIdRef.current = user?._id; }, [user?._id]);
  useEffect(() => { navigateRef.current = navigate; }, [navigate]);

  // WebSocket — only re-creates if requestId changes
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.hostname}:8000/api/chat/ws/${requestId}?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);
    ws.onerror = () => setIsConnected(false);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case 'history':
          setMessages(data.messages);
          break;
        case 'text':
          setMessages(prev => [...prev, data.message]);
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
          break;
        case 'offer_update':
          setMessages(prev => prev.map(msg =>
            msg._id === data.message._id ? data.message : msg
          ));
          // When an offer is accepted, set agreed_price so the Confirm button appears
          if (data.message?.offer_status === 'accepted') {
            setRoomData(prev => prev ? {
              ...prev,
              room: { ...prev.room, agreed_price: data.message.offer_amount }
            } : prev);
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
          setMessages(prev => [...prev, {
            _id: Date.now().toString(),
            message_type: 'system',
            message: 'Both parties have confirmed the agreement',
            timestamp: new Date().toISOString(),
          }]);
          break;
        case 'cancelled':
          setMessages(prev => [...prev, {
            _id: Date.now().toString(),
            message_type: 'system',
            message: data.message,
            timestamp: new Date().toISOString(),
          }]);
          setTimeout(() => navigateRef.current('/map'), 3000);
          break;
        case 'job_completed':
          setIsCompleted(true);
          setBothConfirmed(true);
          break;
      }
    };

    return () => {
      ws.close();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [requestId]);

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const res = await getChatRoom(requestId);
        setRoomData(res.data);
        setMessages(res.data.messages || []);

        if (res.data.room?.status === 'confirmed') {
          setBothConfirmed(true);
        }
        if (res.data.request_status === 'completed') {
          setIsCompleted(true);
          setBothConfirmed(true);
          // Check if current user already submitted a rating for this job
          try {
            const ratingsRes = await getJobRatings(requestId);
            const alreadyRated = ratingsRes.data.some(r => r.rater_id === user?._id);
            if (alreadyRated) setHasRated(true);
          } catch {
            // ignore — worst case they see the rating form again
          }
        }
        if (user?._id === res.data.room?.client_id && res.data.room?.client_confirmed) {
          setUserConfirmed(true);
        }
        if (user?._id === res.data.room?.provider_id && res.data.room?.provider_confirmed) {
          setUserConfirmed(true);
        }
      } catch (err) {
        console.error('Failed to fetch chat room:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRoom();
  }, [requestId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputText.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    wsRef.current.send(JSON.stringify({
      type: 'text',
      content: inputText.trim(),
    }));

    setInputText('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);

    // Send typing indicator
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'typing' }));
    }
  };

  const handleSendOffer = async () => {
    if (!offerAmount || isNaN(parseFloat(offerAmount))) return;

    try {
      const res = await sendOffer(requestId, parseFloat(offerAmount), offerNote);

      // Broadcast offer via WebSocket
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'offer',
          message: res.data,
        }));
      }

      setOfferAmount('');
      setOfferNote('');
      setShowOfferPanel(false);
    } catch (err) {
      console.error('Failed to send offer:', err);
    }
  };

  const handleUpdateOffer = async (messageId, status) => {
    try {
      const res = await updateOfferStatus(requestId, messageId, status);

      // Broadcast offer update via WebSocket
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'offer_update',
          message: res.data,
        }));
      }
    } catch (err) {
      console.error('Failed to update offer:', err);
    }
  };

  const handleConfirm = async () => {
    try {
      const res = await confirmAgreement(requestId);
      setUserConfirmed(true);

      if (res.data.status === 'both_confirmed') {
        setBothConfirmed(true);
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'confirmed' }));
        }
      }
    } catch (err) {
      console.error('Failed to confirm:', err);
    }
  };

  const handleComplete = async () => {
    try {
      await completeRequest(requestId);
      setIsCompleted(true);
      wsRef.current?.send(JSON.stringify({ type: 'job_completed' }));
    } catch (err) {
      console.error('Failed to mark as complete:', err);
    }
  };

  const handleSubmitRating = async () => {
    if (!ratingScore) return;
    try {
      await submitRating({ job_id: requestId, score: ratingScore, comment: ratingComment });
      setHasRated(true);
    } catch (err) {
      console.error('Failed to submit rating:', err);
    }
  };

  const handleCancel = async () => {
    try {
      const res = await cancelRequest(requestId);

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'cancelled',
          message: res.data.message,
        }));
      }

      setShowCancelModal(false);
    } catch (err) {
      console.error('Failed to cancel:', err);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
    }
  };

  const shouldShowDateSeparator = (currentMsg, prevMsg) => {
    if (!prevMsg) return true;
    const currentDate = new Date(currentMsg.timestamp).toDateString();
    const prevDate = new Date(prevMsg.timestamp).toDateString();
    return currentDate !== prevDate;
  };

  const isMyMessage = (msg) => msg.sender_id === user?._id;

  const agreedPrice = roomData?.room?.agreed_price;
  const isProvider = user?.role === 'provider';
  const isClient = user?.role === 'client';
  const canConfirm = agreedPrice && !bothConfirmed && !userConfirmed;
  const isCancelled = roomData?.room?.status === 'cancelled';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <p className="text-white/50">Loading chat...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col">
      {/* Top Bar */}
      <div className="bg-[#1E293B] border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/requests"
            className="text-white/60 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <p className="text-white font-semibold text-sm">
              {roomData?.other_party_name || 'Chat'}
            </p>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-[#22C55E]/10 text-[#4ADE80] text-xs font-medium">
                {roomData?.service_category || 'Service'}
              </span>
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#22C55E] animate-pulse' : 'bg-gray-500'}`} />
                <span className={`text-xs ${isConnected ? 'text-[#4ADE80]' : 'text-gray-500'}`}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {!bothConfirmed && !isCancelled && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="px-3 py-1.5 rounded-[20px] bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-all duration-200"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Agreed Price Banner */}
      {agreedPrice && !bothConfirmed && (
        <div className="bg-[#22C55E]/10 border-b border-[#22C55E]/30 px-4 py-3">
          <p className="text-[#4ADE80] text-sm font-semibold text-center">
            Agreed Price: {agreedPrice} DT — Waiting for confirmation
          </p>
        </div>
      )}

      {/* Confirmed Banner */}
      {bothConfirmed && (
        <div className="bg-[#22C55E]/20 border-b border-[#22C55E]/40 px-4 py-3">
          <p className="text-[#4ADE80] text-sm font-semibold text-center">
            ✓ Agreement Confirmed
          </p>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg, index) => {
          const prevMsg = messages[index - 1];
          const showDate = shouldShowDateSeparator(msg, prevMsg);
          const isMine = isMyMessage(msg);
          const isSystem = msg.message_type === 'system';
          const isOffer = msg.message_type === 'offer';

          return (
            <div key={msg._id}>
              {/* Date Separator */}
              {showDate && (
                <div className="flex items-center justify-center my-4">
                  <div className="bg-white/10 px-3 py-1 rounded-full">
                    <span className="text-white/50 text-xs">{formatDate(msg.timestamp)}</span>
                  </div>
                </div>
              )}

              {/* System Message */}
              {isSystem && (
                <div className="flex justify-center my-2">
                  <p className="text-white/40 text-xs italic">{msg.message}</p>
                </div>
              )}

              {/* Offer Card */}
              {isOffer && (
                <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-3`}>
                  <div className={`max-w-[85%] rounded-[20px] p-4 ${
                    isMine ? 'bg-[#22C55E]/20 border border-[#22C55E]/40' : 'bg-[#1E293B] border border-white/10'
                  }`}>
                    <p className="text-white/60 text-xs mb-2">Price Offer</p>
                    <p className="text-white text-2xl font-bold mb-1">{msg.offer_amount} DT</p>
                    {msg.offer_note && (
                      <p className="text-white/50 text-sm mb-3">{msg.offer_note}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        msg.offer_status === 'accepted'
                          ? 'bg-[#22C55E]/20 text-[#4ADE80]'
                          : msg.offer_status === 'negotiating'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-white/10 text-white/60'
                      }`}>
                        {msg.offer_status === 'accepted' ? '✓ Accepted' :
                         msg.offer_status === 'negotiating' ? 'Negotiating' : 'Pending'}
                      </span>
                      <span className="text-white/40 text-xs">{formatTime(msg.timestamp)}</span>
                    </div>

                    {/* Client Actions */}
                    {isClient && msg.offer_status === 'pending' && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleUpdateOffer(msg._id, 'accepted')}
                          className="flex-1 py-2 rounded-[20px] bg-[#22C55E] text-white text-sm font-semibold hover:bg-[#22C55E]/90 transition-all duration-200"
                        >
                          Accept Offer
                        </button>
                        <button
                          onClick={() => handleUpdateOffer(msg._id, 'negotiating')}
                          className="flex-1 py-2 rounded-[20px] bg-[#1E293B] border border-white/20 text-white text-sm font-semibold hover:bg-white/10 transition-all duration-200"
                        >
                          Negotiate
                        </button>
                      </div>
                    )}

                    {/* Negotiating Status */}
                    {msg.offer_status === 'negotiating' && (
                      <p className="text-yellow-400 text-xs mt-2 italic">
                        Client wants to negotiate
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Regular Text Message */}
              {!isSystem && !isOffer && (
                <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-2`}>
                  <div className={`max-w-[75%] rounded-[20px] px-4 py-2.5 ${
                    isMine
                      ? 'bg-[#22C55E] text-white'
                      : 'bg-[#1E293B] text-white border border-white/10'
                  }`}>
                    <p className="text-sm leading-relaxed">{msg.message}</p>
                    <div className={`flex items-center justify-end gap-1 mt-1 ${isMine ? 'text-white/70' : 'text-white/40'}`}>
                      <span className="text-xs">{formatTime(msg.timestamp)}</span>
                      {isMine && msg.is_read && (
                        <svg className="w-4 h-4 text-[#4ADE80]" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start mb-2">
            <div className="bg-[#1E293B] rounded-[20px] px-4 py-3 border border-white/10">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Confirm Button */}
      {canConfirm && (
        <div className="px-4 pb-2">
          <button
            onClick={handleConfirm}
            className="w-full py-3 rounded-[20px] bg-[#22C55E] text-white font-semibold hover:bg-[#22C55E]/90 transition-all duration-200"
          >
            Confirm Agreement
          </button>
        </div>
      )}

      {/* Summary Card (when both confirmed) */}
      {bothConfirmed && (
        <div className="mx-4 mb-4 bg-[#1E293B] rounded-[20px] border border-[#22C55E]/30 p-4">
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
              <span className="text-white">{roomData?.room?.client_id === user?._id ? 'You' : roomData?.other_party_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Provider:</span>
              <span className="text-white">{roomData?.room?.provider_id === user?._id ? 'You' : roomData?.other_party_name}</span>
            </div>
          </div>

          {isProvider && !isCompleted && (
            <button
              onClick={handleComplete}
              className="w-full mt-4 py-2.5 rounded-[20px] bg-[#22C55E] text-white font-semibold text-sm hover:bg-[#22C55E]/90 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Mark Job as Complete
            </button>
          )}

          {isCompleted && (
            <div className="mt-4 flex items-center justify-center gap-2 text-[#4ADE80] text-sm font-semibold">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Job Completed
            </div>
          )}
        </div>
      )}

      {/* Rating Card — shown after job is completed, until user submits rating */}
      {isCompleted && !hasRated && (
        <div className="mx-4 mb-4 bg-[#1E293B] rounded-[20px] border border-white/10 p-4">
          <p className="text-white font-semibold text-center text-sm">
            Rate {roomData?.other_party_name}
          </p>
          <p className="text-white/40 text-xs text-center mt-1 mb-4">How was your experience?</p>

          {/* Stars */}
          <div className="flex justify-center gap-3 mb-4">
            {[1, 2, 3, 4, 5].map(star => (
              <button key={star} onClick={() => setRatingScore(star)}>
                <svg
                  className="w-8 h-8 transition-colors duration-150"
                  fill={star <= ratingScore ? '#22C55E' : 'none'}
                  stroke={star <= ratingScore ? '#22C55E' : '#ffffff40'}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                </svg>
              </button>
            ))}
          </div>

          {/* Comment */}
          <textarea
            value={ratingComment}
            onChange={e => setRatingComment(e.target.value)}
            placeholder="Leave a comment (optional)"
            rows={2}
            className="w-full bg-[#0F172A] border border-white/10 rounded-[12px] px-4 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-[#22C55E]/50 resize-none mb-3"
          />

          <button
            onClick={handleSubmitRating}
            disabled={!ratingScore}
            className="w-full py-2.5 rounded-[20px] bg-[#22C55E] text-white font-semibold text-sm hover:bg-[#22C55E]/90 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Submit Rating
          </button>
        </div>
      )}

      {/* Already rated confirmation */}
      {isCompleted && hasRated && (
        <div className="mx-4 mb-4 flex items-center justify-center gap-2 text-[#4ADE80] text-sm font-semibold py-3">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Thank you for your rating!
        </div>
      )}

      {/* Offer Panel (Provider Only) */}
      {isProvider && !bothConfirmed && !isCancelled && (
        <div className="border-t border-white/10">
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
            <svg
              className={`w-4 h-4 transition-transform ${showOfferPanel ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showOfferPanel && (
            <div className="px-4 pb-4 space-y-3">
              {/* Platform price stats hint */}
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
                <input
                  type="number"
                  value={offerAmount}
                  onChange={(e) => setOfferAmount(e.target.value)}
                  placeholder="Amount"
                  className="flex-1 bg-[#1E293B] border border-white/10 rounded-[12px] px-4 py-2.5 text-white placeholder-white/40 focus:outline-none focus:border-[#22C55E]/50"
                />
                <span className="flex items-center text-white/60 text-sm">DT</span>
              </div>
              <textarea
                value={offerNote}
                onChange={(e) => setOfferNote(e.target.value)}
                placeholder="Add a note (optional)"
                rows={2}
                className="w-full bg-[#1E293B] border border-white/10 rounded-[12px] px-4 py-2.5 text-white placeholder-white/40 focus:outline-none focus:border-[#22C55E]/50 resize-none"
              />
              <button
                onClick={handleSendOffer}
                disabled={!offerAmount || isNaN(parseFloat(offerAmount))}
                className="w-full py-2.5 rounded-[20px] bg-[#22C55E] text-white font-semibold hover:bg-[#22C55E]/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send Offer
              </button>
            </div>
          )}
        </div>
      )}

      {/* Input Bar */}
      {!bothConfirmed && !isCancelled && (
        <div className="border-t border-white/10 bg-[#1E293B] px-4 py-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1 bg-[#0F172A] border border-white/10 rounded-[20px] px-4 py-2.5 text-white placeholder-white/40 focus:outline-none focus:border-[#22C55E]/50"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim()}
              className="px-4 py-2.5 rounded-[20px] bg-[#22C55E] text-white font-semibold hover:bg-[#22C55E]/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-[#1E293B] rounded-[20px] border border-white/10 p-6 max-w-sm w-full">
            <h3 className="text-white font-semibold text-lg mb-2">Cancel Request?</h3>
            <p className="text-white/60 text-sm mb-6">
              Are you sure you want to cancel this request? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2.5 rounded-[20px] bg-white/10 text-white font-semibold hover:bg-white/20 transition-all duration-200"
              >
                Go Back
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 py-2.5 rounded-[20px] bg-red-500 text-white font-semibold hover:bg-red-600 transition-all duration-200"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
