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

  return (
    <main
      className="min-h-screen p-4 md:p-5 flex flex-col gap-4"
      style={{ maxWidth: 680, margin: '0 auto' }}
    >
      {/* ── TOP BAR ── */}
      <header
        className="flex items-center justify-between anim-slide-up"
        style={{ animationDelay: '0ms' }}
      >
        <h1 className="island-title island-title-nav text-base tracking-wide">
          Euskararen Uhartea
        </h1>
        <button
          onClick={handleLogout}
          className="text-xs font-semibold opacity-35 hover:opacity-60 transition-opacity"
          style={{ color: '#EDD5C0' }}
        >
          Irten
        </button>
      </header>

      {/* ── HERO ROW: character left + identity + overall bar right ── */}
      <div
        className="relative rounded-3xl overflow-hidden flex flex-row items-center gap-4 px-5 py-4"
        style={{
          background: `linear-gradient(120deg, ${group.color}22 0%, ${group.color}0a 60%, transparent 100%)`,
          border: `1px solid ${group.color}44`,
          opacity: ready ? 1 : 0,
          transform: ready ? 'none' : 'translateY(16px)',
          transition: 'opacity 0.55s ease, transform 0.55s ease',
        }}
      >
        {/* Glow blob */}
        <div
          className="anim-glow absolute left-10 top-1/2 -translate-y-1/2 rounded-full pointer-events-none"
          style={{
            width: 130, height: 130,
            background: group.color,
            filter: 'blur(40px)',
          }}
        />

        {/* Character — floating */}
        <div
          className="anim-float relative flex-shrink-0 z-10"
          style={{
            width: 120, height: 120,
            filter: `drop-shadow(0 8px 20px ${group.color}99)`,
          }}
        >
          <Image src={char.image} alt={char.name} fill className="object-contain" />
        </div>

        {/* Identity + overall bar */}
        <div className="flex-1 z-10 min-w-0">
          <p className="text-xs font-black uppercase tracking-widest mb-0.5" style={{ color: group.color }}>
            {char.label} taldea
          </p>
          <h2
            className="font-black leading-tight truncate"
            style={{
              color: '#EDD5C0',
              fontFamily: 'Rubik, var(--font-display), sans-serif',
              fontSize: 'clamp(1.15rem, 4vw, 1.6rem)',
            }}
          >
            {group.student_name || group.name || CHARACTER_NAMES[group.character_index]}
          </h2>

          {/* Position + overall bar */}
          <div className="mt-3 flex items-center gap-3">
            <div
              className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-black"
              style={{ background: 'rgba(0,0,0,0.32)', color: '#EDD5C0' }}
            >
              🗺️ {position}<span style={{ opacity: 0.45 }}>/{mapTotal}</span>
            </div>
            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div
                className="h-2 rounded-full transition-all duration-700"
                style={{
                  width: `${overallPct}%`,
                  background: `linear-gradient(90deg, ${group.color}77, ${group.color})`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── MIDDLE ROW: next checkpoint (left) + today status (right) ── */}
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
            className="rounded-2xl p-4 flex flex-col gap-3"
            style={{
              background: 'rgba(28,16,6,0.72)',
              border: '1px solid rgba(241,168,5,0.18)',
            }}
          >
            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#92ADA4' }}>
              Hurrengo helburua
            </p>
            <div className="flex items-center gap-3">
              <div
                className="text-2xl w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(241,168,5,0.12)', border: '1px solid rgba(241,168,5,0.22)' }}
              >
                {nextCp.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-sm leading-tight truncate" style={{ color: '#EDD5C0' }}>
                  {nextCp.name}
                </p>
                <p className="text-[11px] mt-0.5 leading-snug line-clamp-2" style={{ color: '#92ADA4' }}>
                  {nextCp.description.slice(0, 55)}…
                </p>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="font-black text-xl leading-none" style={{ color: '#F1A805' }}>{distLeft}</p>
                <p className="text-[9px] font-semibold" style={{ color: '#92ADA4' }}>posizio</p>
              </div>
            </div>

            {/* Segment progress bar */}
            <div>
              <div className="w-full h-2.5 rounded-full overflow-hidden relative" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div
                  className="h-2.5 rounded-full transition-all duration-700"
                  style={{
                    width: `${segPct}%`,
                    background: 'linear-gradient(90deg, #F1A80555, #F1A805)',
                  }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full border-2 transition-all duration-700"
                  style={{
                    left: `${Math.max(4, Math.min(segPct, 96))}%`,
                    background: group.color,
                    borderColor: '#F1A805',
                    boxShadow: `0 0 8px ${group.color}`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[9px] mt-1 font-semibold" style={{ color: '#92ADA4' }}>
                <span>{prevCp.icon} {prevCp.requiredPos}</span>
                <span style={{ color: '#F1A80588' }}>{Math.round(segPct)}%</span>
                <span>{nextCp.icon} {nextCp.requiredPos}</span>
              </div>
            </div>
          </div>
        ) : finished ? (
          <div
            className="rounded-2xl p-4 flex flex-col items-center justify-center gap-2 text-center"
            style={{ background: 'rgba(39,174,96,0.10)', border: '1px solid rgba(39,174,96,0.28)' }}
          >
            <span className="text-3xl">🏆</span>
            <p className="font-black text-sm" style={{ color: '#27ae60' }}>Helmugaraino iritsi zara!</p>
            <p className="text-xs" style={{ color: '#92ADA4' }}>Bidai osoa egin duzu!</p>
          </div>
        ) : null}

        {/* Today's status */}
        {todayEntry ? (
          <div
            className="rounded-2xl p-4 flex flex-col gap-2"
            style={{ background: 'rgba(39,174,96,0.09)', border: '1px solid rgba(39,174,96,0.26)' }}
          >
            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#92ADA4' }}>
              Gaurko erregistroa
            </p>
            <div className="flex items-center gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <p className="font-black text-sm" style={{ color: '#27ae60' }}>Erregistratuta!</p>
                <p className="text-xs mt-0.5" style={{ color: '#92ADA4' }}>
                  {todayEntry.score}/10 · +{todayEntry.advance} pos.
                  {todayEntry.validated_by_teacher && ' · ✓ Bal.'}
                </p>
              </div>
            </div>
            {/* Score bar */}
            <div className="mt-1">
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div
                  className="h-2 rounded-full transition-all duration-700"
                  style={{
                    width: `${(todayEntry.score / 10) * 100}%`,
                    background: todayEntry.score >= 8 ? '#27ae60' : todayEntry.score >= 5 ? '#F1A805' : '#e05040',
                  }}
                />
              </div>
            </div>
          </div>
        ) : (
          <Link
            href="/juego/registro"
            className="rounded-2xl p-4 flex flex-col items-center justify-center gap-2 text-center transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #1d4d42, #2a6b5a)',
              border: '1px solid rgba(100,185,140,0.35)',
              color: '#a0e8c0',
              boxShadow: '0 4px 24px rgba(39,174,96,0.16)',
            }}
          >
            <span className="text-3xl">✏️</span>
            <p className="font-black text-sm">Gaur erregistratu</p>
            <p className="text-[11px] opacity-70">Eguneko txartela bete</p>
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
          className="flex items-center gap-3 rounded-2xl px-4 py-3 font-black text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: 'rgba(132,87,47,0.18)',
            border: '1px solid rgba(132,87,47,0.28)',
            color: '#EDD5C0',
          }}
        >
          <span className="text-2xl flex-shrink-0">🗺️</span>
          <span>Mapa ikusi</span>
        </Link>

        <Link
          href="/juego/perfil"
          className="flex items-center gap-3 rounded-2xl px-4 py-3 font-black text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: 'rgba(241,168,5,0.11)',
            border: '1px solid rgba(241,168,5,0.24)',
            color: '#F2D6A1',
          }}
        >
          <span className="text-2xl flex-shrink-0">🎒</span>
          <span>Nire Profila</span>
        </Link>
      </div>

      {/* ── RECENT ENTRIES ── */}
      {recentEntries.length > 0 && (
        <div
          style={{
            opacity: ready ? 1 : 0,
            transition: 'opacity 0.55s ease 0.36s',
          }}
        >
          <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: '#92ADA4' }}>
            Azken egunak
          </p>
          <div className="flex flex-col gap-1.5">
            {recentEntries.map(entry => {
              const sc = entry.score;
              const barColor = sc >= 8 ? '#27ae60' : sc >= 5 ? '#F1A805' : '#e05040';
              return (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <span className="text-xs font-semibold w-22 flex-shrink-0" style={{ color: '#92ADA4' }}>
                    {entry.entry_date}
                  </span>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <div className="h-1.5 rounded-full" style={{ width: `${(sc / 10) * 100}%`, background: barColor }} />
                  </div>
                  <span className="text-xs font-black w-9 text-right flex-shrink-0" style={{ color: barColor }}>
                    {sc}/10
                  </span>
                  <span className="text-xs font-semibold w-10 text-right flex-shrink-0" style={{ color: '#92ADA4' }}>
                    +{entry.advance}
                  </span>
                  {entry.validated_by_teacher && (
                    <span className="text-[10px] font-bold flex-shrink-0" style={{ color: '#27ae60' }}>✓</span>
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
