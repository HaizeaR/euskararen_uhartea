'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { CHARACTER_NAMES, CHARACTERS } from '@/lib/characters';

type Group = {
  id: number;
  code: string | null;
  name: string | null;
  student_name: string | null;
  character_index: number;
  color: string;
  position: string;
  classroom_id: number;
  pending_message: string | null;
};

type DayEntry = {
  id: number;
  group_id: number;
  entry_date: string;
  score: number;
  advance: string;
  validated_by_teacher: boolean;
  class_1_euskera: boolean; class_1_errespetua: boolean;
  class_2_euskera: boolean; class_2_errespetua: boolean;
  class_3_euskera: boolean; class_3_errespetua: boolean;
  class_4_euskera: boolean; class_4_errespetua: boolean;
  class_5_euskera: boolean; class_5_errespetua: boolean;
};

const CLASS_NAMES = ['Matematika', 'Hizkuntza', 'Nat. Zientziak', 'Giz. Zientziak', 'Gorputz Hez.'];

export default function IrakasleaDashboard() {
  const [groups,      setGroups]      = useState<Group[]>([]);
  const [todayData,   setTodayData]   = useState<{
    entries: DayEntry[];
    today: string;
  } | null>(null);
  const [loading,     setLoading]     = useState(true);

  // Message state
  const [msgTarget,   setMsgTarget]   = useState<string>('all');
  const [msgText,     setMsgText]     = useState('');
  const [msgSending,  setMsgSending]  = useState(false);
  const [msgSent,     setMsgSent]     = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [classroomsRes, todayRes] = await Promise.all([
          fetch('/api/teacher/classrooms'),
          fetch('/api/teacher/today'),
        ]);

        if (classroomsRes.ok) {
          const data = await classroomsRes.json();
          if (data.classroom) {
            const groupsRes = await fetch(`/api/groups?classroom_id=${data.classroom.id}`);
            if (groupsRes.ok) setGroups(await groupsRes.json());
          }
        }

        if (todayRes.ok) {
          const data = await todayRes.json();
          setTodayData({ entries: data.entries, today: data.today });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function sendMessage() {
    if (!msgText.trim()) return;
    setMsgSending(true);
    try {
      const res = await fetch('/api/teacher/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId: msgTarget === 'all' ? 'all' : parseInt(msgTarget), message: msgText.trim() }),
      });
      if (res.ok) {
        setMsgSent(true);
        setMsgText('');
        setTimeout(() => setMsgSent(false), 3000);
        // Refresh groups to show pending_message status
        const cr = await fetch('/api/teacher/classrooms');
        if (cr.ok) {
          const { classroom } = await cr.json();
          const gr = await fetch(`/api/groups?classroom_id=${classroom.id}`);
          if (gr.ok) setGroups(await gr.json());
        }
      }
    } finally {
      setMsgSending(false);
    }
  }

  async function validateEntry(entryId: number) {
    const res = await fetch(`/api/entries/${entryId}/validate`, { method: 'PATCH' });
    if (res.ok && todayData) {
      setTodayData(prev => prev ? {
        ...prev,
        entries: prev.entries.map(e => e.id === entryId ? { ...e, validated_by_teacher: true } : e),
      } : null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-amber-400 animate-pulse">Kargatzen...</p>
      </div>
    );
  }

  const sortedGroups = [...groups].sort((a, b) => parseFloat(b.position) - parseFloat(a.position));
  const registered   = groups.filter(g => todayData?.entries.some(e => e.group_id === g.id));

  return (
    <div className="space-y-8">

      {/* ── TODAY'S COMPLETION ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="island-title text-2xl">Dashboard</h2>
        </div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="island-title text-xl">Gaurko Egoera</h3>
          <span className="text-sm font-semibold" style={{ color: '#4a7068' }}>
            {registered.length}/{groups.length} taldeek erregistratu dute
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full rounded-full h-2 mb-4" style={{ background: 'rgba(132,87,47,0.25)' }}>
          <div
            className="h-2 rounded-full bg-emerald-500 transition-all"
            style={{ width: groups.length ? `${(registered.length / groups.length) * 100}%` : '0%' }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sortedGroups.map(g => {
            const entry = todayData?.entries.find(e => e.group_id === g.id);
            const char  = CHARACTERS[g.character_index] ?? CHARACTERS[0];
            const name  = g.student_name || g.name || CHARACTER_NAMES[g.character_index];

            return (
              <div
                key={g.id}
                className="card-dark p-4"
                style={{ borderColor: entry ? 'rgba(39,174,96,0.45)' : 'rgba(120,80,20,0.3)' }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Image src={char.image} alt={char.name} width={28} height={28} className="object-contain flex-shrink-0" />
                  <span className="font-bold text-sm flex-1" style={{ color: g.color }}>
                    {name}
                  </span>
                  <span className="text-xs font-mono text-amber-700">{g.code}</span>
                </div>

                {entry ? (
                  <>
                    {/* Score bar */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-1 bg-amber-950 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${(entry.score / 10) * 100}%`,
                            backgroundColor: g.color,
                          }}
                        />
                      </div>
                      <span className="text-white text-sm font-bold">{entry.score}/10</span>
                      <span className="text-teal-400 text-sm">+{entry.advance}</span>
                    </div>

                    {/* Class breakdown */}
                    <div className="grid grid-cols-5 gap-1 mb-2">
                      {CLASS_NAMES.map((cls, i) => {
                        const k = i + 1;
                        const eu = entry[`class_${k}_euskera` as keyof DayEntry] as boolean;
                        const er = entry[`class_${k}_errespetua` as keyof DayEntry] as boolean;
                        return (
                          <div key={i} className="text-center">
                            <div className="text-amber-700 text-xs mb-1 truncate" title={cls}>
                              {cls.split(' ')[0]}
                            </div>
                            <div className={`text-xs rounded px-1 py-0.5 ${eu ? 'bg-teal-900 text-teal-300' : 'bg-gray-900 text-gray-600'}`}>
                              🗣️
                            </div>
                            <div className={`text-xs rounded px-1 py-0.5 mt-0.5 ${er ? 'bg-amber-900 text-amber-300' : 'bg-gray-900 text-gray-600'}`}>
                              🤝
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Validate */}
                    {!entry.validated_by_teacher ? (
                      <button
                        onClick={() => validateEntry(entry.id)}
                        className="w-full text-xs bg-green-900 text-green-200 rounded-lg py-1.5 hover:bg-green-800 font-semibold transition-colors"
                      >
                        ✓ Baliozta
                      </button>
                    ) : (
                      <p className="text-center text-green-500 text-xs font-semibold">✓ Balioztatua</p>
                    )}
                  </>
                ) : (
                  <p className="text-amber-800 text-sm italic text-center py-2">
                    Ez du erregistratu gaur
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── MESSAGES ── */}
      <div className="card-parchment p-5 space-y-4">
        <h3 className="island-title text-xl">📢 Mezuak bidali</h3>
        <p className="text-xs font-semibold" style={{ color: '#6a4020' }}>
          Mezu bat idatzi eta bidali talde bati edo guztiei. Hurrengo aldian sartzen direnean ikusiko dute.
        </p>

        <div className="flex flex-wrap gap-3 items-end">
          {/* Target selector */}
          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs font-black uppercase tracking-wide mb-1" style={{ color: '#84572F' }}>
              Hartzailea
            </label>
            <select
              value={msgTarget}
              onChange={e => setMsgTarget(e.target.value)}
              className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
              style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(132,87,47,0.30)', color: '#3d2510' }}
            >
              <option value="all">🌍 Talde guztiak</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>
                  {g.student_name || g.name || `Taldea ${g.id}`}
                  {g.pending_message ? ' 📬' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Message input */}
          <div className="flex-[3] min-w-[200px]">
            <label className="block text-xs font-black uppercase tracking-wide mb-1" style={{ color: '#84572F' }}>
              Mezua
            </label>
            <input
              type="text"
              value={msgText}
              onChange={e => setMsgText(e.target.value.slice(0, 200))}
              onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
              placeholder="Idatzi mezu bat..."
              maxLength={200}
              className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
              style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(132,87,47,0.30)', color: '#3d2510' }}
            />
          </div>

          <button
            onClick={sendMessage}
            disabled={msgSending || !msgText.trim()}
            className="btn-teal py-2 px-5 text-sm flex-shrink-0"
          >
            {msgSending ? 'Bidaltzen...' : '📤 Bidali'}
          </button>
        </div>

        {msgSent && (
          <p className="text-sm font-bold" style={{ color: '#27ae60' }}>✓ Mezua bidali da!</p>
        )}

        {/* Pending messages overview */}
        {groups.some(g => g.pending_message) && (
          <div className="space-y-1.5 mt-1">
            <p className="text-xs font-black uppercase tracking-wide" style={{ color: '#84572F' }}>Irakurri gabeko mezuak</p>
            {groups.filter(g => g.pending_message).map(g => (
              <div key={g.id} className="flex items-center gap-3 px-3 py-2 rounded-xl"
                style={{ background: 'rgba(241,168,5,0.12)', border: '1px solid rgba(241,168,5,0.25)' }}>
                <span className="text-sm">📬</span>
                <span className="text-xs font-bold flex-1" style={{ color: '#3d2510' }}>
                  {g.student_name || g.name || `Taldea ${g.id}`}:
                  <span className="font-normal ml-1 opacity-75">{g.pending_message}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── RANKING ── */}
      <div className="card-dark p-6">
        <h3 className="island-title island-title-nav text-lg mb-4">Sailkapena</h3>
        <div className="space-y-2">
          {sortedGroups.map((g, i) => (
            <div key={g.id} className="flex items-center gap-3 p-2 bg-black bg-opacity-20 rounded-xl">
              <span className="text-amber-500 font-bold w-7 text-sm">#{i + 1}</span>
              <Image src={CHARACTERS[g.character_index]?.image ?? CHARACTERS[0].image} alt="" width={24} height={24} className="object-contain flex-shrink-0" />
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: g.color }} />
              <span className="flex-1 text-sm font-semibold">
                {g.student_name || g.name || CHARACTER_NAMES[g.character_index]}
              </span>
              <div className="text-right">
                <div className="text-amber-300 font-bold text-sm">{parseFloat(g.position)} / 50</div>
                <div className="w-20 bg-gray-700 rounded-full h-1.5 mt-1">
                  <div
                    className="h-1.5 rounded-full"
                    style={{
                      width: `${(parseFloat(g.position) / 50) * 100}%`,
                      backgroundColor: g.color,
                    }}
                  />
                </div>
              </div>
              {parseFloat(g.position) >= 50 && <span className="text-yellow-400">🏆</span>}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
