'use client';

import { useEffect, useState } from 'react';

const DEFAULT_CLASS_NAMES = [
  'Matematika',
  'Hizkuntza',
  'Natur Zientziak',
  'Gizarte Zientziak',
  'Gorputz Hezkuntza',
];

type Classroom = {
  id: number;
  name: string;
  code: string;
  map_total: number;
  class_names: string | null;
};

export default function ConfiguracionPage() {
  const [classroom,   setClassroom]   = useState<Classroom | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);

  // Form state
  const [name,        setName]        = useState('');
  const [mapTotal,    setMapTotal]    = useState(50);
  const [classNames,  setClassNames]  = useState<string[]>(DEFAULT_CLASS_NAMES);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/teacher/classrooms');
        if (!res.ok) return;
        const { classroom: c } = await res.json();
        setClassroom(c);
        setName(c.name ?? '');
        setMapTotal(c.map_total ?? 50);
        setClassNames(
          c.class_names
            ? JSON.parse(c.class_names)
            : DEFAULT_CLASS_NAMES
        );
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch('/api/teacher/classrooms', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name, map_total: mapTotal, class_names: classNames }),
      });
      if (res.ok) {
        const { classroom: c } = await res.json();
        setClassroom(c);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } finally {
      setSaving(false);
    }
  }

  function updateClassName(i: number, val: string) {
    setClassNames(prev => prev.map((n, idx) => idx === i ? val : n));
  }

  function resetClassNames() {
    setClassNames(DEFAULT_CLASS_NAMES);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <p className="animate-pulse text-sm" style={{ color: '#92ADA4' }}>Kargatzen...</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h2 className="island-title text-2xl">Konfigurazioa</h2>
        <p className="text-sm mt-1 font-semibold" style={{ color: '#4a7068' }}>
          Klasearen ezarpenak
        </p>
      </div>

      <form onSubmit={save} className="space-y-5">

        {/* Classroom info */}
        <div className="card-parchment p-5 space-y-4">
          <p className="text-xs font-black uppercase tracking-widest" style={{ color: '#84572F' }}>
            Klase informazioa
          </p>

          {/* Access code — read only */}
          <div>
            <label className="block text-xs font-bold mb-1.5" style={{ color: '#6a4020' }}>
              Sarbide kodea (ikasleentzat)
            </label>
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ background: 'rgba(132,87,47,0.08)', border: '1px solid rgba(132,87,47,0.18)' }}>
              <span className="font-black text-2xl tracking-[0.2em]" style={{ color: '#3d2510', fontFamily: 'monospace' }}>
                {classroom?.code ?? '—'}
              </span>
              <span className="text-xs opacity-55" style={{ color: '#84572F' }}>
                (ezin da aldatu)
              </span>
            </div>
          </div>

          {/* Classroom name */}
          <div>
            <label className="block text-xs font-bold mb-1.5" style={{ color: '#6a4020' }}>
              Klase izena
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={100}
              className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.65)',
                border: '1px solid rgba(132,87,47,0.30)',
                color: '#3d2510',
              }}
            />
          </div>

          {/* Map total */}
          <div>
            <label className="block text-xs font-bold mb-1.5" style={{ color: '#6a4020' }}>
              Maparen luzera (posizio kopurua)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={10} max={100} step={5}
                value={mapTotal}
                onChange={e => setMapTotal(parseInt(e.target.value))}
                className="flex-1 accent-[#F1A805]"
              />
              <span className="font-black text-lg w-12 text-center" style={{ color: '#3d2510' }}>
                {mapTotal}
              </span>
            </div>
            <p className="text-xs mt-1 opacity-55" style={{ color: '#84572F' }}>
              Gaur eguneko balioa: {classroom?.map_total ?? 50}. Aldatzeak taldeen aurrerapenari ez dio eragiten.
            </p>
          </div>
        </div>

        {/* Subject names */}
        <div className="card-parchment p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-widest" style={{ color: '#84572F' }}>
              Ikasgaien izenak
            </p>
            <button
              type="button"
              onClick={resetClassNames}
              className="text-xs font-bold opacity-55 hover:opacity-100 transition-opacity"
              style={{ color: '#84572F' }}
            >
              Lehenera itzuli
            </button>
          </div>
          <p className="text-xs opacity-60" style={{ color: '#84572F' }}>
            Hauek eguneroko erregistroan agertzen diren ikasgai-izenak dira.
          </p>
          <div className="space-y-2">
            {classNames.map((cn, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="font-black text-sm w-5 text-center" style={{ color: '#84572F' }}>
                  {i + 1}
                </span>
                <input
                  type="text"
                  value={cn}
                  onChange={e => updateClassName(i, e.target.value)}
                  maxLength={50}
                  className="flex-1 rounded-xl px-3 py-2 text-sm focus:outline-none"
                  style={{
                    background: 'rgba(255,255,255,0.65)',
                    border: '1px solid rgba(132,87,47,0.25)',
                    color: '#3d2510',
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving} className="btn-teal py-3 px-8 text-base">
            {saving ? 'Gordetzen...' : '💾 Aldaketak gorde'}
          </button>
          {saved && (
            <p className="text-sm font-bold" style={{ color: '#27ae60' }}>
              ✓ Gordeta!
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
