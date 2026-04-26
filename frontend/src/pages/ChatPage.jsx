import { useParams, useNavigate } from 'react-router-dom';
import ChatPanel from '../components/ChatPanel';

export default function ChatPage() {
  const { requestId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="h-screen bg-[#0F172A] flex flex-col">
      {/* Back bar */}
      <div className="bg-[#1E293B] border-b border-white/10 px-4 py-3 flex items-center gap-3 flex-shrink-0 md:hidden">
        <button onClick={() => navigate(-1)} className="text-white/60 hover:text-white transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        <span className="text-white/60 text-sm">Back</span>
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-hidden">
        <ChatPanel key={requestId} requestId={requestId} />
      </div>
    </div>
  );
}
