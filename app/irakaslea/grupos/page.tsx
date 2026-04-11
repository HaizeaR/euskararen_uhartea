'use client';

import { useEffect, useState } from 'react';

type Group = {
  id: number;
  name: string | null;
  character_index: number;
  color: string;
  position: string;
  classroom_id: number;
};

type DayEntry = {
  id: number;
  group_id: number;
  entry_date: string;
  score: number;
  advance: string;
  validated_by_teacher: boolean;
};

const CHARACTER_NAMES = ['Amaia', 'Iker', 'Nerea', 'Unai', 'Leire', 'Mikel'];
const CHARACTER_ICONS = ['⚔️', '🏹', '🌊', '🔥', '🌿', '⭐'];

export default function GruposPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [entries, setEntries] = useState<Record<number, DayEntry[]>>({});
  const [loading, setLoading] = useState(true);
  const [editingPos, setEditingPos] = useState<Record<number, string>>({});
  const [editingName, setEditingName] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const cr = await fetch('/api/teacher/classrooms');
      if (!cr.ok) return;
      const { classroom } = await cr.json();

      const gr = await fetch(`/api/groups?classroom_id=${classroom.id}`);
      const groupData: Group[] = await gr.json();
      setGroups(groupData);

      // Load recent entries for each group
      const entryMap: Record<number, DayEntry[]> = {};
      await Promise.all(
        groupData.map(async (g) => {
          const er = await fetch(`/api/entries?group_id=${g.id}`);
          if (er.ok) {
            const data = await er.json();
            entryMap[g.id] = data.slice(-3).reverse();
          }
        })
      );
      setEntries(entryMap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function saveGroup(groupId: number) {
    setSaving(groupId);
    try {
      const body: Record<string, unknown> = {};
      if (editingPos[groupId] !== undefined) body.position = parseFloat(editingPos[groupId]);
      if (editingName[groupId] !== undefined) body.name = editingName[groupId];

      const res = await fetch(`/api/groups/${groupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const updated = await res.json();
        setGroups((prev) => prev.map((g) => (g.id === groupId ? updated : g)));
        setEditingPos((prev) => { const n = { ...prev }; delete n[groupId]; return n; });
        setEditingName((prev) => { const n = { ...prev }; delete n[groupId]; return n; });
      }
    } finally {
      setSaving(null);
    }
  }

  async function resetGroup(groupId: number) {
    if (!confirm('Posizioa 0ra berrezarri nahi duzu?')) return;
    const res = await fetch(`/api/groups/${groupId}/reset`, { method: 'POST' });
    if (res.ok) {
      const updated = await res.json();
      setGroups((prev) => prev.map((g) => (g.id === groupId ? updated : g)));
    }
  }

  async function validateEntry(entryId: number, groupId: number) {
    const res = await fetch(`/api/entries/${entryId}/validate`, { method: 'PATCH' });
    if (res.ok) {
      setEntries((prev) => ({
        ...prev,
        [groupId]: (prev[groupId] || []).map((e) =>
          e.id === entryId ? { ...e, validated_by_teacher: true } : e
        ),
      }));
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-amber-400 animate-pulse">Kargatzen...</p></div>;

  return (
    <div className="space-y-6">
      <h2 className="island-title text-2xl text-amber-400">Taldeak Kudeatu</h2>

      <div className="space-y-6">
        {groups.map((g) => (
          <div key={g.id} className="card-dark p-5">
            {/* Group header */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">{CHARACTER_ICONS[g.character_index]}</span>
              <span className="w-4 h-4 rounded-full" style={{ backgroundColor: g.color }} />
              <h3 className="text-lg font-bold text-amber-300">
                {g.name || CHARACTER_NAMES[g.character_index]}
              </h3>
              <span className="text-amber-600 text-sm">({parseFloat(g.position)} pos.)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Edit name */}
              <div>
                <label className="text-amber-600 text-xs mb-1 block">Talde izena</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editingName[g.id] ?? (g.name || '')}
                    onChange={(e) => setEditingName((prev) => ({ ...prev, [g.id]: e.target.value }))}
                    placeholder={CHARACTER_NAMES[g.character_index]}
                    className="flex-1 bg-amber-950 border border-amber-700 rounded-lg px-3 py-2 text-amber-200 text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Edit position */}
              <div>
                <label className="text-amber-600 text-xs mb-1 block">Posizioa (0-50)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="50"
                    value={editingPos[g.id] ?? parseFloat(g.position)}
                    onChange={(e) => setEditingPos((prev) => ({ ...prev, [g.id]: e.target.value }))}
                    className="flex-1 bg-amber-950 border border-amber-700 rounded-lg px-3 py-2 text-amber-200 text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-3">
              <button
                onClick={() => saveGroup(g.id)}
                disabled={saving === g.id}
                className="btn-teal text-sm py-2 px-4"
              >
                {saving === g.id ? 'Gordetzen...' : '💾 Gorde'}
              </button>
              <button
                onClick={() => resetGroup(g.id)}
                className="btn-bronze text-sm py-2 px-4"
              >
                🔄 Reset (0)
              </button>
            </div>

            {/* Recent entries */}
            {entries[g.id] && entries[g.id].length > 0 && (
              <div className="mt-4 border-t border-amber-900 pt-4">
                <h4 className="text-amber-500 text-sm font-semibold mb-2">Azken sarrerak</h4>
                <div className="space-y-2">
                  {entries[g.id].map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between text-sm p-2 bg-black bg-opacity-30 rounded-lg">
                      <span className="text-amber-300">{entry.entry_date}</span>
                      <span className="text-white">{entry.score}/10</span>
                      <span className="text-teal-400">+{entry.advance}</span>
                      {entry.validated_by_teacher ? (
                        <span className="text-green-400 text-xs">✓ Balioztatua</span>
                      ) : (
                        <button
                          onClick={() => validateEntry(entry.id, g.id)}
                          className="text-xs bg-green-800 text-green-200 px-2 py-1 rounded hover:bg-green-700"
                        >
                          ✓ Baliozta
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
