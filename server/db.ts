import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

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

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'kondangan_db.json');

class DatabaseService {
  private data: DatabaseSchema = {
    users: [],
    kondangan: [],
  };
  private isLoaded = false;

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.data = {
          users: Array.isArray(parsed.users) ? parsed.users : [],
          kondangan: Array.isArray(parsed.kondangan) ? parsed.kondangan : [],
        };
      } else {
        this.persist();
      }
      this.isLoaded = true;
    } catch (err) {
      console.error('Error initializing database file:', err);
      this.data = { users: [], kondangan: [] };
      this.isLoaded = true;
    }
  }

  private persist() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tmpFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tmpFile, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);
    } catch (err) {
      console.error('Failed to write database atomically:', err);
    }
  }

  // --- USER OPERATIONS ---
  public getUserByEmail(email: string): UserRecord | null {
    const cleanEmail = email.trim().toLowerCase();
    const user = this.data.users.find((u) => u.email.toLowerCase() === cleanEmail);
    return user || null;
  }

  public getUserById(id: string): UserRecord | null {
    const user = this.data.users.find((u) => u.id === id);
    return user || null;
  }

  public createUser(userData: { nama: string; email: string; password_hash: string }): UserRecord {
    const cleanEmail = userData.email.trim().toLowerCase();
    const existing = this.getUserByEmail(cleanEmail);
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

    this.data.users.push(newUser);
    this.persist();
    return newUser;
  }

  // --- KONDANGAN OPERATIONS (ROW-LEVEL SECURITY ENFORCED) ---
  public getKondanganByUser(
    userId: string,
    options?: { search?: string; filter?: 'all' | 'checked' | 'unchecked' }
  ): (KondanganRecord & { nomor_urut: number })[] {
    // STRICT ROW-LEVEL SECURITY: Only records matching user_id
    // All records for this user, sorted chronologically ascending (Catatan paling lama → Catatan paling baru)
    const allUserRecords = this.data.kondangan
      .filter((item) => item.user_id === userId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    // Map each record ID to its sequence number (1, 2, 3...) based strictly on created_at
    const seqMap = new Map<string, number>();
    allUserRecords.forEach((item, idx) => {
      seqMap.set(item.id, idx + 1);
    });

    let records = allUserRecords;

    if (options?.filter === 'checked') {
      records = records.filter((item) => item.status_cek === true);
    } else if (options?.filter === 'unchecked') {
      records = records.filter((item) => item.status_cek === false);
    }

    if (options?.search && options.search.trim()) {
      const q = options.search.trim().toLowerCase();
      records = records.filter(
        (item) =>
          item.nama.toLowerCase().includes(q) ||
          item.alamat.toLowerCase().includes(q) ||
          item.sokongan.toLowerCase().includes(q)
      );
    }

    // Return records sorted ascending by created_at with their permanent nomor_urut
    return records.map((item) => ({
      ...item,
      nomor_urut: seqMap.get(item.id) || 1,
    }));
  }

  public getKondanganById(userId: string, id: string): KondanganRecord | null {
    const record = this.data.kondangan.find((item) => item.id === id && item.user_id === userId);
    return record || null;
  }

  public createKondangan(
    userId: string,
    data: {
      nama: string;
      alamat: string;
      jumlah_kondangan: number;
      sokongan?: string;
    }
  ): KondanganRecord & { nomor_urut: number } {
    const now = new Date().toISOString();
    const newRecord: KondanganRecord = {
      id: crypto.randomUUID(),
      user_id: userId, // Tied strictly to current authenticated user
      nama: data.nama.trim(),
      alamat: data.alamat.trim(),
      jumlah_kondangan: Number(data.jumlah_kondangan) || 0,
      sokongan: (data.sokongan || '').trim(),
      created_at: now,
      updated_at: now,
      status_cek: false,
    };

    // Append so records stay in chronological creation order
    this.data.kondangan.push(newRecord);
    this.persist();

    // Determine sequence number among this user's records
    const userCount = this.data.kondangan.filter((item) => item.user_id === userId).length;
    return {
      ...newRecord,
      nomor_urut: userCount,
    };
  }

  public updateKondangan(
    userId: string,
    id: string,
    data: {
      nama?: string;
      alamat?: string;
      jumlah_kondangan?: number;
      sokongan?: string;
      status_cek?: boolean;
    }
  ): KondanganRecord {
    const index = this.data.kondangan.findIndex(
      (item) => item.id === id && item.user_id === userId
    );

    if (index === -1) {
      throw new Error('Catatan tidak ditemukan atau Anda tidak memiliki hak akses.');
    }

    const current = this.data.kondangan[index];
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
      updated_at: new Date().toISOString(),
    };

    this.data.kondangan[index] = updated;
    this.persist();
    return updated;
  }

  public toggleStatusCek(userId: string, id: string): KondanganRecord {
    const index = this.data.kondangan.findIndex(
      (item) => item.id === id && item.user_id === userId
    );

    if (index === -1) {
      throw new Error('Catatan tidak ditemukan atau Anda tidak memiliki akses.');
    }

    const current = this.data.kondangan[index];
    current.status_cek = !current.status_cek;
    current.updated_at = new Date().toISOString();

    this.persist();
    return current;
  }

  public deleteKondangan(userId: string, id: string): boolean {
    const initialLen = this.data.kondangan.length;
    this.data.kondangan = this.data.kondangan.filter(
      (item) => !(item.id === id && item.user_id === userId)
    );

    const changed = this.data.kondangan.length < initialLen;
    if (changed) {
      this.persist();
    }
    return changed;
  }

  public deleteAllKondanganByUser(userId: string): number {
    const beforeCount = this.data.kondangan.length;
    // Keep records belonging to other users only
    this.data.kondangan = this.data.kondangan.filter((item) => item.user_id !== userId);
    const deletedCount = beforeCount - this.data.kondangan.length;
    if (deletedCount > 0) {
      this.persist();
    }
    return deletedCount;
  }
}

export const db = new DatabaseService();
