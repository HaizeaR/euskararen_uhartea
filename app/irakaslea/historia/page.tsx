'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { CHARACTERS } from '@/lib/characters';
import { parseSchedule } from '@/lib/schedule';

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
type EditState = { [key: string]: boolean };

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
  const [classroomSchedule, setClassroomSchedule] = useState<Record<number, string[]>>({});

  // Edit state
  const [editId,     setEditId]     = useState<number | null>(null);
  const [editState,  setEditState]  = useState<EditState>({});
  const [editSaving, setEditSaving] = useState(false);

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
      setClassroomSchedule(parseSchedule(classroom?.weekly_schedule));
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

  function openEdit(e: Entry) {
    const s: EditState = {};
    for (let k = 1; k <= 5; k++) {
      s[`class_${k}_euskera`]    = (e as unknown as Record<string,boolean>)[`class_${k}_euskera`];
      s[`class_${k}_errespetua`] = (e as unknown as Record<string,boolean>)[`class_${k}_errespetua`];
    }
    s['validated_by_teacher'] = e.validated_by_teacher;
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
        const updated: Entry = await res.json();
        setEntries(prev => prev.map(e =>
          e.id === entryId
            ? { ...e, ...updated, validated_by_teacher: editState['validated_by_teacher'] }
            : e
        ));
        setEditId(null);
      }
    } finally {
      setEditSaving(false);
    }
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
        <div className="flex-1 min-w-[140px]">
          <label className="block text-xs font-black uppercase tracking-wide mb-1" style={{ color: '#84572F' }}>
            Hasiera
          </label>
          <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)}
            className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
            style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(132,87,47,0.30)', color: '#3d2510' }}
          />
        </div>
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
            { label: 'Sarrera guztiak',   value: entries.length,        color: '#3d2510' },
            { label: 'Batez besteko puntua', value: `${avgScore}/10`,   color: scoreColor(parseFloat(avgScore) || 0) },
            { label: 'Balioztatuak',      value: entries.filter(e => e.validated_by_teacher).length, color: '#27ae60' },
            { label: 'Baliozta gabeak',   value: unvalidatedCount,      color: unvalidatedCount > 0 ? '#e05040' : '#27ae60' },
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
          <div className="px-4 py-2.5 grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 text-xs font-black uppercase tracking-widest border-b"
            style={{ color: '#92ADA4', borderColor: 'rgba(146,173,164,0.15)' }}>
            <span>Taldea / Data</span>
            <span className="text-right w-16">Puntua</span>
            <span className="text-right w-10">Pos.</span>
            <span className="w-20 text-center">Baliozta</span>
            <span className="w-16 text-center">Editatu</span>
          </div>

          <div className="divide-y divide-white/5">
            {entries.map(entry => {
              const char = CHARACTERS[entry.character_index] ?? CHARACTERS[0];
              const entryDow = new Date(entry.entry_date + 'T12:00:00').getDay();
              const daySubjects = classroomSchedule[entryDow] ?? ['Ikasgaia 1','Ikasgaia 2','Ikasgaia 3','Ikasgaia 4','Ikasgaia 5'];
              const isEditing = editId === entry.id;

              return (
                <div key={entry.id}>
                  {/* Main row */}
                  <div className="px-4 py-3 grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 items-center hover:bg-white hover:bg-opacity-5 transition-colors">

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
                    <div className="text-right w-10">
                      <span className="text-xs font-bold" style={{ color: '#92ADA4' }}>+{entry.advance}</span>
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

                    {/* Edit toggle */}
                    <div className="w-16 text-center">
                      <button
                        onClick={() => isEditing ? setEditId(null) : openEdit(entry)}
                        className="text-xs px-2 py-1 rounded-lg font-semibold transition-all"
                        style={{
                          background: isEditing ? 'rgba(132,87,47,0.22)' : 'rgba(132,87,47,0.10)',
                          color: isEditing ? '#c08040' : '#84572F',
                          border: '1px solid rgba(132,87,47,0.30)',
                        }}
                      >
                        {isEditing ? 'Itxi ✕' : '✏️ Edit'}
                      </button>
                    </div>
                  </div>

                  {/* Inline edit panel */}
                  {isEditing && (
                    <div className="mx-4 mb-3 px-4 py-4 rounded-2xl space-y-3"
                      style={{ background: 'rgba(132,87,47,0.10)', border: '1px solid rgba(132,87,47,0.25)' }}>
                      <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: '#92ADA4' }}>
                        Sarrera editatu — {entry.entry_date}
                      </p>

                      {/* Subject toggles */}
                      <div className="space-y-2">
                        {daySubjects.map((name, i) => (
                          <div key={i} className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold w-28 shrink-0" style={{ color: '#EDD5C0' }}>
                              {name}
                            </span>
                            <button
                              onClick={() => toggleEdit(`class_${i+1}_euskera`)}
                              className="text-xs px-3 py-1.5 rounded-lg transition-all font-semibold"
                              style={{
                                background: editState[`class_${i+1}_euskera`] ? 'rgba(100,185,140,0.22)' : 'rgba(255,255,255,0.06)',
                                border: `1px solid ${editState[`class_${i+1}_euskera`] ? 'rgba(100,185,140,0.55)' : 'rgba(255,255,255,0.12)'}`,
                                color: editState[`class_${i+1}_euskera`] ? '#7edaaa' : 'rgba(237,213,192,0.45)',
                              }}
                            >
                              🗣️ Euskera {editState[`class_${i+1}_euskera`] ? '✓' : '○'}
                            </button>
                            <button
                              onClick={() => toggleEdit(`class_${i+1}_errespetua`)}
                              className="text-xs px-3 py-1.5 rounded-lg transition-all font-semibold"
                              style={{
                                background: editState[`class_${i+1}_errespetua`] ? 'rgba(241,168,5,0.18)' : 'rgba(255,255,255,0.06)',
                                border: `1px solid ${editState[`class_${i+1}_errespetua`] ? 'rgba(241,168,5,0.55)' : 'rgba(255,255,255,0.12)'}`,
                                color: editState[`class_${i+1}_errespetua`] ? '#f5cc50' : 'rgba(237,213,192,0.45)',
                              }}
                            >
                              🤝 Errespetua {editState[`class_${i+1}_errespetua`] ? '✓' : '○'}
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Validated toggle */}
                      <div className="flex items-center gap-3 pt-1 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                        <span className="text-xs font-bold" style={{ color: '#92ADA4' }}>Balioztatuta:</span>
                        <button
                          onClick={() => toggleEdit('validated_by_teacher')}
                          className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
                          style={{
                            background: editState['validated_by_teacher'] ? 'rgba(39,174,96,0.20)' : 'rgba(255,255,255,0.06)',
                            border: `1px solid ${editState['validated_by_teacher'] ? 'rgba(39,174,96,0.50)' : 'rgba(255,255,255,0.12)'}`,
                            color: editState['validated_by_teacher'] ? '#27ae60' : 'rgba(255,255,255,0.45)',
                          }}
                        >
                          {editState['validated_by_teacher'] ? '✓ Bai' : '○ Ez'}
                        </button>
                      </div>

                      <button
                        onClick={() => saveEdit(entry.id)}
                        disabled={editSaving}
                        className="btn-teal text-sm py-2 px-5"
                      >
                        {editSaving ? 'Gordetzen...' : '💾 Gorde'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
