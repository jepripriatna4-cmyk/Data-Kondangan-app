import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { Mail, Lock, LogIn, Sparkles } from 'lucide-react';
import { Footer } from '../components/Footer.js';

interface LoginPageProps {
  onNavigateToRegister: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigateToRegister }) => {
  const { login } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password) {
      setErrorMsg('Email dan kata sandi wajib diisi.');
      return;
    }

    setIsLoading(true);
    try {
      await login(email.trim(), password);
      showToast('Berhasil masuk! Selamat datang kembali.', 'success');
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal masuk. Periksa kembali email dan kata sandi Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-b from-[#050b18] via-[#071129] to-[#0b1638]">
      {/* Main card container */}
      <div className="flex-1 w-full flex items-center justify-center p-4 sm:p-6 relative">
        {/* Glow background accent */}
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
            Selamat Datang 👋
          </h1>
          <p className="mt-2 text-sm text-blue-200/80">
            Masuk untuk mengelola data kondangan Anda.
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div
            id="login-error-alert"
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
              htmlFor="login-email"
              className="block text-xs font-semibold text-white uppercase tracking-wider mb-1.5"
            >
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-blue-300">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="login-email"
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
              htmlFor="login-password"
              className="block text-xs font-semibold text-white uppercase tracking-wider mb-1.5"
            >
              Kata Sandi
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-blue-300">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi Anda"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#081125] border border-blue-800/60 text-white placeholder:text-blue-300/40 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
              />
            </div>
          </div>

          <button
            id="btn-login-submit"
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-sm tracking-wide shadow-lg shadow-blue-600/30 border border-blue-400/30 transition-all duration-200 cursor-pointer disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" />
            <span>{isLoading ? 'Sedang Masuk...' : 'Masuk'}</span>
          </button>
        </form>

        {/* Link to Register */}
        <div className="mt-6 text-center text-xs sm:text-sm text-blue-200/80">
          <span>Belum punya akun? </span>
          <button
            id="link-to-register"
            type="button"
            onClick={onNavigateToRegister}
            className="text-sky-400 hover:text-sky-300 font-bold hover:underline cursor-pointer transition-colors"
          >
            Buat Akun
          </button>
        </div>
      </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};
