'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
  entry_date: string;
  score: number;
  advance: string;
  validated_by_teacher: boolean;
};

const CHARACTER_ICONS = ['⚔️', '🏹', '🌊', '🔥', '🌿', '⭐'];
const CHARACTER_NAMES = ['Amaia', 'Iker', 'Nerea', 'Unai', 'Leire', 'Mikel'];

export default function JuegoPage() {
  const router = useRouter();
  const [group, setGroup] = useState<Group | null>(null);
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [recentEntries, setRecentEntries] = useState<DayEntry[]>([]);
  const [todayEntry, setTodayEntry] = useState<DayEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // Get current group info via session API
        const res = await fetch('/api/session');
        if (!res.ok) {
          router.push('/');
          return;
        }
        const session = await res.json();

        // Get all groups for classroom
        const groupsRes = await fetch(`/api/groups?classroom_id=${session.classroomId}`);
        const groups = await groupsRes.json();
        setAllGroups(groups);

        const myGroup = groups.find((g: Group) => g.id === session.groupId);
        setGroup(myGroup || null);

        if (myGroup) {
          // Get recent entries
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
        className="rounded-2xl p-6 mb-6 border-4 text-white shadow-xl"
        style={{ backgroundColor: group.color, borderColor: group.color }}
      >
        <div className="flex items-center gap-4">
          <span className="text-5xl">{CHARACTER_ICONS[group.character_index]}</span>
          <div>
            <h2 className="text-2xl font-bold">
              {group.name || CHARACTER_NAMES[group.character_index]}
            </h2>
            <p className="opacity-80 text-sm">Taldea #{group.id}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1 opacity-90">
            <span>Ibilbidea</span>
            <span>{position} / {mapTotal} posizio</span>
          </div>
          <div className="w-full bg-black bg-opacity-30 rounded-full h-4">
            <div
              className="h-4 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%`, backgroundColor: 'rgba(255,255,255,0.7)' }}
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

      {/* Ranking */}
      <div className="card-dark p-4 mb-6">
        <h3 className="text-amber-400 font-bold mb-3">📊 Taldeen egoera</h3>
        <div className="space-y-2">
          {[...allGroups]
            .sort((a, b) => parseFloat(b.position) - parseFloat(a.position))
            .map((g, i) => (
              <div
                key={g.id}
                className={`flex items-center gap-3 p-2 rounded-lg ${g.id === group.id ? 'ring-2 ring-amber-400' : ''}`}
              >
                <span className="text-amber-500 font-bold w-6">#{i + 1}</span>
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: g.color }}
                />
                <span className="flex-1 text-sm">
                  {g.name || CHARACTER_NAMES[g.character_index]}
                  {g.id === group.id && ' (zu)'}
                </span>
                <span className="text-amber-300 text-sm font-semibold">
                  {parseFloat(g.position)} pos.
                </span>
              </div>
            ))}
        </div>
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
