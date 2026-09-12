import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { api } from '../lib/api.js';
import { FilterStatus, KondanganItem, KondanganStats } from '../types.js';
import { Navbar } from '../components/Navbar.js';
import { SummaryStats } from '../components/SummaryStats.js';
import { AddKondanganForm } from '../components/AddKondanganForm.js';
import { KondanganCard } from '../components/KondanganCard.js';
import { EditKondanganModal } from '../components/EditKondanganModal.js';
import { ConfirmModal } from '../components/ConfirmModal.js';
import { Footer } from '../components/Footer.js';
import {
  Search,
  CheckCircle2,
  Clock,
  ListFilter,
  Trash2,
  Plus,
  FileSpreadsheet,
  RefreshCw,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [items, setItems] = useState<KondanganItem[]>([]);
  const [stats, setStats] = useState<KondanganStats>({
    totalCatatan: 0,
    totalKondangan: 0,
    totalChecked: 0,
    totalUnchecked: 0,
    sokonganSummary: [],
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals state
  const [editingItem, setEditingItem] = useState<KondanganItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [deletingItem, setDeletingItem] = useState<KondanganItem | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingSingle, setIsDeletingSingle] = useState(false);

  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  // Fetch data
  const fetchData = useCallback(
    async (showSilent = false) => {
      if (!showSilent) setIsLoading(true);
      else setIsRefreshing(true);

      try {
        const res = await api.getKondangan(searchQuery, activeFilter);
        if (res.data) {
          setItems(res.data);
        }
        if (res.stats) {
          setStats(res.stats);
        }
      } catch (err: any) {
        showToast(err.message || '⚠️ Maaf, terjadi kesalahan. Silakan coba lagi.', 'error');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [searchQuery, activeFilter, showToast]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Add Form submission
  const handleAddKondangan = async (data: {
    nama: string;
    alamat: string;
    jumlah_kondangan: number;
    sokongan?: string;
  }) => {
    try {
      const res = await api.createKondangan(data);
      showToast('✓ Catatan berhasil disimpan.', 'success');

      // Clear search query and reset filter to 'all' so new item is immediately visible
      setSearchQuery('');
      setActiveFilter('all');

      // Immediately update items and stats in state from response
      if (res.items) {
        setItems(res.items);
      } else if (res.data) {
        setItems((prev) => [...prev, res.data!]);
      }

      if (res.stats) {
        setStats(res.stats);
      }
    } catch (err: any) {
      showToast(err.message || '⚠️ Maaf, terjadi kesalahan saat menyimpan.', 'error');
      throw err;
    }
  };

  // Handle Toggle Checkbox
  const handleToggleCheck = async (id: string) => {
    // Optimistic UI update
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status_cek: !item.status_cek } : item
      )
    );

    try {
      const res = await api.toggleStatus(id);
      if (res.data) {
        showToast(
          res.data.status_cek
            ? 'Catatan ditandai sudah dicek.'
            : 'Catatan ditandai belum dicek.',
          'info'
        );
      }
      await fetchData(true);
    } catch (err: any) {
      // Revert on error
      await fetchData(true);
      showToast(err.message || 'Gagal mengubah status catatan.', 'error');
    }
  };

  // Handle Edit Action
  const handleOpenEdit = (item: KondanganItem) => {
    setEditingItem(item);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (
    id: string,
    data: {
      nama: string;
      alamat: string;
      jumlah_kondangan: number;
      sokongan: string;
    }
  ) => {
    try {
      await api.updateKondangan(id, data);
      showToast('✓ Catatan berhasil diperbarui.', 'success');
      await fetchData(true);
    } catch (err: any) {
      showToast(err.message || '⚠️ Maaf, terjadi kesalahan saat memperbarui.', 'error');
      throw err;
    }
  };

  // Handle Single Delete
  const handleOpenDelete = (item: KondanganItem) => {
    setDeletingItem(item);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    setIsDeletingSingle(true);
    try {
      await api.deleteKondangan(deletingItem.id);
      showToast('✓ Catatan berhasil dihapus.', 'success');
      setIsDeleteModalOpen(false);
      setDeletingItem(null);
      await fetchData(true);
    } catch (err: any) {
      showToast(err.message || '⚠️ Maaf, terjadi kesalahan saat menghapus.', 'error');
    } finally {
      setIsDeletingSingle(false);
    }
  };

  // Handle Delete All
  const handleConfirmDeleteAll = async () => {
    setIsDeletingAll(true);
    try {
      await api.deleteAllKondangan();
      showToast('✓ Semua catatan berhasil dihapus.', 'success');
      setIsDeleteAllModalOpen(false);
      await fetchData(true);
    } catch (err: any) {
      showToast(err.message || '⚠️ Maaf, gagal menghapus semua catatan.', 'error');
    } finally {
      setIsDeletingAll(false);
    }
  };

  // Focus add form from empty state
  const handleFocusAddForm = () => {
    const inputNama = document.getElementById('input-nama');
    if (inputNama) {
      inputNama.focus();
      inputNama.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Export to CSV helper
  const handleExportCSV = () => {
    if (items.length === 0) {
      showToast('Tidak ada data catatan untuk diekspor.', 'info');
      return;
    }

    const headers = ['No', 'Nama', 'Alamat/Kota', 'Jumlah Kondangan (Rp)', 'Sokongan (Barang)', 'Status Cek', 'Tanggal Input'];
    const rows = items.map((item, index) => [
      index + 1,
      `"${item.nama.replace(/"/g, '""')}"`,
      `"${item.alamat.replace(/"/g, '""')}"`,
      item.jumlah_kondangan,
      `"${(item.sokongan || '').replace(/"/g, '""')}"`,
      item.status_cek ? 'Sudah Cek' : 'Belum',
      `"${new Date(item.created_at).toLocaleString('id-ID')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `data_kondangan_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Daftar data kondangan berhasil diunduh sebagai CSV.', 'success');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#050b18] via-[#071129] to-[#0a1538] text-white selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-12 space-y-6 sm:space-y-8 w-full">
        {/* SUMMARY STATS (Perhitungan Total) */}
        <SummaryStats stats={stats} />

        {/* SECTION: FORM TAMBAH CATATAN BARU */}
        <AddKondanganForm onSuccess={handleAddKondangan} />

        {/* SECTION: DAFTAR CATATAN */}
        <div id="section-daftar-catatan" className="space-y-4">
          {/* Header Bar: Title + Count + Delete All + Export */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-blue-900/40">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">📋</span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Daftar Catatan{' '}
                <span className="text-sky-400 font-bold">({items.length})</span>
              </h2>
            </div>

            {/* Action Buttons: Export & Delete All */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fetchData(true)}
                disabled={isRefreshing}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-blue-200 bg-blue-950/60 hover:bg-blue-900/60 border border-blue-800/40 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                title="Muat ulang data"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-sky-400' : ''}`} />
                <span className="hidden sm:inline">Segarkan</span>
              </button>

              {items.length > 0 && (
                <>
                  <button
                    id="btn-export-csv"
                    type="button"
                    onClick={handleExportCSV}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/40 transition-colors shadow-sm cursor-pointer"
                    title="Unduh data sebagai CSV"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Ekspor CSV</span>
                  </button>

                  <button
                    id="btn-hapus-semua"
                    type="button"
                    onClick={() => setIsDeleteAllModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 transition-colors shadow-sm cursor-pointer"
                    title="Hapus semua catatan milik Anda"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Semua</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* SEARCH & FILTER BAR */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-blue-300">
                <Search className="w-4 h-4" />
              </div>
              <input
                id="search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama, alamat, atau sokongan..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#091328] border border-blue-800/60 text-white placeholder:text-blue-300/40 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-blue-300/60 hover:text-white"
                >
                  Batal
                </button>
              )}
            </div>

            {/* Filter Tabs: Semua, Sudah Ceklis, Belum */}
            <div
              id="filter-tabs-container"
              className="flex items-center p-1 rounded-xl bg-[#081125] border border-blue-900/50 self-start md:self-auto shrink-0"
            >
              <button
                id="filter-tab-all"
                type="button"
                onClick={() => setActiveFilter('all')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeFilter === 'all'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-blue-200/80 hover:text-white hover:bg-blue-900/30'
                }`}
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span>Semua</span>
                {stats.totalCatatan > 0 && (
                  <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-black/30">
                    {stats.totalCatatan}
                  </span>
                )}
              </button>

              <button
                id="filter-tab-checked"
                type="button"
                onClick={() => setActiveFilter('checked')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeFilter === 'checked'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-blue-200/80 hover:text-white hover:bg-blue-900/30'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sudah Ceklis</span>
                {stats.totalChecked > 0 && (
                  <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 text-emerald-300">
                    {stats.totalChecked}
                  </span>
                )}
              </button>

              <button
                id="filter-tab-unchecked"
                type="button"
                onClick={() => setActiveFilter('unchecked')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeFilter === 'unchecked'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-blue-200/80 hover:text-white hover:bg-blue-900/30'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Belum</span>
                {stats.totalUnchecked > 0 && (
                  <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 text-amber-300">
                    {stats.totalUnchecked}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* LIST CONTENT */}
          {isLoading ? (
            <div className="py-16 text-center">
              <div className="inline-block w-8 h-8 border-4 border-blue-500/30 border-t-blue-400 rounded-full animate-spin"></div>
              <p className="mt-3 text-sm text-blue-200 font-medium">Memuat data kondangan...</p>
            </div>
          ) : items.length === 0 ? (
            /* EMPTY STATE */
            <div
              id="empty-state-card"
              className="py-16 px-6 text-center rounded-2xl bg-[#0c1836]/60 border border-dashed border-blue-800/60 shadow-inner"
            >
              <div className="w-16 h-16 rounded-2xl bg-blue-950/80 border border-blue-700/40 flex items-center justify-center mx-auto text-3xl mb-4 shadow-lg shadow-blue-950/40">
                📋
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">Belum Ada Catatan</h3>
              <p className="mt-2 text-sm text-blue-200/80 max-w-md mx-auto">
                {searchQuery || activeFilter !== 'all'
                  ? 'Tidak ada catatan yang cocok dengan filter atau pencarian Anda.'
                  : 'Belum ada data kondangan. Yuk, tambahkan catatan pertama Anda.'}
              </p>

              {searchQuery || activeFilter !== 'all' ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setActiveFilter('all');
                  }}
                  className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-950 hover:bg-blue-900 border border-blue-700/50 text-sky-300 text-xs sm:text-sm font-semibold transition-all"
                >
                  Reset Filter & Pencarian
                </button>
              ) : (
                <button
                  id="btn-tambah-pertama"
                  type="button"
                  onClick={handleFocusAddForm}
                  className="mt-5 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Tambah Catatan</span>
                </button>
              )}
            </div>
          ) : (
            /* CARDS LIST */
            <div id="cards-list-container" className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
              {items.map((item, index) => (
                <KondanganCard
                  key={item.id}
                  item={item}
                  index={index}
                  onToggleCheck={handleToggleCheck}
                  onEdit={handleOpenEdit}
                  onDelete={handleOpenDelete}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* FOOTER */}
      <Footer />

      {/* EDIT MODAL */}
      <EditKondanganModal
        isOpen={isEditModalOpen}
        item={editingItem}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveEdit}
      />

      {/* DELETE SINGLE RECORD MODAL */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Hapus Catatan?"
        message={`Apakah Anda yakin ingin menghapus catatan atas nama "${deletingItem?.nama}"? Data yang sudah dihapus tidak dapat dikembalikan.`}
        confirmLabel="Hapus"
        isDanger={true}
        isProcessing={isDeletingSingle}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setDeletingItem(null);
        }}
      />

      {/* DELETE ALL RECORDS MODAL */}
      <ConfirmModal
        isOpen={isDeleteAllModalOpen}
        title="Hapus Semua Catatan?"
        message="Apakah Anda yakin ingin menghapus semua catatan? Tindakan ini akan menghapus seluruh data kondangan yang tercatat di akun Anda dan tidak dapat dibatalkan."
        confirmLabel="Hapus Semua"
        isDanger={true}
        isProcessing={isDeletingAll}
        onConfirm={handleConfirmDeleteAll}
        onCancel={() => setIsDeleteAllModalOpen(false)}
      />
    </div>
  );
};
