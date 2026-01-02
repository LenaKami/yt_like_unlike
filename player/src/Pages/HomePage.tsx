
import { useEffect, useState } from 'react';
import { Text } from '../ui/Text/Text';
import { useAuthContext } from '../Auth/AuthContext';

type SharedFile = {
  id: number;
  username: string;
  filename: string;
  category: string;
  filepath: string;
  created_at: string;
};

type Task = {
  id: string;
  name: string;
  date: string;
  start: string;
  end: string;
  playlist: string;
  active?: boolean;
};



type Friend = {
  id: string; // login
  name: string;
  avatar?: string;
  active?: boolean;
};

const STORAGE_KEY = 'studyPlanTasks';

export const HomePage = () => {
  const [recentSharedFiles, setRecentSharedFiles] = useState<SharedFile[]>([]);
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 't1',
      name: 'Przerobić lekcję funkcja kwadratowa',
      date: '2025-12-16',
      start: '10:00',
      end: '11:30',
      playlist: 'Nauka',
      active: true,
    },
    {
      id: 't2',
      name: 'Zadanie z algorytmów',
      date: '2025-12-17',
      start: '14:00',
      end: '15:00',
      playlist: 'Nauka',
      active: true,
    },
  ]);


  const [friends, setFriends] = useState<{
    id: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    active?: boolean;
  }[]>([]);
  const auth = useAuthContext();
  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

  useEffect(() => {
    const fetchRecentSharedFiles = async () => {
      if (!auth.username) return;
      try {
        const token = localStorage.getItem('jwtToken');
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`${API_BASE}/file/recent-shared-by-friends/${auth.username}`, { headers });
        const json = await res.json();
        if (json.status === 200 && Array.isArray(json.data)) {
          setRecentSharedFiles(json.data);
        } else {
          setRecentSharedFiles([]);
        }
      } catch (err) {
        setRecentSharedFiles([]);
      }
    };
    fetchRecentSharedFiles();
  }, [auth.username]);

  useEffect(() => {
    if (!auth.username) return;
    fetchOnlineFriends();
    // Optionally, poll every 60s for live updates
    const interval = setInterval(fetchOnlineFriends, 60000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.username]);

  const fetchOnlineFriends = async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API_BASE}/friend/online/${auth.username}`, { headers });
      const json = await res.json();
      // json.data is array of { login, profile_picture, first_name, last_name }
      const list: Friend[] = (json.data || []).map((u: any) => ({
        id: u.login,
        firstName: u.first_name || u.login,
        lastName: u.last_name || '',
        avatar: u.profile_picture,
        active: true,
      }));
      setFriends(list);
    } catch (err) {
      console.error('fetchOnlineFriends error', err);
    }
  };

  const getInitials = (first?: string, last?: string) => {
    const parts = `${first || ''} ${last || ''}`.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const loadTasks = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: Task[] = JSON.parse(raw);
        const normalized = parsed.map((t) => ({ ...t, active: t.active ?? true }));
        normalized.sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
        setTasks(normalized);
      } else {
        setTasks([]);
      }
    } catch (e) {
      console.error('Failed to read tasks from storage', e);
    }
  };

  useEffect(() => {
    loadTasks();
    const handler = () => loadTasks();
    window.addEventListener('tasks-updated', handler);
    return () => window.removeEventListener('tasks-updated', handler);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
      console.error('Failed to save tasks to storage', e);
    }
  }, [tasks]);

  const toggleActive = (id: string) => {
    setTasks((s) =>
      s.map((t) => (t.id === id ? { ...t, active: !t.active } : t))
    );
  };

  const upcoming = tasks.slice(0, 5);






  return (
    <div className="login-box container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-slate-900 dark:text-slate-100">Start</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Lewa kolumna */}
        <div className="flex flex-col gap-6 md:col-span-2">

          {/* Sekcja Nowości */}
          <section className="login-box p-4 rounded shadow">
            <h2 className="text-xl font-semibold mb-2 text-slate-900 dark:text-slate-100">Nowości</h2>
            <div className="space-y-3 text-slate-700 dark:text-slate-300">
              <p>Witaj! Sprawdź najnowsze materiały i aktualizacje.</p>
              {recentSharedFiles.length === 0 ? (
                console.log(recentSharedFiles.length),
                <div className="text-slate-400">Brak nowych plików udostępnionych przez znajomych w ostatnich 7 dniach.</div>
              ) : (
                recentSharedFiles.map((f) => (
                  <div key={f.id} className="p-3 border rounded box">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{f.username}</span> udostępnił/a „{f.filename}” ({new Date(f.created_at).toLocaleDateString()})
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Sekcja Nadchodzące zadania */}
          <section className="login-box p-4 rounded shadow">
            <h2 className="text-xl font-semibold mb-2 text-slate-900 dark:text-slate-100">Nadchodzące zadania</h2>
            <div className="space-y-3 text-slate-700 dark:text-slate-300">
              {upcoming.length === 0 ? (
                <p>Brak zaplanowanych zadań. Przejdź do Plan nauki, aby dodać nowe.</p>
              ) : (
                <ul className="space-y-3">
                  {upcoming.map((t) => (
                    <li
                      key={t.id}
                      className={`p-3 border rounded flex items-start bg-slate-50 dark:bg-slate-700 ${
                        t.active === false ? 'opacity-50' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={t.active === false}
                        onChange={() => toggleActive(t.id)}
                        className="mr-3 mt-1"
                      />
                      <div className="flex-1 relative">
                        <div className={`font-medium ${t.active === false ? 'line-through text-slate-400' : 'text-slate-900 dark:text-slate-100'}`}> 
                          {t.date} — {t.name}
                        </div>
                        <div className="text-xs">
                          {t.start}-{t.end} • {t.playlist}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>

        {/* Prawa kolumna */}
        <section className="login-box p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2 text-slate-900 dark:text-slate-100">Aktywni znajomi</h2>
          {friends.length === 0 ? (
            <Text>Brak znajomych online.</Text>
          ) : (
            <ul className="space-y-3">
              {friends.slice(0, 6).map((f) => (
                <li key={f.id} className="p-3 border rounded flex items-center box">
                  {f.avatar ? (
                    <div className="relative mr-3">
                      <img
                        src={f.avatar}
                        alt={`${f.firstName} ${f.lastName}`}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                      <span
                        className={`absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full ring-2 ring-white dark:ring-slate-800 bg-green-400`}
                      />
                    </div>
                  ) : (
                    <div className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-100 font-medium mr-3">
                      {getInitials(f.firstName, f.lastName)}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {f.firstName} {f.lastName}
                      </div>
                    </div>
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
