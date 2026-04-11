'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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

export default function MapaPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [myGroupId, setMyGroupId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const sessionRes = await fetch('/api/session');
        if (!sessionRes.ok) { router.push('/'); return; }
        const session = await sessionRes.json();
        setMyGroupId(session.groupId);

        const groupsRes = await fetch(`/api/groups?classroom_id=${session.classroomId}`);
        if (groupsRes.ok) {
          const data = await groupsRes.json();
          setGroups(data);
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
        <p className="text-amber-400 animate-pulse">Mapa kargatzen...</p>
      </div>
    );
  }

  const sortedGroups = [...groups].sort((a, b) => parseFloat(b.position) - parseFloat(a.position));

  return (
    <main className="min-h-screen p-4 md:p-6">
      <header className="flex items-center gap-4 mb-4">
        <Link href="/juego" className="text-amber-400 text-2xl">←</Link>
        <h1 className="island-title text-xl">Uharteko Mapa</h1>
      </header>

      <MapCanvas groups={groups} mapTotal={50} highlightGroupId={myGroupId ?? undefined} />

      {/* Legend */}
      <div className="card-dark p-4 mt-4">
        <h3 className="text-amber-400 font-bold mb-3 text-sm">Taldeak — Sailkapena</h3>
        <div className="space-y-2">
          {sortedGroups.map((g, i) => (
            <div
              key={g.id}
              className={`flex items-center gap-3 p-2 rounded-lg ${g.id === myGroupId ? 'ring-2 ring-amber-400 bg-amber-900 bg-opacity-20' : ''}`}
            >
              <span className="text-amber-500 font-bold w-5 text-sm">#{i + 1}</span>
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: g.color }} />
              <span className="flex-1 text-sm">
                {g.name || CHARACTER_NAMES[g.character_index]}
                {g.id === myGroupId && <span className="text-amber-400 text-xs ml-1">(zu)</span>}
              </span>
              <div className="text-right">
                <span className="text-amber-300 text-sm font-semibold">{parseFloat(g.position)}</span>
                <span className="text-amber-600 text-xs ml-1">/ 50</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
