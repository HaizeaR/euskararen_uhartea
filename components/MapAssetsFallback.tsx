'use client';

import Image from 'next/image';
import { useState } from 'react';

const CHARACTER_ICONS = ['⚔️', '🏹', '🌊', '🔥', '🌿', '⭐'];

function CharacterPreview({ index }: { index: number }) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className="w-14 h-14 rounded-lg border border-amber-700 bg-amber-950/40 flex items-center justify-center text-2xl">
        {CHARACTER_ICONS[index]}
      </div>
    );
  }

  return (
    <Image
      src={`/characters/char-${index}.png`}
      alt={`Pertsonaia ${index}`}
      width={56}
      height={56}
      className="w-14 h-14 rounded-lg border border-amber-700 object-cover"
      onError={() => setError(true)}
    />
  );
}

export default function MapAssetsFallback() {
  const [mapError, setMapError] = useState(false);

  return (
    <section className="card-dark p-4 mt-4">
      <h3 className="text-amber-400 font-bold mb-3 text-sm">Maparen aktiboak (fallback prest)</h3>

      {!mapError ? (
        <Image
          src="/map.png"
          alt="Uharteko mapa"
          width={1200}
          height={700}
          className="w-full h-auto rounded-lg border border-amber-700"
          onError={() => setMapError(true)}
        />
      ) : (
        <div className="w-full aspect-[16/9] rounded-lg border border-amber-700 bg-gradient-to-br from-amber-900/40 to-teal-900/40 flex items-center justify-center text-amber-400 text-sm">
          /public/map.png ez dago oraindik — canvas mapa erabiltzen
        </div>
      )}

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-3">
        {Array.from({ length: 6 }, (_, i) => (
          <CharacterPreview key={i} index={i} />
        ))}
      </div>
    </section>
  );
}
