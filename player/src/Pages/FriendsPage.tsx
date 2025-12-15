import { useEffect, useState } from 'react';
import { XMarkIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/solid';
import { Input } from '../ui/Input/Input';
import { useForm, type SubmitHandler } from "react-hook-form";
import { type FriendFormData, validationSchema } from "../types_friends";
import { zodResolver } from "@hookform/resolvers/zod";

type Friend = {
  id: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  active?: boolean;
};

const STORAGE_KEY = 'friendsList';

export const FriendsPage = () => {
  const classinput = "input-color border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 border-gray-600 placeholder-gray-400 focus:ring-slate-500 focus:border-slate-500"
  const classlabel = "block mb-2 text-sm font-medium text-white"
  const [friends, setFriends] = useState<Friend[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');

    const { register, handleSubmit, formState: { errors }, reset } = useForm<FriendFormData>({
      resolver: zodResolver(validationSchema),
    });
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setFriends(parsed);
          return;
        }
      }
      setFriends(MOCK_FRIENDS);
    } catch (e) {
      console.error('Failed to read friends', e);
      setFriends(MOCK_FRIENDS);
    }
  }, []);

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

  const handleAddFriend: SubmitHandler<FriendFormData> = async (data) => {
  const name = data.friend.trim();
  if (!name) return;

  const parts = name.split(/\s+/);
  const firstName = parts.shift() ?? '';
  const lastName = parts.join(' ');

  const newFriend: Friend = {
    id: String(Date.now()),
    firstName,
    lastName,
  };

  setFriends((prev) => [...prev, newFriend]);
  reset();
  setShowModal(false);
};


  const removeFriend = (id: string) => setFriends((s) => s.filter((f) => f.id !== id));

  const getInitials = (first: string, last: string) => {
    const parts = `${first} ${last}`.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const activeFriends = friends.filter(f => f.active);
  const allFriends = friends;

  const MOCK_FRIENDS: Friend[] = [
    { id: 'm1', firstName: 'Agnieszka', lastName: 'Kowalska', avatar: 'https://i.pravatar.cc/150?img=32', active: true },
    { id: 'm2', firstName: 'Marek', lastName: 'Nowak', avatar: 'https://i.pravatar.cc/150?img=12', active: true },
    { id: 'm3', firstName: 'Olga', lastName: 'Wiśniewska', avatar: 'https://i.pravatar.cc/150?img=45', active: false },
    { id: 'm4', firstName: 'Tomasz', lastName: 'Zieliński', avatar: 'https://i.pravatar.cc/150?img=7', active: true },
  ];

  const FriendListItem = ({ f }: { f: Friend }) => (
    <li className="p-3 border rounded flex items-center box">
      {f.avatar ? (
        <div className="relative mr-3">
          <img
            src={f.avatar}
            alt={`${f.firstName} ${f.lastName}`}
            className="h-10 w-10 rounded-full object-cover"
          />
          <span
            className={`absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full ring-2 ring-white dark:ring-slate-800 ${
              f.active ? 'bg-green-400' : 'bg-gray-400'
            }`}
          />
        </div>
      ) : (
        <div className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-100 font-medium mr-3">
          {getInitials(f.firstName, f.lastName)}
        </div>
      )}
      <div className="font-semibold text-slate-900 dark:text-slate-100">
        {f.firstName} {f.lastName}
      </div>
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
      </section>
<p className="text-green-200">message</p>
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
            <form
  onSubmit={handleSubmit(handleAddFriend)}
  className="space-y-4 md:space-y-6"
>
  <div>
    <Input
      label="Imię i nazwisko"
      {...register('friend', {
        required: 'Podaj imię i nazwisko',
      })}
      error={errors.friend}
      inputClassName={classinput}
      labelClassName={classlabel}
    />
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
      Dodaj
    </button>
  </div>
</form>

          </div>
        </div>
      )}
    </div>
  );
  
};
