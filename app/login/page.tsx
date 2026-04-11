'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/teacher-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Errorea gertatu da');
        return;
      }
      router.push('/irakaslea');
    } catch {
      setError('Konexio errorea');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="text-center mb-10">
        <h1 className="island-title text-3xl md:text-4xl mb-2">
          Euskararen Uhartea
        </h1>
        <p className="text-amber-400 text-base">Irakaslearen Sarbidea</p>
      </div>

      <div className="card-parchment p-8 w-full max-w-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          <h2 className="text-xl font-bold text-center text-amber-900 mb-4">
            Hasi Saioa
          </h2>

          <div>
            <label className="block text-amber-800 font-semibold mb-1 text-sm">
              Erabiltzaile izena
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="irakaslea"
              autoComplete="username"
              className="w-full border-2 border-amber-600 rounded-lg p-3 bg-amber-50 text-amber-900 focus:outline-none focus:border-amber-800"
            />
          </div>

          <div>
            <label className="block text-amber-800 font-semibold mb-1 text-sm">
              Pasahitza
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••"
              autoComplete="current-password"
              className="w-full border-2 border-amber-600 rounded-lg p-3 bg-amber-50 text-amber-900 focus:outline-none focus:border-amber-800"
            />
          </div>

          {error && (
            <p className="text-red-600 text-center text-sm bg-red-50 p-2 rounded-lg border border-red-200">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !username || !password}
            className="btn-gold w-full"
          >
            {loading ? 'Sartzen...' : 'Sartu →'}
          </button>
        </form>
      </div>

      <div className="mt-8">
        <Link href="/" className="text-amber-500 text-sm underline opacity-60 hover:opacity-100">
          ← Ikasleen sarrera
        </Link>
      </div>
    </main>
  );
}
