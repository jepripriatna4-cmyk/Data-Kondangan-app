import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface UserRecord {
  id: string;
  nama: string;
  email: string;
  password_hash: string;
  created_at: string;
}

export interface KondanganRecord {
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

interface DatabaseSchema {
  users: UserRecord[];
  kondangan: KondanganRecord[];
}

// Initial seed data for local dev
const SEED_DATA: DatabaseSchema = {
  users: [
    {
      id: 'fc8ec14c-c838-4da5-bbff-feec6bafc8a6',
      nama: 'Budi Santoso',
      email: 'budi@example.com',
      password_hash: '$2b$10$cjP5BEvFEiL4TXNrbN4X6.b9MKU103gGbLEeLYbu5H95L8PA7bKOq',
      created_at: '2026-09-12T13:19:13.665Z',
    },
    {
      id: '95ea8012-283c-4171-853f-ae1188cc15fd',
      nama: 'Siti Rahma',
      email: 'siti@example.com',
      password_hash: '$2b$10$ZJNrgp.KgyPV1m0H69XdOu8upQZUHa96RcOv0Ti/L.KPxP0.EsEiC',
      created_at: '2026-09-12T13:19:29.691Z',
    },
  ],
  kondangan: [
    {
      id: '00bff408-d740-45e2-ba6e-14b62eae07d4',
      user_id: 'fc8ec14c-c838-4da5-bbff-feec6bafc8a6',
      nama: 'Rebo Bugel',
      alamat: 'Pangandaran',
      jumlah_kondangan: 500000,
      sokongan: 'Beras 5 kg',
      created_at: '2026-09-12T13:19:17.231Z',
      updated_at: '2026-09-12T13:19:26.143Z',
      status_cek: true,
    },
    {
      id: '1fd23a5f-06f2-4956-a7d7-e0f2e993f590',
      user_id: 'fc8ec14c-c838-4da5-bbff-feec6bafc8a6',
      nama: 'ANTONIO CULI',
      alamat: 'Mangunjaya',
      jumlah_kondangan: 100000,
      sokongan: 'Rokok 1 selop',
      created_at: '2026-09-12T13:19:20.446Z',
      updated_at: '2026-09-12T13:19:20.446Z',
      status_cek: false,
    },
  ],
};

function resolveDbPaths(): { dataDir: string; dbFile: string; isServerless: boolean } {
  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  if (isServerless) {
    const tmpDir = path.join('/tmp', 'kondangan_data');
    return {
      dataDir: tmpDir,
      dbFile: path.join(tmpDir, 'kondangan_db.json'),
      isServerless: true,
    };
  }

  const localDir = path.join(process.cwd(), 'data');
  return {
    dataDir: localDir,
    dbFile: path.join(localDir, 'kondangan_db.json'),
    isServerless: false,
  };
}

class DatabaseService {
  private localData: DatabaseSchema = {
    users: [...SEED_DATA.users],
    kondangan: [...SEED_DATA.kondangan],
  };
  private supabaseClient: SupabaseClient | null = null;
  private storagePaths = resolveDbPaths();
  private lastDiskCheck = 0;

  constructor() {
    this.initSupabase();
    this.initLocal();
  }

  private initSupabase() {
    const supabaseUrl =
      process.env.SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.VITE_SUPABASE_URL;

    // Prefer SUPABASE_SERVICE_ROLE_KEY for serverless backend (bypasses RLS issues safely)
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      try {
        this.supabaseClient = createClient(supabaseUrl, supabaseKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        });
        console.log('[Database] Supabase client initialized. URL:', supabaseUrl);
      } catch (err) {
        console.error('[Database] Failed to initialize Supabase client:', err);
        this.supabaseClient = null;
      }
    } else {
      if (this.storagePaths.isServerless) {
        console.warn(
          '[Database WARNING] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY is not defined in Vercel. Accounts & data in /tmp are ephemeral and will be lost on container cold-starts. Configure Supabase in Vercel Environment Variables for permanent persistence!'
        );
      } else {
        console.log('[Database] Running with local JSON file persistence at', this.storagePaths.dbFile);
      }
    }
  }

  public isUsingSupabase(): boolean {
    return this.supabaseClient !== null;
  }

  public getStorageStatus() {
    if (this.supabaseClient) {
      return {
        isPermanent: true,
        type: 'supabase',
        label: 'Cloud Database (Supabase PostgreSQL)',
        warning: null,
      };
    }
    if (this.storagePaths.isServerless) {
      return {
        isPermanent: false,
        type: 'ephemeral',
        label: 'Penyimpanan Sementara (Vercel Lambda /tmp)',
        warning:
          'PERINGATAN: Supabase belum dikonfigurasi di Environment Variables Vercel. Akun dan data akan terhapus saat serverless function restart/cold-start. Pasang SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY untuk penyimpanan permanen.',
      };
    }
    return {
      isPermanent: true,
      type: 'local_file',
      label: 'Local File Storage (data/kondangan_db.json)',
      warning: null,
    };
  }

  public syncFromDisk() {
    // Avoid reading disk more than once every 200ms unless forced
    const now = Date.now();
    if (now - this.lastDiskCheck < 200) return;
    this.lastDiskCheck = now;

    const candidateFiles = [
      this.storagePaths.dbFile,
      path.join(process.cwd(), 'data', 'kondangan_db.json'),
      path.join('/tmp', 'kondangan_data', 'kondangan_db.json'),
    ];

    for (const file of candidateFiles) {
      if (fs.existsSync(file)) {
        try {
          const raw = fs.readFileSync(file, 'utf-8');
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed.users)) {
            for (const u of parsed.users) {
              const cleanEmail = (u.email || '').trim().toLowerCase();
              const existingIdx = this.localData.users.findIndex(
                (item) => item.id === u.id || item.email.toLowerCase() === cleanEmail
              );
              if (existingIdx === -1) {
                this.localData.users.push(u);
              } else if (u.password_hash && !this.localData.users[existingIdx].password_hash) {
                this.localData.users[existingIdx].password_hash = u.password_hash;
              }
            }
          }
          if (Array.isArray(parsed.kondangan)) {
            for (const k of parsed.kondangan) {
              const exists = this.localData.kondangan.some((item) => item.id === k.id);
              if (!exists) {
                this.localData.kondangan.push(k);
              }
            }
          }
        } catch {
          // Ignore parse errors from partially written temp files
        }
      }
    }
  }

  private initLocal() {
    try {
      const { dataDir, dbFile } = this.storagePaths;

      if (!fs.existsSync(dataDir)) {
        try {
          fs.mkdirSync(dataDir, { recursive: true });
        } catch (mkErr) {
          console.warn('[Database] Could not create data directory:', mkErr);
        }
      }

      const sourceFile = path.join(process.cwd(), 'data', 'kondangan_db.json');
      if (!fs.existsSync(dbFile) && fs.existsSync(sourceFile)) {
        try {
          const content = fs.readFileSync(sourceFile, 'utf-8');
          fs.writeFileSync(dbFile, content, 'utf-8');
        } catch {
          // Ignore copy failures
        }
      }

      this.syncFromDisk();
    } catch (err) {
      console.error('[Database] Error initializing local database file:', err);
      this.localData = {
        users: [...SEED_DATA.users],
        kondangan: [...SEED_DATA.kondangan],
      };
    }
  }

  private persistLocal() {
    const targets = [
      this.storagePaths.dbFile,
      path.join(process.cwd(), 'data', 'kondangan_db.json'),
      path.join('/tmp', 'kondangan_data', 'kondangan_db.json'),
    ];

    const dataString = JSON.stringify(this.localData, null, 2);

    for (const target of targets) {
      try {
        const dir = path.dirname(target);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(target, dataString, 'utf-8');
      } catch {
        // Read-only filesystem on certain paths is expected in some environments
      }
    }
  }

  // ==========================================
  // USER OPERATIONS
  // ==========================================
  public async getUserByEmail(email: string): Promise<UserRecord | null> {
    const cleanEmail = email.trim().toLowerCase();
    this.syncFromDisk();

    if (this.supabaseClient) {
      const { data, error } = await this.supabaseClient
        .from('users')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (error) {
        console.error('[Supabase] getUserByEmail error:', error);
        throw new Error(
          `Gagal menghubungi database Supabase: ${error.message}. Pastikan skrip supabase_schema.sql sudah dijalankan di Supabase SQL Editor.`
        );
      }

      if (data) return data as UserRecord;
    }

    const user = this.localData.users.find((u) => u.email.toLowerCase() === cleanEmail);
    return user || null;
  }

  public async getUserById(id: string): Promise<UserRecord | null> {
    this.syncFromDisk();

    if (this.supabaseClient) {
      const { data, error } = await this.supabaseClient
        .from('users')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('[Supabase] getUserById error:', error);
        throw new Error(
          `Gagal memverifikasi akun dari Supabase: ${error.message}.`
        );
      }

      if (data) return data as UserRecord;
    }

    const user = this.localData.users.find((u) => u.id === id);
    return user || null;
  }

  public async restoreUser(userData: UserRecord): Promise<UserRecord> {
    const cleanEmail = userData.email.trim().toLowerCase();
    this.syncFromDisk();

    const existingIdx = this.localData.users.findIndex(
      (u) => u.id === userData.id || u.email.toLowerCase() === cleanEmail
    );

    const userRecord: UserRecord = {
      id: userData.id || crypto.randomUUID(),
      nama: (userData.nama || 'Pengguna').trim(),
      email: cleanEmail,
      password_hash: userData.password_hash || '',
      created_at: userData.created_at || new Date().toISOString(),
    };

    if (existingIdx >= 0) {
      this.localData.users[existingIdx] = {
        ...this.localData.users[existingIdx],
        ...userRecord,
        password_hash:
          userRecord.password_hash || this.localData.users[existingIdx].password_hash,
      };
    } else {
      this.localData.users.push(userRecord);
    }

    this.persistLocal();

    if (this.supabaseClient) {
      try {
        await this.supabaseClient.from('users').upsert([userRecord], { onConflict: 'id' });
      } catch (err) {
        console.warn('[Supabase] restoreUser error (safe to ignore):', err);
      }
    }

    return userRecord;
  }

  public async createUser(userData: {
    nama: string;
    email: string;
    password_hash: string;
  }): Promise<UserRecord> {
    const cleanEmail = userData.email.trim().toLowerCase();
    const existing = await this.getUserByEmail(cleanEmail);
    if (existing) {
      throw new Error('Email sudah terdaftar. Silakan gunakan email lain atau masuk.');
    }

    const newUser: UserRecord = {
      id: crypto.randomUUID(),
      nama: userData.nama.trim(),
      email: cleanEmail,
      password_hash: userData.password_hash,
      created_at: new Date().toISOString(),
    };

    if (this.supabaseClient) {
      const { data, error } = await this.supabaseClient
        .from('users')
        .insert([newUser])
        .select()
        .single();

      if (error) {
        console.error('[Supabase] createUser error:', error);
        throw new Error(
          `Gagal menyimpan akun ke Supabase: ${error.message}. Pastikan tabel 'users' sudah dibuat dengan menjalankan supabase_schema.sql di Supabase SQL Editor.`
        );
      }

      return data as UserRecord;
    }

    this.localData.users.push(newUser);
    this.persistLocal();
    return newUser;
  }

  // ==========================================
  // KONDANGAN OPERATIONS (ROW-LEVEL SECURITY)
  // ==========================================
  public async getKondanganByUser(
    userId: string,
    options?: { search?: string; filter?: 'all' | 'checked' | 'unchecked' }
  ): Promise<(KondanganRecord & { nomor_urut: number })[]> {
    this.syncFromDisk();
    let allUserRecords: KondanganRecord[] = [];

    if (this.supabaseClient) {
      const { data, error } = await this.supabaseClient
        .from('kondangan')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('[Supabase] getKondanganByUser error:', error);
        throw new Error(`Gagal mengambil data dari Supabase: ${error.message}`);
      }

      allUserRecords = (data as KondanganRecord[]) || [];
    } else {
      allUserRecords = this.localData.kondangan.filter((item) => item.user_id === userId);
    }

    // Sort chronologically ascending
    allUserRecords.sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    // Build nomor_urut sequence map based on chronological index
    const seqMap = new Map<string, number>();
    allUserRecords.forEach((item, idx) => {
      seqMap.set(item.id, idx + 1);
    });

    let filtered = allUserRecords;

    if (options?.filter === 'checked') {
      filtered = filtered.filter((item) => item.status_cek === true);
    } else if (options?.filter === 'unchecked') {
      filtered = filtered.filter((item) => item.status_cek === false);
    }

    if (options?.search && options.search.trim()) {
      const q = options.search.trim().toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.nama.toLowerCase().includes(q) ||
          item.alamat.toLowerCase().includes(q) ||
          item.sokongan.toLowerCase().includes(q)
      );
    }

    return filtered.map((item) => ({
      ...item,
      nomor_urut: seqMap.get(item.id) || 1,
    }));
  }

  public async getKondanganById(userId: string, id: string): Promise<KondanganRecord | null> {
    if (this.supabaseClient) {
      const { data, error } = await this.supabaseClient
        .from('kondangan')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('[Supabase] getKondanganById error:', error);
        throw new Error(`Gagal memuat catatan dari Supabase: ${error.message}`);
      }

      return (data as KondanganRecord) || null;
    }

    const record = this.localData.kondangan.find(
      (item) => item.id === id && item.user_id === userId
    );
    return record || null;
  }

  public async createKondangan(
    userId: string,
    data: {
      nama: string;
      alamat: string;
      jumlah_kondangan: number;
      sokongan?: string;
    }
  ): Promise<KondanganRecord & { nomor_urut: number }> {
    const now = new Date().toISOString();
    const newRecord: KondanganRecord = {
      id: crypto.randomUUID(),
      user_id: userId,
      nama: data.nama.trim(),
      alamat: data.alamat.trim(),
      jumlah_kondangan: Number(data.jumlah_kondangan) || 0,
      sokongan: (data.sokongan || '').trim(),
      created_at: now,
      updated_at: now,
      status_cek: false,
    };

    if (this.supabaseClient) {
      const { data: inserted, error } = await this.supabaseClient
        .from('kondangan')
        .insert([newRecord])
        .select()
        .single();

      if (error) {
        console.error('[Supabase] createKondangan error:', error);
        throw new Error(`Gagal menyimpan catatan ke Supabase: ${error.message}`);
      }

      const { count } = await this.supabaseClient
        .from('kondangan')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      return {
        ...(inserted as KondanganRecord),
        nomor_urut: count || 1,
      };
    }

    this.localData.kondangan.push(newRecord);
    this.persistLocal();

    const userCount = this.localData.kondangan.filter((item) => item.user_id === userId).length;
    return {
      ...newRecord,
      nomor_urut: userCount,
    };
  }

  public async updateKondangan(
    userId: string,
    id: string,
    data: {
      nama?: string;
      alamat?: string;
      jumlah_kondangan?: number;
      sokongan?: string;
      status_cek?: boolean;
    }
  ): Promise<KondanganRecord> {
    const now = new Date().toISOString();

    if (this.supabaseClient) {
      const updatePayload: Record<string, any> = { updated_at: now };
      if (data.nama !== undefined) updatePayload.nama = data.nama.trim();
      if (data.alamat !== undefined) updatePayload.alamat = data.alamat.trim();
      if (data.jumlah_kondangan !== undefined)
        updatePayload.jumlah_kondangan = Number(data.jumlah_kondangan);
      if (data.sokongan !== undefined) updatePayload.sokongan = data.sokongan.trim();
      if (data.status_cek !== undefined) updatePayload.status_cek = Boolean(data.status_cek);

      const { data: updated, error } = await this.supabaseClient
        .from('kondangan')
        .update(updatePayload)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('[Supabase] updateKondangan error:', error);
        throw new Error(`Gagal memperbarui catatan di Supabase: ${error.message}`);
      }

      if (!updated) {
        throw new Error('Catatan tidak ditemukan atau Anda tidak memiliki akses.');
      }

      return updated as KondanganRecord;
    }

    const index = this.localData.kondangan.findIndex(
      (item) => item.id === id && item.user_id === userId
    );

    if (index === -1) {
      throw new Error('Catatan tidak ditemukan atau Anda tidak memiliki hak akses.');
    }

    const current = this.localData.kondangan[index];
    const updated: KondanganRecord = {
      ...current,
      nama: data.nama !== undefined ? data.nama.trim() : current.nama,
      alamat: data.alamat !== undefined ? data.alamat.trim() : current.alamat,
      jumlah_kondangan:
        data.jumlah_kondangan !== undefined
          ? Number(data.jumlah_kondangan)
          : current.jumlah_kondangan,
      sokongan: data.sokongan !== undefined ? data.sokongan.trim() : current.sokongan,
      status_cek: data.status_cek !== undefined ? Boolean(data.status_cek) : current.status_cek,
      updated_at: now,
    };

    this.localData.kondangan[index] = updated;
    this.persistLocal();
    return updated;
  }

  public async toggleStatusCek(userId: string, id: string): Promise<KondanganRecord> {
    const record = await this.getKondanganById(userId, id);
    if (!record) {
      throw new Error('Catatan tidak ditemukan atau Anda tidak memiliki akses.');
    }
    return this.updateKondangan(userId, id, { status_cek: !record.status_cek });
  }

  public async deleteKondangan(userId: string, id: string): Promise<boolean> {
    if (this.supabaseClient) {
      const { error } = await this.supabaseClient
        .from('kondangan')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        console.error('[Supabase] deleteKondangan error:', error);
        throw new Error(`Gagal menghapus catatan di Supabase: ${error.message}`);
      }

      return true;
    }

    const initialLen = this.localData.kondangan.length;
    this.localData.kondangan = this.localData.kondangan.filter(
      (item) => !(item.id === id && item.user_id === userId)
    );

    const changed = this.localData.kondangan.length < initialLen;
    if (changed) {
      this.persistLocal();
    }
    return changed;
  }

  public async restoreKondanganRecords(
    userId: string,
    records: KondanganRecord[]
  ): Promise<number> {
    this.syncFromDisk();
    let restoredCount = 0;

    for (const rec of records) {
      if (!rec || !rec.id) continue;
      const exists = this.localData.kondangan.some((item) => item.id === rec.id);
      if (!exists) {
        const item: KondanganRecord = {
          ...rec,
          user_id: userId,
        };
        this.localData.kondangan.push(item);
        restoredCount++;

        if (this.supabaseClient) {
          try {
            await this.supabaseClient.from('kondangan').upsert([item], { onConflict: 'id' });
          } catch {
            // Safe to ignore
          }
        }
      }
    }

    if (restoredCount > 0) {
      this.persistLocal();
    }
    return restoredCount;
  }

  public async deleteAllKondanganByUser(userId: string): Promise<number> {
    if (this.supabaseClient) {
      const { data, error } = await this.supabaseClient
        .from('kondangan')
        .delete()
        .eq('user_id', userId)
        .select();

      if (error) {
        console.error('[Supabase] deleteAllKondanganByUser error:', error);
        throw new Error(`Gagal menghapus semua catatan di Supabase: ${error.message}`);
      }

      return data?.length || 0;
    }

    const beforeCount = this.localData.kondangan.length;
    this.localData.kondangan = this.localData.kondangan.filter((item) => item.user_id !== userId);
    const deletedCount = beforeCount - this.localData.kondangan.length;
    if (deletedCount > 0) {
      this.persistLocal();
    }
    return deletedCount;
  }
}

export const db = new DatabaseService();
