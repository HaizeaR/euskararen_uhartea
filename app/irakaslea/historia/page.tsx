'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { CHARACTERS } from '@/lib/characters';

type Entry = {
  id: number;
  group_id: number;
  group_name: string;
  group_color: string;
  character_index: number;
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

type Group = { id: number; name: string | null; color: string; character_index: number };

const CLASS_LABELS = ['Mat', 'Hiz', 'Nat', 'Giz', 'Gor'];

function scoreColor(s: number) {
  if (s >= 8) return '#27ae60';
  if (s >= 5) return '#F1A805';
  return '#e05040';
}

export default function HistoriaPage() {
  const [entries,   setEntries]   = useState<Entry[]>([]);
  const [groups,    setGroups]    = useState<Group[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [exporting, setExporting] = useState(false);

  // Filters
  const [filterGroup, setFilterGroup] = useState('');
  const [filterFrom,  setFilterFrom]  = useState('');
  const [filterTo,    setFilterTo]    = useState('');

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterGroup) params.set('group_id', filterGroup);
      if (filterFrom)  params.set('from',     filterFrom);
      if (filterTo)    params.set('to',        filterTo);
      const res = await fetch(`/api/teacher/historia?${params}`);
      if (res.ok) setEntries(await res.json());
    } finally {
      setLoading(false);
    }
  }, [filterGroup, filterFrom, filterTo]);

  useEffect(() => {
    async function loadGroups() {
      const cr = await fetch('/api/teacher/classrooms');
      if (!cr.ok) return;
      const { classroom } = await cr.json();
      const gr = await fetch(`/api/groups?classroom_id=${classroom.id}`);
      if (gr.ok) setGroups(await gr.json());
    }
    loadGroups();
  }, []);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  async function validate(entryId: number) {
    const res = await fetch('/api/teacher/historia', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entryId }),
    });
    if (res.ok) {
      setEntries(prev => prev.map(e => e.id === entryId ? { ...e, validated_by_teacher: true } : e));
    }
  }

  async function validateAll() {
    const unvalidated = entries.filter(e => !e.validated_by_teacher);
    await Promise.all(unvalidated.map(e => validate(e.id)));
  }

  function exportCSV() {
    setExporting(true);
    const params = new URLSearchParams({ format: 'csv' });
    if (filterGroup) params.set('group_id', filterGroup);
    if (filterFrom)  params.set('from',     filterFrom);
    if (filterTo)    params.set('to',        filterTo);
    window.location.href = `/api/teacher/historia?${params}`;
    setTimeout(() => setExporting(false), 1500);
  }

  const unvalidatedCount = entries.filter(e => !e.validated_by_teacher).length;
  const avgScore = entries.length
    ? (entries.reduce((s, e) => s + e.score, 0) / entries.length).toFixed(1)
    : '—';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="island-title text-2xl">Historia</h2>
          <p className="text-sm mt-1 font-semibold" style={{ color: '#4a7068' }}>
            {entries.length} sarrera · Batez beste: {avgScore}/10
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {unvalidatedCount > 0 && (
            <button onClick={validateAll} className="btn-teal py-2 px-4 text-sm">
              ✓ Denak baliozta ({unvalidatedCount})
            </button>
          )}
          <button onClick={exportCSV} disabled={exporting} className="btn-bronze py-2 px-4 text-sm">
            {exporting ? 'Esportatzen...' : '⬇ CSV esportatu'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card-parchment p-4 flex flex-wrap gap-3 items-end">
        {/* Group filter */}
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-black uppercase tracking-wide mb-1" style={{ color: '#84572F' }}>
            Taldea
          </label>
          <select
            value={filterGroup}
            onChange={e => setFilterGroup(e.target.value)}
            className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
            style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(132,87,47,0.30)', color: '#3d2510' }}
          >
            <option value="">Guztiak</option>
            {groups.map(g => (
              <option key={g.id} value={g.id}>{g.name ?? `Taldea ${g.id}`}</option>
            ))}
          </select>
        </div>

        {/* Date from */}
        <div className="flex-1 min-w-[140px]">
          <label className="block text-xs font-black uppercase tracking-wide mb-1" style={{ color: '#84572F' }}>
            Hasiera
          </label>
          <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)}
            className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
            style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(132,87,47,0.30)', color: '#3d2510' }}
          />
        </div>

        {/* Date to */}
        <div className="flex-1 min-w-[140px]">
          <label className="block text-xs font-black uppercase tracking-wide mb-1" style={{ color: '#84572F' }}>
            Amaiera
          </label>
          <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)}
            className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
            style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(132,87,47,0.30)', color: '#3d2510' }}
          />
        </div>

        <button
          onClick={() => { setFilterGroup(''); setFilterFrom(''); setFilterTo(''); }}
          className="text-xs font-bold py-2 px-3 rounded-xl transition-opacity hover:opacity-100 opacity-60"
          style={{ color: '#84572F' }}
        >
          Garbitu ✕
        </button>
      </div>

      {/* Summary stats */}
      {entries.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[
            { label: 'Sarrera guztiak', value: entries.length,          color: '#3d2510' },
            { label: 'Batez besteko puntua', value: `${avgScore}/10`,   color: scoreColor(parseFloat(avgScore) || 0) },
            { label: 'Balioztatuak',    value: entries.filter(e => e.validated_by_teacher).length, color: '#27ae60' },
            { label: 'Baliozta gabeak', value: unvalidatedCount,        color: unvalidatedCount > 0 ? '#e05040' : '#27ae60' },
          ].map(s => (
            <div key={s.label} className="card-parchment p-3 text-center">
              <p className="font-black text-2xl" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs mt-0.5 font-semibold" style={{ color: '#84572F' }}>{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="card-dark p-12 text-center">
          <p className="animate-pulse text-sm" style={{ color: '#92ADA4' }}>Kargatzen...</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="card-parchment p-10 text-center">
          <p className="text-lg font-bold" style={{ color: '#84572F' }}>Ez da sarrerarik aurkitu</p>
          <p className="text-sm mt-1 opacity-60" style={{ color: '#84572F' }}>Aldatu iragazkiak beste emaitza batzuk ikusteko</p>
        </div>
      ) : (
        <div className="card-dark overflow-hidden">
          {/* Column headers */}
          <div className="px-4 py-2.5 grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-3 text-xs font-black uppercase tracking-widest border-b"
            style={{ color: '#92ADA4', borderColor: 'rgba(146,173,164,0.15)' }}>
            <span>Taldea / Data</span>
            <span className="text-right w-16">Puntua</span>
            <span className="text-right w-12">Pos.</span>
            <span className="hidden sm:block w-20 text-center">Klaseak</span>
            <span className="w-20 text-center">Baliozta</span>
          </div>

          <div className="divide-y divide-white/5">
            {entries.map(entry => {
              const char = CHARACTERS[entry.character_index] ?? CHARACTERS[0];
              const euskeraCount    = [1,2,3,4,5].filter(k => (entry as Record<string,unknown>)[`class_${k}_euskera`]    as boolean).length;
              const errespetuaCount = [1,2,3,4,5].filter(k => (entry as Record<string,unknown>)[`class_${k}_errespetua`] as boolean).length;
              return (
                <div key={entry.id}
                  className="px-4 py-3 grid grid-cols-[1fr_auto_auto_auto_auto] sm:grid-cols-[1fr_auto_auto_auto_auto] gap-3 items-center hover:bg-white hover:bg-opacity-5 transition-colors">

                  {/* Group + date */}
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="relative flex-shrink-0 rounded-full overflow-hidden"
                      style={{ width: 28, height: 28, background: entry.group_color, border: `1.5px solid ${entry.group_color}` }}>
                      <Image src={char.image} alt="" fill className="object-contain p-0.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate" style={{ color: entry.group_color }}>
                        {entry.group_name}
                      </p>
                      <p className="text-xs" style={{ color: '#92ADA4' }}>{entry.entry_date}</p>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right w-16">
                    <span className="font-black text-base" style={{ color: scoreColor(entry.score) }}>
                      {entry.score}/10
                    </span>
                    <div className="w-14 h-1.5 rounded-full mt-0.5 ml-auto" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <div className="h-1.5 rounded-full" style={{ width: `${(entry.score/10)*100}%`, background: scoreColor(entry.score) }} />
                    </div>
                  </div>

                  {/* Advance */}
                  <div className="text-right w-12">
                    <span className="text-xs font-bold" style={{ color: '#92ADA4' }}>+{entry.advance}</span>
                  </div>

                  {/* Class breakdown */}
                  <div className="hidden sm:flex flex-col gap-0.5 w-20">
                    <div className="flex gap-0.5">
                      {CLASS_LABELS.map((_, i) => (
                        <div key={i} className="flex-1 h-1.5 rounded-sm"
                          style={{ background: (entry as Record<string,unknown>)[`class_${i+1}_euskera`] ? '#92ADA4' : 'rgba(255,255,255,0.08)' }} />
                      ))}
                    </div>
                    <div className="flex gap-0.5">
                      {CLASS_LABELS.map((_, i) => (
                        <div key={i} className="flex-1 h-1.5 rounded-sm"
                          style={{ background: (entry as Record<string,unknown>)[`class_${i+1}_errespetua`] ? '#F1A805' : 'rgba(255,255,255,0.08)' }} />
                      ))}
                    </div>
                    <div className="flex justify-between text-xs mt-0.5" style={{ color: '#92ADA4', fontSize: 9 }}>
                      <span>🗣️{euskeraCount}</span>
                      <span>🤝{errespetuaCount}</span>
                    </div>
                  </div>

                  {/* Validate */}
                  <div className="w-20 text-center">
                    {entry.validated_by_teacher ? (
                      <span className="text-xs font-bold" style={{ color: '#27ae60' }}>✓ Bal.</span>
                    ) : (
                      <button
                        onClick={() => validate(entry.id)}
                        className="text-xs px-2 py-1 rounded-lg font-semibold transition-opacity hover:opacity-100 opacity-80"
                        style={{ background: 'rgba(39,174,96,0.18)', color: '#27ae60', border: '1px solid rgba(39,174,96,0.35)' }}
                      >
                        Baliozta
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
