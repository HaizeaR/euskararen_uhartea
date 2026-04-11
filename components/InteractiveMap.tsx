'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import { CHARACTERS, CHARACTER_IMAGES } from '@/lib/characters';
import { CHECKPOINTS, getPathPosition, unlockedCheckpoints, type Checkpoint } from '@/lib/checkpoints';

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

const MAP_ASPECT = 1320 / 874; // width / height of map image

export default function InteractiveMap({ groups, mapTotal = 50, highlightGroupId }: Props) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Pan / zoom state
  const [offset, setOffset]   = useState({ x: 0, y: 0 });
  const [scale,  setScale]    = useState(1);
  const [minScale, setMinScale] = useState(1);

  // Dragging
  const dragStart = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const hasDragged = useRef(false);

  // Touch pinch
  const lastPinchDist = useRef<number | null>(null);
  const lastPinchCenter = useRef<{ x: number; y: number } | null>(null);

  // Selected checkpoint info panel
  const [selected, setSelected] = useState<Checkpoint | null>(null);

  // ── Fit map to container on mount / resize ──────────────────────────────
  useEffect(() => {
    function fit() {
      const c = containerRef.current;
      if (!c) return;
      const cw = c.clientWidth;
      const ch = c.clientHeight;
      // Scale that fits the map fully inside the container
      const ms = Math.min(cw / (cw), ch / (cw / MAP_ASPECT));
      setMinScale(ms);
      setScale(ms);
      setOffset({ x: 0, y: 0 });
    }
    fit();
    const ro = new ResizeObserver(fit);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // ── Draw ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);

    const mW = W / scale;
    const mH = mW / MAP_ASPECT;
    const mY = (H / scale - mH) / 2;

    // ── Background map image ──
    const mapImg = new window.Image();
    mapImg.src = '/map.png';
    function drawAll() {
      if (!ctx) return;

      ctx.clearRect(0, 0, W / scale + 10, H / scale + 10);

      // Draw map
      if (mapImg.complete && mapImg.naturalWidth > 0) {
        ctx.drawImage(mapImg, 0, mY, mW, mH);
      } else {
        // Fallback gradient background
        const bg = ctx.createLinearGradient(0, mY, mW, mY + mH);
        bg.addColorStop(0,   '#8adbd0');
        bg.addColorStop(0.4, '#e8c870');
        bg.addColorStop(1,   '#2a8a50');
        ctx.fillStyle = bg;
        ctx.fillRect(0, mY, mW, mH);
      }

      // ── Checkpoint markers ──
      const anyGroup = groups[0];
      const groupPos = anyGroup ? parseFloat(anyGroup.position) : 0;
      const unlocked = unlockedCheckpoints(highlightGroupId
        ? parseFloat(groups.find(g => g.id === highlightGroupId)?.position ?? '0')
        : groupPos);

      CHECKPOINTS.forEach(cp => {
        const cx  = cp.x * mW;
        const cy  = cp.y * mH + mY;
        const r   = mW * 0.030;
        const isUnlocked = unlocked.includes(cp.id);
        const isCurrent  = cp.id === Math.max(...unlocked);

        ctx.save();

        if (isCurrent && isUnlocked) {
          // Pulsing ring (static glow)
          ctx.beginPath();
          ctx.arc(cx, cy, r * 1.55, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(245,200,50,0.22)';
          ctx.fill();
          ctx.beginPath();
          ctx.arc(cx, cy, r * 1.30, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(245,200,50,0.18)';
          ctx.fill();
        }

        // Circle
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        if (isUnlocked) {
          ctx.fillStyle = isCurrent ? '#f5c842' : 'rgba(240,220,140,0.92)';
          ctx.shadowColor = isCurrent ? 'rgba(245,200,50,0.80)' : 'rgba(0,0,0,0.40)';
          ctx.shadowBlur  = isCurrent ? 18 : 8;
        } else {
          ctx.fillStyle = 'rgba(60,40,20,0.55)';
          ctx.shadowBlur = 0;
        }
        ctx.fill();
        ctx.strokeStyle = isUnlocked ? '#8a5a10' : 'rgba(80,50,20,0.35)';
        ctx.lineWidth   = r * 0.12;
        ctx.stroke();
        ctx.shadowBlur  = 0;

        // Icon emoji
        ctx.font         = `${Math.round(r * 1.05)}px serif`;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.globalAlpha  = isUnlocked ? 1 : 0.35;
        ctx.fillText(cp.icon, cx, cy);
        ctx.globalAlpha  = 1;

        // Reward badge (top-right if unlocked and not current start)
        if (isUnlocked && cp.id > 0) {
          const bx = cx + r * 0.80, by = cy - r * 0.80;
          const br = r * 0.38;
          ctx.beginPath();
          ctx.arc(bx, by, br, 0, Math.PI * 2);
          ctx.fillStyle = '#27ae60';
          ctx.fill();
          ctx.font         = `${Math.round(br * 1.3)}px serif`;
          ctx.textAlign    = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(cp.reward, bx, by);
        }

        // Name label
        const fSize = Math.max(9, mW * 0.014);
        ctx.font = `bold ${fSize}px sans-serif`;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'top';
        const labelY = cy + r + mW * 0.008;
        ctx.strokeStyle = 'rgba(20,10,5,0.85)';
        ctx.lineWidth   = 3;
        ctx.globalAlpha = isUnlocked ? 0.95 : 0.40;
        ctx.strokeText(cp.name, cx, labelY);
        ctx.fillStyle = isUnlocked ? '#f0d888' : '#a08050';
        ctx.fillText(cp.name, cx, labelY);
        ctx.globalAlpha = 1;

        ctx.restore();
      });

      // ── Group tokens ──────────────────────────────────────────────────
      const charImgs = CHARACTER_IMAGES.map(src => {
        const img = new window.Image();
        img.src = src;
        return img;
      });

      const sorted = [...groups].sort((a, b) => parseFloat(a.position) - parseFloat(b.position));
      sorted.forEach(g => {
        const pos = getPathPosition(parseFloat(g.position));
        const tx  = pos.x * mW;
        const ty  = pos.y * mH + mY;
        const hi  = g.id === highlightGroupId;
        const tr  = hi ? mW * 0.038 : mW * 0.030;

        ctx.save();
        ctx.shadowColor   = 'rgba(20,10,5,0.75)';
        ctx.shadowBlur    = 16;
        ctx.shadowOffsetY = 5;
        ctx.beginPath();
        ctx.arc(tx, ty, tr, 0, Math.PI * 2);
        ctx.fillStyle = g.color;
        ctx.fill();
        ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
        ctx.strokeStyle = hi ? '#f5c842' : 'rgba(255,255,255,0.80)';
        ctx.lineWidth   = hi ? tr * 0.18 : tr * 0.12;
        ctx.stroke();

        // Shine
        ctx.beginPath();
        ctx.arc(tx - tr * 0.28, ty - tr * 0.28, tr * 0.38, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.26)';
        ctx.fill();

        // Character image clipped
        const charImg = charImgs[g.character_index] ?? charImgs[0];
        if (charImg.complete && charImg.naturalWidth > 0) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(tx, ty, tr - 1, 0, Math.PI * 2);
          ctx.clip();
          const imgS = tr * 1.9;
          ctx.drawImage(charImg, tx - imgS / 2, ty - imgS / 2, imgS, imgS);
          ctx.restore();
        }

        // Name tag
        const label  = g.student_name || g.name || '';
        if (label) {
          const fSize = Math.max(8, tr * 0.55);
          ctx.font = `bold ${fSize}px sans-serif`;
          ctx.textAlign    = 'center';
          ctx.textBaseline = 'top';
          const tw = ctx.measureText(label).width;
          ctx.fillStyle = 'rgba(240,215,130,0.92)';
          ctx.beginPath();
          ctx.roundRect(tx - tw / 2 - 4, ty + tr + 3, tw + 8, fSize + 5, 3);
          ctx.fill();
          ctx.fillStyle = '#2a1a05';
          ctx.fillText(label, tx, ty + tr + 5);
        }
        ctx.restore();
      });
    }

    if (mapImg.complete) {
      drawAll();
    } else {
      mapImg.onload  = drawAll;
      mapImg.onerror = drawAll;
      drawAll(); // draw immediately without the image too
    }

    // Preload character images and redraw when ready
    const charImgsForReload = CHARACTER_IMAGES.map(src => {
      const img = new window.Image(); img.src = src; return img;
    });
    Promise.all(charImgsForReload.map(img =>
      img.complete ? Promise.resolve() : new Promise(r => { img.onload = r; img.onerror = r; })
    )).then(drawAll);

    ctx.restore();
  }, [groups, mapTotal, highlightGroupId, offset, scale]);

  // ── Screen → map coordinates ─────────────────────────────────────────
  function screenToMap(sx: number, sy: number) {
    const canvas = canvasRef.current;
    if (!canvas) return { mx: 0, my: 0 };
    const rect = canvas.getBoundingClientRect();
    const px   = (sx - rect.left)  * (canvas.width  / rect.width);
    const py   = (sy - rect.top)   * (canvas.height / rect.height);
    const W    = canvas.width;
    const H    = canvas.height;
    const mW   = W / scale;
    const mH   = mW / MAP_ASPECT;
    const mY   = (H / scale - mH) / 2;
    const mx   = ((px - offset.x) / scale) / mW;
    const my   = (((py - offset.y) / scale) - mY) / mH;
    return { mx, my };
  }

  // ── Hit-test checkpoints ─────────────────────────────────────────────
  function hitCheckpoint(mx: number, my: number): Checkpoint | null {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const r   = 0.030; // same as draw radius

    const anyGroup = groups[0];
    const groupPos = anyGroup ? parseFloat(anyGroup.position) : 0;
    const unlocked = unlockedCheckpoints(highlightGroupId
      ? parseFloat(groups.find(g => g.id === highlightGroupId)?.position ?? '0')
      : groupPos);

    for (const cp of CHECKPOINTS) {
      if (!unlocked.includes(cp.id)) continue;
      const dist = Math.sqrt((mx - cp.x) ** 2 + (my - cp.y) ** 2);
      if (dist < r * 2.2) return cp; // generous hit area
    }
    return null;
  }

  // ── Mouse events ─────────────────────────────────────────────────────
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    hasDragged.current = false;
    dragStart.current  = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  }, [offset]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragStart.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasDragged.current = true;
    setOffset({ x: dragStart.current.ox + dx, y: dragStart.current.oy + dy });
  }, []);

  const onMouseUp = useCallback((e: React.MouseEvent) => {
    if (!hasDragged.current) {
      const { mx, my } = screenToMap(e.clientX, e.clientY);
      const cp = hitCheckpoint(mx, my);
      if (cp) setSelected(cp);
    }
    dragStart.current = null;
  }, [screenToMap, hitCheckpoint]);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const factor  = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    const canvas  = canvasRef.current;
    if (!canvas) return;
    const rect    = canvas.getBoundingClientRect();
    const px      = (e.clientX - rect.left)  * (canvas.width  / rect.width);
    const py      = (e.clientY - rect.top)   * (canvas.height / rect.height);
    setScale(prev => {
      const next = Math.max(minScale, Math.min(prev * factor, 4));
      const ratio = next / prev;
      setOffset(o => ({
        x: px - (px - o.x) * ratio,
        y: py - (py - o.y) * ratio,
      }));
      return next;
    });
  }, [minScale]);

  // ── Touch events ─────────────────────────────────────────────────────
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      hasDragged.current = false;
      dragStart.current = {
        x: e.touches[0].clientX, y: e.touches[0].clientY,
        ox: offset.x, oy: offset.y,
      };
      lastPinchDist.current   = null;
      lastPinchCenter.current = null;
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastPinchDist.current = Math.sqrt(dx * dx + dy * dy);
      lastPinchCenter.current = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      };
    }
  }, [offset]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1 && dragStart.current) {
      const dx = e.touches[0].clientX - dragStart.current.x;
      const dy = e.touches[0].clientY - dragStart.current.y;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) hasDragged.current = true;
      setOffset({ x: dragStart.current.ox + dx, y: dragStart.current.oy + dy });
    } else if (e.touches.length === 2 && lastPinchDist.current !== null) {
      const dx   = e.touches[0].clientX - e.touches[1].clientX;
      const dy   = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const factor = dist / lastPinchDist.current;
      lastPinchDist.current = dist;
      const canvas = canvasRef.current;
      if (!canvas || !lastPinchCenter.current) return;
      const rect = canvas.getBoundingClientRect();
      const px   = (lastPinchCenter.current.x - rect.left) * (canvas.width  / rect.width);
      const py   = (lastPinchCenter.current.y - rect.top)  * (canvas.height / rect.height);
      setScale(prev => {
        const next  = Math.max(minScale, Math.min(prev * factor, 4));
        const ratio = next / prev;
        setOffset(o => ({
          x: px - (px - o.x) * ratio,
          y: py - (py - o.y) * ratio,
        }));
        return next;
      });
    }
  }, [minScale]);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.changedTouches.length === 1 && !hasDragged.current) {
      const t = e.changedTouches[0];
      const { mx, my } = screenToMap(t.clientX, t.clientY);
      const cp = hitCheckpoint(mx, my);
      if (cp) setSelected(cp);
    }
    dragStart.current = null;
  }, [screenToMap, hitCheckpoint]);

  const char = selected ? CHARACTERS[groups[0]?.character_index ?? 0] : null;

  return (
    <div ref={containerRef} className="relative w-full" style={{ height: '62vh', minHeight: 320 }}>
      <canvas
        ref={canvasRef}
        width={900}
        height={600}
        className="w-full h-full rounded-2xl shadow-2xl"
        style={{
          cursor: dragStart.current ? 'grabbing' : 'grab',
          border: '3px solid rgba(160,110,30,0.60)',
          boxShadow: '0 8px 40px rgba(20,10,5,0.60)',
          touchAction: 'none',
        }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={() => { dragStart.current = null; }}
        onWheel={onWheel}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      />

      {/* Zoom hint */}
      <div className="absolute bottom-3 right-3 text-xs opacity-50 pointer-events-none" style={{ color: '#f0d888' }}>
        scroll / pinch = zoom · drag = pan · tap = info
      </div>

      {/* Reset zoom button */}
      {scale > minScale * 1.05 && (
        <button
          onClick={() => { setScale(minScale); setOffset({ x: 0, y: 0 }); }}
          className="absolute top-3 right-3 text-xs px-2 py-1 rounded-lg"
          style={{ background: 'rgba(30,18,8,0.85)', color: '#f0d888', border: '1px solid rgba(200,150,50,0.5)' }}
        >
          Berrezarri
        </button>
      )}

      {/* Checkpoint info modal */}
      {selected && (
        <div
          className="absolute inset-0 flex items-center justify-center rounded-2xl"
          style={{ background: 'rgba(20,12,5,0.72)', backdropFilter: 'blur(3px)' }}
          onClick={() => setSelected(null)}
        >
          <div
            className="mx-4 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            style={{
              background: 'linear-gradient(145deg,#f7eac8,#e8d090)',
              border: '3px solid #a07030',
              color: '#2a1a05',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-4xl">{selected.icon}</span>
              <div>
                <h3 className="font-black text-lg leading-tight" style={{ fontFamily: 'var(--font-display), Bangers, cursive', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  {selected.name}
                </h3>
                <span className="text-xs font-bold opacity-60">
                  {selected.requiredPos} / 50 posizio
                </span>
              </div>
            </div>
            <p className="text-sm leading-relaxed mb-4" style={{ fontFamily: 'var(--font-body), Nunito, sans-serif' }}>
              {selected.description}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold">
                <span className="text-2xl">{selected.reward}</span>
                <span className="opacity-70">Saria lortu duzu!</span>
              </div>
              {char && (
                <Image src={char.image} alt={char.name} width={40} height={40} className="object-contain" />
              )}
            </div>
            <button
              onClick={() => setSelected(null)}
              className="mt-4 w-full py-2 rounded-xl font-bold text-sm"
              style={{ background: 'linear-gradient(145deg,#c87a30,#7a4018)', color: '#f5e8c0', border: '2px solid #5a2e0c' }}
            >
              Itxi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
