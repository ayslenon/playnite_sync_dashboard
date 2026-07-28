import React, { createContext, useCallback, useContext, useState, useEffect } from 'react';
import { X } from 'lucide-react';

const ToastContext = createContext(null);

let toastId = 0;

const EMOJIS = {
  success: '\u2705',
  error: '\u274C',
  info: '\u2139\uFE0F',
};

const COLORS = {
  success: {
    bg: 'bg-zinc-900',
    border: 'border-emerald-600',
    text: 'text-emerald-300',
  },
  error: {
    bg: 'bg-zinc-900',
    border: 'border-red-600',
    text: 'text-red-300',
  },
  info: {
    bg: 'bg-zinc-900',
    border: 'border-indigo-600',
    text: 'text-indigo-300',
  },
};

function ToastItem({ toast, onRemove }) {
  const c = COLORS[toast.type] || COLORS.info;

  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast, onRemove]);

  return (
    <div
      className={`flex items-center space-x-2.5 px-4 py-3 rounded-xl border shadow-2xl ${c.bg} ${c.border} animate-slide-in`}
      style={{ minWidth: 300, maxWidth: 440, boxShadow: '0 8px 32px rgba(0,0,0,.5)' }}
    >
      <span className="text-base flex-shrink-0">{EMOJIS[toast.type] || EMOJIS.info}</span>
      <p className={`text-sm font-medium leading-snug flex-1 ${c.text}`}>{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-zinc-600 hover:text-zinc-300 p-0.5 flex-shrink-0 transition"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col space-y-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onRemove={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
