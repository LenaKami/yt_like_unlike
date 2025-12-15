import { useState, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../Auth/AuthContext';
import { Input } from "../ui"
import { useForm, type SubmitHandler } from "react-hook-form";
import { type FileFormData, validationSchema } from "../types_file";
import { zodResolver } from '@hookform/resolvers/zod'
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

export const FilePage = () => {
  const classinput =
    "input-color border border-gray-300 text-white sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 border-gray-600 placeholder-gray-400 focus:ring-slate-500 focus:border-slate-500";
  const classlabel = "block mb-2 text-sm font-medium text-white";
  
  const [players, setPlayers] = useState<PlayerYT[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddFolderModal, setShowAddFolderModal] = useState(false);
  
  // Stan dla folderu (obsługiwany ręcznie, bez React Hook Form)
  const [newFolderName, setNewFolderName] = useState('');
  
  // Wybrane ID folderu do podświetlenia (opcjonalne)
  const [selectedFolderId, setSelectedFolderId] = useState<number>(1);
  
  const navigate = useNavigate();
  const { username } = useAuthContext();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FileFormData>({
    resolver: zodResolver(validationSchema),
  });

  // Mockup folders
  const [folders, setFolders] = useState<Folder[]>([
    { id: 1, name: 'Matematyka', isExpanded: true },
    { id: 2, name: 'Fizyka', isExpanded: false },
  ]);

  // Mockup documents
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
    // ... (Twoja logika usuwania bez zmian)
  };

  const handleOnClickLike = async (like: string, id: number) => {
    // ... (Twoja logika like bez zmian)
  };

  const handleDownloadDocument = (docId: number) => {
    console.log('Downloading document:', docId);
    setMessage('📥 Pobieranie dokumentu (mockup)...');
  };

  const handleShareDocument = (docId: number, docName: string) => {
    console.log('Sharing document:', docId, docName);
    setMessage(`🔗 Udostępnianie: ${docName} (mockup)`);
  };

  // --- POPRAWIONA FUNKCJA DODAWANIA DOKUMENTU ---
  const handleAddDocument: SubmitHandler<FileFormData> = (data) => {
    // Dane z formularza są w obiekcie 'data'
    // data.file jest typu FileList, więc musimy pobrać pierwszy element
    const fileObj = data.file && data.file.length > 0 ? data.file[0] : null;

    if (!fileObj) {
        setMessage('❌ Błąd: Nie wybrano pliku');
        return;
    }

    const newDoc: Document = {
      id: documents.length + 1,
      name: data.filename, // Pobieramy nazwę z inputa formularza
      uploadDate: new Date().toISOString().split('T')[0],
      folderId: Number(data.folderId), // Pobieramy wybrane ID folderu
    };

    setDocuments([...documents, newDoc]);
    setMessage('✅ Dokument dodany (mockup)');
    
    // Resetujemy formularz i zamykamy modal
    reset();
    setShowAddModal(false);
  };

  // --- FUNKCJA DODAWANIA FOLDERU (Obsługa przez useState) ---
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

  if (loading) return <div className="text-center text-white mt-10">Loading...</div>;

  return (
    <div className="login-box container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-slate-900 dark:text-slate-100">Materiały</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Box 1 - Twoje materiały */}
        <div className="login-box p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2 text-slate-900 dark:text-slate-100">Twoje materiały</h2>
          
          <div className="mb-4">
            {folders.map((folder) => (
              <div key={folder.id} className="mb-4">
                <div className="rounded-lg p-4 border box">
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
                            className="flex items-center justify-between py-2 px-3 rounded transition"
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
                className="flex-1 log-in py-2.5 font-medium"
              >
                <PlusIcon className="w-5 h-5 inline mr-2" />
                Dodaj materiał
              </button>
              <button
                onClick={() => setShowAddFolderModal(true)}
                className="flex-1 log-in py-2.5 font-medium"
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

      <p className="text-green-200">message</p>

      {/* --- ADD MATERIAL MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="login-box rounded-lg p-6 w-full max-w-md relative">
            <button
              onClick={() => {
                setShowAddModal(false);
                reset(); // Czyścimy formularz przy zamknięciu
              }}
              className="absolute top-4 right-7 log-in-e"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
            
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">Dodaj materiał</h3>
            
            <form onSubmit={handleSubmit(handleAddDocument)} className="space-y-4 md:space-y-6">
              {/* Folder */}
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                  Folder
                </label>
                <select
                  {...register('folderId')} // Bez required: true, bo walidację robi Zod resolver
                  className="input-color w-full border border-gray-300 text-gray-900 sm:text-sm rounded-lg p-2.5 border-gray-600 focus:ring-slate-500 focus:border-slate-500"
                >
                  {folders.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
                </select>
                {errors.folderId && (
                  <p className="text-sm text-red-500 mt-1">{errors.folderId.message}</p>
                )}
              </div>

              {/* Nazwa dokumentu */}
              <div>
                <Input
                  label="Nazwa pliku"
                  {...register('filename')}
                  inputClassName={classinput}
                  labelClassName={classlabel}
                  error={errors.filename}
                />
              </div>

              {/* Plik */}
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                  Wybierz plik
                </label>
                <input
                  type="file"
                  {...register('file')}
                  className="input-color w-full border border-gray-300 text-gray-900 sm:text-sm rounded-lg p-2.5 border-gray-600 focus:ring-slate-500 focus:border-slate-500"
                />
                {errors.file && (
                  <p className="text-sm text-red-500 mt-1">{errors.file.message as string}</p>
                )}
              </div>

              {/* Akcje */}
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    reset();
                  }}
                  className="flex-1 log-in-e py-2"
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

      {/* --- ADD FOLDER MODAL --- */}
      {showAddFolderModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="login-box rounded-lg p-6 w-full max-w-md relative">
            <button
              onClick={() => {
                setShowAddFolderModal(false);
                setNewFolderName('');
              }}
              className="absolute top-4 right-7 log-in-e"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
            
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">Dodaj folder</h3>
            
            <div className="space-y-4">
              <div>
                {/* UWAGA: Ten input korzysta teraz ze stanu (useState), a nie register */}
                <Input
                  label="Nazwa folder"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  inputClassName={classinput}
                  labelClassName={classlabel}
                />
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddFolderModal(false);
                    setNewFolderName('');
                  }}
                  className="flex-1 log-in-e py-2"
                >
                  Anuluj
                </button>
                <button
                  onClick={handleAddFolder}
                  className="flex-1 log-in py-2"
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