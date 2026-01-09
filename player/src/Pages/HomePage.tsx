
import { useEffect, useState } from 'react';
import { Text } from '../ui/Text/Text';
import { useAuthContext } from '../Auth/AuthContext';
import musicApi from '../api/musicApi';

type PlaylistRef = {
  type: 'subcategory' | 'playlist';
  id: number;
};

type PlaylistOption = {
  id: string | number;
  name: string;
  type: 'subcategory' | 'playlist';
};

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
  playlist: PlaylistRef | null;
  active?: boolean;
};



type Friend = {
  id: string; // login
  name: string;
  avatar?: string;
  active?: boolean;
};

const STORAGE_KEY = 'studyPlanTasks';

// ===== Helper to get playlist name from PlaylistRef =====
const getPlaylistName = (playlistRef: PlaylistRef | null, options: PlaylistOption[]): string => {
  if (!playlistRef) return '';
  // opt.id is like "sub_15" or "play_16", we need to extract the numeric part and compare
  const option = options.find(opt => 
    opt.type === playlistRef.type && 
    String(opt.id).split('_').pop() === String(playlistRef.id)
  );
  return option ? option.name : '';
};

export const HomePage = () => {
  const [recentSharedFiles, setRecentSharedFiles] = useState<SharedFile[]>([]);
  const [playlistOptions, setPlaylistOptions] = useState<PlaylistOption[]>([]);
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 't1',
      name: 'Przerobić lekcję funkcja kwadratowa',
      date: '2025-12-16',
      start: '10:00',
      end: '11:30',
      playlist: null,
      active: true,
    },
    {
      id: 't2',
      name: 'Zadanie z algorytmów',
      date: '2025-12-17',
      start: '14:00',
      end: '15:00',
      playlist: null,
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

  // Load playlist options
  useEffect(() => {
    (async () => {
      try {
        const options: PlaylistOption[] = [];

        // Get categories and their subcategories
        const categories = await musicApi.getCategories();
        for (const cat of categories) {
          const subcats = await musicApi.getSubcategories(cat.id);
          for (const subcat of subcats) {
            options.push({
              id: `sub_${subcat.id}`,
              name: `${subcat.name}`,
              type: 'subcategory'
            });
          }
        }

        // Get user playlists if logged in
        if (auth.isLoggedIn && auth.username) {
          const userPlaylists = await musicApi.getUserPlaylists(auth.username);
          for (const p of userPlaylists) {
            options.push({
              id: `play_${p.id}`,
              name: p.name,
              type: 'playlist'
            });
          }
        }

        setPlaylistOptions(options);
      } catch (e) {
        console.error('Błąd ładowania playlist:', e);
      }
    })();
  }, [auth.isLoggedIn, auth.username]);

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

  const STUDY_API = `${API_BASE}/study`;

  const relativeDayLabel = (yyyyMmDd: string) => {
    try {
      const parts = yyyyMmDd.split('-').map(Number);
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const cmp = new Date(d);
      cmp.setHours(0, 0, 0, 0);
      const diffMs = cmp.getTime() - today.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return 'Dziś';
      if (diffDays === 1) return 'Jutro';
      return `Za ${diffDays} dni`;
    } catch (e) {
      return yyyyMmDd;
    }
  };

  const fetchUpcomingTasks = async () => {
    if (!auth.username) return;
    try {
      // get user's plan
      const res = await fetch(`${API_BASE}/study/plan/user/${auth.username}`);
      const j = await res.json();
      if (j && j.status === 200 && Array.isArray(j.data) && j.data.length > 0) {
        const plan = j.data[0];
        const lres = await fetch(`${API_BASE}/study/plan/${plan.id}/lessons`);
        const ljson = await lres.json();
        if (ljson && ljson.status === 200 && Array.isArray(ljson.data)) {
          const mapped: Task[] = ljson.data
            .map((row: any) => {
              const date = row.scheduled_at ? row.scheduled_at.slice(0, 10) : (row.created_at ? row.created_at.slice(0,10) : new Date().toISOString().slice(0,10));
              const start = row.scheduled_at ? row.scheduled_at.slice(11, 16) : '09:00';
              const end = row.duration_minutes ? (() => {
                const [h, m] = start.split(':').map(Number);
                const dt = new Date(); dt.setHours(h); dt.setMinutes(m + row.duration_minutes);
                return dt.toTimeString().slice(0, 5);
              })() : '10:00';
              // Build PlaylistRef from backend data
              let playlistRef: PlaylistRef | null = null;
              if (row.playlist_type && row.playlist_id) {
                playlistRef = { type: row.playlist_type, id: row.playlist_id };
              }
              return { id: String(row.id), name: row.title, date, start, end, playlist: playlistRef, active: !row.completed } as Task;
            })
            .filter((t: Task) => t.active !== false) // only incomplete
            .sort((a: Task, b: Task) => (a.date + a.start).localeCompare(b.date + b.start))
            .filter((t: Task) => {
              // only upcoming: date >= today
              const today = new Date(); today.setHours(0,0,0,0);
              const parts = t.date.split('-').map(Number);
              const d = new Date(parts[0], parts[1]-1, parts[2]); d.setHours(0,0,0,0);
              return d.getTime() >= today.getTime();
            })
            .slice(0, 3);
          setTasks(mapped);
          return;
        }
      }
      // fallback: empty
      setTasks([]);
    } catch (err) {
      console.error('fetchUpcomingTasks error', err);
    }
  };

  useEffect(() => {
    if (auth.username) {
      fetchUpcomingTasks();
    } else {
      loadTasks();
    }
    const handler = () => { if (!auth.username) loadTasks(); else fetchUpcomingTasks(); };
    window.addEventListener('tasks-updated', handler);
    return () => window.removeEventListener('tasks-updated', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.username]);

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
                          {relativeDayLabel(t.date)} — {t.name}
                        </div>
                        <div className="text-xs">
                          {t.start}-{t.end} • {getPlaylistName(t.playlist, playlistOptions)}
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
