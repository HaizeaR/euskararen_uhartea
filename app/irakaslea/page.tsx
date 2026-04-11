'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { CHARACTER_NAMES, CHARACTERS } from '@/lib/characters';

const MapCanvas = dynamic(() => import('@/components/MapCanvas'), { ssr: false });

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

const CLASS_NAMES = ['Matematika', 'Hizkuntza', 'Nat. Zientziak', 'Giz. Zientziak', 'Gorputz Hez.'];

export default function IrakasleaDashboard() {
  const [groups,      setGroups]      = useState<Group[]>([]);
  const [todayData,   setTodayData]   = useState<{
    entries: DayEntry[];
    today: string;
  } | null>(null);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [classroomsRes, todayRes] = await Promise.all([
          fetch('/api/teacher/classrooms'),
          fetch('/api/teacher/today'),
        ]);

        if (classroomsRes.ok) {
          const data = await classroomsRes.json();
          if (data.classroom) {
            const groupsRes = await fetch(`/api/groups?classroom_id=${data.classroom.id}`);
            if (groupsRes.ok) setGroups(await groupsRes.json());
          }
        }

        if (todayRes.ok) {
          const data = await todayRes.json();
          setTodayData({ entries: data.entries, today: data.today });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function validateEntry(entryId: number) {
    const res = await fetch(`/api/entries/${entryId}/validate`, { method: 'PATCH' });
    if (res.ok && todayData) {
      setTodayData(prev => prev ? {
        ...prev,
        entries: prev.entries.map(e => e.id === entryId ? { ...e, validated_by_teacher: true } : e),
      } : null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-amber-400 animate-pulse">Kargatzen...</p>
      </div>
    );
  }

  const sortedGroups = [...groups].sort((a, b) => parseFloat(b.position) - parseFloat(a.position));
  const registered   = groups.filter(g => todayData?.entries.some(e => e.group_id === g.id));

  return (
    <div className="space-y-8">

      {/* ── MAP ── */}
      <div>
        <h2 className="island-title text-2xl text-amber-400 mb-3">Dashboard</h2>
        <MapCanvas groups={groups} mapTotal={50} />
      </div>

      {/* ── TODAY'S COMPLETION ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="island-title text-xl text-amber-400">Gaurko Egoera</h3>
          <span className="text-amber-600 text-sm">
            {registered.length}/{groups.length} taldeek erregistratu dute
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-amber-950 rounded-full h-2 mb-4">
          <div
            className="h-2 rounded-full bg-emerald-500 transition-all"
            style={{ width: groups.length ? `${(registered.length / groups.length) * 100}%` : '0%' }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sortedGroups.map(g => {
            const entry = todayData?.entries.find(e => e.group_id === g.id);
            const char  = CHARACTERS[g.character_index] ?? CHARACTERS[0];
            const name  = g.student_name || g.name || CHARACTER_NAMES[g.character_index];

            return (
              <div
                key={g.id}
                className="card-dark p-4"
                style={{ borderColor: entry ? 'rgba(39,174,96,0.45)' : 'rgba(120,80,20,0.3)' }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Image src={char.image} alt={char.name} width={28} height={28} className="object-contain flex-shrink-0" />
                  <span className="font-bold text-sm flex-1" style={{ color: g.color }}>
                    {name}
                  </span>
                  <span className="text-xs font-mono text-amber-700">{g.code}</span>
                </div>

                {entry ? (
                  <>
                    {/* Score bar */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-1 bg-amber-950 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${(entry.score / 10) * 100}%`,
                            backgroundColor: g.color,
                          }}
                        />
                      </div>
                      <span className="text-white text-sm font-bold">{entry.score}/10</span>
                      <span className="text-teal-400 text-sm">+{entry.advance}</span>
                    </div>

                    {/* Class breakdown */}
                    <div className="grid grid-cols-5 gap-1 mb-2">
                      {CLASS_NAMES.map((cls, i) => {
                        const k = i + 1;
                        const eu = entry[`class_${k}_euskera` as keyof DayEntry] as boolean;
                        const er = entry[`class_${k}_errespetua` as keyof DayEntry] as boolean;
                        return (
                          <div key={i} className="text-center">
                            <div className="text-amber-700 text-xs mb-1 truncate" title={cls}>
                              {cls.split(' ')[0]}
                            </div>
                            <div className={`text-xs rounded px-1 py-0.5 ${eu ? 'bg-teal-900 text-teal-300' : 'bg-gray-900 text-gray-600'}`}>
                              🗣️
                            </div>
                            <div className={`text-xs rounded px-1 py-0.5 mt-0.5 ${er ? 'bg-amber-900 text-amber-300' : 'bg-gray-900 text-gray-600'}`}>
                              🤝
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Validate */}
                    {!entry.validated_by_teacher ? (
                      <button
                        onClick={() => validateEntry(entry.id)}
                        className="w-full text-xs bg-green-900 text-green-200 rounded-lg py-1.5 hover:bg-green-800 font-semibold transition-colors"
                      >
                        ✓ Baliozta
                      </button>
                    ) : (
                      <p className="text-center text-green-500 text-xs font-semibold">✓ Balioztatua</p>
                    )}
                  </>
                ) : (
                  <p className="text-amber-800 text-sm italic text-center py-2">
                    Ez du erregistratu gaur
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── RANKING ── */}
      <div className="card-dark p-6">
        <h3 className="island-title text-lg text-amber-400 mb-4">Sailkapena</h3>
        <div className="space-y-2">
          {sortedGroups.map((g, i) => (
            <div key={g.id} className="flex items-center gap-3 p-2 bg-black bg-opacity-20 rounded-xl">
              <span className="text-amber-500 font-bold w-7 text-sm">#{i + 1}</span>
              <Image src={CHARACTERS[g.character_index]?.image ?? CHARACTERS[0].image} alt="" width={24} height={24} className="object-contain flex-shrink-0" />
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: g.color }} />
              <span className="flex-1 text-sm font-semibold">
                {g.student_name || g.name || CHARACTER_NAMES[g.character_index]}
              </span>
              <div className="text-right">
                <div className="text-amber-300 font-bold text-sm">{parseFloat(g.position)} / 50</div>
                <div className="w-20 bg-gray-700 rounded-full h-1.5 mt-1">
                  <div
                    className="h-1.5 rounded-full"
                    style={{
                      width: `${(parseFloat(g.position) / 50) * 100}%`,
                      backgroundColor: g.color,
                    }}
                  />
                </div>
              </div>
              {parseFloat(g.position) >= 50 && <span className="text-yellow-400">🏆</span>}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
