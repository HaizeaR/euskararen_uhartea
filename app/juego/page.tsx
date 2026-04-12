'use client';

import { useEffect, useState, useRef } from 'react';
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

function getNextCheckpoint(position: number) {
  return CHECKPOINTS.find(cp => cp.requiredPos > position) ?? null;
}

function getPrevCheckpoint(position: number) {
  const passed = CHECKPOINTS.filter(cp => cp.requiredPos <= position);
  return passed[passed.length - 1] ?? CHECKPOINTS[0];
}

export default function JuegoPage() {
  const router  = useRouter();
  const heroRef = useRef<HTMLDivElement>(null);

  const [group,         setGroup]         = useState<Group | null>(null);
  const [recentEntries, setRecentEntries] = useState<DayEntry[]>([]);
  const [todayEntry,    setTodayEntry]    = useState<DayEntry | null>(null);
  const [mapTotal,      setMapTotal]      = useState(50);
  const [loading,       setLoading]       = useState(true);
  const [heroVisible,   setHeroVisible]   = useState(false);

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

        if (!myGroup) { router.push('/juego/setup'); return; }
        if (!myGroup.student_name) { router.push('/juego/setup'); return; }
        setGroup(myGroup);

        if (classroomRes.ok) {
          const { classroom: c } = await classroomRes.json();
          if (c?.map_total) setMapTotal(c.map_total);
        }

        const entriesRes = await fetch(`/api/entries?group_id=${myGroup.id}`);
        const entries: DayEntry[] = await entriesRes.json();
        setRecentEntries(entries.slice(-5).reverse());

        const today = new Date().toISOString().split('T')[0];
        const tEntry = entries.find((e: DayEntry) => e.entry_date === today);
        setTodayEntry(tEntry ?? null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
        // Stagger entrance
        setTimeout(() => setHeroVisible(true), 80);
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

  // Progress between prev and next checkpoint
  const segStart  = prevCp.requiredPos;
  const segEnd    = nextCp?.requiredPos ?? mapTotal;
  const segLen    = Math.max(segEnd - segStart, 1);
  const segPct    = Math.min(((position - segStart) / segLen) * 100, 100);
  const distLeft  = nextCp ? Math.max(0, nextCp.requiredPos - position) : 0;

  // Overall map progress
  const overallPct = Math.min((position / mapTotal) * 100, 100);
  const finished   = position >= mapTotal;

  return (
    <main className="min-h-screen max-w-md mx-auto px-4 pt-5 pb-8 flex flex-col gap-5">

      {/* ── TOP BAR ── */}
      <header className="flex items-center justify-between">
        <h1 className="island-title island-title-nav text-base tracking-wide">
          Euskararen Uhartea
        </h1>
        <button
          onClick={handleLogout}
          className="text-xs font-semibold opacity-40 hover:opacity-70 transition-opacity"
          style={{ color: '#EDD5C0' }}
        >
          Irten
        </button>
      </header>

      {/* ── HERO: CHARACTER + IDENTITY ── */}
      <div
        ref={heroRef}
        className="relative rounded-3xl overflow-hidden flex flex-col items-center pt-7 pb-6 px-5 transition-all duration-700"
        style={{
          background: `linear-gradient(160deg, ${group.color}28, ${group.color}0d)`,
          border: `1px solid ${group.color}44`,
          opacity: heroVisible ? 1 : 0,
          transform: heroVisible ? 'translateY(0)' : 'translateY(18px)',
        }}
      >
        {/* Glow blob behind character */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 180, height: 180,
            top: -30, left: '50%', transform: 'translateX(-50%)',
            background: group.color,
            opacity: 0.13,
            filter: 'blur(48px)',
          }}
        />

        {/* Character */}
        <div
          className="relative z-10 mb-3"
          style={{
            width: 148, height: 148,
            filter: `drop-shadow(0 6px 24px ${group.color}88)`,
          }}
        >
          <Image src={char.image} alt={char.name} fill className="object-contain" />
        </div>

        {/* Name + group */}
        <h2
          className="z-10 text-2xl font-black text-center leading-tight"
          style={{ color: '#EDD5C0', fontFamily: 'Rubik, var(--font-display), sans-serif' }}
        >
          {group.student_name || group.name || CHARACTER_NAMES[group.character_index]}
        </h2>
        <p className="z-10 text-xs font-bold mt-0.5 uppercase tracking-widest" style={{ color: group.color }}>
          {char.label} taldea
        </p>

        {/* Position pill */}
        <div
          className="z-10 mt-3 px-4 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5"
          style={{ background: 'rgba(0,0,0,0.28)', color: '#EDD5C0' }}
        >
          <span>🗺️</span>
          <span>{position}</span>
          <span style={{ opacity: 0.5 }}>/ {mapTotal}</span>
          <span className="ml-1 text-[10px] font-semibold" style={{ color: '#92ADA4' }}>posizio</span>
        </div>

        {/* Overall progress bar */}
        <div className="z-10 w-full mt-4">
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div
              className="h-2 rounded-full transition-all duration-700"
              style={{ width: `${overallPct}%`, background: `linear-gradient(90deg, ${group.color}99, ${group.color})` }}
            />
          </div>
        </div>
      </div>

      {/* ── NEXT CHECKPOINT ── */}
      {!finished && nextCp && (
        <div
          className="rounded-2xl p-4 transition-all duration-700"
          style={{
            background: 'rgba(30,18,8,0.7)',
            border: '1px solid rgba(241,168,5,0.18)',
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? 'translateY(0)' : 'translateY(14px)',
            transitionDelay: '150ms',
          }}
        >
          <p className="text-[10px] font-black uppercase tracking-widest mb-2.5" style={{ color: '#92ADA4' }}>
            Hurrengo helburua
          </p>

          <div className="flex items-center gap-3 mb-3">
            <div
              className="text-3xl flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(241,168,5,0.10)', border: '1px solid rgba(241,168,5,0.20)' }}
            >
              {nextCp.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-sm leading-tight" style={{ color: '#EDD5C0' }}>{nextCp.name}</p>
              <p className="text-xs mt-0.5" style={{ color: '#92ADA4' }}>{nextCp.description.slice(0, 60)}…</p>
            </div>
            <div className="flex-shrink-0 text-right">
              <p className="font-black text-xl leading-none" style={{ color: '#F1A805' }}>{distLeft}</p>
              <p className="text-[10px] font-semibold" style={{ color: '#92ADA4' }}>posizio</p>
            </div>
          </div>

          {/* Segment progress bar */}
          <div>
            <div className="flex justify-between text-[10px] font-semibold mb-1" style={{ color: '#92ADA4' }}>
              <span>{prevCp.icon} {prevCp.name}</span>
              <span>{nextCp.icon} {nextCp.name}</span>
            </div>
            <div className="w-full h-3 rounded-full overflow-hidden relative" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div
                className="h-3 rounded-full transition-all duration-700"
                style={{
                  width: `${segPct}%`,
                  background: 'linear-gradient(90deg, #F1A80566, #F1A805)',
                }}
              />
              {/* Token dot on bar */}
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 transition-all duration-700"
                style={{
                  left: `${segPct}%`,
                  background: group.color,
                  borderColor: '#F1A805',
                  boxShadow: `0 0 8px ${group.color}`,
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] mt-1 font-semibold" style={{ color: '#92ADA4' }}>
              <span>{prevCp.requiredPos} pos.</span>
              <span style={{ color: '#F1A80599' }}>{Math.round(segPct)}% eginda</span>
              <span>{nextCp.requiredPos} pos.</span>
            </div>
          </div>
        </div>
      )}

      {finished && (
        <div
          className="rounded-2xl p-5 text-center"
          style={{ background: 'rgba(39,174,96,0.12)', border: '1px solid rgba(39,174,96,0.30)' }}
        >
          <p className="text-2xl mb-1">🏆</p>
          <p className="font-black text-base" style={{ color: '#27ae60' }}>Zorionak! Helmugaraino iritsi zara!</p>
          <p className="text-xs mt-1" style={{ color: '#92ADA4' }}>Bidai osoa egin duzu. Itzela!</p>
        </div>
      )}

      {/* ── TODAY'S REGISTRATION STATUS ── */}
      <div
        className="transition-all duration-700"
        style={{
          opacity: heroVisible ? 1 : 0,
          transform: heroVisible ? 'translateY(0)' : 'translateY(12px)',
          transitionDelay: '260ms',
        }}
      >
        {todayEntry ? (
          <div
            className="rounded-2xl px-5 py-4 flex items-center gap-3"
            style={{ background: 'rgba(39,174,96,0.10)', border: '1px solid rgba(39,174,96,0.28)' }}
          >
            <span className="text-2xl">✅</span>
            <div className="flex-1">
              <p className="font-black text-sm" style={{ color: '#27ae60' }}>Gaur erregistratuta zaude!</p>
              <p className="text-xs mt-0.5" style={{ color: '#92ADA4' }}>
                {todayEntry.score}/10 puntu · +{todayEntry.advance} posizio
                {todayEntry.validated_by_teacher && ' · ✓ Balioztatua'}
              </p>
            </div>
          </div>
        ) : (
          <Link
            href="/juego/registro"
            className="flex items-center justify-center gap-2 w-full rounded-2xl py-4 font-black text-base transition-all hover:scale-[1.01] active:scale-[0.99]"
            style={{
              background: 'linear-gradient(135deg, #2a6b5a, #1d4d42)',
              border: '1px solid rgba(100,185,140,0.35)',
              color: '#a0e8c0',
              boxShadow: '0 4px 20px rgba(39,174,96,0.18)',
            }}
          >
            <span className="text-xl">✏️</span>
            Gaur erregistratu
          </Link>
        )}
      </div>

      {/* ── ACTION BUTTONS ── */}
      <div
        className="grid grid-cols-2 gap-3 transition-all duration-700"
        style={{
          opacity: heroVisible ? 1 : 0,
          transform: heroVisible ? 'translateY(0)' : 'translateY(12px)',
          transitionDelay: '340ms',
        }}
      >
        <Link
          href="/juego/mapa"
          className="flex flex-col items-center gap-1.5 rounded-2xl py-4 font-black text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: 'rgba(132,87,47,0.18)',
            border: '1px solid rgba(132,87,47,0.30)',
            color: '#EDD5C0',
          }}
        >
          <span className="text-2xl">🗺️</span>
          Mapa ikusi
        </Link>

        <Link
          href="/juego/perfil"
          className="flex flex-col items-center gap-1.5 rounded-2xl py-4 font-black text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: 'rgba(241,168,5,0.12)',
            border: '1px solid rgba(241,168,5,0.25)',
            color: '#F2D6A1',
          }}
        >
          <span className="text-2xl">🎒</span>
          Nire Profila
        </Link>
      </div>

      {/* ── RECENT ENTRIES ── */}
      {recentEntries.length > 0 && (
        <div
          className="transition-all duration-700"
          style={{
            opacity: heroVisible ? 1 : 0,
            transitionDelay: '420ms',
          }}
        >
          <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: '#92ADA4' }}>
            Azken egunak
          </p>
          <div className="space-y-1.5">
            {recentEntries.map(entry => {
              const sc = entry.score;
              const barColor = sc >= 8 ? '#27ae60' : sc >= 5 ? '#F1A805' : '#e05040';
              return (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <span className="text-xs font-semibold w-20 flex-shrink-0" style={{ color: '#92ADA4' }}>
                    {entry.entry_date}
                  </span>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <div className="h-1.5 rounded-full" style={{ width: `${(sc / 10) * 100}%`, background: barColor }} />
                  </div>
                  <span className="text-xs font-black w-10 text-right" style={{ color: barColor }}>
                    {sc}/10
                  </span>
                  <span className="text-xs font-semibold w-12 text-right" style={{ color: '#92ADA4' }}>
                    +{entry.advance}
                  </span>
                  {entry.validated_by_teacher && (
                    <span className="text-[10px] font-bold" style={{ color: '#27ae60' }}>✓</span>
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
