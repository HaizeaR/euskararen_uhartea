'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/student-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
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
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="text-center mb-10">
        <h1 className="island-title text-4xl md:text-5xl mb-3">
          Euskararen Uhartea
        </h1>
        <p className="text-amber-300 text-lg">Joko Hezigarria</p>
      </div>

      <div className="card-parchment p-8 w-full max-w-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-amber-900 mb-1">Hasi Jolasa</h2>
            <p className="text-amber-700 text-sm">
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
            className="w-full text-center text-3xl font-bold tracking-widest border-2 border-amber-600 rounded-xl p-4 bg-amber-50 text-amber-900 focus:outline-none focus:border-amber-800 uppercase"
          />

          {error && <p className="text-red-600 text-center text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading || code.length < 4}
            className="btn-gold w-full text-lg"
          >
            {loading ? 'Bilatzen...' : 'Sartu →'}
          </button>
        </form>
      </div>

      <div className="mt-8 text-center">
        <Link
          href="/login"
          className="text-amber-500 text-sm underline opacity-60 hover:opacity-100"
        >
          Irakaslearen sarbidea
        </Link>
      </div>
    </main>
  );
}
