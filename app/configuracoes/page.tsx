'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ConfiguracoesRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/configuracoes/acesso');
  }, [router]);
  return null;
}
