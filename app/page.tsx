'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Group = {
  id: number;
  name: string | null;
  character_index: number;
  color: string;
  position: string;
};

type Classroom = {
  id: number;
  name: string;
  code: string;
};

export default function HomePage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [groups, setGroups] = useState<Group[]>([]);
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [step, setStep] = useState<'code' | 'group'>('code');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`/api/classroom/${code.trim().toUpperCase()}`);
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Kode okerra');
        return;
      }
      const data = await res.json();
      setClassroom(data.classroom);
      setGroups(data.groups);
      setStep('group');
    } catch {
      setError('Konexio errorea');
    } finally {
      setLoading(false);
    }
  }

  async function handleGroupSelect(groupId: number) {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/student-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.toUpperCase(), group_id: groupId }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Errorea');
        return;
      }
      router.push('/juego');
    } catch {
      setError('Konexio errorea');
    } finally {
      setLoading(false);
    }
  }

  const CHARACTER_NAMES = [
    'Amaia', 'Iker', 'Nerea', 'Unai', 'Leire', 'Mikel',
  ];

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="island-title text-4xl md:text-5xl mb-3">
          Euskararen Uhartea
        </h1>
        <p className="text-amber-300 text-lg">Joko Hezigarria — 6B Klasea</p>
      </div>

      <div className="card-parchment p-8 w-full max-w-md">
        {step === 'code' && (
          <form onSubmit={handleCodeSubmit} className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-amber-900">
              Sartu Kodea
            </h2>
            <p className="text-amber-800 text-center text-sm">
              Irakasleak emandako klasearen kodea idatzi
            </p>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="UHARTE"
              maxLength={6}
              className="w-full text-center text-2xl font-bold tracking-widest border-2 border-amber-600 rounded-xl p-4 bg-amber-50 text-amber-900 focus:outline-none focus:border-amber-800 uppercase"
            />
            {error && <p className="text-red-600 text-center text-sm">{error}</p>}
            <button type="submit" disabled={loading || code.length < 4} className="btn-gold w-full">
              {loading ? 'Bilatzen...' : 'Sartu →'}
            </button>
          </form>
        )}

        {step === 'group' && classroom && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-center text-amber-900">
              {classroom.name}
            </h2>
            <p className="text-amber-800 text-center text-sm">
              Zure taldea aukeratu
            </p>
            <div className="grid grid-cols-2 gap-3">
              {groups.map((g) => (
                <button
                  key={g.id}
                  onClick={() => handleGroupSelect(g.id)}
                  disabled={loading}
                  className="p-4 rounded-xl border-2 font-semibold text-white transition-all hover:scale-105 active:scale-95 shadow-md"
                  style={{
                    backgroundColor: g.color,
                    borderColor: g.color,
                  }}
                >
                  <div className="text-2xl mb-1">
                    {g.character_index === 0 ? '⚔️' :
                     g.character_index === 1 ? '🏹' :
                     g.character_index === 2 ? '🌊' :
                     g.character_index === 3 ? '🔥' :
                     g.character_index === 4 ? '🌿' : '⭐'}
                  </div>
                  <div className="text-sm font-bold">
                    {g.name || CHARACTER_NAMES[g.character_index]}
                  </div>
                  <div className="text-xs opacity-80 mt-1">
                    {parseFloat(g.position)} pos.
                  </div>
                </button>
              ))}
            </div>
            {error && <p className="text-red-600 text-center text-sm">{error}</p>}
            <button
              onClick={() => { setStep('code'); setError(''); }}
              className="w-full text-amber-700 underline text-sm text-center"
            >
              ← Atzera
            </button>
          </div>
        )}
      </div>

      <div className="mt-8 text-center">
        <Link href="/login" className="text-amber-500 text-sm underline opacity-60 hover:opacity-100">
          Irakaslearen sarbidea
        </Link>
      </div>
    </main>
  );
}
