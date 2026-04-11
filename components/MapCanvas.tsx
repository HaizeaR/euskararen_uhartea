'use client';

import { useEffect, useRef } from 'react';
import { CHARACTER_NAMES, CHARACTER_IMAGES } from '@/lib/characters';

type Group = {
  id: number;
  name: string | null;
  student_name?: string | null;
  character_index: number;
  color: string;
  position: string;
};

type Props = {
  groups: Group[];
  mapTotal?: number;
  highlightGroupId?: number;
};

const WAYPOINTS = [
  { x: 0.10, y: 0.82 }, // HASIERA — beach
  { x: 0.20, y: 0.72 },
  { x: 0.17, y: 0.60 },
  { x: 0.28, y: 0.50 },
  { x: 0.38, y: 0.43 },
  { x: 0.33, y: 0.33 },
  { x: 0.44, y: 0.26 },
  { x: 0.56, y: 0.30 },
  { x: 0.66, y: 0.24 },
  { x: 0.74, y: 0.33 },
  { x: 0.82, y: 0.26 },
  { x: 0.90, y: 0.18 }, // META — mountain peak
];

function getPositionOnPath(position: number, total: number) {
  const progress = Math.min(position / total, 1);
  const segCount = WAYPOINTS.length - 1;
  const seg = progress * segCount;
  const idx = Math.min(Math.floor(seg), segCount - 1);
  const t = seg - idx;
  const p1 = WAYPOINTS[idx], p2 = WAYPOINTS[idx + 1];
  return { x: p1.x + (p2.x - p1.x) * t, y: p1.y + (p2.y - p1.y) * t };
}

/** Tropical palm-style tree */
function drawPalm(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  // Trunk — slightly curved
  ctx.save();
  ctx.strokeStyle = '#7a5230';
  ctx.lineWidth = s * 0.22;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y + s);
  ctx.quadraticCurveTo(x + s * 0.25, y + s * 0.4, x + s * 0.1, y);
  ctx.stroke();

  // Fronds
  const fronds = [
    { dx: -s * 1.1, dy: -s * 0.5, cx: -s * 0.5, cy: -s * 0.7 },
    { dx:  s * 1.1, dy: -s * 0.4, cx:  s * 0.5, cy: -s * 0.7 },
    { dx: -s * 0.6, dy: -s * 1.0, cx: -s * 0.2, cy: -s * 0.9 },
    { dx:  s * 0.6, dy: -s * 1.0, cx:  s * 0.2, cy: -s * 0.9 },
    { dx:  s * 0.0, dy: -s * 1.1, cx:  s * 0.1, cy: -s * 1.0 },
  ];
  fronds.forEach(f => {
    ctx.beginPath();
    ctx.moveTo(x + s * 0.1, y);
    ctx.quadraticCurveTo(x + s * 0.1 + f.cx, y + f.cy, x + s * 0.1 + f.dx, y + f.dy);
    ctx.strokeStyle = '#2d8040';
    ctx.lineWidth = s * 0.14;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.strokeStyle = '#3aa050';
    ctx.lineWidth = s * 0.06;
    ctx.stroke();
  });
  ctx.restore();
}

/** Dense jungle bush cluster */
function drawBush(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  const shades = ['#1e6a2a', '#2a8038', '#226030', '#338844'];
  for (let i = 0; i < 5; i++) {
    const ox = (Math.sin(i * 1.7) * r * 0.6);
    const oy = (Math.cos(i * 2.1) * r * 0.4);
    const cr = r * (0.55 + Math.sin(i * 0.9) * 0.25);
    ctx.beginPath();
    ctx.arc(x + ox, y + oy, cr, 0, Math.PI * 2);
    ctx.fillStyle = shades[i % shades.length];
    ctx.fill();
  }
  // Highlight on top bush
  ctx.beginPath();
  ctx.arc(x - r * 0.2, y - r * 0.35, r * 0.25, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(100,200,80,0.25)';
  ctx.fill();
}

/** Rocky formation */
function drawRock(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.save();
  // Shadow
  ctx.beginPath();
  ctx.ellipse(x + w * 0.08, y + h * 0.08, w * 0.52, h * 0.38, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.fill();
  // Rock body
  ctx.beginPath();
  ctx.moveTo(x - w * 0.5, y + h * 0.4);
  ctx.quadraticCurveTo(x - w * 0.55, y - h * 0.1, x - w * 0.15, y - h * 0.45);
  ctx.quadraticCurveTo(x + w * 0.1,  y - h * 0.55, x + w * 0.45, y - h * 0.3);
  ctx.quadraticCurveTo(x + w * 0.58, y + h * 0.1,  x + w * 0.5,  y + h * 0.4);
  ctx.closePath();
  const rg = ctx.createLinearGradient(x - w * 0.5, y - h * 0.5, x + w * 0.5, y + h * 0.4);
  rg.addColorStop(0,   '#9ecfb8');
  rg.addColorStop(0.4, '#6aad98');
  rg.addColorStop(1,   '#3d7060');
  ctx.fillStyle = rg;
  ctx.fill();
  ctx.strokeStyle = 'rgba(30,70,55,0.50)';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  // Highlight
  ctx.beginPath();
  ctx.moveTo(x - w * 0.12, y - h * 0.42);
  ctx.quadraticCurveTo(x + w * 0.05, y - h * 0.55, x + w * 0.38, y - h * 0.28);
  ctx.strokeStyle = 'rgba(200,240,225,0.55)';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.restore();
}

export default function MapCanvas({ groups, mapTotal = 50, highlightGroupId }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Preload character images
    const charImgs: HTMLImageElement[] = CHARACTER_IMAGES.map(src => {
      const img = new window.Image();
      img.src = src;
      return img;
    });
    const allLoaded = Promise.all(
      charImgs.map(img => img.complete ? Promise.resolve() : new Promise(r => { img.onload = r; img.onerror = r; }))
    );
    allLoaded.then(() => drawMap(ctx, canvas, charImgs, groups, mapTotal, highlightGroupId));
    drawMap(ctx, canvas, charImgs, groups, mapTotal, highlightGroupId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups, mapTotal, highlightGroupId]);

  return (
    <canvas
      ref={canvasRef}
      width={700}
      height={480}
      className="w-full h-auto rounded-2xl shadow-2xl"
      style={{
        maxHeight: '65vh',
        border: '3px solid rgba(160,110,30,0.65)',
        boxShadow: '0 10px 48px rgba(20,10,5,0.65), 0 0 0 1px rgba(220,170,50,0.22)',
      }}
    />
  );
}

function drawMap(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  charImgs: HTMLImageElement[],
  groups: Group[],
  mapTotal: number,
  highlightGroupId: number | undefined,
) {

    const W = canvas.width;
    const H = canvas.height;

    // ── 1. TEAL OCEAN ─────────────────────────────────
    const oceanGrad = ctx.createLinearGradient(0, 0, W * 0.6, H);
    oceanGrad.addColorStop(0,   '#8adbd0');
    oceanGrad.addColorStop(0.35,'#4ab8aa');
    oceanGrad.addColorStop(0.65,'#2a9090');
    oceanGrad.addColorStop(1,   '#1a6a70');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, W, H);

    // Water sparkles / ripples
    ctx.save();
    ctx.globalAlpha = 0.18;
    for (let j = 0; j < 40; j++) {
      const wx = (j * 173) % W;
      const wy = (j * 97 + j * j * 3) % H;
      ctx.beginPath();
      ctx.ellipse(wx, wy, 18, 4, Math.sin(j) * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = '#e0f8f5';
      ctx.fill();
    }
    ctx.restore();

    // ── 2. ISLAND SANDY BASE ──────────────────────────
    const cx = W * 0.48, cy = H * 0.52;

    // Drop shadow
    ctx.save();
    ctx.shadowColor = 'rgba(10,60,50,0.55)';
    ctx.shadowBlur  = 40;
    ctx.beginPath();
    ctx.ellipse(cx + 12, cy + 10, W * 0.445, H * 0.445, -0.06, 0, Math.PI * 2);
    ctx.fillStyle = '#1a6055';
    ctx.fill();
    ctx.restore();

    // Sandy island body
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy, W * 0.440, H * 0.440, -0.06, 0, Math.PI * 2);
    const islandGrad = ctx.createRadialGradient(cx - W * 0.08, cy - H * 0.12, H * 0.03, cx, cy, W * 0.44);
    islandGrad.addColorStop(0,    '#f0d888');
    islandGrad.addColorStop(0.25, '#e8c870');
    islandGrad.addColorStop(0.50, '#d4a850');
    islandGrad.addColorStop(0.70, '#3a8c48');
    islandGrad.addColorStop(0.85, '#286038');
    islandGrad.addColorStop(0.94, '#d4a850');
    islandGrad.addColorStop(1,    '#e8c870');
    ctx.fillStyle = islandGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(20,80,55,0.70)';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    // ── 3. INTERIOR JUNGLE ZONES ──────────────────────
    const jungles = [
      { x: W*0.30, y: H*0.44, rx: W*0.12, ry: H*0.11 },
      { x: W*0.48, y: H*0.58, rx: W*0.11, ry: H*0.09 },
      { x: W*0.60, y: H*0.50, rx: W*0.09, ry: H*0.10 },
      { x: W*0.40, y: H*0.65, rx: W*0.10, ry: H*0.08 },
      { x: W*0.22, y: H*0.55, rx: W*0.08, ry: H*0.08 },
    ];
    jungles.forEach(f => {
      ctx.save();
      const fg = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, Math.max(f.rx, f.ry));
      fg.addColorStop(0, 'rgba(20, 90, 30, 0.62)');
      fg.addColorStop(1, 'rgba(14, 60, 20, 0.18)');
      ctx.beginPath();
      ctx.ellipse(f.x, f.y, f.rx, f.ry, 0, 0, Math.PI * 2);
      ctx.fillStyle = fg;
      ctx.fill();
      ctx.restore();
    });

    // ── 4. ROCKS (teal-green like reference) ──────────
    drawRock(ctx, W*0.16, H*0.45, W*0.062, H*0.055);
    drawRock(ctx, W*0.68, H*0.60, W*0.055, H*0.048);
    drawRock(ctx, W*0.55, H*0.72, W*0.048, H*0.042);
    drawRock(ctx, W*0.44, H*0.38, W*0.040, H*0.036);

    // ── 5. JUNGLE BUSHES ──────────────────────────────
    const bushes = [
      [W*0.25, H*0.52], [W*0.33, H*0.42], [W*0.44, H*0.60],
      [W*0.53, H*0.53], [W*0.62, H*0.47], [W*0.58, H*0.65],
      [W*0.38, H*0.67], [W*0.27, H*0.60], [W*0.20, H*0.48],
      [W*0.48, H*0.43], [W*0.70, H*0.55],
    ];
    bushes.forEach(([bx, by]) => drawBush(ctx, bx, by, H * 0.036));

    // ── 6. PALM TREES ─────────────────────────────────
    const palms = [
      [W*0.12, H*0.75], [W*0.18, H*0.65], [W*0.23, H*0.56],
      [W*0.36, H*0.46], [W*0.50, H*0.64], [W*0.64, H*0.58],
      [W*0.46, H*0.72], [W*0.30, H*0.62], [W*0.58, H*0.44],
    ];
    palms.forEach(([px, py]) => drawPalm(ctx, px, py, H * 0.050));

    // ── 7. HIGHLAND / SAVANNA ─────────────────────────
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(W * 0.74, H * 0.34, W * 0.14, H * 0.12, 0.15, 0, Math.PI * 2);
    const hg = ctx.createRadialGradient(W*0.74, H*0.34, 0, W*0.74, H*0.34, W*0.14);
    hg.addColorStop(0, 'rgba(200,165,80,0.70)');
    hg.addColorStop(1, 'rgba(160,120,55,0.20)');
    ctx.fillStyle = hg;
    ctx.fill();
    ctx.restore();

    // ── 8. MOUNTAIN ───────────────────────────────────
    const mx = W * 0.890, my = H * 0.210;

    // Mountain shadow
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(mx + W*0.015, my - H*0.120 + H*0.020);
    ctx.lineTo(mx - W*0.090 + W*0.015, my + H*0.095 + H*0.020);
    ctx.lineTo(mx + W*0.082 + W*0.015, my + H*0.095 + H*0.020);
    ctx.closePath();
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fill();
    ctx.restore();

    // Mountain body
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(mx,           my - H*0.130);
    ctx.lineTo(mx - W*0.090, my + H*0.095);
    ctx.lineTo(mx + W*0.082, my + H*0.095);
    ctx.closePath();
    const mg = ctx.createLinearGradient(mx - W*0.090, my + H*0.095, mx + W*0.082, my - H*0.130);
    mg.addColorStop(0,   '#6e4a2a');
    mg.addColorStop(0.5, '#9a7050');
    mg.addColorStop(1,   '#c4a060');
    ctx.fillStyle = mg;
    ctx.fill();
    ctx.strokeStyle = 'rgba(50,28,10,0.70)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // Snow cap
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(mx,             my - H*0.130);
    ctx.lineTo(mx - W*0.028,   my - H*0.058);
    ctx.lineTo(mx + W*0.026,   my - H*0.058);
    ctx.closePath();
    ctx.fillStyle = '#f8f0e0';
    ctx.fill();
    // Highlight streak
    ctx.beginPath();
    ctx.moveTo(mx,             my - H*0.130);
    ctx.lineTo(mx - W*0.010,   my - H*0.082);
    ctx.lineTo(mx + W*0.007,   my - H*0.082);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,255,255,0.60)';
    ctx.fill();
    ctx.restore();

    // ── 9. BEACH ZONE ─────────────────────────────────
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(W*0.10, H*0.85, W*0.105, H*0.070, 0.2, 0, Math.PI * 2);
    const sg = ctx.createRadialGradient(W*0.08, H*0.82, 0, W*0.10, H*0.85, W*0.11);
    sg.addColorStop(0,   '#f8e898');
    sg.addColorStop(0.5, '#e8cc6a');
    sg.addColorStop(1,   '#c8a038');
    ctx.fillStyle = sg;
    ctx.fill();
    ctx.strokeStyle = 'rgba(180,140,40,0.40)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    // ── 10. DASHED TREASURE-MAP PATH ──────────────────
    // Glow halo
    ctx.save();
    ctx.strokeStyle = 'rgba(220,170,50,0.22)';
    ctx.lineWidth = 14;
    ctx.lineCap  = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    WAYPOINTS.forEach((wp, i) => {
      if (i === 0) ctx.moveTo(wp.x*W, wp.y*H);
      else ctx.lineTo(wp.x*W, wp.y*H);
    });
    ctx.stroke();
    ctx.restore();

    // Dashed line — warm brown like hand-drawn ink
    ctx.save();
    ctx.strokeStyle = '#a06828';
    ctx.lineWidth   = 3;
    ctx.setLineDash([10, 7]);
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    ctx.shadowColor = 'rgba(240,190,60,0.40)';
    ctx.shadowBlur  = 6;
    ctx.beginPath();
    WAYPOINTS.forEach((wp, i) => {
      if (i === 0) ctx.moveTo(wp.x*W, wp.y*H);
      else ctx.lineTo(wp.x*W, wp.y*H);
    });
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Dot markers
    WAYPOINTS.forEach((wp, i) => {
      if (i === 0 || i === WAYPOINTS.length - 1) return;
      ctx.beginPath();
      ctx.arc(wp.x*W, wp.y*H, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#c8960a';
      ctx.fill();
      ctx.strokeStyle = '#3a1a05';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // ── 11. START FLAG — green with palm icon ─────────
    const sp = WAYPOINTS[0];
    const sx = sp.x * W, sy = sp.y * H;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(sx, sy - H*0.008);
    ctx.lineTo(sx, sy - H*0.090);
    ctx.strokeStyle = '#7a5230';
    ctx.lineWidth   = 2.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(sx,            sy - H*0.090);
    ctx.lineTo(sx + W*0.044,  sy - H*0.072);
    ctx.lineTo(sx,            sy - H*0.054);
    ctx.closePath();
    ctx.fillStyle   = '#2a8a40';
    ctx.strokeStyle = '#1a5a25';
    ctx.lineWidth   = 1;
    ctx.fill(); ctx.stroke();
    // Label
    ctx.font          = `bold ${Math.max(9, H*0.026)}px sans-serif`;
    ctx.textAlign     = 'center';
    ctx.strokeStyle   = 'rgba(20,10,5,0.90)';
    ctx.lineWidth     = 3.5;
    ctx.strokeText('HASIERA', sx + W*0.048, sy + H*0.038);
    ctx.fillStyle = '#e8d060';
    ctx.fillText('HASIERA', sx + W*0.048, sy + H*0.038);
    ctx.restore();

    // ── 12. META FLAG — gold with X ───────────────────
    const ep = WAYPOINTS[WAYPOINTS.length - 1];
    const ex = ep.x * W, ey = ep.y * H;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(ex, ey - H*0.008);
    ctx.lineTo(ex, ey - H*0.108);
    ctx.strokeStyle = '#7a5230';
    ctx.lineWidth   = 2.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(ex,            ey - H*0.108);
    ctx.lineTo(ex + W*0.050,  ey - H*0.088);
    ctx.lineTo(ex,            ey - H*0.068);
    ctx.closePath();
    ctx.fillStyle   = '#e8c030';
    ctx.strokeStyle = '#a07010';
    ctx.lineWidth   = 1;
    ctx.fill(); ctx.stroke();
    // X on flag
    const fx = ex + W*0.024, fy = ey - H*0.090;
    ctx.strokeStyle = '#7a4010';
    ctx.lineWidth   = 2;
    ctx.beginPath(); ctx.moveTo(fx-5, fy-5); ctx.lineTo(fx+5, fy+5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(fx+5, fy-5); ctx.lineTo(fx-5, fy+5); ctx.stroke();
    // Label
    ctx.font          = `bold ${Math.max(9, H*0.028)}px sans-serif`;
    ctx.textAlign     = 'center';
    ctx.strokeStyle   = 'rgba(20,10,5,0.90)';
    ctx.lineWidth     = 3.5;
    ctx.strokeText('META!', ex - W*0.018, ey + H*0.040);
    ctx.fillStyle = '#f8d050';
    ctx.fillText('META!', ex - W*0.018, ey + H*0.040);
    ctx.restore();

    // ── 13. ZONE LABELS — italic ink ──────────────────
    const zones = [
      { x: W*0.12, y: H*0.74, label: 'Hondartza', color: '#d4a030' },
      { x: W*0.32, y: H*0.57, label: 'Basoa',     color: '#3aaa50' },
      { x: W*0.72, y: H*0.44, label: 'Mendiak',   color: '#b08040' },
    ];
    zones.forEach(z => {
      ctx.save();
      ctx.font        = `italic bold ${Math.max(8, H*0.022)}px serif`;
      ctx.textAlign   = 'center';
      ctx.globalAlpha = 0.85;
      ctx.strokeStyle = 'rgba(10,5,0,0.75)';
      ctx.lineWidth   = 3.5;
      ctx.strokeText(z.label, z.x, z.y);
      ctx.fillStyle = z.color;
      ctx.fillText(z.label, z.x, z.y);
      ctx.restore();
    });

    // ── 14. COMPASS ROSE — golden ─────────────────────
    const compX = W * 0.925, compY = H * 0.880, compR = H * 0.060;
    ctx.save();
    // Outer ring
    ctx.beginPath();
    ctx.arc(compX, compY, compR * 1.18, 0, Math.PI * 2);
    const compBg = ctx.createRadialGradient(compX, compY, 0, compX, compY, compR * 1.18);
    compBg.addColorStop(0, 'rgba(255,240,190,0.92)');
    compBg.addColorStop(1, 'rgba(200,160,60,0.82)');
    ctx.fillStyle = compBg;
    ctx.fill();
    ctx.strokeStyle = '#8a6010';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Cardinal points
    [[0,-1,'N'],[0,1,'S'],[1,0,'E'],[-1,0,'O']].forEach(([dx, dy, lbl]) => {
      const px = compX + (dx as number) * compR * 0.78;
      const py = compY + (dy as number) * compR * 0.78;
      ctx.font = `bold ${Math.round(compR * 0.40)}px serif`;
      ctx.fillStyle = '#5a3008';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(lbl as string, px, py);
    });
    // Needle — N red, S cream
    ctx.beginPath();
    ctx.moveTo(compX,                compY - compR * 0.72);
    ctx.lineTo(compX - compR * 0.18, compY);
    ctx.lineTo(compX + compR * 0.18, compY);
    ctx.closePath();
    ctx.fillStyle = '#c03020';
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(compX,                compY + compR * 0.72);
    ctx.lineTo(compX - compR * 0.18, compY);
    ctx.lineTo(compX + compR * 0.18, compY);
    ctx.closePath();
    ctx.fillStyle = 'rgba(60,30,10,0.60)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(compX, compY, compR * 0.14, 0, Math.PI * 2);
    ctx.fillStyle = '#e8c030';
    ctx.fill();
    ctx.restore();

    // ── 15. GROUP TOKENS ──────────────────────────────
    const sorted = [...groups].sort((a, b) => parseFloat(a.position) - parseFloat(b.position));
    sorted.forEach(g => {
      const pos = getPositionOnPath(parseFloat(g.position), mapTotal);
      const x = pos.x * W, y = pos.y * H;
      const hi = g.id === highlightGroupId;
      const r  = hi ? 20 : 16;

      ctx.save();

      // Drop shadow
      ctx.shadowColor   = 'rgba(20,10,5,0.75)';
      ctx.shadowBlur    = 14;
      ctx.shadowOffsetY = 5;

      // Token body
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = g.color;
      ctx.fill();

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur  = 0;
      ctx.shadowOffsetY = 0;

      // Gold border if highlighted, white otherwise
      ctx.strokeStyle = hi ? '#e8c030' : 'rgba(255,255,255,0.75)';
      ctx.lineWidth   = hi ? 3.5 : 2;
      ctx.stroke();

      // Inner shine arc
      ctx.beginPath();
      ctx.arc(x - r * 0.28, y - r * 0.28, r * 0.38, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.26)';
      ctx.fill();

      // Character image (clipped to circle)
      const charImg = charImgs[g.character_index] ?? charImgs[0];
      if (charImg?.complete && charImg.naturalWidth > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, r - 1, 0, Math.PI * 2);
        ctx.clip();
        const imgSize = r * 1.85;
        ctx.drawImage(charImg, x - imgSize / 2, y - imgSize / 2, imgSize, imgSize);
        ctx.restore();
      }

      // Name label backing + text
      const label = g.student_name || g.name || CHARACTER_NAMES[g.character_index];
      const fSize = Math.max(8, Math.round(r * 0.54));
      ctx.font         = `bold ${fSize}px sans-serif`;
      ctx.textBaseline = 'top';
      ctx.textAlign    = 'center';
      const tw = ctx.measureText(label).width;
      ctx.fillStyle = 'rgba(240,215,130,0.88)';
      ctx.beginPath();
      ctx.roundRect(x - tw / 2 - 4, y + r + 3, tw + 8, fSize + 5, 3);
      ctx.fill();
      ctx.fillStyle = '#2a1a05';
      ctx.fillText(label, x, y + r + 5);

      ctx.restore();
    });
}
