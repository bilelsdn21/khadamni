import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const FAQ = [
  {
    q: 'How do I find and hire a provider?',
    a: 'Open the Map, browse available providers near you or switch to the Remote tab for online services. Click a provider\'s marker or card to view their profile, then tap "Request Service" to send them a job request with a description of what you need.',
  },
  {
    q: 'How does pricing work?',
    a: 'After a provider accepts your request, you can negotiate the price in the chat via the "Make Offer" button. Both parties must confirm the agreed price before the job starts. The platform shows real price ranges based on past jobs to guide your negotiation.',
  },
  {
    q: 'Can I cancel a request?',
    a: 'Yes — you can cancel any request before both parties confirm the price. Open the chat for that request and tap the Cancel button. Once a price is mutually confirmed, the job is considered locked in.',
  },
  {
    q: 'How do I know a provider is trustworthy?',
    a: 'Every provider has a public profile with their rating, number of completed jobs, and client reviews. You can view their portfolio and service categories before sending a request. Providers are also subject to moderation if disputes are reported.',
  },
  {
    q: 'What happens if there is a dispute?',
    a: 'If something goes wrong, use the "Report" button in the chat. Our AI system will analyse the conversation and generate a dispute summary. A moderator then reviews the report and takes appropriate action (warning, suspension, or resolution note).',
  },
  {
    q: 'How do I track the provider\'s location?',
    a: 'Once a job is in progress, a "Track" button appears in the chat. Tapping it opens a live map showing the provider\'s real-time location as they travel to you.',
  },
  {
    q: 'How do I update my profile or availability?',
    a: 'Go to My Profile from the side menu. Providers can edit their service categories, hourly rate, bio, and portfolio. You can also toggle your availability on/off directly from the side drawer without opening your profile.',
  },
];

function AccordionItem({ item, isOpen, onToggle }) {
  return (
    <div className={`rounded-[16px] border transition-colors duration-200 ${isOpen ? 'border-[#22C55E]/30 bg-[#22C55E]/5' : 'border-white/8 bg-[#1E293B]'}`}>
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left gap-3"
        onClick={onToggle}
      >
        <span className={`text-sm font-semibold transition-colors ${isOpen ? 'text-[#4ADE80]' : 'text-white/90'}`}>{item.q}</span>
        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${isOpen ? 'bg-[#22C55E]/20 text-[#4ADE80]' : 'bg-white/5 text-white/40'}`}>
          <svg className={`w-3.5 h-3.5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      {isOpen && (
        <div className="px-5 pb-4">
          <p className="text-white/60 text-sm leading-relaxed">{item.a}</p>
        </div>
      )}
    </div>
  );
}

export default function SupportPage() {
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (i) => setOpenIndex(prev => prev === i ? null : i);

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10 bg-[#1E293B]">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-[14px] flex items-center justify-center text-white/60 hover:bg-white/10 hover:text-white transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-white font-bold text-lg leading-none">Help & Support</h1>
          <p className="text-white/40 text-xs mt-0.5">Frequently asked questions</p>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 max-w-lg w-full mx-auto px-4 py-6 space-y-2.5">
        {/* FAQ */}
        {FAQ.map((item, i) => (
          <AccordionItem
            key={i}
            item={item}
            isOpen={openIndex === i}
            onToggle={() => toggle(i)}
          />
        ))}

        {/* Divider */}
        <div className="pt-4 pb-2 flex items-center gap-3">
          <div className="flex-1 h-px bg-white/8" />
          <span className="text-white/25 text-xs">Still need help?</span>
          <div className="flex-1 h-px bg-white/8" />
        </div>

        {/* Contact card */}
        <div className="rounded-[20px] bg-[#1E293B] border border-white/8 p-5 flex flex-col items-center gap-4 text-center">
          <div className="w-12 h-12 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/20 flex items-center justify-center text-2xl">
            ✉️
          </div>
          <div>
            <p className="text-white font-semibold text-sm">Contact our team</p>
            <p className="text-white/40 text-xs mt-1">We usually reply within 24 hours</p>
          </div>
          <a
            href="mailto:khadamni303@gmail.com"
            className="w-full py-3 rounded-[14px] bg-[#22C55E] text-white font-semibold text-sm text-center hover:bg-[#16A34A] transition-colors"
          >
            Send us an email
          </a>
          <p className="text-white/25 text-[11px]">khadamni303@gmail.com</p>
        </div>
      </div>
    </div>
  );
}
