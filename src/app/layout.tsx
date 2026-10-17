import type { Metadata, Viewport } from 'next';
// fontes locais via @fontsource (o build não depende do Google Fonts)
import '@fontsource/dm-serif-display/400.css';
import '@fontsource-variable/manrope';
import { barbearia } from '@/data/barbearia';
import './globals.css';
import './sections.css';

const { marca } = barbearia;

export const metadata: Metadata = {
  title: `${marca.nome} | Barbearia`,
  description: `${marca.slogan}. Cortes, barba, planos e horários.`,
};

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
