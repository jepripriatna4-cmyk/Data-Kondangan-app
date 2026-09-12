import React, { useState, useEffect } from 'react';
import { KondanganItem } from '../types.js';
import { User, MapPin, Banknote, Gift, X, Save } from 'lucide-react';
import { formatRupiahInputValue, parseRupiahInput } from '../lib/formatters.js';

interface EditKondanganModalProps {
  item: KondanganItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    id: string,
    data: {
      nama: string;
      alamat: string;
      jumlah_kondangan: number;
      sokongan: string;
    }
  ) => Promise<void>;
}

export const EditKondanganModal: React.FC<EditKondanganModalProps> = ({
  item,
  isOpen,
  onClose,
  onSave,
}) => {
  const [nama, setNama] = useState('');
  const [alamat, setAlamat] = useState('');
  const [jumlahDisplay, setJumlahDisplay] = useState('');
  const [sokongan, setSokongan] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (item) {
      setNama(item.nama);
      setAlamat(item.alamat);
      setJumlahDisplay(formatRupiahInputValue(item.jumlah_kondangan));
      setSokongan(item.sokongan || '');
      setErrorMsg('');
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!nama.trim()) {
      setErrorMsg('Nama wajib diisi.');
      return;
    }

    if (!alamat.trim()) {
      setErrorMsg('Alamat / Kota wajib diisi.');
      return;
    }

    const nominal = parseRupiahInput(jumlahDisplay);
    if (nominal < 0) {
      setErrorMsg('Jumlah nominal tidak valid.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(item.id, {
        nama: nama.trim(),
        alamat: alamat.trim(),
        jumlah_kondangan: nominal,
        sokongan: sokongan.trim(),
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memperbarui catatan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="modal-edit-kondangan"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-[#0d1a38] border border-blue-500/30 p-6 shadow-2xl shadow-blue-950/60 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-blue-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-sky-400">
              <span className="text-sm">✏️</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Edit Catatan</h3>
              <p className="text-xs text-blue-200/70">Perbarui informasi data kondangan</p>
            </div>
          </div>

          <button
            id="btn-close-edit-modal"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-200 text-xs font-medium">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-white uppercase tracking-wider mb-1">
              Nama <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-blue-300">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Nama tamu"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#091226] border border-blue-800/60 text-white placeholder:text-blue-300/40 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white uppercase tracking-wider mb-1">
              Alamat / Kota <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-blue-300">
                <MapPin className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={alamat}
                onChange={(e) => setAlamat(e.target.value)}
                placeholder="Alamat atau kota asal"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#091226] border border-blue-800/60 text-white placeholder:text-blue-300/40 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white uppercase tracking-wider mb-1">
              Jumlah Kondangan (Rp) <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-400">
                <Banknote className="w-4 h-4" />
              </div>
              <input
                type="text"
                inputMode="numeric"
                required
                value={jumlahDisplay}
                onChange={(e) => setJumlahDisplay(formatRupiahInputValue(e.target.value))}
                placeholder="Nominal uang kondangan"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#091226] border border-blue-800/60 text-emerald-400 font-bold placeholder:text-blue-300/40 text-sm focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white uppercase tracking-wider mb-1">
              Sokongan (Hadiah / Barang)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-cyan-400">
                <Gift className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={sokongan}
                onChange={(e) => setSokongan(e.target.value)}
                placeholder="Contoh: Beras 5 kg, Sembako, Kado Mixer"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#091226] border border-blue-800/60 text-white placeholder:text-blue-300/40 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-blue-900/50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-blue-300 hover:text-white bg-blue-950/60 hover:bg-blue-900/60 border border-blue-800/40 transition-colors"
            >
              Batal
            </button>
            <button
              id="btn-save-edit"
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/30 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
