'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import { CHARACTERS } from '@/lib/characters';
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

const MAP_ASPECT = 1536 / 1024; // 1.5 — actual mapa.png dimensions

export default function InteractiveMap({ groups, highlightGroupId }: Props) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const layerRef      = useRef<HTMLDivElement>(null);
  const transform     = useRef({ x: 0, y: 0, scale: 1 });
  const minScale      = useRef(1);
  const drag          = useRef<{ sx: number; sy: number; tx: number; ty: number } | null>(null);
  const hasDragged    = useRef(false);
  const pinchDist     = useRef<number | null>(null);
  const [isDragging,  setIsDragging]  = useState(false);
  const [mapSize,     setMapSize]     = useState({ w: 800, h: 530 });
  const [selected,    setSelected]    = useState<Checkpoint | null>(null);
  const [, forceUpdate] = useState(0); // used after zoom

  // ── Fit map to container on mount ───────────────────────────────────
  useEffect(() => {
    function fit() {
      const c = containerRef.current;
      if (!c) return;
      const cw = c.clientWidth;
      const ch = c.clientHeight;
      // Fit by width or height, whichever is tighter
      let w = cw, h = cw / MAP_ASPECT;
      if (h > ch) { h = ch; w = ch * MAP_ASPECT; }
      setMapSize({ w, h });
      const ms = 1; // map already fits
      minScale.current = ms;
      transform.current = { x: (cw - w) / 2, y: (ch - h) / 2, scale: 1 };
      applyTransform(transform.current.x, transform.current.y, 1);
    }
    fit();
    const ro = new ResizeObserver(fit);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  function applyTransform(x: number, y: number, s: number) {
    transform.current = { x, y, scale: s };
    if (layerRef.current) {
      layerRef.current.style.transform = `translate(${x}px, ${y}px) scale(${s})`;
    }
  }

  function resetView() {
    const c = containerRef.current;
    if (!c) return;
    const cw = c.clientWidth, ch = c.clientHeight;
    applyTransform((cw - mapSize.w) / 2, (ch - mapSize.h) / 2, 1);
    forceUpdate(n => n + 1);
  }

  // ── Mouse ────────────────────────────────────────────────────────────
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    hasDragged.current = false;
    drag.current = { sx: e.clientX, sy: e.clientY, tx: transform.current.x, ty: transform.current.y };
    setIsDragging(false);
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.sx;
    const dy = e.clientY - drag.current.sy;
    if (!hasDragged.current && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
      hasDragged.current = true;
      setIsDragging(true);
    }
    applyTransform(drag.current.tx + dx, drag.current.ty + dy, transform.current.scale);
  }, []);

  const onMouseUp = useCallback(() => {
    drag.current = null;
    setIsDragging(false);
  }, []);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    const c = containerRef.current;
    if (!c) return;
    const rect = c.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const { x, y, scale } = transform.current;
    const next  = Math.max(minScale.current, Math.min(scale * factor, 4));
    const ratio = next / scale;
    applyTransform(px - (px - x) * ratio, py - (py - y) * ratio, next);
    forceUpdate(n => n + 1);
  }, []);

  // ── Touch ────────────────────────────────────────────────────────────
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      hasDragged.current = false;
      drag.current = { sx: e.touches[0].clientX, sy: e.touches[0].clientY, tx: transform.current.x, ty: transform.current.y };
      pinchDist.current = null;
    } else if (e.touches.length === 2) {
      drag.current = null;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchDist.current = Math.sqrt(dx * dx + dy * dy);
    }
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1 && drag.current) {
      const dx = e.touches[0].clientX - drag.current.sx;
      const dy = e.touches[0].clientY - drag.current.sy;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) hasDragged.current = true;
      applyTransform(drag.current.tx + dx, drag.current.ty + dy, transform.current.scale);
    } else if (e.touches.length === 2 && pinchDist.current !== null) {
      const dx   = e.touches[0].clientX - e.touches[1].clientX;
      const dy   = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const factor = dist / pinchDist.current;
      pinchDist.current = dist;
      const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      const c  = containerRef.current;
      if (!c) return;
      const rect = c.getBoundingClientRect();
      const px = cx - rect.left, py = cy - rect.top;
      const { x, y, scale } = transform.current;
      const next  = Math.max(minScale.current, Math.min(scale * factor, 4));
      const ratio = next / scale;
      applyTransform(px - (px - x) * ratio, py - (py - y) * ratio, next);
    }
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!hasDragged.current && e.changedTouches.length === 1) {
      // click handled by the checkpoint buttons themselves
    }
    drag.current = null;
  }, []);

  // ── Checkpoint unlock state ──────────────────────────────────────────
  const focusGroup = groups.find(g => g.id === highlightGroupId) ?? groups[0];
  const focusPos   = focusGroup ? parseFloat(focusGroup.position) : 0;
  const unlocked   = unlockedCheckpoints(focusPos);

  const char = focusGroup ? (CHARACTERS[focusGroup.character_index] ?? CHARACTERS[0]) : null;

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-2xl select-none"
      style={{
        height: '62vh', minHeight: 320,
        cursor: isDragging ? 'grabbing' : 'grab',
        border: '3px solid rgba(160,110,30,0.55)',
        boxShadow: '0 8px 36px rgba(20,10,5,0.55)',
        background: '#B3D9E0',  /* Pool Water */
      }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onWheel={onWheel}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* ── Pannable / zoomable layer ── */}
      <div
        ref={layerRef}
        className="absolute"
        style={{ transformOrigin: '0 0', willChange: 'transform', width: mapSize.w, height: mapSize.h }}
      >
        {/* Map image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/mapa.png"
          alt="Uharteko mapa"
          draggable={false}
          style={{ width: mapSize.w, height: mapSize.h, display: 'block', userSelect: 'none' }}
        />

        {/* ── Checkpoints ── */}
        {CHECKPOINTS.map(cp => {
          const isUnlocked = unlocked.includes(cp.id);
          const isCurrent  = isUnlocked && cp.id === Math.max(...unlocked);
          return (
            <button
              key={cp.id}
              className="absolute"
              style={{
                left:      `${cp.x * 100}%`,
                top:       `${cp.y * 100}%`,
                transform: 'translate(-50%, -50%)',
                pointerEvents: isUnlocked ? 'auto' : 'none',
              }}
              onClick={e => { e.stopPropagation(); if (!hasDragged.current) setSelected(cp); }}
            >
              {/* Pulse ring for current location */}
              {isCurrent && (
                <span className="absolute inset-0 rounded-full animate-ping opacity-50"
                  style={{ background: 'rgba(245,200,50,0.5)', margin: '-6px' }} />
              )}

              {/* Marker circle */}
              <span
                className="relative flex items-center justify-center rounded-full transition-transform hover:scale-110"
                style={{
                  width:      mapSize.w * 0.068,
                  height:     mapSize.w * 0.068,
                  minWidth:   36,
                  minHeight:  36,
                  background: isUnlocked
                    ? isCurrent ? 'rgba(245,200,50,0.95)' : 'rgba(240,225,150,0.92)'
                    : 'rgba(40,25,10,0.55)',
                  border:     `${mapSize.w * 0.003}px solid ${isUnlocked ? '#8a5a10' : 'rgba(80,50,20,0.3)'}`,
                  boxShadow:  isCurrent ? '0 0 18px rgba(245,200,50,0.75)' : isUnlocked ? '0 2px 8px rgba(0,0,0,0.4)' : 'none',
                  fontSize:   mapSize.w * 0.030,
                  opacity:    isUnlocked ? 1 : 0.4,
                }}
              >
                {cp.icon}

                {/* Reward badge */}
                {isUnlocked && cp.id > 0 && (
                  <span
                    className="absolute -top-1 -right-1 flex items-center justify-center rounded-full"
                    style={{
                      width: mapSize.w * 0.028, height: mapSize.w * 0.028,
                      minWidth: 18, minHeight: 18,
                      background: '#27ae60',
                      fontSize: mapSize.w * 0.016,
                      border: '1.5px solid #1a6035',
                    }}
                  >
                    {cp.reward}
                  </span>
                )}
              </span>

              {/* Name label */}
              <span
                className="absolute whitespace-nowrap font-bold text-center pointer-events-none"
                style={{
                  top: '100%', left: '50%',
                  transform: 'translateX(-50%)',
                  marginTop: mapSize.w * 0.006,
                  fontSize:  Math.max(9, mapSize.w * 0.013),
                  color:     isUnlocked ? '#f0d888' : 'rgba(200,160,80,0.5)',
                  textShadow: '0 1px 4px rgba(0,0,0,0.9)',
                  background: 'rgba(15,8,3,0.55)',
                  borderRadius: 4,
                  padding: '1px 4px',
                }}
              >
                {cp.name}
              </span>
            </button>
          );
        })}

        {/* ── Team tokens ── */}
        {groups.map(g => {
          const pos = getPathPosition(parseFloat(g.position));
          const hi  = g.id === highlightGroupId;
          const ch  = CHARACTERS[g.character_index] ?? CHARACTERS[0];
          const sz  = hi ? mapSize.w * 0.075 : mapSize.w * 0.058;
          return (
            <div
              key={g.id}
              className="absolute pointer-events-none"
              style={{
                left:       `${pos.x * 100}%`,
                top:        `${pos.y * 100}%`,
                transform:  'translate(-50%, -100%)',
                width: sz,  height: sz,
                filter:     `drop-shadow(0 2px 6px ${g.color}aa) drop-shadow(0 1px 2px rgba(0,0,0,0.5))`,
                zIndex:     hi ? 20 : 10,
                transition: 'left 1.2s cubic-bezier(0.4,0,0.2,1), top 1.2s cubic-bezier(0.4,0,0.2,1)',
              }}
            >
              {/* Color circle behind */}
              <span
                className="absolute inset-0 rounded-full"
                style={{
                  background: g.color,
                  border: `${sz * 0.07}px solid ${hi ? '#f5c842' : 'rgba(255,255,255,0.7)'}`,
                  boxShadow: hi ? `0 0 14px ${g.color}` : 'none',
                }}
              />
              <img
                src={ch.image}
                alt={ch.name}
                draggable={false}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }}
              />
              {/* Name tag */}
              {(g.student_name || g.name) && (
                <span
                  className="absolute font-bold whitespace-nowrap"
                  style={{
                    top: '100%', left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: Math.max(8, sz * 0.28),
                    background: 'rgba(240,215,130,0.92)',
                    color: '#2a1a05',
                    borderRadius: 3,
                    padding: '1px 4px',
                    marginTop: 2,
                  }}
                >
                  {g.student_name || g.name}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Hint ── */}
      <div className="absolute bottom-2 right-3 text-xs pointer-events-none opacity-50"
        style={{ color: '#f0d888', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
        {window?.innerWidth < 640 ? 'Mugitu hatzekin · Tap lekuan' : 'Arrastatu · Scroll = zoom · Klik lekuan'}
      </div>

      {/* ── Reset button ── */}
      <button
        onClick={e => { e.stopPropagation(); resetView(); }}
        className="absolute top-3 right-3 text-xs px-2.5 py-1 rounded-lg"
        style={{ background: 'rgba(25,14,5,0.82)', color: '#f0d888', border: '1px solid rgba(200,150,50,0.45)' }}
      >
        ⌂ Berrezarri
      </button>

      {/* ── Checkpoint info modal ── */}
      {selected && (
        <div
          className="absolute inset-0 flex items-center justify-center rounded-2xl"
          style={{ background: 'rgba(15,8,3,0.75)', backdropFilter: 'blur(4px)', zIndex: 50 }}
          onMouseDown={e => e.stopPropagation()}
          onClick={() => setSelected(null)}
        >
          <div
            className="mx-4 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            style={{ background: 'linear-gradient(145deg,#F5E4D0,#EDD5C0)', border: '3px solid #84572F', color: '#3d2510' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
              <span style={{ fontSize: 40 }}>{selected.icon}</span>
              <div>
                <h3 className="font-black text-lg leading-tight" style={{ fontFamily: 'Fredoka, var(--font-display), sans-serif' }}>
                  {selected.name}
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs font-bold opacity-55">{selected.requiredPos}/50 posizio</span>
                  <span className="text-lg">{selected.reward}</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm leading-relaxed mb-4" style={{ fontFamily: 'Nunito, var(--font-body), sans-serif' }}>
              {selected.description}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold"
                style={{ background: 'rgba(146,173,164,0.22)', border: '1.5px solid #92ADA4', color: '#3d5a54' }}>
                {selected.reward} Saria lortu duzu!
              </div>
              {char && (
                <Image src={char.image} alt={char.name} width={44} height={44} className="object-contain" />
              )}
            </div>

            <button
              onClick={() => setSelected(null)}
              className="mt-4 w-full py-2.5 rounded-xl font-bold text-sm"
              style={{ background: 'linear-gradient(145deg,#a06840,#5e3818)', color: '#EDD5C0', border: '2px solid #3d2510' }}
            >
              Itxi ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
