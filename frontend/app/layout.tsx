import type { Metadata } from 'next';
import { Archivo, Public_Sans, JetBrains_Mono } from 'next/font/google';
import { Providers } from '@/components/providers';
import './globals.css';

const display = Archivo({ subsets: ['latin'], variable: '--font-display', weight: ['500', '600', '700'] });
const body = Public_Sans({ subsets: ['latin'], variable: '--font-body' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', weight: ['500', '600'] });

export const metadata: Metadata = {
  title: 'Protocolo Digital — Prefeitura de Laranjal do Jari/AP',
  description: 'Abertura, tramitação e consulta pública de protocolos da Prefeitura Municipal de Laranjal do Jari, Amapá.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
