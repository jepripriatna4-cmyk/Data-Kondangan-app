import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  isDanger?: boolean;
  isProcessing?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Hapus',
  isDanger = true,
  isProcessing = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="confirm-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md rounded-2xl bg-[#0d1a38] border border-blue-500/30 p-6 shadow-2xl shadow-blue-950/60">
        {/* Header with Danger/Warning Icon */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                isDanger
                  ? 'bg-rose-950/70 border-rose-600/40 text-rose-400'
                  : 'bg-blue-950/70 border-blue-600/40 text-sky-400'
              }`}
            >
              {isDanger ? (
                <Trash2 className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message */}
        <p className="mt-3.5 text-sm text-blue-200/90 leading-relaxed">{message}</p>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            id="btn-cancel-confirm"
            type="button"
            disabled={isProcessing}
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-blue-300 hover:text-white bg-blue-950/60 hover:bg-blue-900/60 border border-blue-800/40 transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            id="btn-action-confirm"
            type="button"
            disabled={isProcessing}
            onClick={onConfirm}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white transition-all shadow-md cursor-pointer disabled:opacity-50 ${
              isDanger
                ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30'
            }`}
          >
            {isDanger && <Trash2 className="w-4 h-4" />}
            <span>{isProcessing ? 'Memproses...' : confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
