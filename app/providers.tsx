'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AppProvider, useAppContext } from '../contexts/AppContext';
import { Layout } from '../components/Layout';
import { Login } from '../components/Login';
import { UserRole } from '../types';

function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { user, setUser } = useAppContext();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (user && pathname === '/') {
      if (user.role === UserRole.MECHANIC) {
        router.push('/oficina');
      } else if (user.role === UserRole.BILLING) {
        router.push('/clientes');
      }
    }
  }, [user, pathname, router]);

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return (
    <Layout user={user} onLogout={() => setUser(null)}>
      {children}
    </Layout>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <AuthWrapper>{children}</AuthWrapper>
    </AppProvider>
  );
}
