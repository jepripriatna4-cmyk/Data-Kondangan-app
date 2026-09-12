import { KondanganItem, KondanganStats, User } from '../types.js';

const TOKEN_KEY = 'kondangan_auth_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
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
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({
    success: false,
    message: 'Gagal menguraikan respon server.',
  }));

  if (!response.ok) {
    if (response.status === 401) {
      removeToken();
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    throw new Error(data.message || `Terjadi kesalahan (Kode: ${response.status})`);
  }

  return data;
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
    return res;
  },

  async getMe() {
    return request<{ user: User }>('/api/auth/me', {
      method: 'GET',
    });
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
