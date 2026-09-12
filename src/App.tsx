import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { ToastProvider } from './context/ToastContext.js';
import { ToastContainer } from './components/ToastContainer.js';
import { LoginPage } from './pages/LoginPage.js';
import { RegisterPage } from './pages/RegisterPage.js';
import { DashboardPage } from './pages/DashboardPage.js';

type PageRoute = '/login' | '/register' | '/dashboard';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentRoute, setCurrentRoute] = useState<PageRoute>('/dashboard');

  // Sync route with authentication state
  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        setCurrentRoute('/dashboard');
      } else {
        if (currentRoute === '/dashboard') {
          setCurrentRoute('/login');
        }
      }
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#050b18] text-white">
        <div className="w-12 h-12 border-4 border-blue-600/30 border-t-blue-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-semibold text-blue-200">
          Memuat Aplikasi Data Kondangan...
        </p>
      </div>
    );
  }

  // Protected Route for Dashboard
  if (!isAuthenticated) {
    if (currentRoute === '/register') {
      return <RegisterPage onNavigateToLogin={() => setCurrentRoute('/login')} />;
    }
    return <LoginPage onNavigateToRegister={() => setCurrentRoute('/register')} />;
  }

  return <DashboardPage />;
};

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
        <ToastContainer />
      </AuthProvider>
    </ToastProvider>
  );
}
