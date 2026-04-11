'use client';

import { useEffect, useRef } from 'react';

type Group = {
  id: number;
  name: string | null;
  character_index: number;
  color: string;
  position: string;
};

type Props = {
  groups: Group[];
  mapTotal?: number;
  highlightGroupId?: number;
};

const CHARACTER_ICONS = ['⚔️', '🏹', '🌊', '🔥', '🌿', '⭐'];
const CHARACTER_NAMES = ['Amaia', 'Iker', 'Nerea', 'Unai', 'Leire', 'Mikel'];

// Island path waypoints (normalized 0-1 coordinates on canvas)
const WAYPOINTS = [
  { x: 0.1, y: 0.85 },   // Start (beach)
  { x: 0.2, y: 0.75 },
  { x: 0.15, y: 0.62 },
  { x: 0.25, y: 0.52 },
  { x: 0.35, y: 0.45 },
  { x: 0.3, y: 0.35 },
  { x: 0.42, y: 0.28 },
  { x: 0.55, y: 0.32 },
  { x: 0.65, y: 0.25 },
  { x: 0.72, y: 0.35 },
  { x: 0.8, y: 0.28 },
  { x: 0.88, y: 0.2 },   // Summit
];

function getPositionOnPath(position: number, total: number): { x: number; y: number } {
  const progress = Math.min(position / total, 1);
  const segCount = WAYPOINTS.length - 1;
  const segment = progress * segCount;
  const segIdx = Math.min(Math.floor(segment), segCount - 1);
  const t = segment - segIdx;

  const p1 = WAYPOINTS[segIdx];
  const p2 = WAYPOINTS[segIdx + 1];
  return {
    x: p1.x + (p2.x - p1.x) * t,
    y: p1.y + (p2.y - p1.y) * t,
  };
}

export default function MapCanvas({ groups, mapTotal = 50, highlightGroupId }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    // Background — ocean
    const oceanGrad = ctx.createLinearGradient(0, 0, W, H);
    oceanGrad.addColorStop(0, '#0d4b6e');
    oceanGrad.addColorStop(1, '#1a7a9e');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, W, H);

    // Draw ocean waves pattern
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    for (let y = 0; y < H; y += 30) {
      ctx.beginPath();
      for (let x = 0; x < W; x += 4) {
        const wave = Math.sin((x + y) * 0.05) * 5;
        if (x === 0) ctx.moveTo(x, y + wave);
        else ctx.lineTo(x, y + wave);
      }
      ctx.stroke();
    }

    // Island body
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(W * 0.45, H * 0.52, W * 0.42, H * 0.44, -0.1, 0, Math.PI * 2);
    const islandGrad = ctx.createRadialGradient(W * 0.45, H * 0.52, 0, W * 0.45, H * 0.52, W * 0.42);
    islandGrad.addColorStop(0, '#5d8a3c');
    islandGrad.addColorStop(0.6, '#4a7230');
    islandGrad.addColorStop(1, '#8b6914');
    ctx.fillStyle = islandGrad;
    ctx.fill();
    ctx.strokeStyle = '#2a4a18';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    // Mountain peak
    ctx.save();
    ctx.beginPath();
    const mx = W * 0.88;
    const my = H * 0.18;
    ctx.moveTo(mx, my - H * 0.1);
    ctx.lineTo(mx - W * 0.08, my + H * 0.08);
    ctx.lineTo(mx + W * 0.08, my + H * 0.08);
    ctx.closePath();
    ctx.fillStyle = '#8b7355';
    ctx.fill();
    ctx.strokeStyle = '#5a4a2a';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Snow cap
    ctx.beginPath();
    ctx.moveTo(mx, my - H * 0.1);
    ctx.lineTo(mx - W * 0.025, my - H * 0.04);
    ctx.lineTo(mx + W * 0.025, my - H * 0.04);
    ctx.closePath();
    ctx.fillStyle = '#f0ece0';
    ctx.fill();
    ctx.restore();

    // Beach at start
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(W * 0.1, H * 0.87, W * 0.08, H * 0.06, 0.3, 0, Math.PI * 2);
    ctx.fillStyle = '#d4b86a';
    ctx.fill();
    ctx.restore();

    // Draw path
    ctx.save();
    ctx.strokeStyle = 'rgba(240,192,64,0.5)';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 5]);
    ctx.beginPath();
    WAYPOINTS.forEach((wp, i) => {
      const x = wp.x * W;
      const y = wp.y * H;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw waypoint dots
    WAYPOINTS.forEach((wp, i) => {
      const x = wp.x * W;
      const y = wp.y * H;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = i === 0 ? '#20b090' : i === WAYPOINTS.length - 1 ? '#f0c040' : 'rgba(240,192,64,0.6)';
      ctx.fill();
      ctx.strokeStyle = '#1a0e05';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
    ctx.restore();

    // "START" label
    ctx.save();
    ctx.font = 'bold 11px Cinzel, serif';
    ctx.fillStyle = '#20b090';
    ctx.fillText('START', W * 0.05, H * 0.96);
    // "META" label
    ctx.fillStyle = '#f0c040';
    ctx.fillText('META', W * 0.84, H * 0.12);
    ctx.restore();

    // Draw group tokens
    // Sort by position to handle overlapping
    const sortedGroups = [...groups].sort((a, b) => parseFloat(a.position) - parseFloat(b.position));

    sortedGroups.forEach((g) => {
      const pos = getPositionOnPath(parseFloat(g.position), mapTotal);
      const x = pos.x * W;
      const y = pos.y * H;
      const isHighlighted = g.id === highlightGroupId;
      const radius = isHighlighted ? 18 : 14;

      // Shadow
      ctx.save();
      ctx.beginPath();
      ctx.arc(x + 2, y + 2, radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fill();

      // Token circle
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = g.color;
      ctx.fill();
      ctx.strokeStyle = isHighlighted ? '#f0c040' : '#1a0e05';
      ctx.lineWidth = isHighlighted ? 3 : 2;
      ctx.stroke();

      // Icon text
      ctx.font = `${radius * 0.9}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(CHARACTER_ICONS[g.character_index], x, y);

      // Name tag
      const label = g.name || CHARACTER_NAMES[g.character_index];
      ctx.font = 'bold 9px Cinzel, serif';
      ctx.fillStyle = '#f5e8c0';
      ctx.strokeStyle = '#1a0e05';
      ctx.lineWidth = 2;
      ctx.strokeText(label, x, y + radius + 8);
      ctx.fillText(label, x, y + radius + 8);

      ctx.restore();
    });

  }, [groups, mapTotal, highlightGroupId]);

  return (
    <canvas
      ref={canvasRef}
      width={700}
      height={480}
      className="w-full h-auto rounded-xl border-2 border-amber-700 shadow-xl"
      style={{ maxHeight: '60vh' }}
    />
  );
}
