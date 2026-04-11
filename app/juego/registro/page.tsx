'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { CHARACTERS } from '@/lib/characters';

type ClassData = { euskera: boolean; errespetua: boolean; };

const CLASS_NAMES = [
  'Matematika',
  'Hizkuntza',
  'Natur Zientziak',
  'Gizarte Zientziak',
  'Gorputz Hezkuntza',
];

export default function RegistroPage() {
  const router = useRouter();
  const [classes,  setClasses]  = useState<ClassData[]>(Array(5).fill(null).map(() => ({ euskera: false, errespetua: false })));
  const [charIdx,  setCharIdx]  = useState(0);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  useEffect(() => {
    fetch('/api/session').then(r => r.json()).then(s => {
      if (s.groupId) {
        fetch(`/api/groups?classroom_id=${s.classroomId}`)
          .then(r => r.json())
          .then((gs: { id: number; character_index: number }[]) => {
            const g = gs.find(x => x.id === s.groupId);
            if (g) setCharIdx(g.character_index);
          });
      }
    });
  }, []);

  function toggleClass(idx: number, field: 'euskera' | 'errespetua') {
    setClasses(prev => prev.map((c, i) => i === idx ? { ...c, [field]: !c[field] } : c));
  }

  const totalScore = classes.reduce((s, c) => s + (c.euskera ? 1 : 0) + (c.errespetua ? 1 : 0), 0);
  const advance    = totalScore / 2;
  const pct        = (totalScore / 10) * 100;
  const char       = CHARACTERS[charIdx] ?? CHARACTERS[0];

  // Battery color zones
  const batteryColor =
    totalScore >= 8 ? '#27ae60' :
    totalScore >= 5 ? '#f5c842' :
    totalScore >= 2 ? '#e67e22' : '#c0392b';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    const body: Record<string, boolean> = {};
    classes.forEach((c, i) => {
      body[`class_${i + 1}_euskera`]     = c.euskera;
      body[`class_${i + 1}_errespetua`]  = c.errespetua;
    });
    try {
      const res = await fetch('/api/entries', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) { setError((await res.json()).error || 'Errorea'); return; }
      router.push('/juego');
    } catch { setError('Konexio errorea'); }
    finally  { setLoading(false); }
  }

  return (
    <main className="min-h-screen p-4 md:p-6 max-w-lg mx-auto">
      <header className="flex items-center gap-3 mb-6">
        <Link href="/juego" className="text-2xl" style={{ color: 'var(--sand-light)' }}>←</Link>
        <h1 className="island-title text-2xl">Gaur Erregistratu</h1>
      </header>

      {/* ── CHARACTER + BATTERY ── */}
      <div
        className="rounded-2xl p-5 mb-6 flex items-center gap-5"
        style={{ background: `linear-gradient(135deg, ${char.color}33, ${char.color}11)`, border: `2px solid ${char.color}55` }}
      >
        {/* Character — grows with score */}
        <div
          className="relative flex-shrink-0 transition-all duration-500"
          style={{
            width:  `${80 + totalScore * 6}px`,
            height: `${80 + totalScore * 6}px`,
            filter: totalScore >= 8
              ? `drop-shadow(0 0 14px ${char.color})`
              : totalScore >= 5
              ? `drop-shadow(0 0 6px ${char.color}88)`
              : 'none',
          }}
        >
          <Image src={char.image} alt={char.name} fill className="object-contain" />
          {totalScore === 10 && (
            <div className="absolute -top-2 -right-2 text-2xl animate-bounce">⭐</div>
          )}
        </div>

        {/* Battery bar */}
        <div className="flex-1">
          <div className="flex justify-between items-center mb-1.5">
            <span className="font-bold text-sm" style={{ color: 'var(--parchment)' }}>
              Energia
            </span>
            <span className="font-black text-xl" style={{ color: batteryColor }}>
              {totalScore}/10
            </span>
          </div>

          {/* Main battery */}
          <div className="relative rounded-lg overflow-hidden h-8 w-full"
            style={{ background: 'rgba(0,0,0,0.35)', border: '2px solid rgba(200,160,60,0.4)' }}>
            <div
              className="h-full rounded-md transition-all duration-300"
              style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${batteryColor}99, ${batteryColor})` }}
            />
            {/* Battery segments */}
            {[2,4,6,8].map(n => (
              <div key={n} className="absolute top-0 bottom-0 w-px opacity-30"
                style={{ left: `${n * 10}%`, background: 'rgba(255,255,255,0.6)' }} />
            ))}
            <span className="absolute inset-0 flex items-center justify-center text-xs font-black"
              style={{ color: totalScore > 4 ? '#fff' : 'rgba(255,255,255,0.5)', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
              +{advance} posizio
            </span>
          </div>

          {/* Segment dots */}
          <div className="flex gap-1 mt-2">
            {Array.from({ length: 10 }).map((_, j) => (
              <div key={j} className="flex-1 h-2 rounded-full transition-all duration-200"
                style={{ background: j < totalScore ? batteryColor : 'rgba(255,255,255,0.15)' }} />
            ))}
          </div>

          <p className="text-xs mt-1.5 opacity-60" style={{ color: 'var(--parchment)' }}>
            {totalScore === 10 ? '🎉 Perfektua! Energia osoa!' :
             totalScore >= 7  ? '💪 Oso ondo!' :
             totalScore >= 4  ? '👍 Aurrera!' : '🌱 Hasi berri!'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {CLASS_NAMES.map((name, i) => (
          <div key={i} className="card-dark p-4 rounded-xl">
            <p className="font-bold text-sm uppercase tracking-wide mb-3" style={{ color: 'var(--sand-mid)' }}>
              {i + 1}. {name}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {/* Euskera */}
              <button
                type="button"
                onClick={() => toggleClass(i, 'euskera')}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 transition-all text-left"
                style={{
                  borderColor:     classes[i].euskera ? '#27ae60' : 'rgba(100,70,20,0.4)',
                  background:      classes[i].euskera ? 'rgba(39,174,96,0.18)' : 'rgba(0,0,0,0.25)',
                  boxShadow:       classes[i].euskera ? '0 0 10px rgba(39,174,96,0.30)' : 'none',
                  color:           classes[i].euskera ? '#72e8a0' : 'rgba(240,210,120,0.55)',
                }}
              >
                <span className="text-lg">🗣️</span>
                <span className="text-xs font-bold leading-tight">Euskaraz aritu naiz</span>
                {classes[i].euskera && <span className="ml-auto text-green-400 font-black">✓</span>}
              </button>

              {/* Errespetua */}
              <button
                type="button"
                onClick={() => toggleClass(i, 'errespetua')}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 transition-all text-left"
                style={{
                  borderColor:     classes[i].errespetua ? '#f5c842' : 'rgba(100,70,20,0.4)',
                  background:      classes[i].errespetua ? 'rgba(245,200,66,0.18)' : 'rgba(0,0,0,0.25)',
                  boxShadow:       classes[i].errespetua ? '0 0 10px rgba(245,200,66,0.30)' : 'none',
                  color:           classes[i].errespetua ? '#f5d870' : 'rgba(240,210,120,0.55)',
                }}
              >
                <span className="text-lg">🤝</span>
                <span className="text-xs font-bold leading-tight">Errespetatua naiz</span>
                {classes[i].errespetua && <span className="ml-auto text-amber-400 font-black">✓</span>}
              </button>
            </div>
          </div>
        ))}

        {error && (
          <p className="text-red-400 text-center text-sm bg-red-950 bg-opacity-50 p-3 rounded-xl">{error}</p>
        )}

        <button type="submit" disabled={loading} className="btn-teal w-full text-base py-4 mt-2">
          {loading ? 'Gordetzen...' : '✅ Gorde eta aurrera!'}
        </button>
      </form>
    </main>
  );
}
