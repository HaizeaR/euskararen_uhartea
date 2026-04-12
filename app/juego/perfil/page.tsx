'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { CHARACTERS } from '@/lib/characters';
import { CHECKPOINTS, unlockedCheckpoints } from '@/lib/checkpoints';
import { getGroupRewards } from '@/lib/rewards';
import { WEEKLY_SCHEDULE } from '@/lib/schedule';

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
  class_1_euskera: boolean; class_1_errespetua: boolean;
  class_2_euskera: boolean; class_2_errespetua: boolean;
  class_3_euskera: boolean; class_3_errespetua: boolean;
  class_4_euskera: boolean; class_4_errespetua: boolean;
  class_5_euskera: boolean; class_5_errespetua: boolean;
};

function scoreColor(s: number) {
  if (s >= 8) return '#27ae60';
  if (s >= 5) return '#F1A805';
  return '#e05040';
}

function prevSchoolDay(d: Date): Date {
  const prev = new Date(d);
  do { prev.setDate(prev.getDate() - 1); } while (prev.getDay() === 0 || prev.getDay() === 6);
  return prev;
}

/** Consecutive school days ending on the last school day */
function calcStreak(entries: DayEntry[]): number {
  const sorted = [...entries].sort((a, b) => b.entry_date.localeCompare(a.entry_date));
  if (!sorted.length) return 0;
  let streak = 0;
  // Start from today, but if it's a weekend rewind to Friday
  let d = new Date();
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() - 1);
  for (const e of sorted) {
    const expected = d.toISOString().split('T')[0];
    if (e.entry_date === expected) {
      streak++;
      d = prevSchoolDay(d);
    } else {
      break;
    }
  }
  return streak;
}

type EditState = { [key: string]: boolean };

export default function PerfilPage() {
  const router = useRouter();
  const [group,      setGroup]      = useState<Group | null>(null);
  const [entries,    setEntries]    = useState<DayEntry[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [editId,     setEditId]     = useState<number | null>(null);
  const [editState,  setEditState]  = useState<EditState>({});
  const [editSaving, setEditSaving] = useState(false);
  const [classNames, setClassNames] = useState<string[]>(['Matematika','Hizkuntza','Nat. Zientziak','Giz. Zientziak','Gorputz Hez.']);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/session');
        if (!res.ok) { router.push('/'); return; }
        const session = await res.json();

        const [gr, er, cr] = await Promise.all([
          fetch(`/api/groups?classroom_id=${session.classroomId}`),
          fetch(`/api/entries?group_id=${session.groupId}`),
          fetch('/api/teacher/classrooms'),
        ]);
        const groups: Group[] = await gr.json();
        setGroup(groups.find(x => x.id === session.groupId) ?? null);
        if (er.ok) {
          const data: DayEntry[] = await er.json();
          setEntries([...data].sort((a, b) => b.entry_date.localeCompare(a.entry_date)));
        }
        if (cr.ok) {
          const { classroom: c } = await cr.json();
          if (c?.class_names) try { setClassNames(JSON.parse(c.class_names)); } catch {}
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  function openEdit(e: DayEntry) {
    const s: EditState = {};
    for (let k = 1; k <= 5; k++) {
      s[`class_${k}_euskera`]    = (e as unknown as Record<string,boolean>)[`class_${k}_euskera`];
      s[`class_${k}_errespetua`] = (e as unknown as Record<string,boolean>)[`class_${k}_errespetua`];
    }
    setEditState(s);
    setEditId(e.id);
  }

  function toggleEdit(field: string) {
    setEditState(prev => ({ ...prev, [field]: !prev[field] }));
  }

  async function saveEdit(entryId: number) {
    setEditSaving(true);
    try {
      const res = await fetch(`/api/entries/${entryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editState),
      });
      if (res.ok) {
        const updated: DayEntry = await res.json();
        setEntries(prev => prev.map(e => e.id === entryId ? { ...e, ...updated } : e));
        setEditId(null);
      }
    } finally {
      setEditSaving(false);
    }
  }

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
          { label: 'Bolada',    value: streak,                          icon: '🔥' },
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
          Tresna Biltegia
        </p>
        <div className="grid grid-cols-2 gap-3">
          {CHECKPOINTS.map((cp) => {
            // Checkpoint 0 (Hasierako Hondartza) is always unlocked for everyone
            const isUnlocked = cp.id === 0 || unlocked.includes(cp.id);
            // reward index matches checkpoint id directly (0=initial, 1-6=checkpoints)
            const reward     = groupRewards[cp.id];
            return (
              <div
                key={cp.id}
                className="flex items-center gap-3 p-3 rounded-2xl transition-all"
                style={{
                  background: isUnlocked
                    ? cp.id === 0
                      ? 'linear-gradient(145deg,rgba(146,173,164,0.18),rgba(146,173,164,0.06))'
                      : 'linear-gradient(145deg,rgba(241,168,5,0.13),rgba(241,168,5,0.04))'
                    : 'rgba(0,0,0,0.04)',
                  border: `1px solid ${isUnlocked
                    ? cp.id === 0 ? 'rgba(146,173,164,0.40)' : 'rgba(241,168,5,0.30)'
                    : 'rgba(132,87,47,0.12)'}`,
                }}
              >
                {isUnlocked && reward ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={reward.image}
                      alt={reward.name}
                      className="flex-shrink-0"
                      style={{ width: 72, height: 72, objectFit: 'contain', filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.22))' }}
                    />
                    <div className="min-w-0">
                      <p className="font-black text-sm leading-tight" style={{ color: '#3d2510' }}>
                        {reward.name}
                      </p>
                      <p className="text-xs mt-0.5 opacity-55" style={{ color: '#84572F' }}>
                        {cp.icon} {cp.name}
                      </p>
                      {cp.id === 0 && (
                        <p className="text-xs mt-0.5 font-bold" style={{ color: '#92ADA4' }}>
                          ✓ Hasieratik
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div
                      className="flex items-center justify-center rounded-xl flex-shrink-0"
                      style={{ width: 72, height: 72, background: 'rgba(132,87,47,0.08)', border: '2px dashed rgba(132,87,47,0.22)' }}
                    >
                      <span style={{ fontSize: 34, opacity: 0.30 }}>❓</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm opacity-35" style={{ color: '#3d2510' }}>Ez ezaguna</p>
                      <p className="text-xs mt-0.5 opacity-30" style={{ color: '#84572F' }}>
                        {cp.icon} {cp.name}
                      </p>
                      <p className="text-xs mt-1 opacity-25" style={{ color: '#84572F' }}>
                        {cp.requiredPos} pos. behar
                      </p>
                    </div>
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
          <div className="space-y-1.5 max-h-96 overflow-y-auto">
            {entries.map(e => (
              <div key={e.id}>
                {/* Row */}
                <div className="flex items-center gap-3 text-sm px-3 py-2 rounded-xl"
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
                  {e.validated_by_teacher
                    ? <span className="text-xs font-bold w-14 text-right" style={{ color: '#27ae60' }}>✓ Bal.</span>
                    : (
                      <button
                        onClick={() => editId === e.id ? setEditId(null) : openEdit(e)}
                        className="text-xs font-bold w-14 text-right transition-opacity hover:opacity-100 opacity-60"
                        style={{ color: '#84572F' }}
                      >
                        {editId === e.id ? 'Itxi ✕' : 'Editatu'}
                      </button>
                    )
                  }
                </div>

                {/* Inline edit panel */}
                {editId === e.id && (
                  <div className="mt-1 mb-2 px-3 py-3 rounded-xl space-y-2"
                    style={{ background: 'rgba(132,87,47,0.07)', border: '1px solid rgba(132,87,47,0.18)' }}>
                    {(WEEKLY_SCHEDULE[new Date(e.entry_date + 'T12:00:00').getDay()] ?? classNames).map((name, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-xs font-semibold w-24 shrink-0" style={{ color: '#84572F' }}>
                          {name}
                        </span>
                        <button
                          onClick={() => toggleEdit(`class_${i+1}_euskera`)}
                          className="text-xs px-2 py-1 rounded-lg transition-all"
                          style={{
                            background: editState[`class_${i+1}_euskera`] ? 'rgba(100,185,140,0.18)' : 'rgba(0,0,0,0.06)',
                            border: `1px solid ${editState[`class_${i+1}_euskera`] ? 'rgba(100,185,140,0.50)' : 'rgba(132,87,47,0.20)'}`,
                            color: editState[`class_${i+1}_euskera`] ? '#27ae60' : '#84572F',
                          }}
                        >🗣️ Euskera</button>
                        <button
                          onClick={() => toggleEdit(`class_${i+1}_errespetua`)}
                          className="text-xs px-2 py-1 rounded-lg transition-all"
                          style={{
                            background: editState[`class_${i+1}_errespetua`] ? 'rgba(241,168,5,0.12)' : 'rgba(0,0,0,0.06)',
                            border: `1px solid ${editState[`class_${i+1}_errespetua`] ? 'rgba(241,168,5,0.45)' : 'rgba(132,87,47,0.20)'}`,
                            color: editState[`class_${i+1}_errespetua`] ? '#c98000' : '#84572F',
                          }}
                        >🤝 Errespetua</button>
                      </div>
                    ))}
                    <button
                      onClick={() => saveEdit(e.id)}
                      disabled={editSaving}
                      className="btn-teal text-xs py-1.5 px-4 mt-1"
                    >
                      {editSaving ? 'Gordetzen...' : '💾 Gorde'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
