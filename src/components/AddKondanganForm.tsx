import React, { useState } from 'react';
import { User, MapPin, Banknote, Gift, Save, Sparkles } from 'lucide-react';
import { formatRupiahInputValue, parseRupiahInput } from '../lib/formatters.js';

interface AddKondanganFormProps {
  onSuccess: (data: {
    nama: string;
    alamat: string;
    jumlah_kondangan: number;
    sokongan?: string;
  }) => Promise<void>;
}

export const AddKondanganForm: React.FC<AddKondanganFormProps> = ({ onSuccess }) => {
  const [nama, setNama] = useState('');
  const [alamat, setAlamat] = useState('');
  const [jumlahDisplay, setJumlahDisplay] = useState('');
  const [sokongan, setSokongan] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleJumlahChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const formatted = formatRupiahInputValue(raw);
    setJumlahDisplay(formatted);
  };

  const handleQuickNominal = (value: number) => {
    setJumlahDisplay(formatRupiahInputValue(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!nama.trim()) {
      setErrorMessage('Nama wajib diisi.');
      return;
    }

    if (!alamat.trim()) {
      setErrorMessage('Alamat / Kota wajib diisi.');
      return;
    }

    const nominal = parseRupiahInput(jumlahDisplay);
    if (!jumlahDisplay.trim() || nominal <= 0) {
      setErrorMessage('Jumlah kondangan (Rp) wajib diisi dengan nominal yang benar.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSuccess({
        nama: nama.trim(),
        alamat: alamat.trim(),
        jumlah_kondangan: nominal,
        sokongan: sokongan.trim(),
      });

      // Clear all form inputs immediately on success so user can add next record right away
      setNama('');
      setAlamat('');
      setJumlahDisplay('');
      setSokongan('');
      setErrorMessage('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menyimpan catatan. Silakan periksa kembali.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="section-form-tambah"
      className="rounded-2xl p-5 sm:p-6 bg-[#0c1836] border border-blue-500/25 shadow-xl shadow-blue-950/50"
    >
      {/* Form Header with Status Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-5 border-b border-blue-900/40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>Tambah Catatan Baru</span>
            </h2>
            <p className="text-xs text-blue-200/70">
              Catat amplop dan bingkisan sokongan tamu
            </p>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-950/80 border border-blue-700/40 text-xs font-semibold text-blue-200 self-start sm:self-auto">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-emerald-300">● Siap Menyimpan</span>
        </div>
      </div>

      {/* Error notification inside form */}
      {errorMessage && (
        <div
          id="form-error-alert"
          className="mt-4 p-3.5 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-200 text-xs sm:text-sm font-medium flex items-center gap-2"
        >
          <span className="text-base">⚠️</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Form Fields */}
      <form onSubmit={handleSubmit} className="mt-5 space-y-4 sm:space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {/* FIELD 1: NAMA */}
          <div>
            <label
              htmlFor="input-nama"
              className="block text-xs font-semibold text-white uppercase tracking-wider mb-1.5"
            >
              Nama <span className="text-rose-400 font-bold">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-blue-300">
                <User className="w-4 h-4" />
              </div>
              <input
                id="input-nama"
                type="text"
                required
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Contoh: Budi Santoso"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#091226] border border-blue-800/60 text-white placeholder:text-blue-300/40 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
              />
            </div>
          </div>

          {/* FIELD 2: ALAMAT / KOTA */}
          <div>
            <label
              htmlFor="input-alamat"
              className="block text-xs font-semibold text-white uppercase tracking-wider mb-1.5"
            >
              Alamat / Kota <span className="text-rose-400 font-bold">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-blue-300">
                <MapPin className="w-4 h-4" />
              </div>
              <input
                id="input-alamat"
                type="text"
                required
                value={alamat}
                onChange={(e) => setAlamat(e.target.value)}
                placeholder="Contoh: Jl. Mawar No. 12, Bandung"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#091226] border border-blue-800/60 text-white placeholder:text-blue-300/40 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {/* FIELD 3: JUMLAH KONDANGAN (RP) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="input-jumlah"
                className="block text-xs font-semibold text-white uppercase tracking-wider"
              >
                Jumlah Kondangan (Rp) <span className="text-rose-400 font-bold">*</span>
              </label>
              <span className="text-[11px] text-emerald-400 font-medium">
                {jumlahDisplay ? 'Nominal aktif' : 'Wajib diisi'}
              </span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-400">
                <Banknote className="w-4 h-4" />
              </div>
              <input
                id="input-jumlah"
                type="text"
                inputMode="numeric"
                required
                value={jumlahDisplay}
                onChange={handleJumlahChange}
                placeholder="Contoh: 100.000"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#091226] border border-blue-800/60 text-emerald-400 font-bold placeholder:text-blue-300/40 text-base focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-inner"
              />
            </div>

            {/* Quick Nominal Pill Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2 text-xs">
              <span className="text-[11px] text-blue-300/80 font-medium shrink-0">Cepat:</span>
              {[20000, 25000, 30000, 35000, 50000, 100000, 200000].map((nominal) => (
                <button
                  key={nominal}
                  type="button"
                  onClick={() => handleQuickNominal(nominal)}
                  className="px-2.5 py-1 rounded-lg bg-blue-950/80 hover:bg-blue-900 border border-blue-800/60 text-blue-200 text-[11px] font-medium transition-all shrink-0 active:scale-95 cursor-pointer shadow-xs"
                >
                  {(nominal / 1000).toLocaleString('id-ID')}rb
                </button>
              ))}
            </div>
          </div>

          {/* FIELD 4: SOKONGAN */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="input-sokongan"
                className="block text-xs font-semibold text-white uppercase tracking-wider"
              >
                Sokongan
              </label>
              <span className="text-[11px] text-cyan-300 font-medium">
                Opsional • Hadiah / Barang
              </span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-cyan-400">
                <Gift className="w-4 h-4" />
              </div>
              <input
                id="input-sokongan"
                type="text"
                value={sokongan}
                onChange={(e) => setSokongan(e.target.value)}
                placeholder="Contoh: Beras 5 kg, Sembako, Kado Mixer, dll."
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#091226] border border-blue-800/60 text-white placeholder:text-blue-300/40 text-sm focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all shadow-inner"
              />
            </div>
            <p className="text-[11px] text-blue-300/60 mt-1.5">
              Tuliskan nama barang atau sembako yang diberikan sebagai sokongan
            </p>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="pt-2">
          <button
            id="btn-simpan-catatan"
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto min-w-[200px] flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-sm tracking-wide shadow-lg shadow-blue-600/30 hover:shadow-blue-500/40 border border-blue-400/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? 'Menyimpan...' : '💾 Simpan'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
