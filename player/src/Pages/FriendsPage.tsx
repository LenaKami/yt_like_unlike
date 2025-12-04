import { useEffect, useState } from 'react';
import { Input } from '../ui/Input/Input';

type Friend = {
  id: string;
  firstName: string;
  lastName: string;
};

const STORAGE_KEY = 'friendsList';

export const FriendsPage = () => {
  const classinput = "input-color border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 border-gray-600 placeholder-gray-400 focus:ring-slate-500 focus:border-slate-500"
  const classlabel = "block mb-2 text-sm font-medium text-white"
  const [friends, setFriends] = useState<Friend[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setFriends(JSON.parse(raw));
    } catch (e) {
      console.error('Failed to read friends from storage', e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(friends));
    } catch (e) {
      console.error('Failed to save friends to storage', e);
    }
  }, [friends]);

  const addFriend = () => {
    if (!name.trim()) return;
    const parts = name.trim().split(/\s+/);
    const first = parts.shift() ?? '';
    const last = parts.join(' ');
    const newFriend: Friend = { id: String(Date.now()), firstName: first, lastName: last };
    setFriends((s) => [...s, newFriend]);
    setName('');
    setShowModal(false);
  };

  const removeFriend = (id: string) => setFriends((s) => s.filter((f) => f.id !== id));

  const getInitials = (first: string, last: string) => {
    const parts = `${first} ${last}`.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <div className="login-box container mx-auto p-4">
      <div className=" flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Znajomi</h1>
        <div className="flex items-center space-x-2">
          <button onClick={() => setShowModal(true)} className="px-3 py-1 log-in">Dodaj</button>
        </div>
      </div>

      <section className=" p-4 shadow">
        {friends.length === 0 ? (
          <p className="text-slate-700 dark:text-slate-300">Brak znajomych. Dodaj nowego.</p>
        ) : (
          <ul className="space-y-2">
            {friends.map((f) => (
              <li key={f.id} className="p-2 border rounded flex justify-between items-center bg-slate-50 dark:bg-slate-700">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-100 font-medium">{getInitials(f.firstName, f.lastName)}</div>
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100">{f.firstName} {f.lastName}</div>
                  </div>
                </div>
                <div>
                  <button onClick={() => removeFriend(f.id)} className="text-sm text-red-600">Usuń</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black opacity-50" onClick={() => setShowModal(false)} />
          <div className="login-box p-6 rounded shadow z-10 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-3 text-slate-900 dark:text-slate-100">Dodaj znajomego</h2>
            <div>
              <Input label="Imię i nazwisko" value={name} onChange={(e) => setName(e.target.value)} inputClassName={classinput} labelClassName={classlabel}/>
             </div>
            <div className="mt-4 flex justify-end space-x-2">
              <button onClick={() => setShowModal(false)} className="px-3 py-1 border ">Anuluj</button>
              <button onClick={addFriend} className="px-3 py-1 log-in ">Dodaj</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
