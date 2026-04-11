'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const MapCanvas = dynamic(() => import('@/components/MapCanvas'), { ssr: false });

type Group = {
  id: number;
  name: string | null;
  character_index: number;
  color: string;
  position: string;
  classroom_id: number;
};

const CHARACTER_NAMES = ['Amaia', 'Iker', 'Nerea', 'Unai', 'Leire', 'Mikel'];
const CHARACTER_ICONS = ['⚔️', '🏹', '🌊', '🔥', '🌿', '⭐'];

export default function IrakasleaDashboard() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const sessionRes = await fetch('/api/session');
        if (!sessionRes.ok) return;
        await sessionRes.json();

        // Get classroom info to find classroomId
        // Teacher session has userId but not classroomId, so we need to find it
        const classroomsRes = await fetch('/api/teacher/classrooms');
        if (classroomsRes.ok) {
          const data = await classroomsRes.json();
          if (data.classroom) {
            const groupsRes = await fetch(`/api/groups?classroom_id=${data.classroom.id}`);
            if (groupsRes.ok) {
              setGroups(await groupsRes.json());
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><p className="text-amber-400 animate-pulse">Kargatzen...</p></div>;
  }

  const sortedGroups = [...groups].sort((a, b) => parseFloat(b.position) - parseFloat(a.position));
  const leader = sortedGroups[0];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="island-title text-2xl text-amber-400 mb-1">Dashboard</h2>
        <p className="text-amber-600 text-sm">6B Klasea — Taldeen egoera</p>
      </div>

      {/* Map overview */}
      <MapCanvas groups={groups} mapTotal={50} />

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-dark p-4 text-center">
          <div className="text-3xl font-bold text-amber-400">{groups.length}</div>
          <div className="text-amber-600 text-sm mt-1">Talde kopurua</div>
        </div>
        <div className="card-dark p-4 text-center">
          <div className="text-3xl font-bold text-teal-400">
            {leader ? parseFloat(leader.position) : 0}
          </div>
          <div className="text-amber-600 text-sm mt-1">Lehen posizioaren posizioa</div>
        </div>
        <div className="card-dark p-4 text-center">
          <div className="text-3xl font-bold text-amber-400">
            {groups.filter(g => parseFloat(g.position) >= 50).length}
          </div>
          <div className="text-amber-600 text-sm mt-1">Helmugaraino iritsiak</div>
        </div>
        <div className="card-dark p-4 text-center">
          <div className="text-3xl font-bold text-amber-400">
            {groups.length > 0
              ? (groups.reduce((s, g) => s + parseFloat(g.position), 0) / groups.length).toFixed(1)
              : '0'}
          </div>
          <div className="text-amber-600 text-sm mt-1">Batezbesteko posizioa</div>
        </div>
      </div>

      {/* Groups ranking */}
      <div className="card-dark p-6">
        <h3 className="text-amber-400 font-bold text-lg mb-4">Sailkapena</h3>
        <div className="space-y-3">
          {sortedGroups.map((g, i) => (
            <div key={g.id} className="flex items-center gap-4 p-3 bg-black bg-opacity-20 rounded-xl">
              <span className="text-2xl font-bold text-amber-500 w-8">#{i + 1}</span>
              <span className="text-2xl">{CHARACTER_ICONS[g.character_index]}</span>
              <span
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: g.color }}
              />
              <span className="flex-1 font-semibold">
                {g.name || CHARACTER_NAMES[g.character_index]}
              </span>
              <div className="text-right">
                <div className="text-amber-300 font-bold">{parseFloat(g.position)} / 50</div>
                <div className="w-24 bg-gray-700 rounded-full h-2 mt-1">
                  <div
                    className="h-2 rounded-full bg-teal-500"
                    style={{ width: `${(parseFloat(g.position) / 50) * 100}%` }}
                  />
                </div>
              </div>
              {parseFloat(g.position) >= 50 && (
                <span className="text-yellow-400 text-xl">🏆</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
