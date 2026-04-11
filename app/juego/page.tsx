'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import Image from 'next/image';
import { CHARACTERS, CHARACTER_NAMES } from '@/lib/characters';

type Group = {
  id: number;
  name: string | null;
  student_name: string | null;
  character_index: number;
  color: string;
  position: string;
  classroom_id: number;
};

type DayEntry = {
  id: number;
  entry_date: string;
  score: number;
  advance: string;
  validated_by_teacher: boolean;
};

export default function JuegoPage() {
  const router = useRouter();
  const [group, setGroup] = useState<Group | null>(null);
  const [recentEntries, setRecentEntries] = useState<DayEntry[]>([]);
  const [todayEntry, setTodayEntry] = useState<DayEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/session');
        if (!res.ok) {
          router.push('/');
          return;
        }
        const session = await res.json();

        // Only fetch own group
        const groupsRes = await fetch(`/api/groups?classroom_id=${session.classroomId}`);
        const groups = await groupsRes.json();

        const myGroup = groups.find((g: Group) => g.id === session.groupId);
        if (myGroup && !myGroup.student_name) {
          router.push('/juego/setup');
          return;
        }
        setGroup(myGroup || null);

        if (myGroup) {
          const entriesRes = await fetch(`/api/entries?group_id=${myGroup.id}`);
          const entries = await entriesRes.json();
          setRecentEntries(entries.slice(-5).reverse());

          const today = new Date().toISOString().split('T')[0];
          const tEntry = entries.find((e: DayEntry) => e.entry_date === today);
          setTodayEntry(tEntry || null);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-amber-400 text-xl animate-pulse">Kargatzen...</p>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-amber-400">Saioa iraungi da. <Link href="/" className="underline">Berriz sartu</Link></p>
      </div>
    );
  }

  const mapTotal = 50;
  const position = parseFloat(group.position);
  const progressPct = (position / mapTotal) * 100;

  return (
    <main className="min-h-screen p-4 md:p-6">
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <h1 className="island-title text-xl md:text-2xl">Euskararen Uhartea</h1>
        <button onClick={handleLogout} className="text-amber-500 text-sm underline opacity-70 hover:opacity-100">
          Irten
        </button>
      </header>

      {/* Group Card */}
      <div
        className="rounded-2xl p-5 mb-6 text-white shadow-xl relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${group.color}cc, ${group.color}88)`,
          border: `3px solid ${group.color}`,
        }}
      >
        {/* Decorative background glow */}
        <div className="absolute -right-8 -top-8 opacity-20 pointer-events-none"
          style={{ width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.3)', filter: 'blur(30px)' }} />

        <div className="flex items-end gap-4">
          {/* Large character */}
          <div className="relative flex-shrink-0" style={{ width: 110, height: 110, filter: `drop-shadow(0 4px 12px ${group.color})` }}>
            <Image
              src={CHARACTERS[group.character_index]?.image ?? CHARACTERS[0].image}
              alt=""
              fill
              className="object-contain"
            />
          </div>
          <div className="flex-1 pb-1">
            <h2 className="text-2xl font-black leading-tight drop-shadow">
              {group.student_name || group.name || CHARACTER_NAMES[group.character_index]}
            </h2>
            <p className="opacity-70 text-sm font-semibold mt-0.5">
              {CHARACTERS[group.character_index]?.label} taldea
            </p>
            {/* Mini position badge */}
            <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-xs font-bold"
              style={{ background: 'rgba(0,0,0,0.28)', backdropFilter: 'blur(4px)' }}>
              🗺️ {position} / {mapTotal} posizio
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="w-full bg-black bg-opacity-30 rounded-full h-3 overflow-hidden">
            <div
              className="h-3 rounded-full transition-all duration-700"
              style={{ width: `${progressPct}%`, background: 'rgba(255,255,255,0.75)' }}
            />
          </div>
          {position >= mapTotal && (
            <p className="text-center mt-2 font-bold text-lg">🎉 Helmugaraino iritsi zara!</p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {todayEntry ? (
          <div className="card-dark p-4 rounded-xl col-span-2 text-center">
            <p className="text-amber-400 font-semibold">✅ Gaur dagoeneko erregistratu duzu</p>
            <p className="text-amber-300 text-sm mt-1">
              Puntuazioa: {todayEntry.score}/10 • Aurreratua: +{todayEntry.advance} posizio
              {todayEntry.validated_by_teacher && ' • ✓ Irakasleak balioztatua'}
            </p>
          </div>
        ) : (
          <Link href="/juego/registro" className="btn-teal text-center col-span-2">
            ✏️ Gaur erregistratu
          </Link>
        )}
        <Link href="/juego/mapa" className="btn-bronze text-center">
          🗺️ Mapa ikusi
        </Link>
        <button
          onClick={handleLogout}
          className="btn-bronze text-center"
        >
          🚪 Irten
        </button>
      </div>

      {/* Recent entries */}
      {recentEntries.length > 0 && (
        <div className="card-dark p-4">
          <h3 className="text-amber-400 font-bold mb-3">📅 Azken egunak</h3>
          <div className="space-y-2">
            {recentEntries.map((entry) => (
              <div key={entry.id} className="flex justify-between items-center text-sm p-2 bg-black bg-opacity-20 rounded-lg">
                <span className="text-amber-300">{entry.entry_date}</span>
                <span className="text-white">{entry.score}/10 puntuazio</span>
                <span className="text-teal-400">+{entry.advance} pos.</span>
                {entry.validated_by_teacher && <span className="text-green-400">✓</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
