'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { CHARACTERS } from '@/lib/characters';
import { CHECKPOINTS, type Checkpoint } from '@/lib/checkpoints';
import { getRewardForCheckpoint, type Reward } from '@/lib/rewards';
import { WEEKLY_SCHEDULE } from '@/lib/schedule';

type ClassData = { euskera: boolean; errespetua: boolean };

// Today's subjects from the hardcoded schedule (0=Sun,1=Mon…5=Fri)
const todayDow = new Date().getDay();
const TODAY_SUBJECTS: string[] = WEEKLY_SCHEDULE[todayDow] ?? [];

function batteryColor(score: number) {
  if (score >= 8) return '#27ae60';
  if (score >= 5) return '#F1A805';
  if (score >= 2) return '#e07830';
  return '#c03020';
}

/* ── Perfect score (10/10) celebration ──────────────────────── */
function PerfectScoreCelebration({
  advance,
  charImage,
  charColor,
  onClose,
}: {
  advance: number;
  charImage: string;
  charColor: string;
  onClose: () => void;
}) {
  const dots = Array.from({ length: 32 });
  const colors = ['#F1A805','#27ae60','#e74c3c','#2980b9','#d63384','#EDD5C0','#fff'];
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(10,5,2,0.88)', backdropFilter: 'blur(10px)' }}
    >
      {/* Confetti burst */}
      {dots.map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full animate-ping"
          style={{
            width:  5 + (i % 5) * 4,
            height: 5 + (i % 5) * 4,
            left:   `${4 + (i * 3.1) % 92}%`,
            top:    `${3 + (i * 4.7) % 50}%`,
            background: colors[i % colors.length],
            animationDelay: `${(i * 0.08).toFixed(2)}s`,
            animationDuration: `${0.7 + (i % 4) * 0.25}s`,
            opacity: 0.75,
          }}
        />
      ))}

      <div
        className="relative rounded-3xl p-8 max-w-xs w-full text-center shadow-2xl anim-pop"
        style={{
          background: `linear-gradient(160deg, #1a0e04, #0d0702)`,
          border: `2px solid ${charColor}55`,
          boxShadow: `0 0 60px ${charColor}44`,
        }}
      >
        {/* Stars row */}
        <div className="flex justify-center gap-1 mb-3">
          {[0,1,2].map(i => (
            <span
              key={i}
              className="text-3xl"
              style={{
                animation: `pop-in 0.4s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.12}s both`,
                display: 'inline-block',
              }}
            >⭐</span>
          ))}
        </div>

        {/* Character */}
        <div
          className="relative mx-auto mb-4 anim-float"
          style={{
            width: 100, height: 100,
            filter: `drop-shadow(0 0 20px ${charColor})`,
          }}
        >
          <Image src={charImage} alt="" fill className="object-contain" />
        </div>

        <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: charColor }}>
          Puntuazio perfektua!
        </p>
        <h2
          className="font-black mb-2 leading-none"
          style={{
            fontFamily: 'Rubik, var(--font-display), sans-serif',
            color: '#fff',
            fontSize: '2.4rem',
          }}
        >
          10/10
        </h2>
        <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.65)' }}>
          Egun guztian euskaraz eta errespetuz aritu zara. Itzela!
        </p>

        {/* Advance badge */}
        <div
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-6 font-black text-base"
          style={{
            background: `${charColor}22`,
            border: `1.5px solid ${charColor}55`,
            color: '#fff',
          }}
        >
          <span>🗺️</span>
          <span>+{advance} posizio aurrera!</span>
        </div>

        <button onClick={onClose} className="w-full py-3 rounded-2xl font-black text-base text-white transition-all hover:opacity-90"
          style={{ background: `linear-gradient(135deg, ${charColor}cc, ${charColor}88)` }}>
          Zoragarria! →
        </button>
      </div>
    </div>
  );
}

/* ── Checkpoint celebration overlay ─────────────────────────── */
function CheckpointCelebration({
  checkpoint,
  reward,
  onClose,
}: {
  checkpoint: Checkpoint;
  reward: Reward | null;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(20,10,4,0.82)', backdropFilter: 'blur(8px)' }}
    >
      {/* Confetti dots */}
      {[...Array(18)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full animate-ping"
          style={{
            width:  6 + (i % 4) * 3,
            height: 6 + (i % 4) * 3,
            left:   `${8 + (i * 5.2) % 84}%`,
            top:    `${5 + (i * 7.1) % 40}%`,
            background: ['#F1A805','#B3D9E0','#EDD5C0','#92ADA4','#84572F'][i % 5],
            animationDelay: `${(i * 0.12).toFixed(2)}s`,
            animationDuration: `${0.9 + (i % 3) * 0.3}s`,
            opacity: 0.7,
          }}
        />
      ))}

      <div
        className="relative rounded-3xl p-7 max-w-xs w-full text-center shadow-2xl"
        style={{
          background: 'linear-gradient(160deg,#faf3e8,#EDD5C0)',
          border: '1px solid rgba(132,87,47,0.25)',
        }}
      >
        {/* Location icon */}
        <div className="text-5xl mb-2">{checkpoint.icon}</div>

        <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: '#92ADA4' }}>
          Leku berria desblokeatu duzu!
        </p>
        <h2
          className="text-xl font-black mb-2 leading-tight"
          style={{ fontFamily: 'Rubik, var(--font-display), sans-serif', color: '#3d2510' }}
        >
          {checkpoint.name}
        </h2>
        <p className="text-sm leading-relaxed mb-4" style={{ color: '#6a4020' }}>
          {checkpoint.description}
        </p>

        {/* Tool reward */}
        {reward && (
          <div
            className="flex flex-col items-center gap-2 p-4 rounded-2xl mb-5"
            style={{ background: 'rgba(241,168,5,0.12)', border: '1px solid rgba(241,168,5,0.30)' }}
          >
            <div className="relative" style={{ width: 110, height: 110 }}>
              <Image
                src={reward.image}
                alt={reward.name}
                fill
                className="object-contain animate-bounce"
                style={{ filter: 'drop-shadow(0 4px 12px rgba(241,168,5,0.40))' }}
              />
            </div>
            <p className="font-black text-base" style={{ color: '#5a3218' }}>{reward.name}</p>
            <p className="text-xs font-semibold" style={{ color: '#84572F' }}>
              ¡Tresna berria lortu duzu!
            </p>
          </div>
        )}

        <button onClick={onClose} className="btn-bronze w-full text-base py-3">
          Aurrera! →
        </button>
      </div>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────── */
export default function RegistroPage() {
  const router = useRouter();
  const n = TODAY_SUBJECTS.length || 5;
  const [classes,      setClasses]     = useState<ClassData[]>(Array(n).fill(null).map(() => ({ euskera: false, errespetua: false })));
  const [charIdx,      setCharIdx]     = useState(0);
  const [currentPos,   setCurrentPos]  = useState(0);
  const [groupId,      setGroupId]     = useState<number | null>(null);
  const [loading,      setLoading]     = useState(false);
  const [error,        setError]       = useState('');
  const [celebration,   setCelebration]  = useState<{ checkpoint: Checkpoint; reward: Reward | null } | null>(null);
  const [perfectScore,  setPerfectScore] = useState<{ advance: number } | null>(null);
  const [alreadyDone,   setAlreadyDone]  = useState(false);
  const [todayScore,    setTodayScore]   = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      const s = await fetch('/api/session').then(r => r.json());
      if (!s.groupId) return;
      const gs = await fetch(`/api/groups?classroom_id=${s.classroomId}`).then(r => r.json());
      const g = gs.find((x: { id: number }) => x.id === s.groupId);
      if (g) {
        setCharIdx(g.character_index);
        setCurrentPos(parseFloat(g.position));
        setGroupId(g.id);
        // Check if already registered today
        const today = new Date().toISOString().split('T')[0];
        const entries = await fetch(`/api/entries?group_id=${g.id}`).then(r => r.json());
        const todayEntry = entries.find((e: { entry_date: string; score: number }) => e.entry_date === today);
        if (todayEntry) {
          setAlreadyDone(true);
          setTodayScore(todayEntry.score);
        }
      }
    }
    load();
  }, []);

  function toggleClass(idx: number, field: 'euskera' | 'errespetua') {
    setClasses(prev => prev.map((c, i) => i === idx ? { ...c, [field]: !c[field] } : c));
  }

  const trueCount  = classes.reduce((s, c) => s + (c.euskera ? 1 : 0) + (c.errespetua ? 1 : 0), 0);
  const maxPoints  = n * 2;
  const totalScore = Math.round((trueCount / maxPoints) * 10);
  const advance    = totalScore / 2;
  const pct        = (totalScore / 10) * 100;
  const bColor     = batteryColor(totalScore);
  const char       = CHARACTERS[charIdx] ?? CHARACTERS[0];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    const body: Record<string, boolean> = {};
    classes.forEach((c, i) => {
      body[`class_${i + 1}_euskera`]    = c.euskera;
      body[`class_${i + 1}_errespetua`] = c.errespetua;
    });
    try {
      const res = await fetch('/api/entries', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) { setError((await res.json()).error || 'Errorea'); return; }

      const data = await res.json();
      const prevPos = data.previousPosition ?? currentPos;
      const newPos  = data.newPosition  ?? (currentPos + advance);

      // Find first newly unlocked checkpoint
      const unlocked = CHECKPOINTS.find(
        cp => cp.requiredPos > 0 && cp.requiredPos > prevPos && cp.requiredPos <= newPos
      );
      if (unlocked) {
        const reward = groupId ? getRewardForCheckpoint(unlocked.id, groupId) : null;
        setCelebration({ checkpoint: unlocked, reward });
      } else if (data.score === 10) {
        setPerfectScore({ advance });
      } else {
        router.push('/juego');
      }
    } catch { setError('Konexio errorea'); }
    finally  { setLoading(false); }
  }

  return (
    <>
      {perfectScore && (
        <PerfectScoreCelebration
          advance={perfectScore.advance}
          charImage={char.image}
          charColor={char.color}
          onClose={() => { setPerfectScore(null); router.push('/juego'); }}
        />
      )}
      {celebration && (
        <CheckpointCelebration
          checkpoint={celebration.checkpoint}
          reward={celebration.reward}
          onClose={() => { setCelebration(null); router.push('/juego'); }}
        />
      )}

      <main className="min-h-screen p-4 md:p-6 max-w-lg mx-auto">
        <header className="flex items-center gap-3 mb-5">
          <Link href="/juego" className="text-xl opacity-60 hover:opacity-100" style={{ color: 'var(--saddle)' }}>←</Link>
          <h1 className="island-title text-xl">Gaur Erregistratu</h1>
        </header>

        {/* ── ALREADY REGISTERED ── */}
        {alreadyDone && (
          <div
            className="rounded-3xl p-8 text-center mb-5"
            style={{
              background: 'rgba(39,174,96,0.10)',
              border: '1.5px solid rgba(39,174,96,0.35)',
            }}
          >
            <div className="text-6xl mb-4">✅</div>
            <p className="font-black text-2xl mb-2" style={{ color: '#27ae60', fontFamily: 'Rubik, sans-serif' }}>
              Gaur dagoeneko erregistratuta zaude!
            </p>
            {todayScore !== null && (
              <p className="text-base font-bold mb-4" style={{ color: 'rgba(255,255,255,0.60)' }}>
                Puntua: {todayScore}/10
              </p>
            )}
            <Link
              href="/juego"
              className="inline-block px-6 py-3 rounded-2xl font-black text-base text-white"
              style={{ background: 'linear-gradient(135deg, rgba(39,174,96,0.80), rgba(39,174,96,0.50))' }}
            >
              Itzuli ←
            </Link>
          </div>
        )}

        {/* ── WEEKEND BLOCK ── */}
        {!alreadyDone && (todayDow === 0 || todayDow === 6) && (
          <div
            className="rounded-3xl p-8 text-center mb-5"
            style={{
              background: `linear-gradient(135deg, ${char.color}18, ${char.color}08)`,
              border: `1.5px solid ${char.color}30`,
            }}
          >
            <div className="text-6xl mb-4">🏖️</div>
            <p className="font-black text-2xl mb-2" style={{ color: '#fff', fontFamily: 'Rubik, sans-serif' }}>
              Asteburua da!
            </p>
            <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.60)' }}>
              Gaur ez dago erregistrorik. Atseden har ezazu eta astelehenean ikusiko gara!
            </p>
            <Link
              href="/juego"
              className="inline-block mt-5 px-6 py-3 rounded-2xl font-black text-base text-white"
              style={{ background: `linear-gradient(135deg, ${char.color}cc, ${char.color}88)` }}
            >
              Itzuli ←
            </Link>
          </div>
        )}


        {/* ── MAIN CONTENT (weekdays only, not already done) ── */}
        {!alreadyDone && todayDow !== 0 && todayDow !== 6 && (<>

        {/* ── CHARACTER + BATTERY ── */}
        <div
          className="rounded-2xl p-4 mb-5 flex items-center gap-4"
          style={{
            background: `linear-gradient(135deg, ${char.color}22, ${char.color}0a)`,
            border: `1px solid ${char.color}33`,
          }}
        >
          <div
            className="relative flex-shrink-0 transition-all duration-500"
            style={{
              width:  `${72 + totalScore * 5}px`,
              height: `${72 + totalScore * 5}px`,
              filter: totalScore >= 8
                ? `drop-shadow(0 0 12px ${char.color}bb)`
                : totalScore >= 5
                ? `drop-shadow(0 0 5px ${char.color}66)`
                : 'none',
            }}
          >
            <Image src={char.image} alt={char.name} fill className="object-contain" />
            {totalScore === 10 && (
              <div className="absolute -top-2 -right-2 text-xl animate-bounce">⭐</div>
            )}
          </div>

          <div className="flex-1">
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-xs font-bold uppercase tracking-wide" style={{ color: '#92ADA4' }}>Energia</span>
              <span key={totalScore} className="font-black text-lg anim-score-pop" style={{ color: bColor }}>{totalScore}/10</span>
            </div>

            {/* Battery bar */}
            <div className="relative rounded-lg overflow-hidden h-7"
              style={{ background: 'rgba(0,0,0,0.22)', border: '1px solid rgba(200,160,60,0.25)' }}>
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${pct}%`,
                  background: totalScore > 0
                    ? `linear-gradient(90deg, ${bColor}88, ${bColor} 40%, rgba(255,255,255,0.55) 55%, ${bColor} 70%, ${bColor}88)`
                    : `linear-gradient(90deg, ${bColor}88, ${bColor})`,
                  backgroundSize: totalScore > 0 ? '200% 100%' : '100% 100%',
                  animation: totalScore > 0 ? 'shimmer-bar 1.8s linear infinite' : 'none',
                }}
              />
              {[2,4,6,8].map(n => (
                <div key={n} className="absolute top-0 bottom-0 w-px"
                  style={{ left: `${n * 10}%`, background: 'rgba(255,255,255,0.18)' }} />
              ))}
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold"
                style={{ color: totalScore > 3 ? '#fff' : 'rgba(255,255,255,0.4)', textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>
                +{Number.isInteger(advance) ? advance : advance.toFixed(1)} pos.
              </span>
            </div>

            {/* Segment dots */}
            <div className="flex gap-0.5 mt-1.5">
              {Array.from({ length: 10 }).map((_, j) => (
                <div key={j} className="flex-1 h-1.5 rounded-full transition-all duration-200"
                  style={{ background: j < totalScore ? bColor : 'rgba(255,255,255,0.12)' }} />
              ))}
            </div>

            <p className="text-xs mt-1 opacity-55" style={{ color: 'var(--parchment)' }}>
              {totalScore === 10 ? '🎉 Perfektua!' : totalScore >= 7 ? '💪 Oso ondo!' : totalScore >= 4 ? '👍 Aurrera!' : '🌱 Hasi berri!'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-2.5">
          {TODAY_SUBJECTS.length === 0 ? (
            <p className="text-center py-8 text-sm font-bold opacity-60" style={{ color: 'var(--parchment)' }}>
              Gaur ez dago klaseen erregistrorik.
            </p>
          ) : TODAY_SUBJECTS.map((name, i) => (
            <div key={i} className="card-dark px-4 py-3 rounded-2xl">
              {/* Subject name */}
              <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: '#92ADA4' }}>
                {i + 1}. {name}
              </p>
              {/* Horizontal toggle row */}
              <div className="flex gap-2">
                {/* Euskera button */}
                <button
                  type="button"
                  onClick={() => toggleClass(i, 'euskera')}
                  className="flex-1 flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 transition-all active:scale-95"
                  style={{
                    borderColor: classes[i].euskera ? '#7edaaa' : 'rgba(146,173,164,0.20)',
                    background:  classes[i].euskera ? 'rgba(100,185,140,0.18)' : 'rgba(0,0,0,0.18)',
                  }}
                >
                  <span className="text-xl leading-none flex-shrink-0">{classes[i].euskera ? '🗣️' : '💬'}</span>
                  <span className="text-xs font-black leading-tight text-left flex-1"
                    style={{ color: classes[i].euskera ? '#7edaaa' : 'rgba(237,213,192,0.40)' }}>
                    Euskaraz hitz egin dut
                  </span>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: classes[i].euskera ? '#7edaaa' : 'rgba(255,255,255,0.08)',
                      border: classes[i].euskera ? 'none' : '1.5px solid rgba(255,255,255,0.15)',
                    }}>
                    {classes[i].euskera
                      ? <span className="text-xs font-black anim-bounce-in" style={{ color: '#0d2e1a' }}>✓</span>
                      : <span className="text-xs opacity-30" style={{ color: '#fff' }}>○</span>}
                  </div>
                </button>

                {/* Errespetua button */}
                <button
                  type="button"
                  onClick={() => toggleClass(i, 'errespetua')}
                  className="flex-1 flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 transition-all active:scale-95"
                  style={{
                    borderColor: classes[i].errespetua ? '#f5cc50' : 'rgba(146,173,164,0.20)',
                    background:  classes[i].errespetua ? 'rgba(241,168,5,0.14)' : 'rgba(0,0,0,0.18)',
                  }}
                >
                  <span className="text-xl leading-none flex-shrink-0">{classes[i].errespetua ? '🤝' : '👐'}</span>
                  <span className="text-xs font-black leading-tight text-left flex-1"
                    style={{ color: classes[i].errespetua ? '#f5cc50' : 'rgba(237,213,192,0.40)' }}>
                    Errespetuz jokatu dut
                  </span>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: classes[i].errespetua ? '#f5cc50' : 'rgba(255,255,255,0.08)',
                      border: classes[i].errespetua ? 'none' : '1.5px solid rgba(255,255,255,0.15)',
                    }}>
                    {classes[i].errespetua
                      ? <span className="text-xs font-black anim-bounce-in" style={{ color: '#3d2510' }}>✓</span>
                      : <span className="text-xs opacity-30" style={{ color: '#fff' }}>○</span>}
                  </div>
                </button>
              </div>
            </div>
          ))}

          {error && (
            <p className="text-sm text-center px-4 py-2.5 rounded-xl" style={{ background: 'rgba(180,40,20,0.12)', color: '#e05040', border: '1px solid rgba(180,40,20,0.20)' }}>
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className="btn-teal w-full text-base py-3.5 mt-1">
            {loading ? 'Gordetzen...' : '✅ Gorde eta aurrera!'}
          </button>
        </form>

        </>)}
      </main>
    </>
  );
}
