import type { Metadata } from 'next';
import { Fredoka, Nunito } from 'next/font/google';
import './globals.css';

/* ── Display: Fredoka — round, friendly, easy to read for kids ── */
const fredoka = Fredoka({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
});

/* ── Body: Nunito — clean, rounded, very readable ── */
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
    <html lang="eu" className={`${fredoka.variable} ${nunito.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
