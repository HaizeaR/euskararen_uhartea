'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { CHARACTERS } from '@/lib/characters';
import { CHECKPOINTS, unlockedCheckpoints } from '@/lib/checkpoints';
import { getGroupRewards } from '@/lib/rewards';

type Group = {
  id: number;
  name: string | null;
  student_name: string | null;
  character_index: number;
  color: string;
  position: string;
};

type DayEntry = {
  id: number;
  entry_date: string;
  score: number;
  advance: string;
  validated_by_teacher: boolean;
};

function scoreColor(s: number) {
  if (s >= 8) return '#27ae60';
  if (s >= 5) return '#F1A805';
  return '#e05040';
}

/** Consecutive days ending today */
function calcStreak(entries: DayEntry[]): number {
  const sorted = [...entries].sort((a, b) => b.entry_date.localeCompare(a.entry_date));
  if (!sorted.length) return 0;
  let streak = 0;
  const d = new Date();
  for (const e of sorted) {
    const expected = d.toISOString().split('T')[0];
    if (e.entry_date === expected) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export default function PerfilPage() {
  const router = useRouter();
  const [group,   setGroup]   = useState<Group | null>(null);
  const [entries, setEntries] = useState<DayEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/session');
        if (!res.ok) { router.push('/'); return; }
        const session = await res.json();

        const [gr, er] = await Promise.all([
          fetch(`/api/groups?classroom_id=${session.classroomId}`),
          fetch(`/api/entries?group_id=${session.groupId}`),
        ]);
        const groups: Group[] = await gr.json();
        const g = groups.find(x => x.id === session.groupId) ?? null;
        setGroup(g);

        if (er.ok) {
          const data: DayEntry[] = await er.json();
          setEntries([...data].sort((a, b) => b.entry_date.localeCompare(a.entry_date)));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="animate-pulse text-sm" style={{ color: 'var(--breeze)' }}>Kargatzen...</p>
      </div>
    );
  }

  if (!group) return null;

  const char         = CHARACTERS[group.character_index] ?? CHARACTERS[0];
  const pos          = parseFloat(group.position);
  const unlocked     = unlockedCheckpoints(pos);
  const groupRewards = getGroupRewards(group.id);
  const streak  = calcStreak(entries);
  const avg     = entries.length ? entries.reduce((s, e) => s + e.score, 0) / entries.length : null;
  const last7   = entries.slice(0, 7).reverse();

  return (
    <main className="min-h-screen p-4 md:p-6 max-w-lg mx-auto">
      <header className="flex items-center gap-3 mb-5">
        <Link href="/juego" className="text-xl opacity-60 hover:opacity-100" style={{ color: 'var(--saddle)' }}>←</Link>
        <h1 className="island-title text-xl">Nire Profila</h1>
      </header>

      {/* ── Character hero ── */}
      <div
        className="rounded-3xl p-6 mb-4 flex flex-col items-center text-center relative overflow-hidden"
        style={{
          background: `linear-gradient(160deg, ${char.color}22, ${char.color}08)`,
          border: `1px solid ${char.color}30`,
        }}
      >
        {/* Glow blob */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse 60% 50% at 50% 80%, ${char.color}18, transparent)` }} />

        <div className="relative"
          style={{ width: 120, height: 120, filter: `drop-shadow(0 6px 18px ${char.color}88)` }}>
          <Image src={char.image} alt={char.name} fill className="object-contain" />
        </div>

        <h2 className="font-black text-2xl mt-3 leading-tight"
          style={{ fontFamily: 'Rubik, var(--font-display), sans-serif', color: '#3d2510' }}>
          {group.student_name || group.name || char.name}
        </h2>
        <p className="text-sm mt-0.5 font-semibold" style={{ color: char.color }}>
          {char.label} taldea
        </p>

        {/* Position pill */}
        <div className="mt-3 flex items-center gap-2">
          <div className="px-4 py-1.5 rounded-full text-sm font-black"
            style={{ background: 'rgba(0,0,0,0.12)', color: '#3d2510' }}>
            🗺️ {pos} / 50 posizio
          </div>
          {streak > 0 && (
            <div className="px-3 py-1.5 rounded-full text-sm font-black"
              style={{ background: 'rgba(241,168,5,0.15)', color: '#7a5000', border: '1px solid rgba(241,168,5,0.30)' }}>
              🔥 {streak} egun
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="w-full mt-4 rounded-full h-2" style={{ background: 'rgba(0,0,0,0.12)' }}>
          <div className="h-2 rounded-full transition-all duration-700"
            style={{ width: `${(pos / 50) * 100}%`, background: char.color }} />
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-3 gap-2.5 mb-4">
        {[
          { label: 'Sarrerak',     value: entries.length,                  icon: '📝' },
          { label: 'Batez beste',  value: avg !== null ? `${avg.toFixed(1)}` : '—', icon: '⭐' },
          { label: 'Errautsak',    value: streak,                          icon: '🔥' },
        ].map(stat => (
          <div key={stat.label} className="card-parchment p-3 text-center">
            <div className="text-xl mb-0.5">{stat.icon}</div>
            <div className="font-black text-xl leading-none" style={{ color: '#3d2510' }}>{stat.value}</div>
            <div className="text-xs mt-0.5 font-semibold" style={{ color: '#84572F' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ── Last 7 days mini chart ── */}
      {last7.length > 0 && (
        <div className="card-parchment p-4 mb-4">
          <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: '#92ADA4' }}>
            Azken egunak
          </p>
          <div className="flex items-end gap-1.5 h-16">
            {last7.map((e, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-lg transition-all duration-500"
                  style={{
                    height: `${Math.max(8, (e.score / 10) * 52)}px`,
                    background: scoreColor(e.score),
                    opacity: 0.85,
                  }}
                  title={`${e.entry_date}: ${e.score}/10`}
                />
                <span className="text-xs font-semibold" style={{ color: '#84572F', fontSize: 9 }}>
                  {e.entry_date.slice(5)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Rewards inventory ── */}
      <div className="card-parchment p-4 mb-4">
        <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: '#92ADA4' }}>
          Tresna Inbentarioa
        </p>
        <div className="grid grid-cols-3 gap-2.5">
          {CHECKPOINTS.filter(cp => cp.id > 0).map((cp, idx) => {
            const isUnlocked = unlocked.includes(cp.id);
            const reward     = groupRewards[idx];
            return (
              <div
                key={cp.id}
                className="flex flex-col items-center gap-1.5 p-3 rounded-2xl text-center transition-all relative"
                style={{
                  background: isUnlocked
                    ? 'linear-gradient(145deg,rgba(241,168,5,0.12),rgba(241,168,5,0.05))'
                    : 'rgba(0,0,0,0.04)',
                  border: `1px solid ${isUnlocked ? 'rgba(241,168,5,0.28)' : 'rgba(132,87,47,0.12)'}`,
                }}
              >
                {isUnlocked ? (
                  <>
                    {/* Tool image */}
                    <div className="relative" style={{ width: 52, height: 52 }}>
                      <Image
                        src={reward.image}
                        alt={reward.name}
                        fill
                        className="object-contain"
                        style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.18))' }}
                      />
                    </div>
                    <span className="text-xs font-bold leading-tight" style={{ color: '#5a3218', fontSize: 10 }}>
                      {reward.name}
                    </span>
                    {/* Checkpoint name */}
                    <span className="text-xs leading-tight opacity-50" style={{ color: '#84572F', fontSize: 9 }}>
                      {cp.icon} {cp.name.split(' ')[0]}
                    </span>
                  </>
                ) : (
                  <>
                    {/* Mystery box */}
                    <div
                      className="flex items-center justify-center rounded-xl"
                      style={{ width: 52, height: 52, background: 'rgba(132,87,47,0.10)', border: '1.5px dashed rgba(132,87,47,0.25)' }}
                    >
                      <span style={{ fontSize: 26, filter: 'grayscale(1)', opacity: 0.35 }}>❓</span>
                    </div>
                    <span className="text-xs font-semibold opacity-40" style={{ color: '#3d2510', fontSize: 10 }}>
                      Lorteke
                    </span>
                    <span className="text-xs opacity-30" style={{ color: '#84572F', fontSize: 9 }}>
                      {cp.requiredPos} pos. behar
                    </span>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Recent history ── */}
      {entries.length > 0 && (
        <div className="card-parchment p-4">
          <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: '#92ADA4' }}>
            Historikoa
          </p>
          <div className="space-y-1.5 max-h-52 overflow-y-auto">
            {entries.map(e => (
              <div key={e.id} className="flex items-center gap-3 text-sm px-3 py-2 rounded-xl"
                style={{ background: 'rgba(0,0,0,0.04)' }}>
                <span className="text-xs font-semibold w-20 shrink-0" style={{ color: '#84572F' }}>
                  {e.entry_date}
                </span>
                <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(132,87,47,0.12)' }}>
                  <div className="h-1.5 rounded-full transition-all"
                    style={{ width: `${(e.score / 10) * 100}%`, background: scoreColor(e.score) }} />
                </div>
                <span className="font-black text-sm w-10 text-right" style={{ color: scoreColor(e.score) }}>
                  {e.score}/10
                </span>
                <span className="text-xs w-12 text-right font-semibold" style={{ color: '#4a7068' }}>
                  +{e.advance}
                </span>
                {e.validated_by_teacher && (
                  <span className="text-xs font-bold" style={{ color: '#27ae60' }}>✓</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
