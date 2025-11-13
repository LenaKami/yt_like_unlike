import { useState, useEffect, SetStateAction } from 'react';
import ReactPlayer from 'react-player';
import { useNavigate } from 'react-router-dom';
import { AddWaNavLink } from '../onkrzycz2';
import { routes } from '../routes';
import { useAuthContext } from '../Auth/AuthContext';
import { HandThumbUpIcon, HandThumbDownIcon } from '@heroicons/react/24/solid';

type PlayerYT = {
  _id: number;
  linkyt: string;
  category: string;
  like: [string];
  unlike: [string];
  countlike: number;
  countunlike: number;
};

export const File = () => {
  const [players, setPlayers] = useState<PlayerYT[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { isLoggedIn, username } = useAuthContext();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('http://localhost:5000/file/myfiles');
      const data = await res.json();
      if (Array.isArray(data.data)) setPlayers(data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const handleOnClickUpdate = (id: number) => {
    navigate(`/update/${id}`);
  };

  const handleOnClickDelete = async (id: number) => {
    try {
      const token = localStorage.getItem('jwtToken');
      if (!token) throw new Error('JWT token not found');
      const response = await fetch(`http://localhost:5000/file/delete/${id}`, {
        method: 'GET',
        headers: { Authorization: `${token}`, 'Content-Type': 'application/json' },
      });
      const dataa = await response.json();
      if (response.ok) {
        setPlayers(players.filter((p) => p._id !== id));
        setMessage(`✅ ${dataa.message}`);
      } else setMessage(`❌ ${dataa.message}`);
    } catch (error) {
      setMessage(`Error: ${(error as Error).message}`);
    }
  };

  const handleOnClickLike = async (like: string, id: number) => {
    try {
      const token = localStorage.getItem('jwtToken');
      if (!token) throw new Error('JWT token not found');
      const response = await fetch(`http://localhost:5000/player/${like}/${id}`, {
        method: 'POST',
        headers: { Authorization: `${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      const dataa = await response.json();
      setMessage(response.ok ? `✅ ${dataa.message}` : `❌ ${dataa.message}`);
      fetchData();
    } catch (error) {
      setMessage(`Error: ${(error as Error).message}`);
    }
  };

  if (loading) return <div className="text-center text-white mt-10">Loading...</div>;

  // 🔸 Dla przykładu — rozdzielamy materiały użytkownika i znajomych
  const myMaterials = players.filter((p) => p.category !== 'RAP'); // przykładowe
  const friendsMaterials = players.filter((p) => p.category === 'RAP'); // przykładowe

  return (
    <div className="min-h-screen bg-[#0d0d1a] text-white p-8 flex flex-col items-center">
      <div className="flex flex-col lg:flex-row gap-8 w-full max-w-7xl">
        {/* Box 1 - Twoje materiały */}
        <div className="flex-1 bg-[#1c1c2b] rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-yellow-300 mb-4">Twoje materiały</h2>
          {myMaterials.length === 0 && <p className="text-gray-400">Brak materiałów</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {myMaterials.map((player) => (
              <div
                key={player._id}
                className="bg-[#2a2a40] p-4 rounded-xl flex flex-col hover:shadow-lg hover:shadow-orange-400/10 transition"
              >
                <div className="rounded-lg overflow-hidden mb-2">
                  <ReactPlayer url={player.linkyt} width="100%" height="180px" controls />
                </div>
                <span className="text-sm text-orange-300 mb-2">{player.category}</span>

                <div className="flex justify-between items-center text-sm text-gray-300 mb-3">
                  <button
                    onClick={() => handleOnClickLike('like', player._id)}
                    className="flex items-center gap-1 hover:text-orange-400"
                  >
                    <HandThumbUpIcon className="w-4 h-4" /> {player.countlike}
                  </button>
                  <button
                    onClick={() => handleOnClickLike('unlike', player._id)}
                    className="flex items-center gap-1 hover:text-red-400"
                  >
                    <HandThumbDownIcon className="w-4 h-4" /> {player.countunlike}
                  </button>
                </div>

                <div className="flex gap-2 mt-auto">
                  <button
                    onClick={() => handleOnClickUpdate(player._id)}
                    className="flex-1 bg-green-600 hover:bg-green-500 py-2 rounded-lg text-sm"
                  >
                    Edytuj
                  </button>
                  <button
                    onClick={() => handleOnClickDelete(player._id)}
                    className="flex-1 bg-red-500 hover:bg-red-400 py-2 rounded-lg text-sm"
                  >
                    Usuń
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Box 2 - Materiały od znajomych */}
        <div className="flex-1 bg-[#1c1c2b] rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-yellow-300 mb-4">Materiały od znajomych</h2>
          {friendsMaterials.length === 0 && <p className="text-gray-400">Brak materiałów znajomych</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {friendsMaterials.map((player) => (
              <div
                key={player._id}
                className="bg-[#2a2a40] p-4 rounded-xl flex flex-col hover:shadow-lg hover:shadow-orange-400/10 transition"
              >
                <div className="rounded-lg overflow-hidden mb-2">
                  <ReactPlayer url={player.linkyt} width="100%" height="180px" controls />
                </div>
                <span className="text-sm text-orange-300 mb-2">{player.category}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {message && <p className="mt-6 text-sm text-gray-300">{message}</p>}
    </div>
  );
};
