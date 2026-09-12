import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { ToastProvider } from './context/ToastContext.js';
import { ToastContainer } from './components/ToastContainer.js';
import { LoginPage } from './pages/LoginPage.js';
import { RegisterPage } from './pages/RegisterPage.js';
import { DashboardPage } from './pages/DashboardPage.js';

type PageRoute = '/login' | '/register' | '/dashboard';

function getInitialRoute(): PageRoute {
  if (typeof window !== 'undefined') {
    const path = window.location.pathname;
    if (path === '/register') return '/register';
    if (path === '/login') return '/login';
  }
  return '/dashboard';
}

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentRoute, setCurrentRoute] = useState<PageRoute>(getInitialRoute);

  const navigateTo = (route: PageRoute) => {
    setCurrentRoute(route);
    if (typeof window !== 'undefined' && window.location.pathname !== route) {
      window.history.pushState({}, '', route);
    }
  };

  // Sync route with browser navigation (Back/Forward buttons)
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/register') setCurrentRoute('/register');
      else if (path === '/login') setCurrentRoute('/login');
      else setCurrentRoute('/dashboard');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Sync route with authentication state
  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        if (currentRoute === '/login' || currentRoute === '/register') {
          setCurrentRoute('/dashboard');
          if (typeof window !== 'undefined' && window.location.pathname !== '/dashboard') {
            window.history.replaceState({}, '', '/dashboard');
          }
        }
      } else {
        if (currentRoute === '/dashboard') {
          setCurrentRoute('/login');
          if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
            window.history.replaceState({}, '', '/login');
          }
        }
      }
    }
  }, [isAuthenticated, isLoading, currentRoute]);

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
      return <RegisterPage onNavigateToLogin={() => navigateTo('/login')} />;
    }
    return <LoginPage onNavigateToRegister={() => navigateTo('/register')} />;
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
