import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Minha conta | Barber Navalha',
  robots: { index: false },
};

export default function ContaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
