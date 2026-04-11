'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

/* ── Island SVG Logo with curved text ─────────────────────────── */
function IslandLogo() {
  return (
    <svg
      viewBox="0 0 520 520"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      aria-label="Euskararen Uhartea"
    >
      <defs>
        {/* Curved text path — arc over the island */}
        <path
          id="titleArc"
          d="M 68,220 A 210,210 0 0,1 452,220"
          fill="none"
        />
        {/* Water radial gradient */}
        <radialGradient id="waterGrad" cx="50%" cy="55%" r="55%">
          <stop offset="0%"   stopColor="#c8eef4" />
          <stop offset="55%"  stopColor="#B3D9E0" />
          <stop offset="100%" stopColor="#92ADA4" />
        </radialGradient>
        {/* Island gradient */}
        <radialGradient id="islandGrad" cx="45%" cy="45%" r="60%">
          <stop offset="0%"   stopColor="#a8c87a" />
          <stop offset="60%"  stopColor="#7ea860" />
          <stop offset="100%" stopColor="#6a9050" />
        </radialGradient>
        {/* Drop shadow filter */}
        <filter id="shadow" x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="4" dy="8" stdDeviation="10" floodColor="#3d5a38" floodOpacity="0.35"/>
        </filter>
        <filter id="textShadow" x="-10%" y="-30%" width="120%" height="160%">
          <feDropShadow dx="2" dy="3" stdDeviation="3" floodColor="#5a3218" floodOpacity="0.70"/>
        </filter>
      </defs>

      {/* ── Outer water blob ── */}
      <ellipse cx="260" cy="290" rx="220" ry="195" fill="url(#waterGrad)" filter="url(#shadow)" />

      {/* ── Inner water shallows (lighter ring) ── */}
      <ellipse cx="260" cy="290" rx="185" ry="163" fill="#cceef6" opacity="0.55" />

      {/* ── Island main body ── */}
      <path
        d="M 155,230 C 130,200 140,160 175,145 C 210,130 240,150 270,140
           C 300,130 345,118 370,138 C 395,158 390,195 385,220
           C 395,245 400,275 390,305 C 378,340 350,360 318,365
           C 295,368 278,350 258,355 C 235,360 210,370 190,355
           C 165,338 148,308 150,278 C 148,260 158,248 155,230 Z"
        fill="url(#islandGrad)"
      />

      {/* ── Sandy beaches ── */}
      <path
        d="M 165,285 C 158,310 168,338 190,348 C 178,325 175,300 185,280 Z"
        fill="#F2D6A1" opacity="0.85"
      />
      <path
        d="M 330,345 C 350,342 372,328 382,305 C 365,320 345,335 325,335 Z"
        fill="#F2D6A1" opacity="0.85"
      />
      <path
        d="M 258,138 C 240,133 218,140 205,148 C 220,143 245,140 262,145 Z"
        fill="#EDD5C0" opacity="0.80"
      />

      {/* ── Dirt / earth patches ── */}
      <ellipse cx="196" cy="300" rx="22" ry="14" fill="#84572F" opacity="0.45" />
      <ellipse cx="355" cy="252" rx="18" ry="11" fill="#84572F" opacity="0.35" />
      <ellipse cx="300" cy="330" rx="15" ry="10" fill="#a06840" opacity="0.40" />

      {/* ── Trees (circles of varying sizes) ── */}
      {[
        [218, 175, 14], [245, 162, 11], [272, 170, 13], [300, 158, 10],
        [330, 170, 12], [355, 185, 10], [370, 210, 11], [360, 240, 13],
        [345, 270, 11], [310, 295, 10], [275, 300, 12], [240, 295, 11],
        [210, 275, 13], [195, 248, 11], [230, 240, 10], [265, 235, 12],
        [295, 230, 10], [325, 225, 11], [350, 195, 9],  [200, 225, 9],
      ].map(([cx, cy, r], i) => (
        <circle key={i} cx={cx} cy={cy} r={r}
          fill={i % 3 === 0 ? '#4e8040' : i % 3 === 1 ? '#6aa050' : '#3a6030'}
          opacity="0.90"
        />
      ))}

      {/* ── Tiny highlight dots on trees ── */}
      {[
        [220, 171], [248, 158], [274, 166], [332, 166], [357, 181],
        [362, 237], [312, 291], [267, 231],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="3" fill="#8ecc60" opacity="0.60" />
      ))}

      {/* ── Sandy paths on island ── */}
      <path d="M 260,145 Q 272,200 280,250 Q 290,290 305,325"
        stroke="#EDD5C0" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.70"/>
      <path d="M 260,145 Q 235,190 225,240 Q 215,270 200,295"
        stroke="#EDD5C0" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.60"/>

      {/* ── Small buildings cluster ── */}
      <rect x="298" y="305" width="10" height="10" rx="2" fill="#e8805a" opacity="0.85"/>
      <rect x="312" y="308" width="9" height="9"  rx="2" fill="#F1A805" opacity="0.75"/>
      <rect x="325" y="303" width="8" height="10" rx="2" fill="#e8805a" opacity="0.80"/>

      {/* ── Curved title text ── */}
      <text
        filter="url(#textShadow)"
        style={{ fontFamily: 'Rubik, var(--font-display), sans-serif', fontWeight: 900 }}
      >
        <textPath
          href="#titleArc"
          textAnchor="middle"
          startOffset="50%"
          fontSize="44"
          letterSpacing="3"
          fill="#F1A805"
        >
          EUSKARAREN UHARTEA
        </textPath>
      </text>
    </svg>
  );
}

/* ── Page ─────────────────────────────────────────────────────────── */
export default function HomePage() {
  const router = useRouter();
  const [code,    setCode]    = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/student-login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ code: code.trim().toUpperCase() }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Kode okerra');
        return;
      }
      const data = await res.json();
      router.push(data.needsSetup ? '/juego/setup' : '/juego');
    } catch {
      setError('Konexio errorea');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8"
      style={{ gap: 0 }}
    >
      {/* ── Island Logo ── */}
      <div className="w-full max-w-md" style={{ maxWidth: 420 }}>
        <IslandLogo />
      </div>

      {/* ── Tagline ── */}
      <p
        className="text-center font-bold tracking-widest uppercase text-sm mb-8 -mt-2"
        style={{ color: '#4a7068', letterSpacing: '0.18em' }}
      >
        Joko Hezigarria
      </p>

      {/* ── Login card ── */}
      <div className="card-parchment p-7 w-full max-w-sm shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="text-center">
            <h2
              className="text-xl font-black mb-1"
              style={{ fontFamily: 'Rubik, var(--font-display), sans-serif', color: '#5a3218' }}
            >
              Hasi Jolasa
            </h2>
            <p className="text-sm" style={{ color: '#84572F' }}>
              Irakasleak emandako talde-kodea idatzi
            </p>
          </div>

          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="EKP001"
            maxLength={8}
            autoFocus
            className="w-full text-center text-3xl font-black tracking-widest rounded-2xl p-4 uppercase focus:outline-none transition-all"
            style={{
              border:      '3px solid #84572F',
              background:  'rgba(255,255,255,0.65)',
              color:       '#3d2510',
              fontFamily:  'Rubik, var(--font-display), sans-serif',
            }}
          />

          {error && (
            <p className="text-center text-sm font-bold" style={{ color: '#b83020' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || code.length < 4}
            className="btn-bronze w-full text-lg"
          >
            {loading ? 'Bilatzen...' : 'Sartu →'}
          </button>
        </form>
      </div>

      {/* ── Teacher link ── */}
      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="text-sm font-semibold underline underline-offset-4 opacity-65 hover:opacity-100 transition-opacity"
          style={{ color: '#4a7068' }}
        >
          Irakaslearen sarbidea
        </Link>
      </div>
    </main>
  );
}
