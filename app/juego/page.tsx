'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { CHARACTERS, CHARACTER_NAMES } from '@/lib/characters';
import { CHECKPOINTS } from '@/lib/checkpoints';

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

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function getNextCheckpoint(pos: number) {
  return CHECKPOINTS.find(cp => cp.requiredPos > pos) ?? null;
}
function getPrevCheckpoint(pos: number) {
  const passed = CHECKPOINTS.filter(cp => cp.requiredPos <= pos);
  return passed[passed.length - 1] ?? CHECKPOINTS[0];
}

export default function JuegoPage() {
  const router = useRouter();
  const [group,         setGroup]         = useState<Group | null>(null);
  const [recentEntries, setRecentEntries] = useState<DayEntry[]>([]);
  const [todayEntry,    setTodayEntry]    = useState<DayEntry | null>(null);
  const [mapTotal,      setMapTotal]      = useState(50);
  const [loading,       setLoading]       = useState(true);
  const [ready,         setReady]         = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/session');
        if (!res.ok) { router.push('/'); return; }
        const session = await res.json();

        const [groupsRes, classroomRes] = await Promise.all([
          fetch(`/api/groups?classroom_id=${session.classroomId}`),
          fetch('/api/teacher/classrooms'),
        ]);
        const groups = await groupsRes.json();
        const myGroup: Group | undefined = groups.find((g: Group) => g.id === session.groupId);

        if (!myGroup || !myGroup.student_name) { router.push('/juego/setup'); return; }
        setGroup(myGroup);

        if (classroomRes.ok) {
          const { classroom: c } = await classroomRes.json();
          if (c?.map_total) setMapTotal(c.map_total);
        }

        const entriesRes = await fetch(`/api/entries?group_id=${myGroup.id}`);
        const entries: DayEntry[] = await entriesRes.json();
        setRecentEntries(entries.slice(-5).reverse());
        const today = new Date().toISOString().split('T')[0];
        setTodayEntry(entries.find((e: DayEntry) => e.entry_date === today) ?? null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
        setTimeout(() => setReady(true), 60);
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
        <p className="animate-pulse text-sm" style={{ color: '#92ADA4' }}>Kargatzen...</p>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm" style={{ color: '#92ADA4' }}>
          Saioa iraungi da.{' '}
          <Link href="/" className="underline">Berriz sartu</Link>
        </p>
      </div>
    );
  }

  const char      = CHARACTERS[group.character_index] ?? CHARACTERS[0];
  const position  = parseFloat(group.position);
  const nextCp    = getNextCheckpoint(position);
  const prevCp    = getPrevCheckpoint(position);
  const segStart  = prevCp.requiredPos;
  const segEnd    = nextCp?.requiredPos ?? mapTotal;
  const segLen    = Math.max(segEnd - segStart, 1);
  const segPct    = Math.min(((position - segStart) / segLen) * 100, 100);
  const distLeft  = nextCp ? Math.max(0, nextCp.requiredPos - position) : 0;
  const finished  = position >= mapTotal;
  const overallPct = Math.min((position / mapTotal) * 100, 100);

  // ── Color theme derived from character color ──
  const [r, g, b] = hexToRgb(group.color);
  const c1 = (a: number) => `rgba(${r},${g},${b},${a})`;       // character color at opacity
  const cardBg   = `rgba(${Math.round(r*0.12)},${Math.round(g*0.12)},${Math.round(b*0.12)},0.85)`; // very dark tinted
  const cardBorder = c1(0.35);

  return (
    <main
      className="min-h-screen p-4 md:p-6 flex flex-col gap-4"
      style={{
        maxWidth: 700,
        margin: '0 auto',
        // Page background tinted with character color
        background: `radial-gradient(ellipse 80% 50% at 50% -10%, ${c1(0.18)}, transparent 70%)`,
      }}
    >
      {/* ── TOP BAR ── */}
      <header className="flex items-center justify-between anim-slide-up">
        <h1
          className="font-black text-sm uppercase tracking-widest"
          style={{ color: c1(0.9), fontFamily: 'Rubik, sans-serif' }}
        >
          Euskararen Uhartea
        </h1>
        <button
          onClick={handleLogout}
          className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all hover:opacity-100 opacity-70"
          style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.18)', color: '#fff' }}
        >
          🚪 Irten
        </button>
      </header>

      {/* ── HERO ROW ── */}
      <div
        className="relative rounded-3xl overflow-hidden flex flex-row items-center gap-5 px-6 py-5"
        style={{
          background: `linear-gradient(130deg, ${c1(0.32)} 0%, ${c1(0.14)} 55%, rgba(10,6,2,0.7) 100%)`,
          border: `1.5px solid ${cardBorder}`,
          boxShadow: `0 8px 40px ${c1(0.22)}`,
          opacity: ready ? 1 : 0,
          transform: ready ? 'none' : 'translateY(18px)',
          transition: 'opacity 0.55s ease, transform 0.55s ease',
        }}
      >
        {/* Glow blob */}
        <div
          className="anim-glow absolute rounded-full pointer-events-none"
          style={{
            width: 200, height: 200,
            left: 30, top: '50%', transform: 'translateY(-50%)',
            background: group.color,
            filter: 'blur(60px)',
          }}
        />

        {/* Character */}
        <div
          className="anim-float relative flex-shrink-0 z-10"
          style={{
            width: 140, height: 140,
            filter: `drop-shadow(0 10px 28px ${c1(0.7)})`,
          }}
        >
          <Image src={char.image} alt={char.name} fill className="object-contain" />
        </div>

        {/* Identity */}
        <div className="flex-1 z-10 min-w-0">
          <p
            className="text-xs font-black uppercase tracking-widest mb-1"
            style={{ color: c1(0.85) }}
          >
            {char.label} taldea
          </p>
          <h2
            className="font-black leading-tight"
            style={{
              color: '#ffffff',
              fontFamily: 'Rubik, var(--font-display), sans-serif',
              fontSize: 'clamp(1.4rem, 5vw, 2rem)',
              textShadow: `0 2px 12px ${c1(0.5)}`,
            }}
          >
            {group.student_name || group.name || CHARACTER_NAMES[group.character_index]}
          </h2>

          {/* Position pill + bar */}
          <div className="mt-3 flex items-center gap-3">
            <div
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-black"
              style={{ background: c1(0.28), color: '#fff', border: `1px solid ${c1(0.45)}` }}
            >
              🗺️ {position}<span style={{ opacity: 0.55, marginLeft: 2 }}>/{mapTotal}</span>
            </div>
            <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.10)' }}>
              <div
                className="h-2.5 rounded-full transition-all duration-700"
                style={{
                  width: `${overallPct}%`,
                  background: `linear-gradient(90deg, ${c1(0.6)}, ${group.color})`,
                  boxShadow: `0 0 8px ${c1(0.7)}`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── MIDDLE ROW: next checkpoint + today status ── */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        style={{
          opacity: ready ? 1 : 0,
          transform: ready ? 'none' : 'translateY(14px)',
          transition: 'opacity 0.55s ease 0.13s, transform 0.55s ease 0.13s',
        }}
      >
        {/* Next checkpoint */}
        {!finished && nextCp ? (
          <div
            className="rounded-2xl p-5 flex flex-col gap-3"
            style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
          >
            <p className="text-xs font-black uppercase tracking-widest" style={{ color: c1(0.7) }}>
              Hurrengo helburua
            </p>
            <div className="flex items-center gap-3">
              <div
                className="text-3xl w-13 h-13 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  width: 52, height: 52,
                  background: c1(0.18),
                  border: `1.5px solid ${c1(0.35)}`,
                }}
              >
                {nextCp.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-base leading-tight" style={{ color: '#fff' }}>
                  {nextCp.name}
                </p>
                <p className="text-xs mt-0.5 leading-snug" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  {nextCp.description.slice(0, 58)}…
                </p>
              </div>
            </div>

            {/* Distance */}
            <div
              className="flex items-center justify-between px-4 py-2.5 rounded-xl"
              style={{ background: c1(0.15), border: `1px solid ${c1(0.25)}` }}
            >
              <span className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.7)' }}>Falta diren posoak</span>
              <span className="font-black text-2xl" style={{ color: '#fff', textShadow: `0 0 14px ${c1(0.8)}` }}>
                {distLeft}
              </span>
            </div>

            {/* Segment progress bar */}
            <div>
              <div className="w-full h-3 rounded-full overflow-hidden relative" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div
                  className="h-3 rounded-full transition-all duration-700"
                  style={{
                    width: `${segPct}%`,
                    background: `linear-gradient(90deg, ${c1(0.5)}, ${group.color})`,
                  }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 transition-all duration-700"
                  style={{
                    left: `${Math.max(4, Math.min(segPct, 96))}%`,
                    background: '#fff',
                    borderColor: group.color,
                    boxShadow: `0 0 10px ${c1(0.9)}`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] mt-1.5 font-bold" style={{ color: 'rgba(255,255,255,0.45)' }}>
                <span>{prevCp.icon} {prevCp.requiredPos}</span>
                <span style={{ color: c1(0.8) }}>{Math.round(segPct)}% eginda</span>
                <span>{nextCp.icon} {nextCp.requiredPos}</span>
              </div>
            </div>
          </div>
        ) : finished ? (
          <div
            className="rounded-2xl p-5 flex flex-col items-center justify-center gap-2 text-center"
            style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
          >
            <span className="text-4xl">🏆</span>
            <p className="font-black text-lg" style={{ color: '#fff' }}>Helmugaraino iritsi zara!</p>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>Bidai osoa egin duzu!</p>
          </div>
        ) : null}

        {/* Today's status */}
        {todayEntry ? (
          <div
            className="rounded-2xl p-5 flex flex-col gap-3"
            style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
          >
            <p className="text-xs font-black uppercase tracking-widest" style={{ color: c1(0.7) }}>
              Gaurko erregistroa
            </p>
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: 'rgba(39,174,96,0.2)', border: '1.5px solid rgba(39,174,96,0.45)' }}
              >
                ✅
              </div>
              <div>
                <p className="font-black text-base" style={{ color: '#fff' }}>Erregistratuta!</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  {todayEntry.score}/10 puntu · +{todayEntry.advance} posizio
                  {todayEntry.validated_by_teacher && ' · ✓ Balioztatua'}
                </p>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                <span>Puntuazioa</span>
                <span style={{ color: '#fff' }}>{todayEntry.score}/10</span>
              </div>
              <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div
                  className="h-3 rounded-full transition-all duration-700"
                  style={{
                    width: `${(todayEntry.score / 10) * 100}%`,
                    background: todayEntry.score >= 8
                      ? 'linear-gradient(90deg,#1a9e50,#27ae60)'
                      : todayEntry.score >= 5
                      ? 'linear-gradient(90deg,#c98000,#F1A805)'
                      : 'linear-gradient(90deg,#b02820,#e05040)',
                  }}
                />
              </div>
            </div>
          </div>
        ) : (
          <Link
            href="/juego/registro"
            className="rounded-2xl p-5 flex flex-col items-center justify-center gap-3 text-center transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: `linear-gradient(140deg, ${c1(0.55)}, ${c1(0.30)})`,
              border: `1.5px solid ${c1(0.60)}`,
              boxShadow: `0 6px 28px ${c1(0.28)}`,
            }}
          >
            <span className="text-4xl">✏️</span>
            <div>
              <p className="font-black text-lg" style={{ color: '#fff' }}>Gaur erregistratu</p>
              <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.7)' }}>Eguneko txartela bete</p>
            </div>
          </Link>
        )}
      </div>

      {/* ── ACTION BUTTONS ── */}
      <div
        className="grid grid-cols-2 gap-3"
        style={{
          opacity: ready ? 1 : 0,
          transform: ready ? 'none' : 'translateY(12px)',
          transition: 'opacity 0.55s ease 0.25s, transform 0.55s ease 0.25s',
        }}
      >
        <Link
          href="/juego/mapa"
          className="flex items-center gap-3 rounded-2xl px-5 py-4 font-black text-base transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: cardBg,
            border: `1px solid ${cardBorder}`,
            color: '#fff',
          }}
        >
          <span className="text-2xl flex-shrink-0">🗺️</span>
          <span>Mapa ikusi</span>
        </Link>

        <Link
          href="/juego/perfil"
          className="flex items-center gap-3 rounded-2xl px-5 py-4 font-black text-base transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: cardBg,
            border: `1px solid ${cardBorder}`,
            color: '#fff',
          }}
        >
          <span className="text-2xl flex-shrink-0">🎒</span>
          <span>Nire Profila</span>
        </Link>
      </div>

      {/* ── LOGOUT (bottom) ── */}
      <div
        style={{
          opacity: ready ? 1 : 0,
          transition: 'opacity 0.55s ease 0.42s',
        }}
      >
        <button
          onClick={handleLogout}
          className="w-full rounded-xl py-3 text-sm font-bold transition-all hover:opacity-90 active:scale-[0.99]"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: 'rgba(255,255,255,0.5)',
          }}
        >
          🚪 Saioa itxi
        </button>
      </div>

      {/* ── RECENT ENTRIES ── */}
      {recentEntries.length > 0 && (
        <div
          style={{
            opacity: ready ? 1 : 0,
            transition: 'opacity 0.55s ease 0.36s',
          }}
        >
          <p className="text-xs font-black uppercase tracking-widest mb-2.5" style={{ color: c1(0.65) }}>
            Azken egunak
          </p>
          <div className="flex flex-col gap-2">
            {recentEntries.map(entry => {
              const sc = entry.score;
              const barColor = sc >= 8 ? '#27ae60' : sc >= 5 ? '#F1A805' : '#e05040';
              return (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl"
                  style={{ background: cardBg, border: `1px solid ${c1(0.15)}` }}
                >
                  <span className="text-sm font-bold flex-shrink-0 w-24" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    {entry.entry_date}
                  </span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.09)' }}>
                    <div className="h-2 rounded-full" style={{ width: `${(sc / 10) * 100}%`, background: barColor }} />
                  </div>
                  <span className="text-sm font-black flex-shrink-0 w-10 text-right" style={{ color: '#fff' }}>
                    {sc}/10
                  </span>
                  <span className="text-xs font-semibold flex-shrink-0 w-12 text-right" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    +{entry.advance}
                  </span>
                  {entry.validated_by_teacher && (
                    <span className="text-xs font-black flex-shrink-0" style={{ color: '#27ae60' }}>✓</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
}
