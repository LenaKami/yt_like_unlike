import { useState, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../Auth/AuthContext';
import { HandThumbUpIcon, HandThumbDownIcon, DocumentIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/solid';

type PlayerYT = {
  _id: number;
  linkyt: string;
  category: string;
  like: [string];
  unlike: [string];
  countlike: number;
  countunlike: number;
};

type Document = {
  id: number;
  name: string;
  uploadDate: string;
};

export const File = () => {
  const [players, setPlayers] = useState<PlayerYT[]>([]);
  const [loading, setLoading] = useState(true);
  // selected category (not used yet)
  const [message, setMessage] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const navigate = useNavigate();
  const { username } = useAuthContext();

  // Mockup documents - replace with backend data later
  const [documents, setDocuments] = useState<Document[]>([
    { id: 1, name: 'Notatki z wykładu 1.pdf', uploadDate: '2025-12-01' },
    { id: 2, name: 'Materiały dodatkowe.docx', uploadDate: '2025-12-05' },
    { id: 3, name: 'Prezentacja.pptx', uploadDate: '2025-12-08' },
  ]);

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

  const handleDownloadDocument = (docId: number) => {
    // Mockup - will be implemented with backend
    console.log('Downloading document:', docId);
    setMessage('📥 Pobieranie dokumentu (mockup)...');
  };

  const handleAddDocument = () => {
    if (!newDocName || !selectedFile) {
      setMessage('❌ Podaj nazwę i wybierz plik');
      return;
    }
    // Mockup - will be implemented with backend
    const newDoc: Document = {
      id: documents.length + 1,
      name: newDocName,
      uploadDate: new Date().toISOString().split('T')[0],
    };
    setDocuments([...documents, newDoc]);
    setMessage('✅ Dokument dodany (mockup)');
    setShowAddModal(false);
    setNewDocName('');
    setSelectedFile(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
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
          <h2 className="text-2xl font-semibold text-yellow-300 mb-4">Materiały</h2>
          
          {/* Documents Section */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-200 mb-3">Dokumenty</h3>
            <div className="space-y-2">
              {documents.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => handleDownloadDocument(doc.id)}
                  className="w-full flex items-center gap-3 bg-[#2a2a40] hover:bg-[#353550] p-3 rounded-lg transition group"
                >
                  <DocumentIcon className="w-5 h-5 text-blue-400 group-hover:text-blue-300" />
                  <div className="flex-1 text-left">
                    <p className="text-sm text-gray-200 group-hover:text-white">{doc.name}</p>
                    <p className="text-xs text-gray-500">{doc.uploadDate}</p>
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 py-3 rounded-lg font-medium transition"
            >
              <PlusIcon className="w-5 h-5" />
              Dodaj materiał
            </button>
          </div>

          {/* Video Materials */}
          <h3 className="text-lg font-medium text-gray-200 mb-3">Materiały wideo</h3>
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

      {/* Add Material Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1c1c2b] rounded-2xl p-6 w-full max-w-md relative">
            <button
              onClick={() => {
                setShowAddModal(false);
                setNewDocName('');
                setSelectedFile(null);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
            
            <h3 className="text-xl font-semibold text-yellow-300 mb-6">Dodaj materiał</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Nazwa dokumentu</label>
                <input
                  type="text"
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  placeholder="np. Notatki z wykładu"
                  className="w-full bg-[#2a2a40] text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-300 mb-2">Wybierz plik</label>
                <input
                  type="file"
                  onChange={handleFileSelect}
                  className="w-full bg-[#2a2a40] text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-orange-500 file:text-white file:cursor-pointer hover:file:bg-orange-400"
                />
                {selectedFile && (
                  <p className="mt-2 text-sm text-gray-400">Wybrany plik: {selectedFile.name}</p>
                )}
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setNewDocName('');
                    setSelectedFile(null);
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-500 py-2 rounded-lg transition"
                >
                  Anuluj
                </button>
                <button
                  onClick={handleAddDocument}
                  className="flex-1 bg-orange-500 hover:bg-orange-400 py-2 rounded-lg transition font-medium"
                >
                  Dodaj
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
