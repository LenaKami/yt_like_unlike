
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
  shared_at?: string;
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
  const [tasks, setTasks] = useState<Task[]>([]);


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
      if (!auth.username) {
        console.log('[HomePage] No username, skipping fetch');
        return;
      }
      try {
        const token = localStorage.getItem('jwtToken');
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
        console.log('[HomePage] Fetching recent files for:', auth.username);
        const res = await fetch(`${API_BASE}/file/recent-shared-by-friends/${auth.username}`, { headers });
        const json = await res.json();
        console.log('[HomePage] Fetch response:', json);
        if (json.status === 200 && Array.isArray(json.data)) {
          console.log('[HomePage] Setting files:', json.data);
          setRecentSharedFiles(json.data);
        } else {
          setRecentSharedFiles([]);
        }
      } catch (err) {
        console.error('[HomePage] Fetch error:', err);
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

  const formatRelativeDays = (iso: string | undefined | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    // normalize to local midnight
    const startOfDay = (dt: Date) => new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
    const days = Math.round((startOfDay(now).getTime() - startOfDay(d).getTime()) / (24 * 60 * 60 * 1000));
    if (days === 0) return 'dziś';
    if (days > 0) return `${days} dni temu`;
    return `za ${Math.abs(days)} dni`;
  };

  const loadTasks = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      console.log('[HomePage] loadTasks - raw data:', raw);
      if (raw) {
        const parsed: Task[] = JSON.parse(raw);
        const normalized = parsed.map((t) => ({ ...t, active: t.active ?? true }));
        normalized.sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
        console.log('[HomePage] loadTasks - parsed:', normalized);
        setTasks(normalized);
      } else {
        console.log('[HomePage] loadTasks - no data in storage');
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
  useEffect(() => {
    // Try to fetch study plan tasks from backend; if found, prefer them over localStorage
    const fetchStudyTasks = async () => {
      if (!auth.username) return;
      try {
        const res = await fetch(`${API_BASE}/study/plan/user/${auth.username}`);
        const json = await res.json();
        if (json.status === 200 && Array.isArray(json.data) && json.data.length > 0) {
          const plan = json.data[0];
          const res2 = await fetch(`${API_BASE}/study/plan/${plan.id}/lessons`);
          const json2 = await res2.json();
          if (json2.status === 200 && Array.isArray(json2.data) && json2.data.length > 0) {
            const mapped: Task[] = json2.data.map((l: any) => {
              const scheduled = l.scheduled_at ? new Date(l.scheduled_at) : null;
              const date = scheduled ? scheduled.toISOString().slice(0,10) : (l.scheduled_at ? String(l.scheduled_at).slice(0,10) : '');
              const start = scheduled ? scheduled.toTimeString().slice(0,5) : '';
              const end = scheduled && l.duration_minutes ? new Date(scheduled.getTime() + (l.duration_minutes||0)*60000).toTimeString().slice(0,5) : '';
              return {
                id: String(l.id),
                name: l.title,
                date,
                start,
                end,
                playlist: 'Plan',
                active: l.completed === undefined ? true : !l.completed,
              } as Task;
            });
            mapped.sort((a,b) => (a.date + a.start).localeCompare(b.date + b.start));
            setTasks(mapped);
            return;
          }
        }
      } catch (err) {
        console.error('[HomePage] fetchStudyTasks error', err);
      }
    };
    fetchStudyTasks();
  }, [auth.username]);

  const toggleActive = (id: string) => {
    setTasks((s) =>
      s.map((t) => (t.id === id ? { ...t, active: !t.active } : t))
    );
  };

  // Filter for incomplete tasks (active === true) and limit to 3
  const incompleteTasks = tasks.filter((t) => t.active !== false).slice(0, 3);

  // Use files returned from backend (backend already limits / sorts). Limit to 3 here as safety.
  const recentFiles = recentSharedFiles.slice(0, 3);






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
              {recentFiles.length === 0 ? (
                <div className="text-slate-400">Brak nowych plików udostępnionych przez znajomych w ostatnich 7 dniach.</div>
              ) : (
                    recentFiles.map((f) => (
                      <div key={f.id} className="p-3 border rounded box">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{f.username}</span> udostępnił/a „{f.filename}” ({formatRelativeDays(f.shared_at || f.created_at)})
                      </div>
                    ))
                  )}
            </div>
          </section>

          {/* Sekcja Nadchodzące zadania */}
          <section className="login-box p-4 rounded shadow">
            <h2 className="text-xl font-semibold mb-2 text-slate-900 dark:text-slate-100">Plan dnia</h2>
            <div className="space-y-3 text-slate-700 dark:text-slate-300">
              {incompleteTasks.length === 0 ? (
                <p>Brak zaplanowanych zadań. Przejdź do Plan nauki, aby dodać nowe.</p>
              ) : (
                <ul className="space-y-3">
                  {incompleteTasks.map((t) => (
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
                          {formatRelativeDays(t.date)} — {t.name}
                        </div>
                        <div className="text-xs">
                          {t.start}{t.end ? `-${t.end}` : ''} • {t.playlist}
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
