'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';

const NAV_ITEMS = [
  { href: '/irakaslea', label: '📊 Dashboard', exact: true },
  { href: '/irakaslea/grupos', label: '👥 Taldeak' },
  { href: '/irakaslea/historia', label: '📅 Historia' },
  { href: '/irakaslea/configuracion', label: '⚙️ Konfigurazioa' },
];

export default function IrakasleaLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top nav */}
      <nav className="sticky top-0 z-10 border-b border-wood-dark" style={{ background: 'linear-gradient(90deg,rgba(30,18,8,0.97),rgba(18,45,20,0.97))', backdropFilter: 'blur(6px)' }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-2">
          <h1 className="island-title text-lg whitespace-nowrap">Euskararen Uhartea</h1>
          <div className="flex items-center gap-1 flex-wrap">
            {NAV_ITEMS.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-link text-sm ${isActive ? 'bg-amber-900 bg-opacity-50' : ''}`}
                  style={isActive ? { color: '#f0d888' } : {}}
                >
                  {item.label}
                </Link>
              );
            })}
            <button onClick={handleLogout} className="text-sm ml-2 underline opacity-70 hover:opacity-100" style={{ color: '#f0d888' }}>
              Irten
            </button>
          </div>
        </div>
      </nav>

      <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        {children}
      </div>
    </div>
  );
}
