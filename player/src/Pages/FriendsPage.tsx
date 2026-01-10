import { useEffect, useState, useRef } from 'react';
import { XMarkIcon, QuestionMarkCircleIcon, TrashIcon } from '@heroicons/react/24/solid';
import { Input } from '../ui/Input/Input';
import ConfirmModal from '../ui/ConfirmModal';
import { useForm, type SubmitHandler } from "react-hook-form";
import { type FriendFormData, validationSchema } from "../types_friends";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthContext } from '../Auth/AuthContext';
import { useToast } from '../Toast/ToastContext';

type Friend = {
  id: string; // login
  name: string;
  avatar?: string;
  active?: boolean;
};

const STORAGE_KEY = 'friendsList';

export const FriendsPage = () => {
  const classinput = "input-color border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 border-gray-600 placeholder-gray-400 focus:ring-slate-500 focus:border-slate-500"
  const classlabel = "block mb-2 text-sm font-medium text-white"
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<any[]>([]);
  const [message, setMessage] = useState<string>('');
  const messageTimeout = useRef<number | null>(null);
  const [messageType, setMessageType] = useState<'success'|'error'|'info'>('info');
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [suggestions, setSuggestions] = useState<{ login: string; profile_picture?: string }[]>([]);
  const searchTimeout = useRef<number | null>(null);

    const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<FriendFormData>({
      resolver: zodResolver(validationSchema),
    });
    const auth = useAuthContext();
    const { showToast } = useToast();
    const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
  useEffect(() => {
    if (!auth.username) return;
    fetchAll();

    const heartbeat = setInterval(() => {
      const token = localStorage.getItem('jwtToken');
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      fetch(`${API_BASE}/user/active`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: auth.username }),
      }).catch(() => {});
    }, 30000);

    return () => clearInterval(heartbeat);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.username]);

  const fetchAll = async () => {
    await Promise.all([fetchFriends(), fetchOnlineFriends(), fetchRequests()]);
  };

  const fetchFriends = async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      const headers: any = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`${API_BASE}/friend/${auth.username}`, { headers });
      const json = await res.json();
      const list: Friend[] = await Promise.all((json.data || []).map(async (login:string) => {
        // Try to fetch user's profile picture
        let avatarUrl = undefined;
        try {
          const imgRes = await fetch(`${API_BASE}/user/${login}/image`);
          if (imgRes.ok) {
            const blob = await imgRes.blob();
            avatarUrl = URL.createObjectURL(blob);
          }
        } catch (e) {
          // No avatar, use default
        }
        return { id: login, name: login, avatar: avatarUrl, active: false };
      }));
      setFriends(list);
    } catch (err) {
      console.error('fetchFriends error', err);
    }
  };

  const fetchOnlineFriends = async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      const headers: any = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`${API_BASE}/friend/online/${auth.username}`, { headers });
      const json = await res.json();
      const online = (json.data || []).map((u:any) => u.login);
      setFriends((prev) => prev.map(f => ({ ...f, active: online.includes(f.id) })));
    } catch (err) {
      console.error('fetchOnlineFriends error', err);
    }
  };

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      const headers: any = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const [incRes, outRes] = await Promise.all([
        fetch(`${API_BASE}/friend/requests/incoming/${auth.username}`),
        fetch(`${API_BASE}/friend/requests/outgoing/${auth.username}`),
      ]);
      const incJson = await incRes.json();
      const outJson = await outRes.json();
      setIncomingRequests(incJson.data || []);
      setOutgoingRequests(outJson.data || []);
    } catch (err) {
      console.error('fetchRequests error', err);
    }
  };

  const sendFriendRequest = async (toUser: string) => {
    try {
      const token = localStorage.getItem('jwtToken');
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/friend/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from_user: auth.username, to_user: toUser }),
      });
      const json = await res.json();
      
      if (res.ok) {
        showToast('Wysłano zaproszenie', 'success');
      } else {
        showToast(json.message || 'Nie udało się wysłać zaproszenia', 'error');
      }
      
      if (messageTimeout.current) window.clearTimeout(messageTimeout.current);
      messageTimeout.current = window.setTimeout(() => setMessage(''), 3000) as unknown as number;
      await fetchRequests();
    } catch (err) {
      console.error('sendFriendRequest error', err);
      showToast('Błąd podczas wysyłania zaproszenia', 'error');
    }
  };

  const handleAddFriend: SubmitHandler<FriendFormData> = async (data) => {
  const toUser = data.friend.trim();
  if (!toUser) return;
  await sendFriendRequest(toUser);
  reset();
  setShowModal(false);
};


  const removeFriend = (id: string) => setFriends((s) => s.filter((f) => f.id !== id));

  const removeFriendBackend = async (friendId: string) => {
    try {
      const token = localStorage.getItem('jwtToken');
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/friend/delete/${auth.username}`, {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ friend_username: friendId }),
      });

      if (res.ok) {
        setFriends((s) => s.filter((f) => f.id !== friendId));
        // also refresh requests/online if needed
        await fetchOnlineFriends();
        setMessage('✅ Usunięto znajomego');
        if (messageTimeout.current) window.clearTimeout(messageTimeout.current);
        messageTimeout.current = window.setTimeout(() => setMessage(''), 3000) as unknown as number;
      } else {
        console.error('Failed to remove friend', await res.text());
      }
    } catch (err) {
      console.error('removeFriendBackend error', err);
    }
  };

  const getInitials = (name: string) => {
    const parts = `${name}`.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  // confirmation modal for removing friend
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingFriendId, setPendingFriendId] = useState<string | null>(null);

  const openRemoveFriendModal = (id: string) => {
    setPendingFriendId(id);
    setConfirmOpen(true);
  };

  const doRemoveFriendPending = async () => {
    if (!pendingFriendId) return;
    const id = pendingFriendId;
    setConfirmOpen(false);
    setPendingFriendId(null);
    await removeFriendBackend(id);
  };

  const formatRelativeDate = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.setHours(0,0,0,0) - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Dziś';
    if (days === 1) return '1 dzień temu';
    return `${days} dni temu`;
  };

  const activeFriends = friends.filter(f => f.active);
  const allFriends = friends;



  const FriendListItem = ({ f }: { f: Friend }) => (
    <li className="p-3 border rounded flex items-center box group relative">
      <div className="relative mr-3">
        {f.avatar ? (
          <img
            src={f.avatar}
            alt={`${f.name}`}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-100 font-medium">
            {getInitials(f.name)}
          </div>
        )}
        <span
          className={`absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full ring-2 ring-white dark:ring-slate-800 ${
            f.active ? 'bg-green-400' : 'bg-gray-400'
          }`}
        />
      </div>
      <div className="font-semibold text-slate-900 dark:text-slate-100">
        {f.name}
      </div>

      <button
        title="Usuń znajomego"
        onClick={(e) => {
          e.stopPropagation();
          openRemoveFriendModal(f.id);
        }}
        className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 bg-red-500 hover:bg-red-600 dark:bg-red-500 dark:hover:bg-red-600 rounded-lg opacity-0 group-hover:opacity-100 z-10"
      >
        <TrashIcon className="w-4 h-4 text-white" />
      </button>
    </li>
  );


  return (
    <div className="login-box container mx-auto p-4">
      <div className="grid grid-cols-3 items-center mb-4">
        <div /> {/* lewa kolumna – pusta, dla równowagi świata */}

        <div className="flex items-center justify-center gap-2">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Znajomi
          </h1>
          <div className="group relative">
            <QuestionMarkCircleIcon className="w-5 h-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-help" />
            <div className="absolute left-0 top-8 w-64 p-3 bg-white text-slate-900 text-sm rounded-lg shadow-xl border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              Zarządzaj listą swoich znajomych. Możesz im udostępniać materiały edukacyjne.
              <div className="absolute -top-1 left-4 w-2 h-2 bg-white border-l border-t border-slate-200 rotate-45"></div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => setShowModal(true)}
            className="px-3 py-1 log-in"
          >
            Dodaj znajomego
          </button>
        </div>
      </div>

      <section className="space-y-6">
        {/* AKTYWNI */}
        <div>
          <h2 className="text-xl font-semibold mb-3 text-slate-900 dark:text-slate-100">
            Aktywni znajomi
          </h2>

          {activeFriends.length === 0 ? (
            <p className="text-slate-600 dark:text-slate-400">
              Brak aktywnych znajomych
            </p>
          ) : (
            <ul className="space-y-3">
              {activeFriends.map(f => (
                <FriendListItem key={f.id} f={f} />
              ))}
            </ul>
          )}
        </div>
        

        {/* WSZYSCY */}
        <div>
          <h2 className="text-xl font-semibold mb-3 text-slate-900 dark:text-slate-100">
            Wszyscy znajomi
          </h2>

          {allFriends.length === 0 ? (
            <p className="text-slate-600 dark:text-slate-400">
              Brak znajomych
            </p>
          ) : (
            <ul className="space-y-3">
              {allFriends.map(f => (
                <FriendListItem key={f.id} f={f} />
              ))}
            </ul>
          )}
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-3 text-slate-900 dark:text-slate-100">
            Zaproszenia od znajomych
          </h2>
          {incomingRequests.length === 0 ? (
            <p className="text-slate-600 dark:text-slate-400">Brak zaproszeń</p>
          ) : (
            <ul className="space-y-3">
              {incomingRequests.map((r) => (
                <li key={r.id} className="p-3 border rounded flex items-center box group relative">
                  <div className="flex items-center mr-3 min-w-[120px]">
                    <div className="relative mr-2">
                      {/* Avatar lub inicjały */}
                      {r.profile_picture ? (
                        <img
                          src={r.profile_picture.startsWith('http') ? r.profile_picture : `/files/${r.profile_picture}`}
                          alt={r.from_user}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-100 font-medium">
                          {r.from_user ? r.from_user[0].toUpperCase() : '?'}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100 leading-tight">{r.from_user}</div>
                      <div className="text-xs text-slate-600 leading-tight">{formatRelativeDate(r.created_at)}</div>
                    </div>
                  </div>
                  <div className="flex gap-2 absolute right-3 top-1/2 -translate-y-1/2">
                    <button
                      type="button"
                      onClick={async () => {
                        const token = localStorage.getItem('jwtToken');
                        const headers: any = {};
                        if (token) headers.Authorization = `Bearer ${token}`;
                        const res = await fetch(`${API_BASE}/friend/requests/${r.id}/reject`, { method: 'POST', headers });
                        try {
                          const json = await res.json();
                          setMessage(json.message || (res.ok ? '❌ Zaproszenie odrzucone' : 'Błąd'));
                          setMessageType(res.ok ? 'success' : 'error');
                        } catch { }
                        if (messageTimeout.current) window.clearTimeout(messageTimeout.current);
                        messageTimeout.current = window.setTimeout(() => setMessage(''), 3000) as unknown as number;
                        await fetchRequests();
                      }}
                      className="log-in-e px-4 py-2 font-medium"
                    >
                      Odrzuć
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const token = localStorage.getItem('jwtToken');
                        const headers: any = {};
                        if (token) headers.Authorization = `Bearer ${token}`;
                        const res = await fetch(`${API_BASE}/friend/requests/${r.id}/accept`, { method: 'POST', headers });
                        try {
                          const json = await res.json();
                          setMessage(json.message || (res.ok ? '✅ Zaproszenie zaakceptowane' : 'Błąd'));
                          setMessageType(res.ok ? 'success' : 'error');
                        } catch { }
                        if (messageTimeout.current) window.clearTimeout(messageTimeout.current);
                        messageTimeout.current = window.setTimeout(() => setMessage(''), 3000) as unknown as number;
                        await fetchAll();
                      }}
                      className="log-in px-4 py-2 font-medium"
                    >
                      Akceptuj
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
{message && (
  <p
    className={
      messageType === 'success'
        ? 'text-green-600 bg-green-100 border border-green-300 rounded px-3 py-2'
        : messageType === 'error'
        ? 'text-red-600 bg-red-100 border border-red-300 rounded px-3 py-2'
        : 'text-slate-700 bg-slate-100 border border-slate-300 rounded px-3 py-2'
    }
  >
    {message}
  </p>
)}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black opacity-50" onClick={() => setShowModal(false)} />
          <div className="login-box rounded-lg p-6 w-full max-w-md relative">
            <button
        onClick={() => {
          setShowModal(false);
        }}
        className="absolute top-4 right-7 log-in-e"
      >
        <XMarkIcon className="w-6 h-6" />
      </button>
            <h2 className="text-lg font-semibold mb-3 text-slate-900 dark:text-slate-100">Dodaj znajomego</h2>
                        <form onSubmit={handleSubmit(handleAddFriend)} className="space-y-4 md:space-y-6">
                          <div className="relative">
                            <Input
                              label="Login użytkownika"
                              {...register('friend', {
                                required: 'Podaj login użytkownika',
                                onChange: (e: any) => {
                                  const q = e.target.value || '';
                                  setValue('friend', q);
                                  if (searchTimeout.current) window.clearTimeout(searchTimeout.current);
                                  if (!q || q.trim().length === 0) {
                                    setSuggestions([]);
                                    return;
                                  }
                                  searchTimeout.current = window.setTimeout(async () => {
                                    try {
                                      const token = localStorage.getItem('jwtToken');
                                      const headers: any = {};
                                      if (token) headers.Authorization = `Bearer ${token}`;
                                      const res = await fetch(`${API_BASE}/user/search?query=${encodeURIComponent(q)}`, { headers });
                                      const json = await res.json();
                                      setSuggestions(json.data || []);
                                    } catch (err) {
                                      console.error('search error', err);
                                    }
                                  }, 300) as unknown as number;
                                }
                              })}
                              error={errors.friend}
                              inputClassName={classinput}
                              labelClassName={classlabel}
                            />

                            {suggestions.length > 0 && (
                              <ul className="absolute left-0 right-0 mt-1 bg-white border rounded shadow z-50 max-h-48 overflow-auto">
                                {suggestions.map((s) => (
                                  <li
                                    key={s.login}
                                    className="px-3 py-2 cursor-pointer hover:bg-slate-100 flex items-center gap-2"
                                    onClick={() => {
                                      setValue('friend', s.login);
                                      setSuggestions([]);
                                    }}
                                  >
                                    <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden">
                                      {s.profile_picture ? <img src={`/files/${s.profile_picture}`} alt={s.login} className="w-full h-full object-cover" /> : <div className="w-full h-full" />}
                                    </div>
                                    <div className="font-medium">{s.login}</div>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>

  <div className="flex gap-3 mt-6">
    <button
      type="button"
      onClick={() => setShowModal(false)}
      className="flex-1 log-in-e py-2 font-medium"
    >
      Anuluj
    </button>

    <button
      type="submit"
      className="flex-1 log-in py-2 font-medium"
    >
      Wyślij zaproszenie
    </button>
  </div>
</form>

          </div>
        </div>
      )}
      <ConfirmModal
        open={confirmOpen}
        message={pendingFriendId ? 'Czy na pewno chcesz usunąć tego znajomego?' : ''}
        onCancel={() => { setConfirmOpen(false); setPendingFriendId(null); }}
        onConfirm={doRemoveFriendPending}
      />
    </div>
  );
  
};
