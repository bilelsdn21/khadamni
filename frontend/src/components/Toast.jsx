import { createContext, useContext, useState, useCallback } from 'react';

const ToastCtx = createContext(null);
let _toastId = 0;

const TYPE_STYLES = {
  success: { bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.35)',  color: '#4ADE80',           icon: '✓' },
  error:   { bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.35)',  color: '#F87171',           icon: '✕' },
  info:    { bg: 'rgba(30,41,59,0.96)',   border: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)', icon: 'ℹ' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++_toastId;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  const dismiss = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div style={{
        position: 'fixed', bottom: 20, right: 20, zIndex: 9997,
        display: 'flex', flexDirection: 'column', gap: 8,
        pointerEvents: 'none', maxWidth: 320,
      }}>
        {toasts.map(t => {
          const s = TYPE_STYLES[t.type] || TYPE_STYLES.info;
          return (
            <div
              key={t.id}
              onClick={() => dismiss(t.id)}
              style={{
                pointerEvents: 'auto',
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '10px 14px',
                borderRadius: 14,
                border: `1px solid ${s.border}`,
                background: s.bg,
                color: s.color,
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                backdropFilter: 'blur(16px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
                transition: 'opacity 0.2s',
              }}
            >
              <span style={{ flexShrink: 0, fontWeight: 700, fontSize: 13 }}>{s.icon}</span>
              <span style={{ lineHeight: '1.4' }}>{t.message}</span>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}

/** Returns a toast(message, type?, duration?) function. Safe to call even outside provider (no-op). */
export function useToast() {
  return useContext(ToastCtx) || (() => {});
}
