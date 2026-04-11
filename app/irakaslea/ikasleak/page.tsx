'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { CHARACTERS } from '@/lib/characters';
import { CHECKPOINTS } from '@/lib/checkpoints';

type Group = {
  id: number;
  code: string | null;
  name: string | null;
  student_name: string | null;
  character_index: number;
  color: string;
  position: string;
};

type Member = { id: number; group_id: number; name: string };

type DayEntry = {
  id: number;
  group_id: number;
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

type StudentRow = {
  member: Member;
  group: Group;
  entries: DayEntry[];
};

const CLASS_LABELS = ['Mat', 'Hiz', 'Nat', 'Giz', 'Gor'];

function scoreColor(score: number) {
  if (score >= 8) return '#27ae60';
  if (score >= 5) return '#F1A805';
  return '#c0392b';
}

function lastCheckpointName(pos: number) {
  return [...CHECKPOINTS].reverse().find(c => c.requiredPos <= pos)?.name ?? 'Hasiera';
}

export default function IkasleakPage() {
  const [students,   setStudents]   = useState<StudentRow[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [expanded,   setExpanded]   = useState<number | null>(null); // member id
  const [today,      setToday]      = useState('');

  useEffect(() => {
    setToday(new Date().toISOString().split('T')[0]);
    loadData();
  }, []);

  async function loadData() {
    try {
      const cr = await fetch('/api/teacher/classrooms');
      if (!cr.ok) return;
      const { classroom } = await cr.json();

      const gr = await fetch(`/api/groups?classroom_id=${classroom.id}`);
      if (!gr.ok) return;
      const groups: Group[] = await gr.json();

      // Fetch members + entries per group in parallel
      const rows: StudentRow[] = [];
      await Promise.all(groups.map(async g => {
        const [mr, er] = await Promise.all([
          fetch(`/api/groups/${g.id}/members`),
          fetch(`/api/entries?group_id=${g.id}`),
        ]);
        const groupMembers: Member[] = mr.ok ? await mr.json() : [];
        const groupEntries: DayEntry[] = er.ok ? (await er.json()).reverse() : []; // newest first

        for (const m of groupMembers) {
          rows.push({ member: m, group: g, entries: groupEntries });
        }
      }));

      // Sort by group position desc
      rows.sort((a, b) => parseFloat(b.group.position) - parseFloat(a.group.position));
      setStudents(rows);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function validateEntry(entryId: number, groupId: number) {
    const res = await fetch(`/api/entries/${entryId}/validate`, { method: 'PATCH' });
    if (res.ok) {
      setStudents(prev => prev.map(s =>
        s.group.id === groupId
          ? { ...s, entries: s.entries.map(e => e.id === entryId ? { ...e, validated_by_teacher: true } : e) }
          : s
      ));
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="animate-pulse" style={{ color: 'var(--tuscan-sun)' }}>Kargatzen...</p>
      </div>
    );
  }

  const filtered = search.trim()
    ? students.filter(s =>
        s.member.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.group.name ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : students;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="island-title text-2xl">Ikasleak</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--saddle)' }}>
            {students.length} ikasle • Taldekako bilakaera
          </p>
        </div>
        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Bilatu ikasleak..."
          className="rounded-xl px-4 py-2 text-sm focus:outline-none"
          style={{
            background: 'rgba(237,213,192,0.85)',
            border: '2px solid #84572F',
            color: '#3d2510',
            width: 220,
          }}
        />
      </div>

      {filtered.length === 0 && (
        <div className="card-dark p-8 text-center" style={{ color: 'var(--sugar-cookie)' }}>
          Ez da emaitzarik aurkitu
        </div>
      )}

      <div className="space-y-3">
        {filtered.map(({ member, group, entries }) => {
          const char = CHARACTERS[group.character_index] ?? CHARACTERS[0];
          const pos  = parseFloat(group.position);
          const avg  = entries.length
            ? entries.reduce((s, e) => s + e.score, 0) / entries.length
            : null;
          const hasToday = entries.some(e => e.entry_date === today);
          const isOpen   = expanded === member.id;
          const lastEntry = entries[0]; // newest (already reversed)

          return (
            <div key={member.id} className="card-dark overflow-hidden">
              {/* ── Student summary row ── */}
              <button
                className="w-full text-left px-5 py-4 flex items-center gap-4 flex-wrap hover:bg-white hover:bg-opacity-5 transition-colors"
                onClick={() => setExpanded(isOpen ? null : member.id)}
              >
                {/* Character avatar */}
                <div
                  className="relative flex-shrink-0 rounded-full"
                  style={{
                    width: 44, height: 44,
                    background: group.color,
                    border: `3px solid ${group.color}`,
                    boxShadow: `0 0 10px ${group.color}66`,
                  }}
                >
                  <Image src={char.image} alt={char.name} fill className="object-contain p-0.5" />
                </div>

                {/* Name + group */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-base leading-tight" style={{ color: '#EDD5C0' }}>
                    {member.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs font-semibold" style={{ color: group.color }}>
                      {group.name ?? char.name} taldea
                    </span>
                    <span className="text-xs px-1.5 py-0.5 rounded font-mono"
                      style={{ background: 'rgba(255,255,255,0.08)', color: '#92ADA4' }}>
                      {group.code ?? '—'}
                    </span>
                  </div>
                </div>

                {/* Checkpoint reached */}
                <div className="hidden sm:block text-center min-w-[100px]">
                  <p className="text-xs" style={{ color: '#92ADA4' }}>Kokapena</p>
                  <p className="text-xs font-bold mt-0.5" style={{ color: '#F2D6A1' }}>
                    {lastCheckpointName(pos)}
                  </p>
                </div>

                {/* Position progress */}
                <div className="min-w-[80px]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs" style={{ color: '#92ADA4' }}>Pos.</span>
                    <span className="text-xs font-bold" style={{ color: '#F1A805' }}>{pos}/50</span>
                  </div>
                  <div className="w-20 rounded-full h-2" style={{ background: 'rgba(255,255,255,0.1)' }}>
                    <div className="h-2 rounded-full transition-all"
                      style={{ width: `${(pos / 50) * 100}%`, background: group.color }} />
                  </div>
                </div>

                {/* Average score */}
                <div className="min-w-[60px] text-center">
                  <p className="text-xs" style={{ color: '#92ADA4' }}>Batez beste</p>
                  {avg !== null ? (
                    <p className="text-base font-black" style={{ color: scoreColor(avg) }}>
                      {avg.toFixed(1)}
                    </p>
                  ) : (
                    <p className="text-xs italic" style={{ color: '#84572F' }}>—</p>
                  )}
                </div>

                {/* Entries count */}
                <div className="min-w-[50px] text-center">
                  <p className="text-xs" style={{ color: '#92ADA4' }}>Sarrerak</p>
                  <p className="text-sm font-bold" style={{ color: '#EDD5C0' }}>{entries.length}</p>
                </div>

                {/* Today status */}
                <div className="min-w-[70px] text-center">
                  {hasToday ? (
                    <span className="text-xs font-bold px-2 py-1 rounded-lg"
                      style={{ background: 'rgba(39,174,96,0.2)', color: '#27ae60' }}>
                      ✅ Gaur
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-1 rounded-lg"
                      style={{ background: 'rgba(132,87,47,0.2)', color: '#84572F' }}>
                      Ez gaur
                    </span>
                  )}
                </div>

                {/* Expand arrow */}
                <span className="text-xs ml-auto" style={{ color: '#92ADA4' }}>
                  {isOpen ? '▲' : '▼'}
                </span>
              </button>

              {/* ── Expanded: full history ── */}
              {isOpen && (
                <div className="border-t px-5 pb-5 pt-4 space-y-4"
                  style={{ borderColor: 'rgba(146,173,164,0.20)' }}>

                  {/* Stats row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'Batez besteko puntuazioa', value: avg !== null ? `${avg.toFixed(1)}/10` : '—', color: avg !== null ? scoreColor(avg) : '#84572F' },
                      { label: 'Sarrera kopurua', value: entries.length, color: '#F1A805' },
                      { label: 'Balioztatuak', value: entries.filter(e => e.validated_by_teacher).length, color: '#27ae60' },
                      { label: 'Azken sarrera', value: lastEntry?.entry_date ?? '—', color: '#B3D9E0' },
                    ].map(stat => (
                      <div key={stat.label}
                        className="rounded-xl p-3 text-center"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(146,173,164,0.15)' }}>
                        <p className="text-xs mb-1" style={{ color: '#92ADA4' }}>{stat.label}</p>
                        <p className="font-black text-lg leading-none" style={{ color: String(stat.color) }}>{stat.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Entries table */}
                  {entries.length === 0 ? (
                    <p className="text-center text-sm italic" style={{ color: '#84572F' }}>
                      Oraindik ez dago sarrerarik
                    </p>
                  ) : (
                    <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                      {entries.map(entry => {
                        const euskeraCount    = [1,2,3,4,5].filter(k => entry[`class_${k}_euskera`    as keyof DayEntry] as boolean).length;
                        const errespetuaCount = [1,2,3,4,5].filter(k => entry[`class_${k}_errespetua` as keyof DayEntry] as boolean).length;
                        return (
                          <div key={entry.id}
                            className="flex items-center gap-2 text-xs px-3 py-2 rounded-xl flex-wrap"
                            style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(146,173,164,0.10)' }}>

                            {/* Date */}
                            <span className="w-24 shrink-0 font-semibold" style={{ color: '#B3D9E0' }}>
                              {entry.entry_date}
                            </span>

                            {/* Score bar */}
                            <div className="flex-1 min-w-[80px]">
                              <div className="h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                                <div className="h-2 rounded-full transition-all"
                                  style={{
                                    width: `${(entry.score / 10) * 100}%`,
                                    background: scoreColor(entry.score),
                                  }} />
                              </div>
                            </div>

                            {/* Score */}
                            <span className="w-10 text-right font-black" style={{ color: scoreColor(entry.score) }}>
                              {entry.score}/10
                            </span>

                            {/* Advance */}
                            <span className="w-14 text-right font-bold" style={{ color: '#92ADA4' }}>
                              +{entry.advance} pos
                            </span>

                            {/* Class breakdown pills */}
                            <div className="hidden sm:flex gap-0.5 items-center">
                              {CLASS_LABELS.map((lbl, i) => {
                                const k  = i + 1;
                                const eu = entry[`class_${k}_euskera`    as keyof DayEntry] as boolean;
                                const er = entry[`class_${k}_errespetua` as keyof DayEntry] as boolean;
                                return (
                                  <div key={i} className="flex flex-col gap-0.5" title={lbl}>
                                    <div className="w-3 h-1.5 rounded-sm"
                                      style={{ background: eu ? '#92ADA4' : 'rgba(255,255,255,0.08)' }} />
                                    <div className="w-3 h-1.5 rounded-sm"
                                      style={{ background: er ? '#F1A805' : 'rgba(255,255,255,0.08)' }} />
                                  </div>
                                );
                              })}
                              <span className="ml-1" style={{ color: '#92ADA4' }}>🗣️{euskeraCount}/5</span>
                              <span className="ml-1" style={{ color: '#F1A805' }}>🤝{errespetuaCount}/5</span>
                            </div>

                            {/* Mobile summary */}
                            <span className="sm:hidden" style={{ color: '#92ADA4' }}>
                              🗣️{euskeraCount}/5 🤝{errespetuaCount}/5
                            </span>

                            {/* Validate */}
                            <div className="ml-auto">
                              {entry.validated_by_teacher ? (
                                <span className="font-bold" style={{ color: '#27ae60' }}>✓ Bal.</span>
                              ) : (
                                <button
                                  onClick={() => validateEntry(entry.id, group.id)}
                                  className="px-2 py-0.5 rounded-lg text-xs font-semibold transition-colors hover:opacity-80"
                                  style={{ background: 'rgba(39,174,96,0.18)', color: '#27ae60', border: '1px solid rgba(39,174,96,0.4)' }}
                                >
                                  Baliozta
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
