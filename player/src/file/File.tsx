import { useState, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../Auth/AuthContext';
import { HandThumbUpIcon, HandThumbDownIcon, DocumentIcon, PlusIcon, XMarkIcon, ShareIcon, FolderIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

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
  folderId: number;
};

type Folder = {
  id: number;
  name: string;
  isExpanded: boolean;
};

export const File = () => {
  const [players, setPlayers] = useState<PlayerYT[]>([]);
  const [loading, setLoading] = useState(true);
  // selected category (not used yet)
  const [message, setMessage] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddFolderModal, setShowAddFolderModal] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<number>(1);
  const navigate = useNavigate();
  const { username } = useAuthContext();

  // Mockup folders
  const [folders, setFolders] = useState<Folder[]>([
    { id: 1, name: 'Matematyka', isExpanded: true },
    { id: 2, name: 'Fizyka', isExpanded: false },
  ]);

  // Mockup documents - replace with backend data later
  const [documents, setDocuments] = useState<Document[]>([
    { id: 1, name: 'Całki', uploadDate: '2025-12-01', folderId: 1 },
    { id: 2, name: 'Funkcja kwadratowa', uploadDate: '2025-12-05', folderId: 1 },
    { id: 3, name: 'Wielomiany', uploadDate: '2025-12-08', folderId: 1 },
    { id: 4, name: 'Funkcja liniowa', uploadDate: '2025-12-10', folderId: 1 },
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

  const handleShareDocument = (docId: number, docName: string) => {
    // Mockup - will be implemented with backend
    console.log('Sharing document:', docId, docName);
    setMessage(`🔗 Udostępnianie: ${docName} (mockup)`);
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
      folderId: selectedFolderId,
    };
    setDocuments([...documents, newDoc]);
    setMessage('✅ Dokument dodany (mockup)');
    setShowAddModal(false);
    setNewDocName('');
    setSelectedFile(null);
  };

  const handleAddFolder = () => {
    if (!newFolderName) {
      setMessage('❌ Podaj nazwę folderu');
      return;
    }
    const newFolder: Folder = {
      id: folders.length + 1,
      name: newFolderName,
      isExpanded: true,
    };
    setFolders([...folders, newFolder]);
    setMessage('✅ Folder dodany (mockup)');
    setShowAddFolderModal(false);
    setNewFolderName('');
  };

  const toggleFolder = (folderId: number) => {
    setFolders(folders.map(f => 
      f.id === folderId ? { ...f, isExpanded: !f.isExpanded } : f
    ));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  if (loading) return <div className="text-center text-white mt-10">Loading...</div>;

  return (
    <div className="login-box container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-slate-900 dark:text-slate-100">Materiały</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Box 1 - Twoje materiały */}
        <div className="login-box p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2 text-slate-900 dark:text-slate-100">Twoje materiały</h2>
          
          {/* Documents Section */}
          <div className="mb-4">
            {folders.map((folder) => (
              <div key={folder.id} className="mb-4">
                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 border">
                  <button
                    onClick={() => toggleFolder(folder.id)}
                    className="flex items-center gap-3 w-full mb-3"
                  >
                    {folder.isExpanded ? (
                      <ChevronDownIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    ) : (
                      <ChevronRightIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    )}
                    <FolderIcon className="w-6 h-6 text-yellow-500" />
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{folder.name}</h3>
                  </button>
                  
                  {folder.isExpanded && (
                    <div className="space-y-2 pl-2">
                      {documents
                        .filter((doc) => doc.folderId === folder.id)
                        .map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between py-2 px-3 rounded hover:bg-slate-100 dark:hover:bg-slate-600 transition"
                          >
                            <button
                              onClick={() => handleDownloadDocument(doc.id)}
                              className="flex-1 text-left text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition"
                            >
                              {doc.name}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShareDocument(doc.id, doc.name);
                              }}
                              className="p-2 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 rounded-full transition ml-2"
                              title="Udostępnij"
                            >
                              <ShareIcon className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(true)}
                className="flex-1 log-in py-2.5 rounded-lg font-medium"
              >
                <PlusIcon className="w-5 h-5 inline mr-2" />
                Dodaj materiał
              </button>
              <button
                onClick={() => setShowAddFolderModal(true)}
                className="flex-1 log-in py-2.5 rounded-lg font-medium bg-blue-500 hover:bg-blue-600"
              >
                <PlusIcon className="w-5 h-5 inline mr-2" />
                Dodaj folder
              </button>
            </div>
          </div>
        </div>

        {/* Box 2 - Materiały od znajomych */}
        <div className="login-box p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2 text-slate-900 dark:text-slate-100">Materiały od znajomych</h2>
          <p className="text-slate-700 dark:text-slate-300">Brak materiałów znajomych</p>
        </div>
      </div>

      {message && <p className="mt-4 text-sm text-slate-700 dark:text-slate-300">{message}</p>}

      {/* Add Material Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="login-box rounded-lg p-6 w-full max-w-md relative">
            <button
              onClick={() => {
                setShowAddModal(false);
                setNewDocName('');
                setSelectedFile(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
            
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">Dodaj materiał</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">Folder</label>
                <select
                  value={selectedFolderId}
                  onChange={(e) => setSelectedFolderId(Number(e.target.value))}
                  className="input-color w-full border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block p-2.5 border-gray-600 placeholder-gray-400 focus:ring-slate-500 focus:border-slate-500"
                >
                  {folders.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">Nazwa dokumentu</label>
                <input
                  type="text"
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  placeholder="np. Notatki z wykładu"
                  className="input-color w-full border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block p-2.5 border-gray-600 placeholder-gray-400 focus:ring-slate-500 focus:border-slate-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">Wybierz plik</label>
                <input
                  type="file"
                  onChange={handleFileSelect}
                  className="input-color w-full border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block p-2.5 border-gray-600 placeholder-gray-400 focus:ring-slate-500 focus:border-slate-500"
                />
                {selectedFile && (
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Wybrany plik: {selectedFile.name}</p>
                )}
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setNewDocName('');
                    setSelectedFile(null);
                  }}
                  className="flex-1 log-in py-2 rounded-lg bg-gray-500 hover:bg-gray-600"
                >
                  Anuluj
                </button>
                <button
                  onClick={handleAddDocument}
                  className="flex-1 log-in py-2 rounded-lg font-medium"
                >
                  Dodaj
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Folder Modal */}
      {showAddFolderModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="login-box rounded-lg p-6 w-full max-w-md relative">
            <button
              onClick={() => {
                setShowAddFolderModal(false);
                setNewFolderName('');
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
            
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">Dodaj folder</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">Nazwa folderu</label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="np. Fizyka"
                  className="input-color w-full border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block p-2.5 border-gray-600 placeholder-gray-400 focus:ring-slate-500 focus:border-slate-500"
                />
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddFolderModal(false);
                    setNewFolderName('');
                  }}
                  className="flex-1 log-in py-2 rounded-lg bg-gray-500 hover:bg-gray-600"
                >
                  Anuluj
                </button>
                <button
                  onClick={handleAddFolder}
                  className="flex-1 log-in py-2 rounded-lg font-medium bg-blue-500 hover:bg-blue-600"
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
