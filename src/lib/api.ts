import { KondanganItem, KondanganStats, User } from '../types.js';

const TOKEN_KEY = 'kondangan_auth_token';
const USER_KEY = 'kondangan_user_profile';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getCachedUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCachedUser(user: User): void {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // Ignore storage quota errors
  }
}

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  items?: KondanganItem[];
  stats?: KondanganStats;
  token?: string;
  user?: User;
}

async function request<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(endpoint, {
      ...options,
      headers,
    });
  } catch (netErr: any) {
    console.error(`[Network Error ${options.method || 'GET'} ${endpoint}]:`, netErr);
    throw new Error(
      'Gagal terhubung ke server. Periksa koneksi internet Anda atau coba beberapa saat lagi.'
    );
  }

  const contentType = response.headers.get('content-type') || '';
  let data: any = null;

  if (contentType.includes('application/json')) {
    data = await response.json().catch(() => null);
  } else {
    // Non-JSON response (such as HTML 404 or 500 from Vercel)
    const rawText = await response.text().catch(() => '');
    console.error(`[API Non-JSON Response ${response.status}]:`, rawText.slice(0, 300));

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(
          'API endpoint tidak ditemukan (404). Pastikan konfigurasi Vercel rewrites sudah benar.'
        );
      }
      throw new Error(
        `Terjadi kesalahan pada server (Status: ${response.status}). Silakan coba lagi nanti.`
      );
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      removeToken();
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    const errMsg =
      data?.message ||
      (response.status === 401
        ? 'Email atau kata sandi tidak sesuai.'
        : `Terjadi kesalahan (Kode: ${response.status})`);
    throw new Error(errMsg);
  }

  return data || { success: true };
}

export const api = {
  async register(nama: string, email: string, password: string, confirmPassword: string) {
    const res = await request<{ token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ nama, email, password, confirmPassword }),
    });
    if (res.token) {
      setToken(res.token);
    }
    if (res.user) {
      setCachedUser(res.user);
    }
    return res;
  },

  async login(email: string, password: string) {
    const res = await request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.token) {
      setToken(res.token);
    }
    if (res.user) {
      setCachedUser(res.user);
    }
    return res;
  },

  async getMe() {
    const res = await request<{ user: User }>('/api/auth/me', {
      method: 'GET',
    });
    if (res.user) {
      setCachedUser(res.user);
    }
    return res;
  },

  async getKondangan(search?: string, filter?: string) {
    const params = new URLSearchParams();
    if (search && search.trim()) params.append('search', search.trim());
    if (filter && filter !== 'all') params.append('filter', filter);

    const qs = params.toString();
    const endpoint = `/api/kondangan${qs ? `?${qs}` : ''}`;
    return request<KondanganItem[]>(endpoint, {
      method: 'GET',
    });
  },

  async createKondangan(data: {
    nama: string;
    alamat: string;
    jumlah_kondangan: number;
    sokongan?: string;
  }) {
    return request<KondanganItem>('/api/kondangan', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateKondangan(
    id: string,
    data: {
      nama?: string;
      alamat?: string;
      jumlah_kondangan?: number;
      sokongan?: string;
      status_cek?: boolean;
    }
  ) {
    return request<KondanganItem>(`/api/kondangan/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async toggleStatus(id: string) {
    return request<KondanganItem>(`/api/kondangan/${id}/toggle`, {
      method: 'PATCH',
    });
  },

  async deleteKondangan(id: string) {
    return request<void>(`/api/kondangan/${id}`, {
      method: 'DELETE',
    });
  },

  async deleteAllKondangan() {
    return request<{ count: number }>(`/api/kondangan`, {
      method: 'DELETE',
    });
  },
};
