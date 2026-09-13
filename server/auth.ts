import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db, UserRecord } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'kondangan_super_secure_jwt_secret_key_2025';

export interface AuthenticatedRequest extends Request {
  user?: UserRecord;
}

export async function hashPassword(plainText: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainText, salt);
}

export async function verifyPassword(plainText: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}

export function generateToken(user: UserRecord): string {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      nama: user.nama,
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        code: 'NO_TOKEN',
        message: 'Akses ditolak. Sesi tidak ditemukan atau token tidak valid.',
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      res.status(401).json({
        success: false,
        code: 'NO_TOKEN',
        message: 'Akses ditolak. Token tidak ditemukan.',
      });
      return;
    }

    let decoded: { userId: string };
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    } catch (jwtErr: any) {
      const isExpired = jwtErr.name === 'TokenExpiredError';
      res.status(401).json({
        success: false,
        code: isExpired ? 'SESSION_EXPIRED' : 'INVALID_TOKEN',
        message: isExpired
          ? 'Sesi Anda telah kedaluwarsa. Silakan masuk kembali.'
          : 'Token autentikasi tidak valid. Silakan masuk kembali.',
      });
      return;
    }

    const user = await db.getUserById(decoded.userId);

    if (!user) {
      res.status(401).json({
        success: false,
        code: 'USER_NOT_FOUND',
        message: 'Akun tidak ditemukan atau telah dihapus. Silakan login kembali.',
      });
      return;
    }

    req.user = user;
    next();
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message || 'Terjadi kesalahan saat memverifikasi sesi autentikasi.',
    });
  }
}
