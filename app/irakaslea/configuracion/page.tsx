'use client';

import { useEffect, useState } from 'react';

type Classroom = {
  id: number;
  name: string;
  code: string;
  map_total: number;
  is_active: boolean;
};

export default function KonfigurazioaPage() {
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [classroomName, setClassroomName] = useState('');
  const [mapTotal, setMapTotal] = useState(50);
  const [isActive, setIsActive] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/teacher/configuration');
      if (!res.ok) return;
      const data = await res.json();
      setClassroom(data.classroom);
      setClassroomName(data.classroom.name);
      setMapTotal(data.classroom.map_total);
      setIsActive(data.classroom.is_active);
    }
    load();
  }, []);

  async function saveConfiguration() {
    setMessage('');
    const res = await fetch('/api/teacher/configuration', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        classroomName,
        mapTotal,
        isActive,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || 'Errorea gordetzean');
      return;
    }

    setMessage('Gordeta!');
    setCurrentPassword('');
    setNewPassword('');
    if (data.classroom) {
      setClassroom(data.classroom);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="island-title text-2xl text-amber-400">Konfigurazioa</h2>
        <p className="text-amber-600 text-sm">Klasearen eta kontuaren ezarpenak</p>
      </div>

      <div className="card-dark p-6 space-y-4">
        <h3 className="text-amber-400 font-bold">Klasea</h3>
        <p className="text-xs text-amber-700">Kodea: {classroom?.code || '---'}</p>

        <div>
          <label className="text-sm text-amber-500 block mb-1">Izena</label>
          <input
            value={classroomName}
            onChange={(e) => setClassroomName(e.target.value)}
            className="w-full bg-amber-50 text-amber-900 rounded-lg p-2"
          />
        </div>

        <div>
          <label className="text-sm text-amber-500 block mb-1">Helburua (map_total)</label>
          <input
            type="number"
            min={10}
            max={200}
            value={mapTotal}
            onChange={(e) => setMapTotal(Number(e.target.value))}
            className="w-full bg-amber-50 text-amber-900 rounded-lg p-2"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-amber-400">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          Klasea aktibo dago
        </label>
      </div>

      <div className="card-dark p-6 space-y-4">
        <h3 className="text-amber-400 font-bold">Pasahitza aldatu</h3>
        <input
          type="password"
          placeholder="Uneko pasahitza"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="w-full bg-amber-50 text-amber-900 rounded-lg p-2"
        />
        <input
          type="password"
          placeholder="Pasahitz berria"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full bg-amber-50 text-amber-900 rounded-lg p-2"
        />
      </div>

      <button onClick={saveConfiguration} className="btn-gold">Gorde aldaketak</button>

      {message && <p className="text-sm text-amber-400">{message}</p>}
    </div>
  );
}
