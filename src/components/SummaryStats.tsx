import React, { useState } from 'react';
import { KondanganStats } from '../types.js';
import { formatRupiah } from '../lib/formatters.js';
import { FileText, Wallet, Gift, CheckCircle2, Clock, ChevronDown, ChevronUp } from 'lucide-react';

interface SummaryStatsProps {
  stats: KondanganStats;
}

export const SummaryStats: React.FC<SummaryStatsProps> = ({ stats }) => {
  const [showAllSokongan, setShowAllSokongan] = useState(false);

  const displayedSokongan = showAllSokongan
    ? stats.sokonganSummary
    : stats.sokonganSummary.slice(0, 4);

  return (
    <div id="summary-stats-section" className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Total Catatan Card */}
      <div
        id="card-total-catatan"
        className="relative overflow-hidden rounded-2xl p-5 bg-[#0d1a38] border border-blue-500/20 shadow-lg shadow-blue-950/40 flex flex-col justify-between"
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-300 uppercase tracking-wider">
              <FileText className="w-4 h-4 text-sky-400" />
              <span>Total Catatan</span>
            </div>
            <div className="mt-2 text-3xl font-extrabold text-white tracking-tight">
              {stats.totalCatatan.toLocaleString('id-ID')}
              <span className="text-sm font-normal text-blue-300/70 ml-1.5">orang</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-sky-400">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        {/* Sub-status counts */}
        <div className="mt-4 pt-3 border-t border-blue-900/40 flex items-center justify-between text-xs text-blue-200">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sudah Cek: <strong className="text-white font-semibold">{stats.totalChecked}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Belum: <strong className="text-white font-semibold">{stats.totalUnchecked}</strong></span>
          </div>
        </div>
      </div>

      {/* Total Uang Kondangan Card */}
      <div
        id="card-total-kondangan"
        className="relative overflow-hidden rounded-2xl p-5 bg-[#0d1a38] border border-blue-500/20 shadow-lg shadow-blue-950/40 flex flex-col justify-between"
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-300 uppercase tracking-wider">
              <Wallet className="w-4 h-4 text-emerald-400" />
              <span>Total Uang Kondangan</span>
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
              {formatRupiah(stats.totalKondangan)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-blue-900/40 text-xs text-blue-300/80">
          Akumulasi total nominal uang amplop dari semua tamu
        </div>
      </div>

      {/* Total Sokongan Card */}
      <div
        id="card-total-sokongan"
        className="relative overflow-hidden rounded-2xl p-5 bg-[#0d1a38] border border-blue-500/20 shadow-lg shadow-blue-950/40 flex flex-col justify-between"
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-300 uppercase tracking-wider">
              <Gift className="w-4 h-4 text-cyan-400" />
              <span>Daftar Sokongan (Barang)</span>
            </div>
            <div className="mt-2 text-3xl font-extrabold text-cyan-300 tracking-tight">
              {stats.sokonganSummary.length}
              <span className="text-sm font-normal text-blue-300/70 ml-1.5">jenis barang</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Gift className="w-5 h-5" />
          </div>
        </div>

        {/* Sokongan Chips */}
        <div className="mt-4 pt-3 border-t border-blue-900/40">
          {stats.sokonganSummary.length === 0 ? (
            <p className="text-xs text-blue-300/60 italic">Belum ada barang sokongan yang dicatat</p>
          ) : (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                {displayedSokongan.map((item, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-950/80 text-cyan-200 border border-cyan-500/30 shadow-sm"
                  >
                    <span>🎁</span>
                    <span className="truncate max-w-[140px]">{item.nama_barang}</span>
                    {item.count > 1 && (
                      <span className="ml-0.5 px-1 py-0.2 rounded bg-cyan-900/60 text-[10px] text-cyan-300">
                        {item.count}x
                      </span>
                    )}
                  </span>
                ))}
              </div>

              {stats.sokonganSummary.length > 4 && (
                <button
                  type="button"
                  onClick={() => setShowAllSokongan(!showAllSokongan)}
                  className="text-[11px] font-medium text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors"
                >
                  {showAllSokongan ? (
                    <>
                      <ChevronUp className="w-3 h-3" /> Sembunyikan sebagian
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3" /> Lihat semua ({stats.sokonganSummary.length} jenis)
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
