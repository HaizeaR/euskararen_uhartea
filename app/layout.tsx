import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Euskararen Uhartea',
  description: 'Joko hezigarria euskara eta errespetua lantzeko',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="eu">
      <body className="antialiased">{children}</body>
    </html>
  );
}
