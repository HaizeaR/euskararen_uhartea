'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { CHARACTERS } from '@/lib/characters';
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

export default function IrakasleaMapaPage() {
  const [groups,   setGroups]   = useState<Group[]>([]);
  const [mapTotal, setMapTotal] = useState(50);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const cr = await fetch('/api/teacher/classrooms');
        if (!cr.ok) return;
        const { classroom } = await cr.json();
        if (classroom?.map_total) setMapTotal(classroom.map_total);
        const gr = await fetch(`/api/groups?classroom_id=${classroom.id}`);
        if (gr.ok) setGroups(await gr.json());
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="animate-pulse text-sm" style={{ color: '#92ADA4' }}>Mapa kargatzen...</p>
      </div>
    );
  }

  const sorted = [...groups].sort((a, b) => parseFloat(b.position) - parseFloat(a.position));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="island-title text-2xl">Uharteko Mapa</h2>
          <p className="text-sm mt-1 font-semibold" style={{ color: '#4a7068' }}>
            {groups.length} talde mapan
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-2">
          {sorted.map((g, i) => {
            const ch  = CHARACTERS[g.character_index] ?? CHARACTERS[0];
            const pos = parseFloat(g.position);
            const pct = Math.round((pos / mapTotal) * 100);
            return (
              <div
                key={g.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold"
                style={{
                  background: `${g.color}18`,
                  border: `1.5px solid ${g.color}55`,
                  color: '#3d2510',
                }}
              >
                <span className="text-base leading-none">#{i + 1}</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ch.image} alt="" style={{ width: 18, height: 18, objectFit: 'contain' }} />
                <span style={{ color: g.color }}>{g.student_name || g.name || ch.name}</span>
                <span className="opacity-60">{pos}/{mapTotal}</span>
                <span style={{ color: pct >= 80 ? '#27ae60' : pct >= 50 ? '#F1A805' : '#84572F' }}>
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Map */}
      <InteractiveMap
        groups={groups}
        mapTotal={mapTotal}
      />

      {/* Ranking cards below map */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {sorted.map((g, i) => {
          const ch  = CHARACTERS[g.character_index] ?? CHARACTERS[0];
          const pos = parseFloat(g.position);
          const pct = (pos / mapTotal) * 100;
          const lastCp = [...CHECKPOINTS].reverse().find(cp => cp.requiredPos <= pos);
          const nextCp = CHECKPOINTS.find(cp => cp.requiredPos > pos);
          return (
            <div
              key={g.id}
              className="card-parchment p-3 space-y-2"
              style={{ borderColor: `${g.color}44` }}
            >
              {/* Header */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-black opacity-50" style={{ color: '#84572F' }}>#{i+1}</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ch.image} alt="" style={{ width: 28, height: 28, objectFit: 'contain' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black truncate leading-tight" style={{ color: g.color }}>
                    {g.student_name || g.name || ch.name}
                  </p>
                  <p className="text-xs opacity-55" style={{ color: '#84572F' }}>{ch.label} taldea</p>
                </div>
                {pos >= mapTotal && <span className="text-base">🏆</span>}
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-1" style={{ color: '#84572F' }}>
                  <span>{pos} / {mapTotal}</span>
                  <span>{Math.round(pct)}%</span>
                </div>
                <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(132,87,47,0.15)' }}>
                  <div
                    className="h-2.5 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(pct, 100)}%`, background: g.color }}
                  />
                </div>
              </div>

              {/* Current / Next checkpoint */}
              <div className="flex gap-2 text-xs">
                {lastCp && (
                  <span className="flex-1 text-center py-1 rounded-lg font-semibold"
                    style={{ background: 'rgba(39,174,96,0.10)', color: '#27ae60' }}>
                    {lastCp.icon} {lastCp.name.split(' ')[0]}
                  </span>
                )}
                {nextCp && pos < mapTotal && (
                  <span className="flex-1 text-center py-1 rounded-lg font-semibold opacity-55"
                    style={{ background: 'rgba(132,87,47,0.08)', color: '#84572F' }}>
                    → {nextCp.icon} {nextCp.requiredPos - pos}p
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
