import React from 'react';
import { useToast } from '../context/ToastContext.js';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      id="toast-container"
      className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-[calc(100vw-2.5rem)] pointer-events-none"
    >
      {toasts.map((toast) => {
        let borderClass = 'border-blue-500/30';
        let bgClass = 'bg-[#0e1c3e]/95';
        let textClass = 'text-blue-100';
        let IconComponent = CheckCircle2;
        let iconColor = 'text-emerald-400';

        if (toast.type === 'success') {
          borderClass = 'border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.2)]';
          IconComponent = CheckCircle2;
          iconColor = 'text-emerald-400';
        } else if (toast.type === 'error') {
          borderClass = 'border-rose-500/40 shadow-[0_0_20px_rgba(244,63,94,0.2)]';
          IconComponent = AlertTriangle;
          iconColor = 'text-rose-400';
        } else {
          borderClass = 'border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.2)]';
          IconComponent = Info;
          iconColor = 'text-sky-400';
        }

        return (
          <div
            key={toast.id}
            id={`toast-${toast.id}`}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md transition-all duration-300 transform translate-y-0 shadow-lg ${bgClass} ${borderClass}`}
          >
            <IconComponent className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
            <div className={`flex-1 text-sm font-medium ${textClass}`}>
              {toast.message}
            </div>
            <button
              id={`toast-close-${toast.id}`}
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white p-1 transition-colors rounded-lg hover:bg-white/10"
              aria-label="Tutup notifikasi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
