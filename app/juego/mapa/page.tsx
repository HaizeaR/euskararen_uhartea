'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const MapCanvas = dynamic(() => import('@/components/MapCanvas'), { ssr: false });

import { CHARACTER_NAMES } from '@/lib/characters';

type Group = {
  id: number;
  name: string | null;
  student_name: string | null;
  character_index: number;
  color: string;
  position: string;
  classroom_id: number;
};

export default function MapaPage() {
  const router = useRouter();
  const [myGroup, setMyGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const sessionRes = await fetch('/api/session');
        if (!sessionRes.ok) { router.push('/'); return; }
        const session = await sessionRes.json();

        const groupsRes = await fetch(`/api/groups?classroom_id=${session.classroomId}`);
        if (groupsRes.ok) {
          const data: Group[] = await groupsRes.json();
          const found = data.find(g => g.id === session.groupId) || null;
          setMyGroup(found);
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

  return (
    <main className="min-h-screen p-4 md:p-6">
      <header className="flex items-center gap-4 mb-4">
        <Link href="/juego" className="text-amber-400 text-2xl">←</Link>
        <h1 className="island-title text-xl">Uharteko Mapa</h1>
      </header>

      <MapCanvas groups={myGroup ? [myGroup] : []} mapTotal={50} />

      {myGroup && (
        <div className="card-dark p-4 mt-4 flex items-center gap-3">
          <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: myGroup.color }} />
          <span className="flex-1 text-sm font-semibold">
            {myGroup.student_name || myGroup.name || CHARACTER_NAMES[myGroup.character_index]}
          </span>
          <span className="text-amber-300 font-bold">{parseFloat(myGroup.position)} / 50</span>
        </div>
      )}
    </main>
  );
}
