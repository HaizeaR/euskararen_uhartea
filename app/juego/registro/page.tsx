'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { CHARACTERS } from '@/lib/characters';
import { CHECKPOINTS, type Checkpoint } from '@/lib/checkpoints';
import { getRewardForCheckpoint, type Reward } from '@/lib/rewards';

type ClassData = { euskera: boolean; errespetua: boolean };

const DEFAULT_CLASS_NAMES = [
  'Matematika',
  'Hizkuntza',
  'Natur Zientziak',
  'Gizarte Zientziak',
  'Gorputz Hezkuntza',
];

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
  const [classes,     setClasses]     = useState<ClassData[]>(Array(5).fill(null).map(() => ({ euskera: false, errespetua: false })));
  const [charIdx,     setCharIdx]     = useState(0);
  const [currentPos,  setCurrentPos]  = useState(0);
  const [classNames,  setClassNames]  = useState<string[]>(DEFAULT_CLASS_NAMES);
  const [groupId,     setGroupId]     = useState<number | null>(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [celebration,  setCelebration]  = useState<{ checkpoint: Checkpoint; reward: Reward | null } | null>(null);
  const [perfectScore, setPerfectScore] = useState<{ advance: number } | null>(null);

  useEffect(() => {
    fetch('/api/session').then(r => r.json()).then(s => {
      if (s.groupId) {
        Promise.all([
          fetch(`/api/groups?classroom_id=${s.classroomId}`).then(r => r.json()),
          fetch('/api/teacher/classrooms').then(r => r.ok ? r.json() : null),
        ]).then(([gs, classroomData]) => {
          const g = gs.find((x: { id: number }) => x.id === s.groupId);
          if (g) {
            setCharIdx(g.character_index);
            setCurrentPos(parseFloat(g.position));
            setGroupId(g.id);
          }
          if (classroomData?.classroom?.class_names) {
            try { setClassNames(JSON.parse(classroomData.classroom.class_names)); } catch {}
          }
        });
      }
    });
  }, []);

  function toggleClass(idx: number, field: 'euskera' | 'errespetua') {
    setClasses(prev => prev.map((c, i) => i === idx ? { ...c, [field]: !c[field] } : c));
  }

  const totalScore = classes.reduce((s, c) => s + (c.euskera ? 1 : 0) + (c.errespetua ? 1 : 0), 0);
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
              <span className="font-black text-lg" style={{ color: bColor }}>{totalScore}/10</span>
            </div>

            {/* Battery bar */}
            <div className="relative rounded-lg overflow-hidden h-7"
              style={{ background: 'rgba(0,0,0,0.22)', border: '1px solid rgba(200,160,60,0.25)' }}>
              <div
                className="h-full transition-all duration-300"
                style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${bColor}88, ${bColor})` }}
              />
              {[2,4,6,8].map(n => (
                <div key={n} className="absolute top-0 bottom-0 w-px"
                  style={{ left: `${n * 10}%`, background: 'rgba(255,255,255,0.18)' }} />
              ))}
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold"
                style={{ color: totalScore > 3 ? '#fff' : 'rgba(255,255,255,0.4)', textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>
                +{advance} pos.
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
          {classNames.map((name, i) => (
            <div key={i} className="card-dark px-4 py-3 rounded-2xl">
              <p className="text-xs font-bold uppercase tracking-widest mb-2.5" style={{ color: '#92ADA4' }}>
                {i + 1}. {name}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => toggleClass(i, 'euskera')}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border transition-all text-left"
                  style={{
                    borderColor: classes[i].euskera ? 'rgba(100,185,140,0.60)' : 'rgba(146,173,164,0.18)',
                    background:  classes[i].euskera ? 'rgba(100,185,140,0.12)' : 'rgba(0,0,0,0.15)',
                    color:       classes[i].euskera ? '#7edaaa' : 'rgba(237,213,192,0.45)',
                  }}
                >
                  <span className="text-base">🗣️</span>
                  <span className="text-xs font-semibold leading-tight flex-1">Euskaraz aritu naiz</span>
                  {classes[i].euskera && <span style={{ color: '#7edaaa', fontSize: 11 }}>✓</span>}
                </button>

                <button
                  type="button"
                  onClick={() => toggleClass(i, 'errespetua')}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border transition-all text-left"
                  style={{
                    borderColor: classes[i].errespetua ? 'rgba(241,168,5,0.50)' : 'rgba(146,173,164,0.18)',
                    background:  classes[i].errespetua ? 'rgba(241,168,5,0.10)' : 'rgba(0,0,0,0.15)',
                    color:       classes[i].errespetua ? '#f5cc50' : 'rgba(237,213,192,0.45)',
                  }}
                >
                  <span className="text-base">🤝</span>
                  <span className="text-xs font-semibold leading-tight flex-1">Errespetatua naiz</span>
                  {classes[i].errespetua && <span style={{ color: '#f5cc50', fontSize: 11 }}>✓</span>}
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
      </main>
    </>
  );
}
