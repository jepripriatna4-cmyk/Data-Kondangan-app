import React from 'react';
import { useAuth } from '../context/AuthContext.js';
import { LogOut, UserCircle } from 'lucide-react';

interface NavbarProps {
  onRefresh?: () => void;
}

export const Navbar: React.FC<NavbarProps> = () => {
  const { user, logout } = useAuth();

  return (
    <header
      id="main-navbar"
      className="sticky top-0 z-30 w-full border-b border-blue-900/40 bg-[#070e22]/95 backdrop-blur-md shadow-lg shadow-black/20"
    >
      <div className="max-w-6xl mx-auto px-3 sm:px-6 min-h-[56px] sm:h-16 py-2 sm:py-0 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: App Title */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0 pr-1">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center shrink-0 shadow-md shadow-blue-600/30 border border-blue-400/30">
            <span className="text-lg sm:text-xl">💌</span>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-[13px] xs:text-sm sm:text-lg font-bold text-white tracking-tight leading-tight sm:leading-snug break-words">
              Aplikasi Data Kondangan
            </h1>
            <p className="text-xs text-blue-300/80 truncate hidden sm:block">
              Pencatatan Tamu, Nominal Uang & Sokongan
            </p>
          </div>
        </div>

        {/* Right: Greeting & Logout */}
        <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
          {user && (
            <div
              className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-blue-950/60 border border-blue-800/40"
              title={`Akun: ${user.nama} (${user.email})`}
            >
              <UserCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400 shrink-0" />
              <div className="text-left">
                <span className="text-[11px] text-blue-200/90 block sm:hidden font-medium truncate max-w-[65px] xs:max-w-[85px]">
                  {user.nama}
                </span>
                <span className="text-xs text-blue-200 hidden sm:block font-medium">
                  Selamat datang, <strong className="text-white font-semibold">{user.nama}</strong> 👋
                </span>
              </div>
            </div>
          )}

          <button
            id="btn-logout"
            type="button"
            onClick={logout}
            className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-600/80 border border-rose-800/40 transition-all duration-200 shadow-sm active:scale-95 cursor-pointer"
            title="Keluar dari akun"
          >
            <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </div>
    </header>
  );
};
