import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'GC Locamoto',
  description: 'Sistema de Gestão de Aluguéis de Motocicletas',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
