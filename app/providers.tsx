'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { QueryClientProvider } from '@tanstack/react-query';
import { AppProvider, useAppContext } from '../contexts/AppContext';
import { Layout } from '../components/Layout';
import { Login } from '../components/Login';
import { queryClient } from '../lib/queryClient';

function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { user, setUser } = useAppContext();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (user && pathname === '/') {
      const perms = user.role?.permissions || [];
      const hasDashboard = perms.includes('*') || perms.includes('dashboard');
      if (!hasDashboard) {
        if (perms.includes('oficina_view')) router.push('/oficina');
        else if (perms.includes('financeiro_view')) router.push('/clientes');
        else if (perms.includes('veiculos_view')) router.push('/veiculos');
      }
    }
  }, [user, pathname, router]);

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return (
    <Layout user={user} onLogout={() => {
      localStorage.removeItem('electron_user_id');
      localStorage.removeItem('electron_user_email');
      setUser(null);
    }}>
      {children}
    </Layout>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <AuthWrapper>{children}</AuthWrapper>
      </AppProvider>
    </QueryClientProvider>
  );
}
