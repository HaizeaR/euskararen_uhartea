'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { CHARACTERS } from '@/lib/characters';

type Group = {
  id: number;
  code: string | null;
  name: string | null;
  student_name: string | null;
  character_index: number;
  color: string;
  position: string;
  classroom_id: number;
};

type Member = {
  id: number;
  group_id: number;
  name: string;
};

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

const CLASS_LABELS = ['Mat', 'Hiz', 'Nat', 'Giz', 'Gor'];

export default function GruposPage() {
  const [groups,       setGroups]       = useState<Group[]>([]);
  const [members,      setMembers]      = useState<Record<number, Member[]>>({});
  const [entries,      setEntries]      = useState<Record<number, DayEntry[]>>({});
  const [todayMap,     setTodayMap]     = useState<Record<number, DayEntry>>({});
  const [loading,      setLoading]      = useState(true);
  const [creating,     setCreating]     = useState(false);
  const [editingChar,  setEditingChar]  = useState<Record<number, number>>({});
  const [editingCode,  setEditingCode]  = useState<Record<number, string>>({});
  const [saving,       setSaving]       = useState<number | null>(null);
  const [codeError,    setCodeError]    = useState<Record<number, string>>({});
  // Per-group new member input
  const [newMember,    setNewMember]    = useState<Record<number, string>>({});
  const [addingMember, setAddingMember] = useState<number | null>(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const cr = await fetch('/api/teacher/classrooms');
      if (!cr.ok) return;
      const { classroom } = await cr.json();

      const [gr, todayRes] = await Promise.all([
        fetch(`/api/groups?classroom_id=${classroom.id}`),
        fetch('/api/teacher/today'),
      ]);

      const groupData: Group[] = await gr.json();
      setGroups(groupData);

      if (todayRes.ok) {
        const { entries: todayEntries } = await todayRes.json();
        const map: Record<number, DayEntry> = {};
        for (const e of todayEntries) map[e.group_id] = e;
        setTodayMap(map);
      }

      // Fetch members + all entries per group in parallel
      const memberMap: Record<number, Member[]> = {};
      const entryMap:  Record<number, DayEntry[]> = {};
      await Promise.all(groupData.map(async g => {
        const [mr, er] = await Promise.all([
          fetch(`/api/groups/${g.id}/members`),
          fetch(`/api/entries?group_id=${g.id}`),
        ]);
        if (mr.ok) memberMap[g.id] = await mr.json();
        if (er.ok) {
          const data: DayEntry[] = await er.json();
          entryMap[g.id] = [...data].reverse(); // newest first
        }
      }));
      setMembers(memberMap);
      setEntries(entryMap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function createGroup() {
    setCreating(true);
    try {
      const res = await fetch('/api/groups', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      if (res.ok) {
        const newGroup: Group = await res.json();
        setGroups(prev => [...prev, newGroup]);
        setMembers(prev => ({ ...prev, [newGroup.id]: [] }));
        setEntries(prev => ({ ...prev, [newGroup.id]: [] }));
      }
    } finally {
      setCreating(false);
    }
  }

  async function saveCode(groupId: number) {
    const newCode = (editingCode[groupId] ?? '').trim().toUpperCase();
    if (!newCode) return;
    setSaving(groupId);
    try {
      const res = await fetch(`/api/groups/${groupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: newCode }),
      });
      if (res.ok) {
        const updated = await res.json();
        setGroups(prev => prev.map(g => g.id === groupId ? updated : g));
        setEditingCode(prev => { const n = { ...prev }; delete n[groupId]; return n; });
        setCodeError(prev => { const n = { ...prev }; delete n[groupId]; return n; });
      } else {
        const { error } = await res.json();
        setCodeError(prev => ({ ...prev, [groupId]: error ?? 'Errorea' }));
      }
    } finally {
      setSaving(null);
    }
  }

  async function saveCharacter(groupId: number) {
    const charIdx = editingChar[groupId];
    if (charIdx === undefined) return;
    setSaving(groupId);
    try {
      const res = await fetch(`/api/groups/${groupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ character_index: charIdx }),
      });
      if (res.ok) {
        const updated = await res.json();
        setGroups(prev => prev.map(g => g.id === groupId ? updated : g));
        setEditingChar(prev => { const n = { ...prev }; delete n[groupId]; return n; });
      }
    } finally {
      setSaving(null);
    }
  }

  async function addMember(groupId: number) {
    const name = newMember[groupId]?.trim();
    if (!name) return;
    setAddingMember(groupId);
    try {
      const res = await fetch(`/api/groups/${groupId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        const member: Member = await res.json();
        setMembers(prev => ({ ...prev, [groupId]: [...(prev[groupId] || []), member] }));
        setNewMember(prev => ({ ...prev, [groupId]: '' }));
      }
    } finally {
      setAddingMember(null);
    }
  }

  async function removeMember(groupId: number, memberId: number) {
    const res = await fetch(`/api/groups/${groupId}/members/${memberId}`, { method: 'DELETE' });
    if (res.ok) {
      setMembers(prev => ({
        ...prev,
        [groupId]: (prev[groupId] || []).filter(m => m.id !== memberId),
      }));
    }
  }

  async function validateEntry(entryId: number, groupId: number) {
    const res = await fetch(`/api/entries/${entryId}/validate`, { method: 'PATCH' });
    if (res.ok) {
      const update = (e: DayEntry) => e.id === entryId ? { ...e, validated_by_teacher: true } : e;
      setEntries(prev => ({ ...prev, [groupId]: (prev[groupId] || []).map(update) }));
      setTodayMap(prev =>
        prev[groupId]?.id === entryId
          ? { ...prev, [groupId]: { ...prev[groupId], validated_by_teacher: true } }
          : prev
      );
    }
  }

  async function resetGroup(groupId: number) {
    if (!confirm('Posizioa 0ra berrezarri nahi duzu?')) return;
    const res = await fetch(`/api/groups/${groupId}/reset`, { method: 'POST' });
    if (res.ok) {
      const updated = await res.json();
      setGroups(prev => prev.map(g => g.id === groupId ? updated : g));
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-amber-400 animate-pulse">Kargatzen...</p>
      </div>
    );
  }

  const today = new Date().toLocaleDateString('eu', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="island-title text-2xl">Taldeak Kudeatu</h2>
          <p className="text-sm mt-1 font-semibold" style={{ color: '#4a7068' }}>{groups.length} talde • {today}</p>
        </div>
        <button onClick={createGroup} disabled={creating} className="btn-teal py-2 px-5 text-sm">
          {creating ? 'Sortzen...' : '+ Talde berria'}
        </button>
      </div>

      {groups.length === 0 && (
        <div className="card-dark p-8 text-center text-amber-600">
          Oraindik ez dago talderik. Sortu lehena!
        </div>
      )}

      <div className="space-y-5">
        {groups.map(g => {
          const char       = CHARACTERS[g.character_index] ?? CHARACTERS[0];
          const todayEntry = todayMap[g.id];
          const groupMembers = members[g.id] || [];
          const groupEntries = entries[g.id] || [];
          const charChanged  = editingChar[g.id] !== undefined;

          return (
            <div key={g.id} className="card-dark overflow-hidden">

              {/* ── Top bar: today status ── */}
              <div
                className="px-5 py-2.5 flex items-center justify-between text-sm border-b border-amber-900 flex-wrap gap-2"
                style={{ backgroundColor: todayEntry ? 'rgba(39,174,96,0.12)' : 'rgba(0,0,0,0.2)' }}
              >
                <div className="flex items-center gap-2">
                  <Image src={char.image} alt={char.name} width={24} height={24} className="object-contain" />
                  <span className="font-bold text-sm" style={{ color: char.color }}>
                    {g.student_name ?? g.name}
                  </span>
                  <div className="flex flex-col items-end gap-0.5">
                    <input
                      value={editingCode[g.id] ?? g.code ?? ''}
                      onChange={e => setEditingCode(prev => ({ ...prev, [g.id]: e.target.value.toUpperCase().slice(0,8) }))}
                      onBlur={() => { if (editingCode[g.id] !== undefined && editingCode[g.id] !== g.code) saveCode(g.id); }}
                      onKeyDown={e => { if (e.key === 'Enter') saveCode(g.id); }}
                      className="font-mono text-xs border rounded px-1.5 py-0.5 w-20 text-center focus:outline-none"
                      style={{ background: 'rgba(0,0,0,0.3)', borderColor: codeError[g.id] ? '#e05040' : 'rgba(161,107,30,0.5)', color: '#f5cc80' }}
                    />
                    {codeError[g.id] && <span className="text-xs" style={{ color: '#e05040' }}>{codeError[g.id]}</span>}
                  </div>
                </div>
                {todayEntry ? (
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-green-400 font-bold text-xs">
                      ✅ {todayEntry.score}/10 pts · +{todayEntry.advance} pos
                    </span>
                    {!todayEntry.validated_by_teacher ? (
                      <button
                        onClick={() => validateEntry(todayEntry.id, g.id)}
                        className="text-xs bg-green-900 text-green-200 px-2 py-1 rounded hover:bg-green-800 font-semibold"
                      >
                        Baliozta ✓
                      </button>
                    ) : (
                      <span className="text-green-500 text-xs">✓ Balioztatua</span>
                    )}
                  </div>
                ) : (
                  <span className="text-amber-700 text-xs italic">Ez du erregistratu gaur</span>
                )}
              </div>

              <div className="p-5 space-y-5">

                {/* ── Two-column: members + character ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                  {/* MEMBERS */}
                  <div>
                    <p className="text-amber-600 text-xs uppercase tracking-wide font-semibold mb-2">
                      Ikasleak ({groupMembers.length})
                    </p>
                    <div className="space-y-1.5 mb-2">
                      {groupMembers.length === 0 && (
                        <p className="text-amber-900 text-xs italic">Oraindik ez dago ikaslerik</p>
                      )}
                      {groupMembers.map(m => (
                        <div
                          key={m.id}
                          className="flex items-center gap-2 bg-black bg-opacity-30 rounded-lg px-3 py-1.5"
                        >
                          <span className="flex-1 text-amber-100 text-sm">{m.name}</span>
                          <button
                            onClick={() => removeMember(g.id, m.id)}
                            className="text-red-700 hover:text-red-400 text-xs transition-colors"
                            title="Ezabatu"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                    {/* Add member */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMember[g.id] ?? ''}
                        onChange={e => setNewMember(prev => ({ ...prev, [g.id]: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && addMember(g.id)}
                        placeholder="Ane Iriarte Zubia"
                        className="flex-1 bg-black bg-opacity-40 border border-amber-800 rounded-lg px-3 py-1.5 text-amber-100 text-sm focus:outline-none focus:border-amber-400 placeholder-amber-900"
                      />
                      <button
                        onClick={() => addMember(g.id)}
                        disabled={addingMember === g.id || !newMember[g.id]?.trim()}
                        className="btn-teal text-xs py-1.5 px-3"
                      >
                        {addingMember === g.id ? '...' : '+ Gehitu'}
                      </button>
                    </div>
                  </div>

                  {/* CHARACTER + ACTIONS */}
                  <div className="space-y-3">
                    <div>
                      <p className="text-amber-600 text-xs uppercase tracking-wide font-semibold mb-2">
                        Pertsonaia
                      </p>
                      <div className="grid grid-cols-5 gap-1.5">
                        {CHARACTERS.map(c => {
                          const selectedIdx = editingChar[g.id] ?? g.character_index;
                          const isSel = selectedIdx === c.index;
                          return (
                            <button
                              key={c.index}
                              type="button"
                              onClick={() => setEditingChar(prev => ({ ...prev, [g.id]: c.index }))}
                              className="flex flex-col items-center rounded-xl border-2 p-1.5 transition-all"
                              style={{
                                borderColor:     isSel ? c.color : 'rgba(100,60,10,0.45)',
                                backgroundColor: isSel ? `${c.color}25` : 'rgba(0,0,0,0.30)',
                                boxShadow:       isSel ? `0 0 10px ${c.color}55` : 'none',
                              }}
                              title={c.name}
                            >
                              <div className="relative w-8 h-8">
                                <Image src={c.image} alt={c.name} fill className="object-contain" />
                              </div>
                              <span
                                className="text-xs mt-0.5 font-bold leading-tight text-center"
                                style={{ color: isSel ? c.color : 'rgba(240,210,120,0.6)', fontSize: '0.60rem' }}
                              >
                                {c.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveCharacter(g.id)}
                        disabled={saving === g.id || !charChanged}
                        className="btn-teal text-xs py-2 px-4 flex-1"
                      >
                        {saving === g.id ? 'Gordetzen...' : '💾 Gorde'}
                      </button>
                      <button onClick={() => resetGroup(g.id)} className="btn-bronze text-xs py-2 px-4">
                        🔄 Reset
                      </button>
                    </div>
                    <div className="flex items-center gap-2 bg-black bg-opacity-30 rounded-lg px-3 py-2">
                      <span className="text-amber-700 text-xs font-semibold uppercase">Posizioa:</span>
                      <span className="text-amber-300 font-bold text-sm">{parseFloat(g.position)} / 50</span>
                    </div>
                  </div>
                </div>

                {/* ── HISTORY ── */}
                {groupEntries.length > 0 && (
                  <div className="border-t border-amber-900 pt-4">
                    <p className="text-amber-600 text-xs uppercase tracking-wide font-semibold mb-3">
                      Historikoa ({groupEntries.length} sarrera)
                    </p>
                    <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                      {groupEntries.map(entry => {
                        const totalClasses = 5;
                        const euskeraCount  = [1,2,3,4,5].filter(k => entry[`class_${k}_euskera`  as keyof DayEntry]).length;
                        const errespetuaCount = [1,2,3,4,5].filter(k => entry[`class_${k}_errespetua` as keyof DayEntry]).length;
                        return (
                          <div
                            key={entry.id}
                            className="flex items-center gap-2 text-xs px-3 py-2 bg-black bg-opacity-30 rounded-lg"
                          >
                            {/* Date */}
                            <span className="text-amber-500 w-24 shrink-0">{entry.entry_date}</span>

                            {/* Score bar */}
                            <div className="flex-1 min-w-0">
                              <div className="h-1.5 bg-amber-950 rounded-full">
                                <div
                                  className="h-1.5 rounded-full bg-amber-400"
                                  style={{ width: `${(entry.score / 10) * 100}%` }}
                                />
                              </div>
                            </div>

                            {/* Score */}
                            <span className="text-white w-10 text-right font-bold">{entry.score}/10</span>

                            {/* Advance */}
                            <span className="text-teal-400 w-12 text-right">+{entry.advance}</span>

                            {/* Class breakdown mini pills */}
                            <div className="hidden sm:flex gap-0.5">
                              {CLASS_LABELS.map((lbl, i) => {
                                const k = i + 1;
                                const eu = entry[`class_${k}_euskera`  as keyof DayEntry] as boolean;
                                const er = entry[`class_${k}_errespetua` as keyof DayEntry] as boolean;
                                return (
                                  <div key={i} className="flex flex-col gap-0.5" title={lbl}>
                                    <div className={`w-4 h-1.5 rounded-sm ${eu ? 'bg-teal-500' : 'bg-gray-800'}`} />
                                    <div className={`w-4 h-1.5 rounded-sm ${er ? 'bg-amber-500' : 'bg-gray-800'}`} />
                                  </div>
                                );
                              })}
                            </div>

                            {/* Euskera/Errespetua summary for mobile */}
                            <span className="sm:hidden text-teal-600 text-xs">
                              🗣️{euskeraCount}/{totalClasses} 🤝{errespetuaCount}/{totalClasses}
                            </span>

                            {/* Validate */}
                            <span className="w-16 text-right">
                              {entry.validated_by_teacher ? (
                                <span className="text-green-400">✓ Bal.</span>
                              ) : (
                                <button
                                  onClick={() => validateEntry(entry.id, g.id)}
                                  className="text-amber-600 hover:text-green-400 transition-colors"
                                >
                                  Balioztatu
                                </button>
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    {/* Summary row */}
                    {groupEntries.length > 0 && (
                      <div className="mt-2 flex items-center gap-4 text-xs text-amber-700 px-1">
                        <span>
                          Batez besteko puntuazioa:{' '}
                          <span className="text-amber-300 font-bold">
                            {(groupEntries.reduce((s, e) => s + e.score, 0) / groupEntries.length).toFixed(1)}/10
                          </span>
                        </span>
                        <span>
                          Sarrerak: <span className="text-amber-300 font-bold">{groupEntries.length}</span>
                        </span>
                        <span>
                          Balioztatuak:{' '}
                          <span className="text-green-400 font-bold">
                            {groupEntries.filter(e => e.validated_by_teacher).length}
                          </span>
                          /{groupEntries.length}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {groupEntries.length === 0 && (
                  <div className="border-t border-amber-900 pt-3 text-center text-amber-900 text-xs italic">
                    Oraindik ez dago sarrerarik talde honentzat
                  </div>
                )}

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
