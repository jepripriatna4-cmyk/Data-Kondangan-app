-- =========================================================
-- SQL SCHEMA FOR SUPABASE (APLIKASI DATA KONDANGAN)
-- Jalankan query ini di menu "SQL Editor" pada dashboard Supabase Anda.
-- =========================================================

-- 1. Tabel users (Akun Pengguna)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pencarian email cepat
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- 2. Tabel kondangan (Catatan Kondangan per Pengguna)
CREATE TABLE IF NOT EXISTS public.kondangan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  nama TEXT NOT NULL,
  alamat TEXT NOT NULL,
  jumlah_kondangan NUMERIC DEFAULT 0,
  sokongan TEXT DEFAULT '',
  status_cek BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index query per user_id
CREATE INDEX IF NOT EXISTS idx_kondangan_user_id ON public.kondangan(user_id);
CREATE INDEX IF NOT EXISTS idx_kondangan_created_at ON public.kondangan(created_at);

-- 3. Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kondangan ENABLE ROW LEVEL SECURITY;

-- Kebijakan akses (Bisa diakses oleh service role key atau anon key aplikasi)
CREATE POLICY IF NOT EXISTS "Allow all operations for app backend"
ON public.users FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow all operations for app backend"
ON public.kondangan FOR ALL
USING (true)
WITH CHECK (true);
