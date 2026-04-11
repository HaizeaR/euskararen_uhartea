'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { CHARACTERS } from '@/lib/characters';

export default function SetupPage() {
  const router = useRouter();
  const [groupId, setGroupId]           = useState<number | null>(null);
  const [selectedChar, setSelectedChar] = useState<number | null>(null);
  const [teamName, setTeamName]         = useState('');
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');

  useEffect(() => {
    fetch('/api/session')
      .then(r => r.json())
      .then(s => {
        if (!s.groupId) { router.push('/'); return; }
        setGroupId(s.groupId);
      });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedChar === null) { setError('Pertsonaia bat aukeratu ezazu'); return; }
    if (!teamName.trim())      { setError('Taldearen izena idatzi ezazu'); return; }
    if (!groupId)              return;

    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/groups/${groupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_name: teamName.trim(), character_index: selectedChar }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || 'Errorea');
        return;
      }
      router.push('/juego');
    } catch {
      setError('Konexio errorea');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen p-4 md:p-6 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="island-title text-2xl md:text-3xl mb-2">
          Pertsonaia Aukeratu
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--sand-light)' }}>
          Zein koloreko pertsonaia izango da zure taldea?
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Character grid */}
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
          {CHARACTERS.map(char => {
            const isSelected = selectedChar === char.index;
            return (
              <button
                key={char.index}
                type="button"
                onClick={() => setSelectedChar(char.index)}
                className="flex flex-col items-center rounded-2xl border-2 transition-all cursor-pointer overflow-hidden pt-3 pb-2 px-1"
                style={{
                  borderColor:     isSelected ? char.color : 'rgba(120,80,20,0.4)',
                  backgroundColor: isSelected ? `${char.color}28` : 'rgba(0,0,0,0.28)',
                  transform:       isSelected ? 'scale(1.07)' : 'scale(1)',
                  boxShadow:       isSelected
                    ? `0 0 22px ${char.color}70, 0 4px 14px rgba(0,0,0,0.5)`
                    : '0 2px 8px rgba(0,0,0,0.4)',
                }}
              >
                {/* Character image */}
                <div className="relative w-16 h-16 mb-2">
                  <Image
                    src={char.image}
                    alt={char.name}
                    fill
                    className="object-contain drop-shadow-lg"
                    draggable={false}
                  />
                </div>

                {/* Color dot + label */}
                <div className="flex items-center gap-1 mb-0.5">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0 border border-black border-opacity-20"
                    style={{ backgroundColor: char.color }}
                  />
                  <span
                    className="text-xs font-bold leading-tight"
                    style={{ color: isSelected ? char.color : '#f0d888' }}
                  >
                    {char.label}
                  </span>
                </div>

                {isSelected && (
                  <span
                    className="text-xs font-bold mt-0.5"
                    style={{ color: char.color }}
                  >
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Team name input */}
        <div className="card-dark p-5">
          <label className="block text-xs uppercase tracking-wide font-bold mb-2" style={{ color: 'var(--sand-mid)' }}>
            Taldearen izena
          </label>
          <input
            type="text"
            value={teamName}
            onChange={e => setTeamName(e.target.value)}
            placeholder="adib.: Ane eta Mikel, Talde beroa..."
            maxLength={60}
            className="w-full bg-black bg-opacity-40 border border-amber-800 rounded-lg px-4 py-3 text-amber-100 focus:outline-none focus:border-amber-400 placeholder-amber-900 text-sm"
          />
        </div>

        {error && (
          <p className="text-red-400 text-center text-sm bg-red-950 bg-opacity-50 p-3 rounded-lg">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || selectedChar === null || !teamName.trim()}
          className="btn-teal w-full text-lg"
        >
          {loading ? 'Gordetzen...' : 'Jolasteko prest!'}
        </button>
      </form>
    </main>
  );
}
