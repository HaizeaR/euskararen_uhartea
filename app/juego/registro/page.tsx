'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type ClassData = {
  euskera: boolean;
  errespetua: boolean;
};

const CLASS_NAMES = [
  'Matematika',
  'Hizkuntza',
  'Natur Zientziak',
  'Gizarte Zientziak',
  'Gorputz Hezkuntza',
];

export default function RegistroPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassData[]>(
    Array(5).fill(null).map(() => ({ euskera: false, errespetua: false }))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function toggleClass(classIndex: number, field: 'euskera' | 'errespetua') {
    setClasses((prev) =>
      prev.map((c, i) =>
        i === classIndex ? { ...c, [field]: !c[field] } : c
      )
    );
  }

  const totalScore = classes.reduce(
    (sum, c) => sum + (c.euskera ? 1 : 0) + (c.errespetua ? 1 : 0),
    0
  );
  const advance = totalScore / 2;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const body: Record<string, boolean> = {};
    classes.forEach((c, i) => {
      body[`class_${i + 1}_euskera`] = c.euskera;
      body[`class_${i + 1}_errespetua`] = c.errespetua;
    });

    try {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Errorea gertatu da');
        return;
      }

      router.push('/juego');
    } catch {
      setError('Konexio errorea');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen p-4 md:p-6 max-w-lg mx-auto">
      {/* Header */}
      <header className="flex items-center gap-4 mb-6">
        <Link href="/juego" className="text-amber-400 hover:text-amber-300 text-2xl">←</Link>
        <h1 className="island-title text-xl">Gaur Erregistratu</h1>
      </header>

      <p className="text-amber-300 text-center mb-6 text-sm">
        Klase bakoitzean, markatu lortu dituzun gauzak
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {CLASS_NAMES.map((name, i) => (
          <div key={i} className="card-dark p-4">
            <h3 className="text-amber-400 font-bold mb-3 text-sm uppercase tracking-wide">
              {i + 1}. {name}
            </h3>
            <div className="space-y-3">
              {/* Euskera toggle */}
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-amber-200 flex items-center gap-2">
                  <span className="text-lg">🗣️</span>
                  Euskaraz aritu naiz
                </span>
                <div
                  onClick={() => toggleClass(i, 'euskera')}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-200 cursor-pointer ${
                    classes[i].euskera ? 'bg-teal-500' : 'bg-gray-600'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                      classes[i].euskera ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </div>
              </label>

              {/* Errespetua toggle */}
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-amber-200 flex items-center gap-2">
                  <span className="text-lg">🤝</span>
                  Errespetatua naiz
                </span>
                <div
                  onClick={() => toggleClass(i, 'errespetua')}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-200 cursor-pointer ${
                    classes[i].errespetua ? 'bg-amber-500' : 'bg-gray-600'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                      classes[i].errespetua ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </div>
              </label>
            </div>
          </div>
        ))}

        {/* Score summary */}
        <div className="card-parchment p-4 text-center">
          <div className="text-3xl font-bold text-amber-900">{totalScore}/10</div>
          <div className="text-amber-700 text-sm">puntuazioa</div>
          <div className="text-amber-800 font-semibold mt-1">
            +{advance} posizio aurreratuko duzu
          </div>
          <div className="grid grid-cols-5 gap-1 mt-3">
            {Array.from({ length: 10 }).map((_, j) => (
              <div
                key={j}
                className={`h-3 rounded-full transition-all duration-200 ${
                  j < totalScore ? 'bg-teal-500' : 'bg-amber-200'
                }`}
              />
            ))}
          </div>
        </div>

        {error && (
          <p className="text-red-500 text-center text-sm bg-red-900 bg-opacity-30 p-3 rounded-lg">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-teal w-full text-lg"
        >
          {loading ? 'Gordetzen...' : '✅ Gorde eta aurrera!'}
        </button>
      </form>
    </main>
  );
}
