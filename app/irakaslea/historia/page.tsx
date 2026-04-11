'use client';

import { useEffect, useState } from 'react';

type HistoryEntry = {
  id: number;
  entry_date: string;
  score: number;
  advance: string;
  validated_by_teacher: boolean;
  group_id: number;
  group_name: string | null;
  group_color: string;
  character_index: number;
};

const CHARACTER_NAMES = ['Amaia', 'Iker', 'Nerea', 'Unai', 'Leire', 'Mikel'];

export default function HistoriaPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch('/api/teacher/history');
        if (!res.ok) return;
        setEntries(await res.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, []);

  if (loading) {
    return <p className="text-amber-400 animate-pulse">Kargatzen...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="island-title text-2xl text-amber-400">Historia</h2>
        <p className="text-amber-600 text-sm">Eguneko erregistro guztiak</p>
      </div>

      <div className="card-dark p-5 overflow-x-auto">
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className="text-amber-500 border-b border-amber-900/50">
              <th className="text-left py-2">Data</th>
              <th className="text-left py-2">Taldea</th>
              <th className="text-left py-2">Puntuazioa</th>
              <th className="text-left py-2">Aurrerapena</th>
              <th className="text-left py-2">Egoera</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className="border-b border-amber-950/50">
                <td className="py-2 text-amber-200">{entry.entry_date}</td>
                <td className="py-2">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.group_color }} />
                    <span>{entry.group_name || CHARACTER_NAMES[entry.character_index]}</span>
                  </div>
                </td>
                <td className="py-2 font-bold text-amber-300">{entry.score} / 10</td>
                <td className="py-2 text-teal-300">+{entry.advance}</td>
                <td className="py-2">
                  {entry.validated_by_teacher ? (
                    <span className="text-green-400">✓ Balioztatua</span>
                  ) : (
                    <span className="text-amber-500">Zain</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {entries.length === 0 && (
          <p className="text-amber-700 text-center py-8">Oraindik ez dago erregistrorik.</p>
        )}
      </div>
    </div>
  );
}
