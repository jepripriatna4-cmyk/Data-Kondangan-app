import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { User as UserIcon, Mail, Lock, UserPlus } from 'lucide-react';
import { Footer } from '../components/Footer.js';

interface RegisterPageProps {
  onNavigateToLogin: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigateToLogin }) => {
  const { register } = useAuth();
  const { showToast } = useToast();

  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!nama.trim()) {
      setErrorMsg('Nama wajib diisi.');
      return;
    }

    if (!email.trim()) {
      setErrorMsg('Email wajib diisi.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Kata sandi minimal harus 6 karakter.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setIsLoading(true);
    try {
      await register(nama.trim(), email.trim(), password, confirmPassword);
      showToast('Akun berhasil dibuat! Selamat datang.', 'success');
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal membuat akun. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-b from-[#050b18] via-[#071129] to-[#0b1638]">
      {/* Main content area */}
      <div className="flex-1 w-full flex items-center justify-center p-4 sm:p-6 relative">
        {/* Background accents */}
        <div className="absolute w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none -top-20 -left-20"></div>
        <div className="absolute w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -bottom-20 -right-20"></div>

        <div className="relative w-full max-w-md rounded-3xl bg-[#0c1836]/90 border border-blue-500/25 p-6 sm:p-8 shadow-2xl shadow-blue-950/60 backdrop-blur-xl">
        {/* Brand Icon */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center mx-auto shadow-lg shadow-blue-600/30 border border-blue-400/30 mb-5">
          <span className="text-2xl">💌</span>
        </div>

        {/* Titles */}
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Buat Akun
          </h1>
          <p className="mt-2 text-sm text-blue-200/80">
            Buat akun untuk menyimpan data kondangan Anda.
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div
            id="register-error-alert"
            className="mb-5 p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs sm:text-sm font-medium flex items-center gap-2"
          >
            <span className="text-base shrink-0">⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="register-nama"
              className="block text-xs font-semibold text-white uppercase tracking-wider mb-1.5"
            >
              Nama
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-blue-300">
                <UserIcon className="w-4 h-4" />
              </div>
              <input
                id="register-nama"
                type="text"
                required
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Masukkan nama lengkap Anda"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#081125] border border-blue-800/60 text-white placeholder:text-blue-300/40 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="register-email"
              className="block text-xs font-semibold text-white uppercase tracking-wider mb-1.5"
            >
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-blue-300">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="register-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Masukkan email Anda"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#081125] border border-blue-800/60 text-white placeholder:text-blue-300/40 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="register-password"
              className="block text-xs font-semibold text-white uppercase tracking-wider mb-1.5"
            >
              Kata Sandi
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-blue-300">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="register-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Buat kata sandi (min. 6 karakter)"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#081125] border border-blue-800/60 text-white placeholder:text-blue-300/40 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="register-confirm-password"
              className="block text-xs font-semibold text-white uppercase tracking-wider mb-1.5"
            >
              Konfirmasi Kata Sandi
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-blue-300">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="register-confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi kata sandi Anda"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#081125] border border-blue-800/60 text-white placeholder:text-blue-300/40 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
              />
            </div>
          </div>

          <button
            id="btn-register-submit"
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-sm tracking-wide shadow-lg shadow-blue-600/30 border border-blue-400/30 transition-all duration-200 cursor-pointer disabled:opacity-50"
          >
            <UserPlus className="w-4 h-4" />
            <span>{isLoading ? 'Mendaftarkan Akun...' : 'Buat Akun'}</span>
          </button>
        </form>

        {/* Link to Login */}
        <div className="mt-6 text-center text-xs sm:text-sm text-blue-200/80">
          <span>Sudah punya akun? </span>
          <button
            id="link-to-login"
            type="button"
            onClick={onNavigateToLogin}
            className="text-sky-400 hover:text-sky-300 font-bold hover:underline cursor-pointer transition-colors"
          >
            Masuk
          </button>
        </div>
      </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};
