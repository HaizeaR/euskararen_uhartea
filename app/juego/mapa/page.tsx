'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { CHECKPOINTS } from '@/lib/checkpoints';

const InteractiveMap = dynamic(() => import('@/components/InteractiveMap'), { ssr: false });

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
  const [myGroup,  setMyGroup]  = useState<Group | null>(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const sessionRes = await fetch('/api/session');
        if (!sessionRes.ok) { router.push('/'); return; }
        const session = await sessionRes.json();

        const groupsRes = await fetch(`/api/groups?classroom_id=${session.classroomId}`);
        if (groupsRes.ok) {
          const data: Group[] = await groupsRes.json();
          setMyGroup(data.find(g => g.id === session.groupId) || null);
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
        <p className="animate-pulse text-lg" style={{ color: 'var(--sand-light)' }}>Mapa kargatzen...</p>
      </div>
    );
  }

  const pos = myGroup ? parseFloat(myGroup.position) : 0;
  const nextCheckpoint = CHECKPOINTS.find(c => c.requiredPos > pos);
  const lastCheckpoint = [...CHECKPOINTS].reverse().find(c => c.requiredPos <= pos);

  return (
    <main className="min-h-screen p-4 md:p-6">
      <header className="flex items-center gap-4 mb-4">
        <Link href="/juego" className="text-2xl" style={{ color: 'var(--sand-light)' }}>←</Link>
        <h1 className="island-title text-2xl">Uharteko Mapa</h1>
      </header>

      <InteractiveMap
        groups={myGroup ? [myGroup] : []}
        mapTotal={50}
        highlightGroupId={myGroup?.id}
      />

      {/* Current location + next goal */}
      {myGroup && (
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="card-dark p-4">
            <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--sand-mid)' }}>
              Orain zaude
            </p>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{lastCheckpoint?.icon ?? '🏖️'}</span>
              <div>
                <p className="font-bold text-sm leading-tight" style={{ color: 'var(--sand-light)' }}>
                  {lastCheckpoint?.name ?? 'Hasiera'}
                </p>
                <p className="text-xs opacity-60" style={{ color: 'var(--sand-light)' }}>
                  {lastCheckpoint?.reward} Saria lortu da
                </p>
              </div>
            </div>
          </div>

          {nextCheckpoint && (
            <div className="card-dark p-4">
              <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--sand-mid)' }}>
                Hurrengo helburua
              </p>
              <div className="flex items-center gap-2">
                <span className="text-2xl opacity-60">{nextCheckpoint.icon}</span>
                <div>
                  <p className="font-bold text-sm leading-tight opacity-80" style={{ color: 'var(--sand-light)' }}>
                    {nextCheckpoint.name}
                  </p>
                  <p className="text-xs opacity-50" style={{ color: 'var(--sand-light)' }}>
                    {nextCheckpoint.requiredPos - pos} posizio falta
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
