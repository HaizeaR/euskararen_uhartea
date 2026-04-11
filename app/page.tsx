'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

/* ── Page ─────────────────────────────────────────────────────────── */
export default function HomePage() {
  const router = useRouter();
  const [code,    setCode]    = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/student-login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ code: code.trim().toUpperCase() }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Kode okerra');
        return;
      }
      const data = await res.json();
      router.push(data.needsSetup ? '/juego/setup' : '/juego');
    } catch {
      setError('Konexio errorea');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8"
      style={{ gap: 0 }}
    >
      {/* ── Island Logo ── */}
      <div className="relative" style={{ width: 360, height: 360, maxWidth: '90vw' }}>
        <Image
          src="/logo-island.png"
          alt="Euskararen Uhartea"
          fill
          className="object-contain"
          priority
          style={{ filter: 'drop-shadow(0 8px 24px rgba(74,112,104,0.35))' }}
        />
      </div>

      {/* ── Tagline ── */}
      <p
        className="text-center font-bold tracking-widest uppercase text-sm mb-8 -mt-4"
        style={{ color: '#4a7068', letterSpacing: '0.18em' }}
      >
        Joko Hezigarria
      </p>

      {/* ── Login card ── */}
      <div className="card-parchment p-7 w-full max-w-sm shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="text-center">
            <h2
              className="text-xl font-black mb-1"
              style={{ fontFamily: 'Rubik, var(--font-display), sans-serif', color: '#5a3218' }}
            >
              Hasi Jolasa
            </h2>
            <p className="text-sm" style={{ color: '#84572F' }}>
              Irakasleak emandako talde-kodea idatzi
            </p>
          </div>

          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="EKP001"
            maxLength={8}
            autoFocus
            className="w-full text-center text-3xl font-black tracking-widest rounded-2xl p-4 uppercase focus:outline-none transition-all"
            style={{
              border:      '3px solid #84572F',
              background:  'rgba(255,255,255,0.65)',
              color:       '#3d2510',
              fontFamily:  'Rubik, var(--font-display), sans-serif',
            }}
          />

          {error && (
            <p className="text-center text-sm font-bold" style={{ color: '#b83020' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || code.length < 4}
            className="btn-bronze w-full text-lg"
          >
            {loading ? 'Bilatzen...' : 'Sartu →'}
          </button>
        </form>
      </div>

      {/* ── Teacher link ── */}
      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="text-sm font-semibold underline underline-offset-4 opacity-65 hover:opacity-100 transition-opacity"
          style={{ color: '#4a7068' }}
        >
          Irakaslearen sarbidea
        </Link>
      </div>
    </main>
  );
}
