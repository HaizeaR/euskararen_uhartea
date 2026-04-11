import type { Metadata } from 'next';
import { Bangers, Nunito } from 'next/font/google';
import './globals.css';

/* ── Display: chunky, playful, adventure ── */
const bangers = Bangers({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
});

/* ── Body: clean, rounded, readable ── */
const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  display: 'swap',
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: 'Euskararen Uhartea',
  description: 'Joko hezigarria euskara eta errespetua lantzeko',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="eu" className={`${bangers.variable} ${nunito.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
