import express, { Request, Response } from 'express';
import { db } from './db.js';
import {
  authMiddleware,
  AuthenticatedRequest,
  generateToken,
  hashPassword,
  verifyPassword,
} from './auth.js';

export const app = express();

app.use(express.json());

// Enable CORS for production & Vercel
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// Safe request logging (no sensitive credentials logged)
app.use((req, _res, next) => {
  const start = Date.now();
  const url = req.originalUrl || req.url;
  _res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[API] ${req.method} ${url} -> ${_res.statusCode} (${duration}ms)`);
  });
  next();
});

const router = express.Router();

// ==========================================
// HEALTH & STORAGE STATUS CHECK
// ==========================================
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    isUsingSupabase: db.isUsingSupabase(),
    env: process.env.NODE_ENV || 'development',
  });
});

router.get('/storage-status', (_req: Request, res: Response) => {
  res.json({
    success: true,
    ...db.getStorageStatus(),
  });
});

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================

// Register
router.post('/auth/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { nama, email, password, confirmPassword } = req.body;

    if (!nama || typeof nama !== 'string' || nama.trim().length < 2) {
      res.status(400).json({
        success: false,
        message: 'Nama wajib diisi (minimal 2 karakter).',
      });
      return;
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      res.status(400).json({
        success: false,
        message: 'Format email tidak valid.',
      });
      return;
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Kata sandi minimal harus 6 karakter.',
      });
      return;
    }

    if (password !== confirmPassword) {
      res.status(400).json({
        success: false,
        message: 'Konfirmasi kata sandi tidak cocok.',
      });
      return;
    }

    const existingUser = await db.getUserByEmail(email);
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'Email ini sudah terdaftar. Silakan masuk atau gunakan email lain.',
      });
      return;
    }

    const password_hash = await hashPassword(password);
    const newUser = await db.createUser({
      nama,
      email,
      password_hash,
    });

    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      message: 'Akun berhasil dibuat.',
      token,
      user: {
        id: newUser.id,
        nama: newUser.nama,
        email: newUser.email,
        created_at: newUser.created_at,
      },
    });
  } catch (err: any) {
    console.error('[Register error]:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Gagal mendaftarkan akun. Silakan coba lagi.',
    });
  }
});

// Login
router.post('/auth/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email dan kata sandi wajib diisi.',
      });
      return;
    }

    const user = await db.getUserByEmail(email);
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Email atau kata sandi tidak sesuai.',
      });
      return;
    }

    const isMatch = await verifyPassword(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Email atau kata sandi tidak sesuai.',
      });
      return;
    }

    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Berhasil masuk.',
      token,
      user: {
        id: user.id,
        nama: user.nama,
        email: user.email,
        created_at: user.created_at,
      },
    });
  } catch (err: any) {
    console.error('[Login error]:', err);
    res.status(500).json({
      success: false,
      message: 'Terjadi masalah saat menghubungkan ke server. Silakan coba lagi.',
    });
  }
});

// Current user profile
router.get('/auth/me', authMiddleware, (req: AuthenticatedRequest, res: Response): void => {
  const user = req.user!;
  res.json({
    success: true,
    user: {
      id: user.id,
      nama: user.nama,
      email: user.email,
      created_at: user.created_at,
    },
  });
});

// ==========================================
// KONDANGAN DATA ROUTES (ROW-LEVEL SECURITY)
// ==========================================

// Get all kondangan records for current user
router.get('/kondangan', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const filter = req.query.filter as 'all' | 'checked' | 'unchecked' | undefined;

    const filteredRecords = await db.getKondanganByUser(userId, {
      search,
      filter,
    });

    const allUserRecords = await db.getKondanganByUser(userId);
    const totalCatatan = allUserRecords.length;
    const totalKondangan = allUserRecords.reduce(
      (sum, item) => sum + (Number(item.jumlah_kondangan) || 0),
      0
    );
    const totalChecked = allUserRecords.filter((item) => item.status_cek).length;
    const totalUnchecked = allUserRecords.filter((item) => !item.status_cek).length;

    const sokonganMap = new Map<string, number>();
    for (const item of allUserRecords) {
      if (item.sokongan && item.sokongan.trim().length > 0) {
        const val = item.sokongan.trim();
        sokonganMap.set(val, (sokonganMap.get(val) || 0) + 1);
      }
    }
    const sokonganSummary = Array.from(sokonganMap.entries()).map(([item, count]) => ({
      nama_barang: item,
      count,
    }));

    res.json({
      success: true,
      data: filteredRecords,
      stats: {
        totalCatatan,
        totalKondangan,
        totalChecked,
        totalUnchecked,
        sokonganSummary,
      },
    });
  } catch (err: any) {
    console.error('[Fetch kondangan error]:', err);
    res.status(500).json({
      success: false,
      message: 'Gagal memuat daftar catatan kondangan.',
    });
  }
});

// Create new record
router.post('/kondangan', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { nama, alamat, jumlah_kondangan, sokongan } = req.body;

    if (!nama || typeof nama !== 'string' || nama.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: 'Nama wajib diisi.',
      });
      return;
    }

    if (!alamat || typeof alamat !== 'string' || alamat.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: 'Alamat / Kota wajib diisi.',
      });
      return;
    }

    const nominal = Number(jumlah_kondangan);
    if (isNaN(nominal) || nominal < 0) {
      res.status(400).json({
        success: false,
        message: 'Jumlah kondangan harus berupa angka valid.',
      });
      return;
    }

    const created = await db.createKondangan(userId, {
      nama,
      alamat,
      jumlah_kondangan: nominal,
      sokongan: typeof sokongan === 'string' ? sokongan : '',
    });

    const allUserRecords = await db.getKondanganByUser(userId);
    const totalCatatan = allUserRecords.length;
    const totalKondangan = allUserRecords.reduce(
      (sum, item) => sum + (Number(item.jumlah_kondangan) || 0),
      0
    );
    const totalChecked = allUserRecords.filter((item) => item.status_cek).length;
    const totalUnchecked = allUserRecords.filter((item) => !item.status_cek).length;

    const sokonganMap = new Map<string, number>();
    for (const item of allUserRecords) {
      if (item.sokongan && item.sokongan.trim().length > 0) {
        const val = item.sokongan.trim();
        sokonganMap.set(val, (sokonganMap.get(val) || 0) + 1);
      }
    }
    const sokonganSummary = Array.from(sokonganMap.entries()).map(([item, count]) => ({
      nama_barang: item,
      count,
    }));

    res.status(201).json({
      success: true,
      message: 'Catatan berhasil disimpan.',
      data: created,
      items: allUserRecords,
      stats: {
        totalCatatan,
        totalKondangan,
        totalChecked,
        totalUnchecked,
        sokonganSummary,
      },
    });
  } catch (err: any) {
    console.error('[Create kondangan error]:', err);
    res.status(500).json({
      success: false,
      message: 'Gagal menyimpan catatan.',
    });
  }
});

// Update existing record
router.put('/kondangan/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { nama, alamat, jumlah_kondangan, sokongan, status_cek } = req.body;

    if (nama !== undefined && (!nama || typeof nama !== 'string' || nama.trim().length === 0)) {
      res.status(400).json({
        success: false,
        message: 'Nama tidak boleh kosong.',
      });
      return;
    }

    if (
      alamat !== undefined &&
      (!alamat || typeof alamat !== 'string' || alamat.trim().length === 0)
    ) {
      res.status(400).json({
        success: false,
        message: 'Alamat / Kota tidak boleh kosong.',
      });
      return;
    }

    let parsedNominal: number | undefined = undefined;
    if (jumlah_kondangan !== undefined) {
      parsedNominal = Number(jumlah_kondangan);
      if (isNaN(parsedNominal) || parsedNominal < 0) {
        res.status(400).json({
          success: false,
          message: 'Jumlah kondangan harus berupa angka valid.',
        });
        return;
      }
    }

    const updated = await db.updateKondangan(userId, id, {
      nama,
      alamat,
      jumlah_kondangan: parsedNominal,
      sokongan,
      status_cek,
    });

    res.json({
      success: true,
      message: 'Catatan berhasil diperbarui.',
      data: updated,
    });
  } catch (err: any) {
    console.error('[Update kondangan error]:', err);
    res.status(400).json({
      success: false,
      message: err.message || 'Gagal memperbarui catatan.',
    });
  }
});

// Toggle status_cek
router.patch(
  '/kondangan/:id/toggle',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const updated = await db.toggleStatusCek(userId, id);
      res.json({
        success: true,
        message: updated.status_cek
          ? 'Catatan ditandai sudah dicek.'
          : 'Catatan ditandai belum dicek.',
        data: updated,
      });
    } catch (err: any) {
      console.error('[Toggle status error]:', err);
      res.status(400).json({
        success: false,
        message: err.message || 'Gagal mengubah status catatan.',
      });
    }
  }
);

// Delete single record
router.delete(
  '/kondangan/:id',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const deleted = await db.deleteKondangan(userId, id);
      if (!deleted) {
        res.status(404).json({
          success: false,
          message: 'Catatan tidak ditemukan atau Anda tidak memiliki akses.',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Catatan berhasil dihapus.',
      });
    } catch (err: any) {
      console.error('[Delete kondangan error]:', err);
      res.status(500).json({
        success: false,
        message: 'Gagal menghapus catatan.',
      });
    }
  }
);

// Delete all records of current user
router.delete('/kondangan', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const count = await db.deleteAllKondanganByUser(userId);

    res.json({
      success: true,
      count,
      message: `${count} catatan berhasil dihapus.`,
    });
  } catch (err: any) {
    console.error('[Delete all kondangan error]:', err);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus semua catatan.',
    });
  }
});

// Mount router on BOTH '/api' and '/'
// This ensures that whether Vercel preserves or strips the '/api' prefix, requests are always matched!
app.use('/api', router);
app.use('/', router);

export default app;
