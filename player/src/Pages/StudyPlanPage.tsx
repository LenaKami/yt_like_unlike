import React, { useEffect, useState } from 'react';
import { Input } from '../ui/Input/Input';
import { Text } from '../ui/Text/Text';

type Task = {
  id: string;
  name: string;
  date: string; // yyyy-mm-dd
  start: string; // hh:mm
  end: string; // hh:mm
  playlist: string;
  active?: boolean;
};

export const PlanNaukiPage = () => {
  const classinput = "input-color border border-gray-300 text-white sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 border-gray-600 placeholder-gray-400 focus:ring-slate-500 focus:border-slate-500"
  const classlabel = "block mb-2 text-sm font-medium text-white"
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [playlist, setPlaylist] = useState('Playlist 1');
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('studyPlanTasks');
      if (raw) {
        const parsed: Task[] = JSON.parse(raw);
        const normalized = parsed.map((t) => ({ ...t, active: t.active ?? true }));
        normalized.sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
        setTasks(normalized);
      }
    } catch (e) {
      console.error('Failed to read tasks from storage', e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('studyPlanTasks', JSON.stringify(tasks));
    } catch (e) {
      console.error('Failed to save tasks to storage', e);
    }
  }, [tasks]);

  const clearForm = () => {
    setName('');
    setDate('');
    setStart('');
    setEnd('');
    setPlaylist('Playlist 1');
  };

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !date || !start || !end) return;
    const newTask: Task = {
      id: String(Date.now()),
      name,
      date,
      start,
      end,
      playlist,
      active: true,
    };
    setTasks((s) => {
      const next = [...s, newTask].sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
      try { window.dispatchEvent(new Event('tasks-updated')); } catch (e) {}
      return next;
    });
    clearForm();
  };

  const removeTask = (id: string) => {
    setTasks((s) => s.filter((t) => t.id !== id));
  };

  const toggleActive = (id: string) => {
    setTasks((s) => {
      const next = s.map((t) => (t.id === id ? { ...t, active: !t.active } : t));
      try { window.dispatchEvent(new Event('tasks-updated')); } catch (e) {}
      return next;
    });
  };

  return (
    <div className="login-box container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Plan nauki</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="login-box  p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">Dodaj zadanie</h2>
        <form onSubmit={addTask} className="space-y-4 md:space-y-6">
          
          {/* Nazwa zadania - używamy Twojego komponentu Input */}
          <div className="relative">
            <Input label="Nazwa zadania" value={name} onChange={(e) => setName(e.target.value)} inputClassName={classinput}  labelClassName={classlabel} />
          </div>

          {/* Sekcja Daty i Czasu */}
          <div className="flex space-x-2">
            <div className="flex-1">
              <label className={classlabel}>Data</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`${classinput} !p-0.5 text-sm`} 
              />
            </div>
            <div className="flex-1">
              <label className={classlabel}>Start</label>
              <input
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className={`${classinput} !p-0.5 text-sm`} 
              />
            </div>
            <div className="flex-1">
              <label className={classlabel}>Koniec</label>
              <input
                type="time"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className={`${classinput} !p-0.5 text-sm`} 
              />
            </div>
          </div>

          {/* Playlist - Select */}
          <div>
            <label className={classlabel}>Playlist</label>
            <select
              value={playlist}
              onChange={(e) => setPlaylist(e.target.value)}
              className={classinput}
            >
              <option>Playlist 1</option>
              <option>Playlist 2</option>
              <option>Playlist 3</option>
            </select>
          </div>

          {/* Przyciski */}
          <div className="flex space-x-2 mt-4">
            <button type="submit" className="flex-1 log-in py-2">Dodaj</button>
            <button type="button" onClick={clearForm} className="flex-1 log-in-e">Wyczyść</button>
          </div>

        </form>
        </section>

        <section className="login-box  p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2 text-slate-900 dark:text-slate-100">Nadchodzące zadania</h2>
          <div className="space-y-3 text-slate-700 dark:text-slate-300">
            {tasks.length === 0 ? (
            <p>Brak zaplanowanych zadań.</p>
          ) : (
            <ul className="space-y-3">
              {tasks.map((t) => (
                <li key={t.id} className={`p-3 border rounded flex items-start bg-slate-50 dark:bg-slate-700 ${t.active === false ? 'opacity-50' : ''}`}>
                  <input type="checkbox" checked={t.active === false} onChange={() => toggleActive(t.id)} className="mr-3 mt-1" />
                  <div className="flex-1">
                    <div className={`font-semibold ${t.active === false ? 'text-slate-400' : 'text-slate-900 dark:text-slate-100'}`}>{t.name}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-300">{t.date} • {t.start} - {t.end} • {t.playlist}</div>
                  </div>
                  <div className="flex flex-col items-end">
                    <button onClick={() => removeTask(t.id)} className="text-sm log-in">Usuń</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          </div>
        </section>
      </div>
    </div>
  );
};
