import React, { useEffect, useMemo, useState } from 'react';
import { Input } from '../ui/Input/Input';
import { CalendarIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/solid';
import { useForm, type SubmitHandler } from "react-hook-form";
import { type StudyFormData, validationSchema } from "../types_plan";
import { zodResolver } from "@hookform/resolvers/zod";
import { XMarkIcon,} from '@heroicons/react/24/solid';
import { useAuthContext } from '../Auth/AuthContext';
import { useToast } from '../Toast/ToastContext';
import musicApi from '../api/musicApi';

const STUDY_API = 'http://localhost:5000/study';

// ===== Playlist Option Type =====
type PlaylistOption = {
  id: string | number;
  name: string;
  type: 'subcategory' | 'playlist';
};

// ===== Playlist Ref Type (for storing in tasks) =====
type PlaylistRef = {
  type: 'subcategory' | 'playlist';
  id: number;
};

// ===== Types =====
type Task = {
  id: string;
  name: string;
  date: string; // yyyy-mm-dd
  start: string; // hh:mm
  end: string; // hh:mm
  playlist: PlaylistRef | null;
  active?: boolean;
};

// ===== Helpers =====
const startOfWeek = (d: Date) => {
  const date = new Date(d);
  const day = date.getDay() || 7;
  if (day !== 1) date.setDate(date.getDate() - (day - 1));
  date.setHours(0, 0, 0, 0);
  return date;
};

const endOfWeek = (d: Date) => {
  const s = startOfWeek(d);
  const e = new Date(s);
  e.setDate(e.getDate() + 6);
  e.setHours(23, 59, 59, 999);
  return e;
};

const toDate = (yyyyMmDd: string) => {
  const [y, m, d] = yyyyMmDd.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const sameMonth = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

// ===== Helper to convert PlaylistRef back to ID string (e.g., { type: "subcategory", id: 15 } -> "sub_15") =====
const playlistRefToId = (ref: PlaylistRef | null): string => {
  if (!ref) return '';
  const prefix = ref.type === 'subcategory' ? 'sub' : 'play';
  return `${prefix}_${ref.id}`;
};

// ===== Helper to parse playlist ID (e.g., "sub_15" -> { type: "subcategory", id: 15 }) =====
const parsePlaylistId = (playlistId: string): PlaylistRef | null => {
  if (!playlistId) return null;
  const [type, idStr] = playlistId.split('_');
  const id = parseInt(idStr, 10);
  if (isNaN(id)) return null;
  const fullType = type === 'sub' ? 'subcategory' : type === 'play' ? 'playlist' : null;
  return fullType ? { type: fullType as 'subcategory' | 'playlist', id } : null;
};

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

// ===== Component =====
export const PlanNaukiPage = () => {
  const classinput =
    'input-color border border-gray-300 text-white sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 border-gray-600 placeholder-gray-400 focus:ring-slate-500 focus:border-slate-500';
  const classlabel = 'block mb-2 text-sm font-medium text-white';

  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [playlistOptions, setPlaylistOptions] = useState<PlaylistOption[]>([]);
  const [playlist, setPlaylist] = useState<string>('');
  const [tasks, setTasks] = useState<Task[]>([]);

  const [monthCursor, setMonthCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<StudyFormData>({
    resolver: zodResolver(validationSchema),
  });
  const [showCalendar, setShowCalendar] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const { isLoggedIn, username } = useAuthContext();
  const [activePlanId, setActivePlanId] = useState<number | null>(null);
  const [pendingDeletions, setPendingDeletions] = useState<Record<string, number>>({});
  const [taskPlaylistMap, setTaskPlaylistMap] = useState<Record<string, PlaylistRef>>({}); // Map of taskId -> PlaylistRef
  const { showToast } = useToast();
  // Load playlist mapping from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('taskPlaylistMap');
      if (saved) {
        setTaskPlaylistMap(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load taskPlaylistMap', e);
    }
  }, []);

  // Save playlist mapping to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('taskPlaylistMap', JSON.stringify(taskPlaylistMap));
    } catch (e) {
      console.error('Failed to save taskPlaylistMap', e);
    }
  }, [taskPlaylistMap]);
  // Load playlists (categories, subcategories, user playlists)
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
        if (isLoggedIn && username) {
          const userPlaylists = await musicApi.getUserPlaylists(username);
          for (const p of userPlaylists) {
            options.push({
              id: `play_${p.id}`,
              name: p.name,
              type: 'playlist'
            });
          }
        }

        setPlaylistOptions(options);
        // Set default to first option
        if (options.length > 0 && !playlist) {
          setPlaylist(String(options[0].id));
        }
      } catch (e) {
        console.error('Błąd ładowania playlist:', e);
      }
    })();
  }, [isLoggedIn, username]);
  // Load plans and lessons from backend for logged in user
  useEffect(() => {
    if (!isLoggedIn || !username) return;
    (async () => {
      try {
        // Get plans for user
        const res = await fetch(`${STUDY_API}/plan/user/${username}`);
        const data = await res.json();
        if (data.status === 200 && Array.isArray(data.data) && data.data.length > 0) {
          const plan = data.data[0];
          setActivePlanId(plan.id);
          // fetch lessons
          const lres = await fetch(`${STUDY_API}/plan/${plan.id}/lessons`);
          const ldata = await lres.json();
          if (ldata.status === 200 && Array.isArray(ldata.data)) {
            const mapped = ldata.data.map((row: any) => {
              const date = row.scheduled_at ? row.scheduled_at.slice(0,10) : new Date(row.created_at).toISOString().slice(0,10);
              const start = row.scheduled_at ? row.scheduled_at.slice(11,16) : '09:00';
              const end = row.duration_minutes ? (()=>{
                const [h,m]=start.split(':').map(Number);
                const dt=new Date(); dt.setHours(h); dt.setMinutes(m+row.duration_minutes);
                return dt.toTimeString().slice(0,5);
              })() : '10:00';
              // Build PlaylistRef from backend data or fallback to localStorage
              let playlistRef: PlaylistRef | null = null;
              if (row.playlist_type && row.playlist_id) {
                playlistRef = { type: row.playlist_type, id: row.playlist_id };
              } else {
                playlistRef = taskPlaylistMap[String(row.id)] || null;
              }
              return { id: String(row.id), name: row.title, date, start, end, playlist: playlistRef, active: !row.completed } as Task;
            });
            setTasks(mapped);
          }
        } else {
          // create a default plan
          await fetch(`${STUDY_API}/plan/add`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_login: username, title: 'Mój plan' }) });
          // recall effect to load
          const retry = await fetch(`${STUDY_API}/plan/user/${username}`);
          const retryData = await retry.json();
          if (retryData.status === 200 && Array.isArray(retryData.data) && retryData.data.length>0) {
            setActivePlanId(retryData.data[0].id);
          }
        }
      } catch (e) {
        console.error('Błąd ładowania planu:', e);
      }
    })();
  }, [isLoggedIn, username, taskPlaylistMap]);

  // keep controlled playlist in sync with react-hook-form value for validation
  React.useEffect(() => {
    setValue('playlist', playlist);
  }, [playlist, setValue]);
// === tasksByDate ===
const tasksByDate = useMemo(() => {
  const map = new Map<string, Task[]>();
  tasks.forEach((t) => {
    const arr = map.get(t.date) ?? [];
    arr.push(t);
    map.set(t.date, arr);
  });
  return map;
}, [tasks]);


  useEffect(() => {
    try { localStorage.setItem('studyPlanTasks', JSON.stringify(tasks)); }
    catch (e) { console.error('Failed to save tasks', e); }
  }, [tasks]);

const onSubmit: SubmitHandler<StudyFormData> = (data) => {
  console.log('onSubmit called', data);
  // Parse playlist ID to get type and id
  const playlistRef = parsePlaylistId(playlist);
  
  // create task object locally; id will be replaced with backend id when available
  const tempId = String(Date.now());
  const newTask: Task = {
    id: tempId,
    name: data.taskname,
    date: data.dataaa,
    start: data.startg,
    end: data.endg,
    playlist: playlistRef,
    active: true,
  };

  // Optimistically add to UI
  setTasks((prev) =>
    [...prev, newTask].sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))
  );

  // show toast for added task
  showToast('Zadanie dodane', 'success');

  // persist to backend if we have an active plan and logged in
  if (activePlanId && username) {
    (async () => {
      try {
        const res = await fetch(`${STUDY_API}/plan/lesson/add`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            plan_id: activePlanId,
            title: data.taskname,
            description: '',
            scheduled_at: data.dataaa + ' ' + data.startg + ':00',
            duration_minutes: Math.max(1, (parseInt(data.endg.slice(0, 2)) * 60 + parseInt(data.endg.slice(3))) - (parseInt(data.startg.slice(0, 2)) * 60 + parseInt(data.startg.slice(3)))),
            playlist_type: playlistRef?.type || null,
            playlist_id: playlistRef?.id || null,
          }),
        });
        const j = await res.json();
        if (j && j.status === 200 && j.data && j.data.id) {
          // replace temp id with real id from backend
          const realId = String(j.data.id);
          setTasks((prev) => prev.map((t) => (t.id === tempId ? { ...t, id: realId } : t)));
          // Save the playlist mapping for this task
          if (playlistRef) {
            setTaskPlaylistMap((prev) => ({ ...prev, [realId]: playlistRef }));
          }
        } else {
          console.warn('Failed to get id from add lesson response', j);
          showToast('Nie udało się zapisać zadania na serwerze', 'error');
        }
      } catch (e) {
        console.error(e);
        showToast('Błąd podczas zapisywania zadania', 'error');
      }
    })();
  }

  reset();
  if (playlistOptions.length > 0) {
    setPlaylist(String(playlistOptions[0].id));
  }
};


const clearForm = () => {
reset();
if (playlistOptions.length > 0) {
  setPlaylist(String(playlistOptions[0].id));
}
};
  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !date || !start || !end) return;
    const playlistRef = parsePlaylistId(playlist);
    const newTask: Task = { id: String(Date.now()), name, date, start, end, playlist: playlistRef, active: true };
    setTasks((s) => [...s, newTask].sort((a,b)=> (a.date+a.start).localeCompare(b.date+b.start)));
    clearForm();
  };
  const editTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      setEditingTask(task);
      setName(task.name);
      setDate(task.date);
      setStart(task.start);
      setEnd(task.end);
      setPlaylist(playlistRefToId(task.playlist));
      setShowEditModal(true);
    }
  };

  const saveEdit = () => {
    if (!editingTask || !name || !date || !start || !end) return;
    const playlistRef = parsePlaylistId(playlist);
    setTasks((prev) =>
      prev.map(t => 
        t.id === editingTask.id 
          ? { ...t, name, date, start, end, playlist: playlistRef }
          : t
      ).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))
    );
    // update backend
    (async ()=>{
      try {
        await fetch(`${STUDY_API}/plan/lesson/update/${editingTask.id}`, {
          method: 'POST', headers: {'Content-Type':'application/json'},
          body: JSON.stringify({ 
            title: name, 
            scheduled_at: date + ' ' + start + ':00', 
            duration_minutes: Math.max(1, (parseInt(end.slice(0,2))*60+parseInt(end.slice(3)))-(parseInt(start.slice(0,2))*60+parseInt(start.slice(3)))),
            playlist_type: playlistRef?.type || null,
            playlist_id: playlistRef?.id || null,
          })
        });
        showToast('Zapisano zmiany', 'success');
        // Save the playlist mapping for this task
        if (playlistRef) {
          setTaskPlaylistMap((prev) => ({ ...prev, [editingTask.id]: playlistRef }));
        }
      } catch(e){ console.error(e); showToast('Błąd podczas zapisywania zmian', 'error'); }
    })();
    setShowEditModal(false);
    setEditingTask(null);
    clearForm();
  };

  const deleteTask = (id: string) => {
    setTasks((s)=> s.filter(t=> t.id!==id));
    (async ()=>{
      try { await fetch(`${STUDY_API}/plan/lesson/delete/${id}`); } catch(e){console.error(e)}
    })();
    // Remove from playlist mapping
    setTaskPlaylistMap((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    showToast('Zadanie usunięte', 'success');
    setShowEditModal(false);
    setEditingTask(null);
  };
  const toggleActive = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const isNowActive = !task.active;
    if (!isNowActive) {
      // User marked as completed -> schedule deletion after delay
      setTasks((s) => s.map((t) => (t.id === id ? { ...t, active: false } : t)));
      // schedule delete in 5s
      const timeoutId = window.setTimeout(async () => {
        try {
          if (!isNaN(Number(id))) {
            await fetch(`${STUDY_API}/plan/lesson/delete/${id}`);
            showToast('Zadanie zostało usunięte', 'success');
          }
        } catch (e) {
          console.error('Error deleting lesson', e);
          showToast('Błąd podczas usuwania zadania', 'error');
        }
        // remove pending marker
        setPendingDeletions((p) => {
          const copy = { ...p };
          delete copy[id];
          return copy;
        });
        // remove from UI
        setTasks((s) => s.filter((t) => t.id !== id));
      }, 5000);
      setPendingDeletions((p) => ({ ...p, [id]: timeoutId }));
      showToast('Zadanie oznaczone jako wykonane. Cofnij w ciągu 5s', 'info');
      return;
    }
    // User re-activated (unlikely via checkbox) -> cancel pending delete
    if (pendingDeletions[id]) {
      clearTimeout(pendingDeletions[id]);
      setPendingDeletions((p) => {
        const copy = { ...p };
        delete copy[id];
        return copy;
      });
      showToast('Przywrócono zadanie', 'info');
    }
    setTasks((s) => s.map((t) => (t.id === id ? { ...t, active: true } : t)));
  };

  const undoDelete = (id: string) => {
    if (pendingDeletions[id]) {
      clearTimeout(pendingDeletions[id]);
      setPendingDeletions((p) => {
        const copy = { ...p };
        delete copy[id];
        return copy;
      });
      setTasks((s) => s.map((t) => (t.id === id ? { ...t, active: true } : t)));
      showToast('Cofnięto usunięcie', 'info');
    }
  };

  const now = new Date();
  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(now);

  const { thisWeek, futureWeeks } = useMemo(() => {
    const thisWeek: Task[] = [], futureWeeks: Task[] = [];
    tasks.forEach(t=>{
      const d=toDate(t.date);
      if(d>=weekStart && d<=weekEnd) thisWeek.push(t);
      else if(d>weekEnd) futureWeeks.push(t);
    });
    return {thisWeek, futureWeeks};
  }, [tasks, weekStart, weekEnd]);

  const monthDays = useMemo(()=>{
    const first=new Date(monthCursor);
    const start=new Date(first);
    start.setDate(1);
    const startDay=(start.getDay()||7)-1;
    start.setDate(start.getDate()-startDay);
    const days: Date[]=[];
    for(let i=0;i<42;i++){ const d=new Date(start); d.setDate(start.getDate()+i); days.push(d);}
    return days;
  }, [monthCursor]);


  return (
    <div className="login-box container mx-auto p-4">
      <div className="flex items-center gap-2 mb-4">
        <h1 className="text-2xl font-bold">Plan nauki</h1>
        <div className="group relative">
          <QuestionMarkCircleIcon className="w-5 h-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-help" />
          <div className="absolute left-0 top-8 w-64 p-3 bg-white text-slate-900 text-sm rounded-lg shadow-xl border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            Planuj swoją naukę dodając zadania z datami i godzinami. Oznaczaj wykonane zadania.
            <div className="absolute -top-1 left-4 w-2 h-2 bg-white border-l border-t border-slate-200 rotate-45"></div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Form */}
        <section className="login-box p-4 rounded shadow">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-xl font-semibold">Dodaj zadanie</h2>
            <div className="group relative">
              <QuestionMarkCircleIcon className="w-4 h-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-help" />
              <div className="absolute left-0 top-6 w-56 p-2 bg-white text-slate-900 text-xs rounded-lg shadow-xl border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                Wypełnij formularz aby dodać nowe zadanie do planu nauki. Możesz wybrać playlistę muzyczną.
                <div className="absolute -top-1 left-4 w-2 h-2 bg-white border-l border-t border-slate-200 rotate-45"></div>
              </div>
            </div>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
<Input
label="Nazwa zadania"
{...register('taskname')}
error={errors.taskname}
inputClassName={classinput}
labelClassName={classlabel}
/>


<div className="grid grid-cols-1 md:grid-cols-3 gap-2">
<Input
label="Data"
type="date"
{...register('dataaa')}
error={errors.dataaa}
inputClassName={classinput}
labelClassName={classlabel}
/>
<Input
label="Start"
type="time"
{...register('startg')}
error={errors.startg}
inputClassName={classinput}
labelClassName={classlabel}
/>


<Input
label="Koniec"
type="time"
{...register('endg')}
error={errors.endg}
inputClassName={classinput}
labelClassName={classlabel}
/>
</div>


<div>
<label className={classlabel}>Playlist</label>
<select
value={playlist}
onChange={(e) => setPlaylist(e.target.value)}
className={classinput}
>
{playlistOptions.length === 0 ? (
  <option>Brak dostępnych playlist</option>
) : (
  playlistOptions.map((opt) => (
    <option key={opt.id} value={opt.id}>
      {opt.name}
    </option>
  ))
)}
</select>
</div>


<div className="flex gap-2">
<button type="button" onClick={clearForm} className="log-in-e flex-1 py-2">
Wyczyść
</button>
<button type="submit" className="log-in flex-1 py-2">
Dodaj
</button>
</div>
</form>
</section>

        {/* Tasks */}
        <section className="login-box p-4 rounded shadow space-y-6">
          {/* This week */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-lg font-semibold">Zadania na ten tydzień</h2>
              <div className="group relative">
                <QuestionMarkCircleIcon className="w-4 h-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-help" />
                <div className="absolute left-0 top-6 w-56 p-2 bg-white text-slate-900 text-xs rounded-lg shadow-xl border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  Zaznacz checkbox aby oznaczyć zadanie jako wykonane. Najedź na zadanie aby edytować.
                  <div className="absolute -top-1 left-4 w-2 h-2 bg-white border-l border-t border-slate-200 rotate-45"></div>
                </div>
              </div>
            </div>
            {thisWeek.length === 0 ? (
  <p>Brak zadań w tym tygodniu.</p>
) : (
  <ul className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
    {thisWeek.map((t) => (
      <li
        key={t.id}
        className={`p-2 border rounded flex items-start group ${
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
          <div className={`font-medium ${t.active === false ? 'line-through' : ''}`}>
            {t.date} — {t.name}
          </div>
          <div className="text-xs">
            {t.start}-{t.end} • {getPlaylistName(t.playlist, playlistOptions)}
          </div>
          <div className="absolute top-0 right-0 flex items-center gap-2">
            {pendingDeletions[t.id] ? (
              <button onClick={()=>undoDelete(t.id)} className="log-in-e px-2 py-1 text-xs">Cofnij</button>
            ) : (
              <button onClick={()=>editTask(t.id)} className="log-in px-2 py-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity">Edytuj</button>
            )}
          </div>
        </div>
            
      </li>
      
    ))}
  </ul>
)}

          </div>

          {/* Future weeks */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-lg font-semibold">Nadchodzące zadania</h2>
              <div className="group relative">
                <QuestionMarkCircleIcon className="w-4 h-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-help" />
                <div className="absolute left-0 top-6 w-56 p-2 bg-white text-slate-900 text-xs rounded-lg shadow-xl border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  Zadania zaplanowane na kolejne tygodnie.
                  <div className="absolute -top-1 left-4 w-2 h-2 bg-white border-l border-t border-slate-200 rotate-45"></div>
                </div>
              </div>
            </div>
            <ul className="space-y-2">
  {futureWeeks.length === 0 ? (
  <p>Brak nadchodzących zadań.</p>
) : (
  <ul className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
    {futureWeeks.map((t) => (
      <li
        key={t.id}
        className={`p-2 border rounded flex items-start group ${
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
          <div className={`font-medium ${t.active === false ? 'line-through' : ''}`}>
            {t.date} — {t.name}
          </div>
          <div className="text-xs">
            {t.start}-{t.end} • {getPlaylistName(t.playlist, playlistOptions)}
          </div>
          <div className="absolute top-0 right-0 flex items-center gap-2">
            {pendingDeletions[t.id] ? (
              <button onClick={()=>undoDelete(t.id)} className="log-in-e px-2 py-1 text-xs">Cofnij</button>
            ) : (
              <button onClick={()=>editTask(t.id)} className="log-in px-2 py-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity">Edytuj</button>
            )}
          </div>
        </div>
      </li>
    ))}
  </ul>
)}

</ul>

          </div>

          <div className='flex justify-center'>
            <button onClick={()=>setShowCalendar(true)} className="log-in flex justify-center items-center gap-3 px-4 py-1">
              <CalendarIcon className="w-5 h-5"/> Kalendarz
            </button>
          </div>
        </section>
        
      </div>

      {/* EDIT TASK MODAL */}
      {showEditModal && editingTask && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="login-box rounded-lg p-6 w-full max-w-md relative">
            <button
              onClick={() => {
                setShowEditModal(false);
                setEditingTask(null);
                clearForm();
              }}
              className="absolute top-4 right-7 log-in-e text-slate-900"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
            
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">Edytuj zadanie</h3>
            
            <div className="space-y-4">
              <Input
                label="Nazwa zadania"
                value={name}
                onChange={(e) => setName(e.target.value)}
                inputClassName={classinput}
                labelClassName={classlabel}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Input
                  label="Data"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  inputClassName={classinput}
                  labelClassName={classlabel}
                />
                <Input
                  label="Start"
                  type="time"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  inputClassName={classinput}
                  labelClassName={classlabel}
                />
                <Input
                  label="Koniec"
                  type="time"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  inputClassName={classinput}
                  labelClassName={classlabel}
                />
              </div>

              <div>
                <label className={classlabel}>Playlist</label>
                <select
                  value={playlist}
                  onChange={(e) => setPlaylist(e.target.value)}
                  className={classinput}
                >
                  {playlistOptions.length === 0 ? (
                    <option>Brak dostępnych playlist</option>
                  ) : (
                    playlistOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => deleteTask(editingTask.id)}
                  className="flex-1 log-in-e py-2 bg-red-500 hover:bg-red-600"
                >
                  Usuń
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingTask(null);
                    clearForm();
                  }}
                  className="flex-1 log-in-e py-2 bg-gray-500 hover:bg-gray-600"
                >
                  Anuluj
                </button>
                <button
                  type="button"
                  onClick={saveEdit}
                  className="flex-1 log-in py-2 font-medium"
                >
                  Zapisz
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Calendar modal */}
      {showCalendar && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="login-box p-4 rounded shadow w-full max-w-3xl relative">
            <button
              onClick={() => {
                setShowCalendar(false)
              }}
              className="absolute top-4 right-7 log-in-e text-slate-900"
            >
              <XMarkIcon className="w-6 h-6" />
            </button> 
            {/* Header with buttons next/prev */}
            <div className="flex items-center justify-start gap-4 mb-2">
              <h2 className="text-lg font-semibold">Kalendarz ({monthCursor.toLocaleString('pl-PL', { month: 'long', year: 'numeric' })})</h2>
              <div className="space-x-2">
                <button className="log-in px-2" onClick={()=>setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth()-1,1))}>‹</button>
                <button className="log-in px-2" onClick={()=>setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth()+1,1))}>›</button>
              </div>
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1 text-xs">
              {['Pn','Wt','Śr','Cz','Pt','So','Nd'].map(d=><div key={d} className="text-center font-semibold">{d}</div>)}
              {monthDays.map((d, i) => {
                const key = d.toISOString().slice(0, 10);
                const dayTasks = tasksByDate.get(key) || [];
                return (
                  <div
                    key={i}
                    className={`border rounded p-1 min-h-[70px] ${sameMonth(d, monthCursor) ? '' : 'opacity-40'}`}
                  >
                    <div className="font-semibold">{d.getDate()}</div>
                    {dayTasks.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center space-x-1 cursor-pointer"
                        title={`${t.start} - ${t.end} • ${getPlaylistName(t.playlist, playlistOptions)}`}
                      >
                        <span className={`w-2 h-2 rounded-full inline-block ${t.active ? 'bg-orange-500' : 'bg-gray-400'}`} />
                        <span className={`truncate text-xs ${t.active ? '' : 'line-through'}`}>{t.name}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
          
        </div>
      )}
    </div>
  );
};
