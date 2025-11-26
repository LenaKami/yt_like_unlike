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
};

export const PlanNaukiPage = () => {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [playlist, setPlaylist] = useState('Playlist 1');
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('studyPlanTasks');
      if (raw) setTasks(JSON.parse(raw));
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
    };
    setTasks((s) => [...s, newTask].sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start)));
    clearForm();
  };

  const removeTask = (id: string) => {
    setTasks((s) => s.filter((t) => t.id !== id));
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-slate-900 dark:text-slate-100">Plan nauki</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-white dark:bg-slate-800 p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2 text-slate-900 dark:text-slate-100">Dodaj zadanie</h2>
          <form onSubmit={addTask}>
            <Input
              label="Nazwa zadania"
              labelClassName="text-slate-700 dark:text-slate-200"
              value={name}
              onChange={(e) => setName(e.target.value)}
              inputClassName="w-full p-2 border rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            />

            <div className="flex space-x-2">
              <div className="flex-1">
                <label className="block text-slate-700 dark:text-slate-200">Data</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-2 border rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="flex-1">
                <label className="block text-slate-700 dark:text-slate-200">Start</label>
                <input
                  type="time"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  className="w-full p-2 border rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="flex-1">
                <label className="block text-slate-700 dark:text-slate-200">Koniec</label>
                <input
                  type="time"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  className="w-full p-2 border rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="my-2">
              <label className="block text-slate-700 dark:text-slate-200">Playlist</label>
              <select
                value={playlist}
                onChange={(e) => setPlaylist(e.target.value)}
                className="w-full p-2 border rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              >
                <option>Playlist 1</option>
                <option>Playlist 2</option>
                <option>Playlist 3</option>
              </select>
            </div>

            <div className="flex space-x-2 mt-3">
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Dodaj</button>
              <button type="button" onClick={clearForm} className="px-4 py-2 bg-blue-600 text-white rounded">Wyczyść</button>
            </div>
          </form>
        </section>

        <section className="bg-white dark:bg-slate-800 p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2 text-slate-900 dark:text-slate-100">Nadchodzące zadania</h2>
          {tasks.length === 0 ? (
            <Text>Brak zaplanowanych zadań.</Text>
          ) : (
            <ul className="space-y-3">
              {tasks.map((t) => (
                <li key={t.id} className="p-3 border rounded flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100">{t.name}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-300">{t.date} • {t.start} - {t.end} • {t.playlist}</div>
                  </div>
                  <div className="flex flex-col items-end">
                    <button onClick={() => removeTask(t.id)} className="text-sm text-red-600">Usuń</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};
