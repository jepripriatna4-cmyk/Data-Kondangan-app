export interface User {
  id: string;
  nama: string;
  email: string;
  created_at: string;
}

export interface KondanganItem {
  id: string;
  user_id: string;
  nama: string;
  alamat: string;
  jumlah_kondangan: number;
  sokongan: string;
  created_at: string;
  updated_at: string;
  status_cek: boolean;
  nomor_urut?: number;
}

export interface SokonganItemSummary {
  nama_barang: string;
  count: number;
}

export interface KondanganStats {
  totalCatatan: number;
  totalKondangan: number;
  totalChecked: number;
  totalUnchecked: number;
  sokonganSummary: SokonganItemSummary[];
}

export type FilterStatus = 'all' | 'checked' | 'unchecked';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}
