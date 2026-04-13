'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { CHARACTERS, CHARACTER_NAMES } from '@/lib/characters';
import { CHECKPOINTS } from '@/lib/checkpoints';
import { getGroupRewards } from '@/lib/rewards';
import { parseSchedule } from '@/lib/schedule';

type Group = {
  id: number;
  name: string | null;
  student_name: string | null;
  character_index: number;
  color: string;
  position: string;
  classroom_id: number;
  pending_message:      string | null;
  initial_reward_shown: boolean;
};

type DayEntry = {
  id: number;
  entry_date: string;
  score: number;
  advance: string;
  validated_by_teacher: boolean;
};

function hexToRgb(hex: string): [number, number, number] {
  return [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)];
}

function getNextCheckpoint(pos: number) {
  return CHECKPOINTS.find(cp => cp.requiredPos > pos) ?? null;
}
function getPrevCheckpoint(pos: number) {
  const passed = CHECKPOINTS.filter(cp => cp.requiredPos <= pos);
  return passed[passed.length - 1] ?? CHECKPOINTS[0];
}

/* ── Teacher message modal ───────────────────────────────────── */
function TeacherMessage({ message, charColor, onDismiss }: {
  message: string;
  charColor: string;
  onDismiss: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(8,4,1,0.82)', backdropFilter: 'blur(12px)' }}
    >
      <div
        className="relative rounded-3xl p-8 max-w-sm w-full shadow-2xl anim-pop"
        style={{
          background: 'linear-gradient(160deg,#1e1208,#110b04)',
          border: `1.5px solid ${charColor}44`,
          boxShadow: `0 8px 60px ${charColor}22`,
        }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-5"
          style={{ background: `${charColor}22`, border: `1.5px solid ${charColor}44` }}
        >
          📢
        </div>
        <p className="text-xs font-black uppercase tracking-widest text-center mb-2" style={{ color: charColor }}>
          Irakaslearen mezua
        </p>
        <p
          className="text-lg font-bold text-center leading-relaxed mb-7"
          style={{ color: '#fff' }}
        >
          {message}
        </p>
        <button
          onClick={onDismiss}
          className="w-full py-3 rounded-2xl font-black text-base text-white transition-all hover:opacity-90 active:scale-[0.98]"
          style={{ background: `linear-gradient(135deg, ${charColor}cc, ${charColor}88)` }}
        >
          Irakurri dut ✓
        </button>
      </div>
    </div>
  );
}

/* ── Welcome / initial reward modal ─────────────────────────── */
function WelcomeReward({ group, onDismiss }: {
  group: Group;
  onDismiss: () => void;
}) {
  const char   = CHARACTERS[group.character_index] ?? CHARACTERS[0];
  const reward = getGroupRewards(group.id)[0];
  const cp     = CHECKPOINTS[0];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(8,4,1,0.88)', backdropFilter: 'blur(12px)' }}>
      <div className="relative rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl anim-pop"
        style={{
          background: 'linear-gradient(160deg,#1e1208,#0d0702)',
          border: `1.5px solid ${char.color}44`,
          boxShadow: `0 8px 60px ${char.color}22`,
        }}>
        <div className="text-5xl mb-3">{cp.icon}</div>
        <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: char.color }}>
          Ongi etorri!
        </p>
        <h2 className="font-black text-xl mb-2" style={{ color: '#fff', fontFamily: 'Rubik, sans-serif' }}>
          {cp.name}
        </h2>
        <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.60)' }}>{cp.description}</p>
        {reward && (
          <div className="flex flex-col items-center gap-2 p-4 rounded-2xl mb-5"
            style={{ background: `${char.color}15`, border: `1px solid ${char.color}30` }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={reward.image}
              alt={reward.name}
              className="animate-bounce"
              style={{ width: 100, height: 100, objectFit: 'contain', filter: `drop-shadow(0 4px 12px ${char.color}66)` }}
            />
            <p className="font-black text-base" style={{ color: '#fff' }}>{reward.name}</p>
            <p className="text-xs font-semibold" style={{ color: char.color }}>Lehen tresna lortu duzu!</p>
          </div>
        )}
        <button onClick={onDismiss}
          className="w-full py-3 rounded-2xl font-black text-base text-white transition-all hover:opacity-90"
          style={{ background: `linear-gradient(135deg, ${char.color}cc, ${char.color}88)` }}>
          Aurrera! →
        </button>
      </div>
    </div>
  );
}

export default function JuegoPage() {
  const router = useRouter();
  const [group,          setGroup]          = useState<Group | null>(null);
  const [recentEntries,  setRecentEntries]  = useState<DayEntry[]>([]);
  const [todayEntry,     setTodayEntry]     = useState<DayEntry | null>(null);
  const [mapTotal,       setMapTotal]       = useState(50);
  const [members,        setMembers]        = useState<string[]>([]);
  const [todaySubjects,  setTodaySubjects]  = useState<string[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [ready,          setReady]          = useState(false);
  const [teacherMsg,     setTeacherMsg]     = useState<string | null>(null);
  const [showWelcome,    setShowWelcome]    = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/session');
        if (!res.ok) { router.push('/'); return; }
        const session = await res.json();

        const [groupsRes, classroomRes] = await Promise.all([
          fetch(`/api/groups?classroom_id=${session.classroomId}`),
          fetch('/api/classroom'),
        ]);
        const groups = await groupsRes.json();
        const myGroup: Group | undefined = groups.find((g: Group) => g.id === session.groupId);

        if (!myGroup || !myGroup.student_name) { router.push('/juego/setup'); return; }
        setGroup(myGroup);
        if (myGroup.pending_message) setTeacherMsg(myGroup.pending_message);
        if (!myGroup.initial_reward_shown) setShowWelcome(true);

        if (classroomRes.ok) {
          const { classroom: c } = await classroomRes.json();
          if (c?.map_total) setMapTotal(c.map_total);
          const schedule = parseSchedule(c?.weekly_schedule);
          const dow = new Date().getDay();
          setTodaySubjects(schedule[dow] ?? []);
        }

        const [entriesRes, membersRes] = await Promise.all([
          fetch(`/api/entries?group_id=${myGroup.id}`),
          fetch(`/api/groups/${myGroup.id}/members`),
        ]);
        const entries: DayEntry[] = await entriesRes.json();
        setRecentEntries(entries.slice(-5).reverse());
        const today = new Date().toISOString().split('T')[0];
        setTodayEntry(entries.find((e: DayEntry) => e.entry_date === today) ?? null);
        if (membersRes.ok) {
          const ms: { name: string }[] = await membersRes.json();
          setMembers(ms.map(m => m.name));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
        setTimeout(() => setReady(true), 60);
      }
    }
    load();
  }, [router]);

  async function dismissWelcome() {
    setShowWelcome(false);
    if (group) {
      await fetch(`/api/groups/${group.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initial_reward_shown: true }),
      });
    }
  }

  async function dismissMessage() {
    await fetch('/api/groups/message', { method: 'PATCH' });
    setTeacherMsg(null);
  }

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

  const char       = CHARACTERS[group.character_index] ?? CHARACTERS[0];
  const position   = parseFloat(group.position);
  const nextCp     = getNextCheckpoint(position);
  const prevCp     = getPrevCheckpoint(position);
  const segStart   = prevCp.requiredPos;
  const segEnd     = nextCp?.requiredPos ?? mapTotal;
  const segLen     = Math.max(segEnd - segStart, 1);
  const segPct     = Math.min(((position - segStart) / segLen) * 100, 100);
  const distLeft   = nextCp ? Math.max(0, nextCp.requiredPos - position) : 0;
  const finished   = position >= mapTotal;
  const overallPct = Math.min((position / mapTotal) * 100, 100);

  const [r, g, b]  = hexToRgb(group.color);
  const c1         = (a: number) => `rgba(${r},${g},${b},${a})`;
  const cardBg     = `rgba(${Math.round(r*0.10)},${Math.round(g*0.10)},${Math.round(b*0.10)},0.88)`;
  const cardBorder = c1(0.32);

  return (
    <>
      {/* Initial reward / welcome modal */}
      {showWelcome && !teacherMsg && (
        <WelcomeReward group={group} onDismiss={dismissWelcome} />
      )}

      {/* Teacher message modal */}
      {teacherMsg && (
        <TeacherMessage
          message={teacherMsg}
          charColor={group.color}
          onDismiss={dismissMessage}
        />
      )}

      <main
        className="min-h-screen px-6 py-5 flex flex-col gap-5"
        style={{
          maxWidth: 980,
          margin: '0 auto',
          background: `radial-gradient(ellipse 90% 55% at 50% -5%, ${c1(0.20)}, transparent 65%)`,
        }}
      >
        {/* ── TOP BAR ── */}
        <header className="flex items-center justify-between anim-slide-up">
          <h1
            className="font-black uppercase tracking-widest text-sm"
            style={{ color: c1(0.90), fontFamily: 'Rubik, sans-serif' }}
          >
            Euskararen Uhartea
          </h1>
          <button
            onClick={handleLogout}
            className="text-xs font-bold px-4 py-1.5 rounded-lg transition-all hover:opacity-100 opacity-60"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }}
          >
            🚪 Irten
          </button>
        </header>

        {/* ── MAIN CONTENT: 2-column on wide screens ── */}
        <div className="flex flex-col lg:flex-row gap-5 flex-1">

          {/* LEFT PANEL: hero card */}
          <div
            className="lg:w-72 xl:w-80 flex-shrink-0 relative rounded-3xl overflow-hidden flex flex-col items-center justify-center py-8 px-6 text-center"
            style={{
              background: `linear-gradient(175deg, ${c1(0.35)} 0%, ${c1(0.15)} 50%, rgba(8,4,1,0.75) 100%)`,
              border: `1.5px solid ${cardBorder}`,
              boxShadow: `0 8px 50px ${c1(0.20)}`,
              opacity: ready ? 1 : 0,
              transform: ready ? 'none' : 'translateY(18px)',
              transition: 'opacity 0.55s ease, transform 0.55s ease',
            }}
          >
            {/* Glow blob */}
            <div
              className="anim-glow absolute rounded-full pointer-events-none"
              style={{
                width: 220, height: 220,
                top: -40, left: '50%', transform: 'translateX(-50%)',
                background: group.color,
                filter: 'blur(70px)',
              }}
            />

            {/* Character */}
            <div
              className="anim-float relative z-10 mb-4"
              style={{
                width: 160, height: 160,
                filter: `drop-shadow(0 10px 30px ${c1(0.75)})`,
              }}
            >
              <Image src={char.image} alt={char.name} fill className="object-contain" />
            </div>

            <p className="z-10 text-xs font-black uppercase tracking-widest mb-1" style={{ color: c1(0.85) }}>
              {char.label} taldea
            </p>
            <h2
              className="z-10 font-black leading-tight mb-4"
              style={{
                color: '#fff',
                fontFamily: 'Rubik, var(--font-display), sans-serif',
                fontSize: 'clamp(1.3rem, 3vw, 1.8rem)',
                textShadow: `0 2px 16px ${c1(0.55)}`,
              }}
            >
              {group.student_name || group.name || CHARACTER_NAMES[group.character_index]}
            </h2>

            {/* Team members */}
            {members.length > 0 && (
              <div className="z-10 flex flex-wrap justify-center gap-1.5 mb-3 px-2">
                {members.map((m, i) => (
                  <span
                    key={i}
                    className="text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{ background: c1(0.20), color: 'rgba(255,255,255,0.85)', border: `1px solid ${c1(0.30)}` }}
                  >
                    {m}
                  </span>
                ))}
              </div>
            )}

            {/* Position badge */}
            <div
              className="z-10 px-5 py-2 rounded-full font-black text-base mb-4"
              style={{ background: c1(0.25), color: '#fff', border: `1px solid ${c1(0.45)}` }}
            >
              🗺️ {position} <span style={{ opacity: 0.5 }}>/ {mapTotal}</span>
            </div>

            {/* Overall bar */}
            <div className="z-10 w-full">
              <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.10)' }}>
                <div
                  className="h-2.5 rounded-full transition-all duration-700"
                  style={{
                    width: `${overallPct}%`,
                    background: `linear-gradient(90deg, ${c1(0.55)}, ${group.color})`,
                    boxShadow: `0 0 10px ${c1(0.6)}`,
                  }}
                />
              </div>
              <p className="text-[11px] font-semibold mt-1.5 text-center" style={{ color: 'rgba(255,255,255,0.40)' }}>
                {Math.round(overallPct)}% eginda
              </p>
            </div>
          </div>

          {/* RIGHT PANEL: all the action */}
          <div
            className="flex-1 flex flex-col gap-4"
            style={{
              opacity: ready ? 1 : 0,
              transform: ready ? 'none' : 'translateY(14px)',
              transition: 'opacity 0.55s ease 0.10s, transform 0.55s ease 0.10s',
            }}
          >
            {/* Next checkpoint */}
            {!finished && nextCp && (
              <div
                className="rounded-2xl p-5 flex flex-col gap-4"
                style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
              >
                <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: c1(0.65) }}>
                  Hurrengo helburua
                </p>
                <div className="flex items-center gap-4">
                  <div
                    className="text-3xl w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: c1(0.18), border: `1.5px solid ${c1(0.32)}` }}
                  >
                    {nextCp.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-lg leading-tight" style={{ color: '#fff' }}>
                      {nextCp.name}
                    </p>
                    <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.50)' }}>
                      {nextCp.description.slice(0, 70)}…
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right pl-2">
                    <p className="font-black leading-none" style={{ color: '#fff', fontSize: '2.4rem', textShadow: `0 0 20px ${c1(0.8)}` }}>
                      {distLeft}
                    </p>
                    <p className="text-xs font-bold" style={{ color: c1(0.75) }}>posizio</p>
                  </div>
                </div>

                {/* Segment progress bar */}
                <div>
                  <div className="w-full h-3 rounded-full overflow-hidden relative" style={{ background: 'rgba(255,255,255,0.07)' }}>
                    <div
                      className="h-3 rounded-full transition-all duration-700"
                      style={{ width: `${segPct}%`, background: `linear-gradient(90deg, ${c1(0.45)}, ${group.color})` }}
                    />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 transition-all duration-700"
                      style={{
                        left: `${Math.max(4, Math.min(segPct, 96))}%`,
                        background: '#fff', borderColor: group.color,
                        boxShadow: `0 0 12px ${c1(0.9)}`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] mt-1.5 font-bold" style={{ color: 'rgba(255,255,255,0.38)' }}>
                    <span>{prevCp.icon} {prevCp.name} ({prevCp.requiredPos})</span>
                    <span style={{ color: c1(0.75) }}>{Math.round(segPct)}% eginda</span>
                    <span>{nextCp.icon} {nextCp.name} ({nextCp.requiredPos})</span>
                  </div>
                </div>
              </div>
            )}

            {finished && (
              <div
                className="rounded-2xl p-6 text-center"
                style={{ background: 'rgba(39,174,96,0.10)', border: '1px solid rgba(39,174,96,0.28)' }}
              >
                <p className="text-3xl mb-2">🏆</p>
                <p className="font-black text-xl" style={{ color: '#27ae60' }}>Zorionak! Helmugaraino iritsi zara!</p>
              </div>
            )}

            {/* Today's subjects */}
            {todaySubjects.length > 0 && (
              <div
                className="flex items-center gap-2 flex-wrap px-4 py-2.5 rounded-2xl"
                style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
              >
                <span className="text-xs font-black uppercase tracking-widest shrink-0" style={{ color: c1(0.65) }}>
                  📅 Gaur:
                </span>
                {todaySubjects.map((s: string, i: number) => (
                  <span
                    key={i}
                    className="text-xs font-bold px-2.5 py-1 rounded-lg"
                    style={{ background: c1(0.15), color: 'rgba(237,213,192,0.85)', border: `1px solid ${c1(0.25)}` }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}

            {/* Today status */}
            {todayEntry ? (
              <div
                className="rounded-2xl p-5 flex items-center gap-5"
                style={{ background: 'rgba(39,174,96,0.10)', border: '1px solid rgba(39,174,96,0.28)' }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                  style={{ background: 'rgba(39,174,96,0.18)', border: '1px solid rgba(39,174,96,0.35)' }}
                >✅</div>
                <div className="flex-1">
                  <p className="font-black text-base" style={{ color: '#27ae60' }}>Gaur erregistratuta zaude!</p>
                  <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    {todayEntry.score}/10 puntu · +{todayEntry.advance} posizio
                    {todayEntry.validated_by_teacher && ' · ✓ Balioztatua'}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <div className="w-20 h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <div
                      className="h-2.5 rounded-full"
                      style={{
                        width: `${(todayEntry.score / 10) * 100}%`,
                        background: todayEntry.score >= 8 ? '#27ae60' : todayEntry.score >= 5 ? '#F1A805' : '#e05040',
                      }}
                    />
                  </div>
                  <p className="text-xs font-black text-center mt-1" style={{ color: '#fff' }}>{todayEntry.score}/10</p>
                </div>
              </div>
            ) : (
              <Link
                href="/juego/registro"
                className="rounded-2xl p-5 flex items-center justify-between transition-all hover:scale-[1.02] active:scale-[0.98] anim-action-pulse"
                style={{
                  background: `linear-gradient(135deg, ${c1(0.50)}, ${c1(0.28)})`,
                  border: `1.5px solid ${c1(0.55)}`,
                  boxShadow: `0 4px 30px ${c1(0.22)}`,
                }}
              >
                <div className="flex items-center gap-4">
                  <span className="text-4xl">✏️</span>
                  <div>
                    <p className="font-black text-lg" style={{ color: '#fff' }}>Gaur erregistratu</p>
                    <p className="text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>Eguneko txartela bete</p>
                  </div>
                </div>
                <span className="text-3xl opacity-70">→</span>
              </Link>
            )}

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/juego/mapa"
                className="flex items-center gap-3 rounded-2xl px-5 py-4 font-black text-base transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: cardBg, border: `1px solid ${cardBorder}`, color: '#fff' }}
              >
                <span className="text-2xl">🗺️</span> Mapa ikusi
              </Link>
              <Link
                href="/juego/perfil"
                className="flex items-center gap-3 rounded-2xl px-5 py-4 font-black text-base transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: cardBg, border: `1px solid ${cardBorder}`, color: '#fff' }}
              >
                <span className="text-2xl">🎒</span> Nire Profila
              </Link>
            </div>

            {/* Recent entries */}
            {recentEntries.length > 0 && (
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest mb-2" style={{ color: c1(0.60) }}>
                  Azken egunak
                </p>
                <div className="flex flex-col gap-1.5">
                  {recentEntries.map(entry => {
                    const sc = entry.score;
                    const barColor = sc >= 8 ? '#27ae60' : sc >= 5 ? '#F1A805' : '#e05040';
                    return (
                      <div key={entry.id} className="flex items-center gap-4 px-4 py-3 rounded-xl"
                        style={{ background: cardBg, border: `1px solid ${c1(0.12)}` }}>
                        <span className="text-sm font-semibold w-24 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.50)' }}>
                          {entry.entry_date}
                        </span>
                        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                          <div className="h-2 rounded-full" style={{ width: `${(sc/10)*100}%`, background: barColor }} />
                        </div>
                        <span className="text-sm font-black w-10 text-right flex-shrink-0" style={{ color: '#fff' }}>{sc}/10</span>
                        <span className="text-xs font-semibold w-12 text-right flex-shrink-0" style={{ color: 'rgba(255,255,255,0.45)' }}>
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

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full rounded-xl py-2.5 text-sm font-bold transition-all hover:opacity-80"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.38)' }}
            >
              🚪 Saioa itxi
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
