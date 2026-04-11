import type { Metadata } from 'next';
import { Rubik, Nunito } from 'next/font/google';
import './globals.css';

/* ── Display: Rubik Black — bold, rounded, retro-adventure feel ── */
const rubik = Rubik({
  weight: ['700', '800', '900'],
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
    <html lang="eu" className={`${rubik.variable} ${nunito.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
