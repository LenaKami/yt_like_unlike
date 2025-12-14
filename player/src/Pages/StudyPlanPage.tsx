import React, { useEffect, useMemo, useState } from 'react';
import { Input } from '../ui/Input/Input';
import { CalendarIcon } from '@heroicons/react/24/solid';

// ===== Types =====
type Task = {
  id: string;
  name: string;
  date: string; // yyyy-mm-dd
  start: string; // hh:mm
  end: string; // hh:mm
  playlist: string;
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

// ===== Component =====
export const PlanNaukiPage = () => {
  const classinput =
    'input-color border border-gray-300 text-white sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 border-gray-600 placeholder-gray-400 focus:ring-slate-500 focus:border-slate-500';
  const classlabel = 'block mb-2 text-sm font-medium text-white';

  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [playlist, setPlaylist] = useState('Playlist 1');
  const [tasks, setTasks] = useState<Task[]>([]);

  const [monthCursor, setMonthCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  const [showCalendar, setShowCalendar] = useState(false);

  // ===== Load tasks or add sample =====
// === Load sample tasks ===
useEffect(() => {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const sampleTasks: Task[] = [
    { id: '1', name: 'React – useState', date: fmt(today), start: '10:00', end: '11:00', playlist: 'Playlist 1', active: true },
    { id: '2', name: 'TypeScript – typy', date: fmt(new Date(today.getTime() + 86400000)), start: '12:00', end: '13:00', playlist: 'Playlist 2', active: true },
    { id: '3', name: 'Algorytmy – sortowanie', date: fmt(new Date(today.getTime() + 2*86400000)), start: '09:00', end: '10:30', playlist: 'Playlist 3', active: true },
    { id: '4', name: 'CSS Grid', date: fmt(new Date(today.getTime() + 7*86400000)), start: '14:00', end: '15:00', playlist: 'Playlist 1', active: true },
    { id: '5', name: 'Backend – API', date: fmt(new Date(today.getTime() + 10*86400000)), start: '16:00', end: '17:30', playlist: 'Playlist 2', active: true },

    // nadchodzące przykłady
    { id: 'u1', name: 'Projekt React', date: fmt(new Date(today.getTime() + 3*86400000)), start: '09:00', end: '10:00', playlist: 'Playlist 1', active: true },
    { id: 'u2', name: 'TypeScript – Interfejsy', date: fmt(new Date(today.getTime() + 4*86400000)), start: '11:00', end: '12:00', playlist: 'Playlist 2', active: true },
    { id: 'u3', name: 'Algorytmy – DFS', date: fmt(new Date(today.getTime() + 5*86400000)), start: '14:00', end: '15:00', playlist: 'Playlist 3', active: true },
    { id: 'u4', name: 'Node.js – API', date: fmt(new Date(today.getTime() + 6*86400000)), start: '16:00', end: '17:00', playlist: 'Playlist 1', active: true },
    { id: 'u5', name: 'CSS – Flexbox', date: fmt(new Date(today.getTime() + 7*86400000)), start: '18:00', end: '19:00', playlist: 'Playlist 2', active: true },
  ];

  setTasks(sampleTasks);
}, []);

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

  const clearForm = () => { setName(''); setDate(''); setStart(''); setEnd(''); setPlaylist('Playlist 1'); };
  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !date || !start || !end) return;
    const newTask: Task = { id: String(Date.now()), name, date, start, end, playlist, active: true };
    setTasks((s) => [...s, newTask].sort((a,b)=> (a.date+a.start).localeCompare(b.date+b.start)));
    clearForm();
  };
  const editTask = (id: string) => setTasks((s)=> s.filter(t=> t.id!==id));
  const toggleActive = (id: string) => setTasks((s)=> s.map(t=> t.id===id ? {...t, active:!t.active} : t));

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
      <h1 className="text-2xl font-bold mb-4">Plan nauki</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Form */}
        <section className="login-box p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">Dodaj zadanie</h2>
          <form onSubmit={addTask} className="space-y-4 md:space-y-6">
            <Input label="Nazwa zadania" value={name} onChange={(e)=>setName(e.target.value)} inputClassName={classinput} labelClassName={classlabel}/>
            <div className="flex space-x-2">
              <div className="flex-1"><label className={classlabel}>Data</label><input type="date" value={date} onChange={(e)=>setDate(e.target.value)} className={`${classinput} !p-0.5 text-sm`}/></div>
              <div className="flex-1"><label className={classlabel}>Start</label><input type="time" value={start} onChange={(e)=>setStart(e.target.value)} className={`${classinput} !p-0.5 text-sm`}/></div>
              <div className="flex-1"><label className={classlabel}>Koniec</label><input type="time" value={end} onChange={(e)=>setEnd(e.target.value)} className={`${classinput} !p-0.5 text-sm`}/></div>
            </div>
            <div><label className={classlabel}>Playlist</label><select value={playlist} onChange={(e)=>setPlaylist(e.target.value)} className={classinput}><option>Playlist 1</option><option>Playlist 2</option><option>Playlist 3</option></select></div>
            <div className="flex space-x-2 mt-4">
              <button type="button" onClick={clearForm} className="flex-1 log-in-e">Wyczyść</button>
              <button type="submit" className="flex-1 log-in py-2">Dodaj</button>
              
            </div>
          </form>
        </section>

        {/* Tasks */}
        <section className="login-box p-4 rounded shadow space-y-6">
          {/* This week */}
          <div>
            <h2 className="text-lg font-semibold mb-2">Zadania na ten tydzień</h2>
            {thisWeek.length===0?<p>Brak zadań w tym tygodniu.</p>:<ul className="space-y-2">{thisWeek.map(t=>(
              <li key={t.id} className={`p-2 border rounded flex items-start ${t.active===false?'opacity-50':''}`}>
                <input type="checkbox" checked={t.active===false} onChange={()=>toggleActive(t.id)} className="mr-3 mt-1"/>
                <div className="flex-1">
                  <div className={`font-medium ${t.active === false ? 'line-through' : ''}`}>{t.date} — {t.name}</div>
                  <div className="text-xs">{t.start}-{t.end} • {t.playlist}</div>
                </div>
                <button onClick={()=>editTask(t.id)} className="text-xs log-in">Edytuj</button>
              </li>
            ))}</ul>}
          </div>

          {/* Future weeks */}
          <div>
            <h2 className="text-lg font-semibold mb-2">Nadchodzące zadania</h2>
            <ul className="space-y-2">
  {tasks.map((t) => (
    <li
      key={t.id}
      className={`p-2 border rounded flex items-start group ${t.active === false ? 'opacity-50' : ''}`}
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
        <div className="text-xs">{t.start}-{t.end} • {t.playlist}</div>
        {/* Przycisk Edytuj - widoczny po najechaniu */}
        <button
          onClick={() => handleEditTask(t)}
          className="log-in absolute top-0 right-0 px-2 py-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
        > Edytuj
        </button>
      </div>
    </li>
  ))}
</ul>

          </div>

          <div className='flex justify-center'>
            <button onClick={()=>setShowCalendar(true)} className="log-in flex justify-center items-center gap-3 px-4 py-1">
              <CalendarIcon className="w-5 h-5"/> Kalendarz
            </button>
          </div>
        </section>
      </div>

      {/* Calendar modal */}
      {showCalendar && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="login-box p-4 rounded shadow w-full max-w-3xl relative">
            <button onClick={()=>setShowCalendar(false)} className="absolute top-2 right-5 log-in px-2">✕</button>
            
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
                        title={`${t.start} - ${t.end} • ${t.playlist}`}
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
