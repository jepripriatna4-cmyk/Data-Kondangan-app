import React from 'react';
import { KondanganItem } from '../types.js';
import { formatRupiah } from '../lib/formatters.js';
import { MapPin, Banknote, Gift, Pencil, Trash2, CheckSquare, Square } from 'lucide-react';

interface KondanganCardProps {
  item: KondanganItem;
  index: number;
  onToggleCheck: (id: string) => void;
  onEdit: (item: KondanganItem) => void;
  onDelete: (item: KondanganItem) => void;
}

export const KondanganCard: React.FC<KondanganCardProps> = ({
  item,
  index,
  onToggleCheck,
  onEdit,
  onDelete,
}) => {
  return (
    <div
      id={`kondangan-card-${item.id}`}
      className={`group relative rounded-2xl p-4 sm:p-5 transition-all duration-200 border ${
        item.status_cek
          ? 'bg-[#0a1530]/70 border-emerald-500/30 shadow-md shadow-emerald-950/20'
          : 'bg-[#0d1a38] border-blue-500/20 hover:border-blue-400/40 shadow-lg shadow-blue-950/30'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: Checkbox + Number + Details */}
        <div className="flex items-start gap-3.5 flex-1 min-w-0">
          {/* Checkbox */}
          <button
            id={`btn-check-${item.id}`}
            type="button"
            onClick={() => onToggleCheck(item.id)}
            className="mt-0.5 text-blue-400 hover:text-emerald-400 focus:outline-none transition-colors shrink-0 p-1 rounded-lg hover:bg-blue-900/30"
            title={item.status_cek ? 'Tandai belum dicek' : 'Tandai sudah dicek'}
          >
            {item.status_cek ? (
              <CheckSquare className="w-5 h-5 text-emerald-400" />
            ) : (
              <Square className="w-5 h-5 text-blue-400/60 group-hover:text-blue-300" />
            )}
          </button>

          {/* Details */}
          <div className="flex-1 min-w-0">
            {/* Number Tag & Name */}
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-950/90 border border-blue-800/60 text-blue-300">
                No. {item.nomor_urut ?? (index + 1)}
              </span>
              {item.status_cek && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/30 text-emerald-300">
                  Sudah Dicek
                </span>
              )}
            </div>

            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight break-words">
              {item.nama}
            </h3>

            {/* Address */}
            <div className="flex items-center gap-1.5 mt-1 text-xs sm:text-sm text-blue-200/80">
              <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="truncate">{item.alamat}</span>
            </div>

            {/* Money Amount */}
            <div className="flex items-center gap-2 mt-2.5">
              <span className="text-xs font-medium text-blue-300">Jumlah:</span>
              <span className="text-base sm:text-lg font-black text-emerald-400 flex items-center gap-1">
                <Banknote className="w-4 h-4 text-emerald-400 inline" />
                {formatRupiah(item.jumlah_kondangan)}
              </span>
            </div>

            {/* Sokongan (Optional) */}
            {item.sokongan && item.sokongan.trim() && (
              <div className="mt-2 flex items-start gap-1.5 p-2 rounded-xl bg-blue-950/60 border border-cyan-500/25 text-xs text-cyan-200">
                <Gift className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="font-semibold text-cyan-300">Sokongan: </span>
                  <span className="text-white font-medium">{item.sokongan}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Action Buttons (Edit & Delete) */}
        <div className="flex flex-col sm:flex-row items-center gap-1.5 shrink-0 pt-0.5">
          <button
            id={`btn-edit-${item.id}`}
            type="button"
            onClick={() => onEdit(item)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-sky-300 hover:text-white bg-blue-900/40 hover:bg-blue-600 border border-blue-700/50 transition-all duration-200 shadow-sm"
            title="Edit catatan"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Edit</span>
          </button>

          <button
            id={`btn-delete-${item.id}`}
            type="button"
            onClick={() => onDelete(item)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-600 border border-rose-800/40 transition-all duration-200 shadow-sm"
            title="Hapus catatan"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Hapus</span>
          </button>
        </div>
      </div>
    </div>
  );
};
