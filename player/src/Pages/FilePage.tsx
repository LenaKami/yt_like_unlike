import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../Auth/AuthContext';
import { Input } from "../ui"
import { useForm, type SubmitHandler } from "react-hook-form";
import { type FileFormData, type FolderFormData, documentValidationSchema, folderValidationSchema } from "../types_file";
import { zodResolver } from '@hookform/resolvers/zod'
import { PlusIcon, XMarkIcon, ShareIcon, FolderIcon, ChevronDownIcon, ChevronRightIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/solid';
import { fileApi, type FileFromBackend, type FolderFromBackend } from '../api/fileApi';

type Friend = {
  id: number;
  name: string;
};

export const FilePage = () => {
  const classinput =
    "input-color border border-gray-300 text-white sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 border-gray-600 placeholder-gray-400 focus:ring-slate-500 focus:border-slate-500";
  const classlabel = "block mb-2 text-sm font-medium text-white";
  
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddFolderModal, setShowAddFolderModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  
  const [documentToShare, setDocumentToShare] = useState<FileFromBackend | null>(null);
  const [selectedFriends, setSelectedFriends] = useState<number[]>([]);
  
  const navigate = useNavigate();
  const { username } = useAuthContext();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FileFormData>({
    resolver: zodResolver(documentValidationSchema),
  });

  const { 
    register: registerFolder, 
    handleSubmit: handleSubmitFolder, 
    formState: { errors: errorsFolder }, 
    reset: resetFolder 
  } = useForm<FolderFormData>({
    resolver: zodResolver(folderValidationSchema),
  });

  const [folders, setFolders] = useState<FolderFromBackend[]>([]);
  const [documents, setDocuments] = useState<FileFromBackend[]>([]);

  const [friends] = useState<Friend[]>([
    { id: 1, name: 'Anna Kowalska' },
    { id: 2, name: 'Jan Nowak' },
    { id: 3, name: 'Maria Wiśniewska' },
    { id: 4, name: 'Piotr Zieliński' },
  ]);

  useEffect(() => {
    if (username) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [username]);

  const fetchData = async () => {
    if (!username) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const [foldersData, filesData] = await Promise.all([
        fileApi.getUserFolders(username),
        fileApi.getUserFiles(username)
      ]);
      
      setFolders(foldersData);
      setDocuments(filesData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage('❌ Błąd podczas ładowania danych. Sprawdź czy backend działa.');
    } finally {
      setLoading(false);
    }
  };

  const handleShareDocument = (docId: number) => {
    const doc = documents.find(d => d.id === docId);
    if (doc) {
      setDocumentToShare(doc);
      setSelectedFriends([]);
      setShowShareModal(true);
    }
  };

  const handleConfirmShare = () => {
    if (selectedFriends.length === 0) {
      setMessage('❌ Wybierz co najmniej jednego znajomego');
      return;
    }
    const friendNames = friends
      .filter(f => selectedFriends.includes(f.id))
      .map(f => f.name)
      .join(', ');
    setMessage(`✅ Udostępniono "${documentToShare?.filename}" dla: ${friendNames}`);
    setShowShareModal(false);
    setDocumentToShare(null);
    setSelectedFriends([]);
  };

  const toggleFriendSelection = (friendId: number) => {
    setSelectedFriends(prev => 
      prev.includes(friendId) 
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleDownloadDocument = async (docId: number) => {
    const doc = documents.find(d => d.id === docId);
    if (!doc) return;
    
    setMessage('📥 Pobieranie dokumentu...');
    const success = await fileApi.downloadFile(doc.id, doc.filename);
    
    if (success) {
      setMessage('✅ Plik pobrany pomyślnie');
    } else {
      setMessage('❌ Błąd podczas pobierania pliku');
    }
    
    setTimeout(() => setMessage(''), 3000);
  };

  const handleAddDocument: SubmitHandler<FileFormData> = async (data) => {
    if (!username) {
      setMessage('❌ Błąd: Brak zalogowanego użytkownika');
      return;
    }

    const fileObj = data.file && data.file.length > 0 ? data.file[0] : null;

    if (!fileObj) {
      setMessage('❌ Błąd: Nie wybrano pliku');
      return;
    }

    // Znajdź nazwę folderu na podstawie ID
    const folder = folders.find(f => f.id === Number(data.folderId));
    const category = folder ? folder.foldername : 'Inne';

    const result = await fileApi.uploadFile(
      username,
      data.filename,
      category,
      fileObj
    );

    if (result.success) {
      setMessage('✅ Dokument dodany pomyślnie');
      reset();
      setShowAddModal(false);
      fetchData(); // Odśwież listę
    } else {
      setMessage(`❌ ${result.message}`);
    }

    setTimeout(() => setMessage(''), 3000);
  };

  const handleAddFolder: SubmitHandler<FolderFormData> = async (data) => {
    if (!username) {
      setMessage('❌ Błąd: Brak zalogowanego użytkownika');
      return;
    }

    const result = await fileApi.addFolder(username, data.foldername);

    if (result.success) {
      setMessage('✅ Folder dodany pomyślnie!');
      setShowAddFolderModal(false);
      resetFolder();
      fetchData(); // Odśwież listę
    } else {
      setMessage(`❌ ${result.message}`);
    }

    setTimeout(() => setMessage(''), 3000);
  };

  const toggleFolder = (folderId: number) => {
    setFolders(folders.map(f => {
      if (f.id === folderId) {
        return { ...f, isExpanded: !(f as any).isExpanded };
      }
      return f;
    }));
  };

  const getFileIcon = (filename: string) => {
    const lowerName = filename.toLowerCase();
    if (lowerName.endsWith('.pdf')) {
      return { icon: '📕', color: 'text-red-600' };
    } else if (lowerName.endsWith('.docx') || lowerName.endsWith('.doc')) {
      return { icon: '📘', color: 'text-blue-600' };
    } else if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) {
      return { icon: '📗', color: 'text-green-600' };
    } else {
      return { icon: '📄', color: 'text-gray-600' };
    }
  };

  const getFileExtension = (filename: string): string => {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : 'FILE';
  };

  if (loading) return <div className="text-center text-white mt-10">Loading...</div>;

  return (
    <div className="login-box container mx-auto p-4">
      <div className="flex items-center gap-2 mb-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Materiały</h1>
        <div className="group relative">
          <QuestionMarkCircleIcon className="w-5 h-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-help" />
          <div className="absolute left-0 top-8 w-64 p-3 bg-white text-slate-900 text-sm rounded-lg shadow-xl border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            Zarządzaj swoimi materiałami edukacyjnymi. Organizuj pliki w foldery i udostępniaj je znajomym.
            <div className="absolute -top-1 left-4 w-2 h-2 bg-white border-l border-t border-slate-200 rotate-45"></div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Box 1 - Twoje materiały */}
        <div className="login-box p-4 rounded shadow">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Twoje materiały</h2>
            <div className="group relative">
              <QuestionMarkCircleIcon className="w-4 h-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-help" />
              <div className="absolute left-0 top-6 w-56 p-2 bg-white text-slate-900 text-xs rounded-lg shadow-xl border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                Kliknij folder aby rozwinąć. Użyj ikon do pobierania lub udostępniania plików.
                <div className="absolute -top-1 left-4 w-2 h-2 bg-white border-l border-t border-slate-200 rotate-45"></div>
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            {folders.map((folder) => (
              <div key={folder.id} className="mb-4">
                <div className="rounded-lg p-4 border box">
                  <button
                    onClick={() => toggleFolder(folder.id)}
                    className="flex items-center gap-3 w-full mb-3"
                  >
                    {(folder as any).isExpanded ? (
                      <ChevronDownIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    ) : (
                      <ChevronRightIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    )}
                    <FolderIcon className="w-6 h-6 text-yellow-500" />
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{folder.foldername}</h3>
                  </button>
                  
                  {(folder as any).isExpanded && (
                    <div className="space-y-2 pl-2">
                      {documents
                        .filter((doc) => doc.category === folder.foldername)
                        .map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between py-2 px-3 rounded transition"
                          >
                            <button
                              onClick={() => handleDownloadDocument(doc.id)}
                              className="flex-1 flex items-center gap-3 text-left text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition"
                            >
                              <span className="text-2xl">{getFileIcon(doc.filename).icon}</span>
                              <div className="flex flex-col">
                                <span>{doc.filename}</span>
                                <span className={`text-xs ${getFileIcon(doc.filename).color}`}>
                                  {getFileExtension(doc.filename)}
                                </span>
                              </div>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShareDocument(doc.id);
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
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Materiały od znajomych</h2>
            <div className="group relative">
              <QuestionMarkCircleIcon className="w-4 h-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-help" />
              <div className="absolute left-0 top-6 w-56 p-2 bg-white text-slate-900 text-xs rounded-lg shadow-xl border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                Tutaj zobaczysz pliki, które znajomi udostępnili Tobie.
                <div className="absolute -top-1 left-4 w-2 h-2 bg-white border-l border-t border-slate-200 rotate-45"></div>
              </div>
            </div>
          </div>
          <p className="text-slate-700 dark:text-slate-300">Brak materiałów znajomych</p>
        </div>
      </div>

      {message && <p className="mt-4 text-sm text-green-600 dark:text-green-400">{message}</p>}

      {/* ADD MATERIAL MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="login-box rounded-lg p-6 w-full max-w-md relative">
            <button
              onClick={() => {
                setShowAddModal(false);
                reset();
              }}
              className="absolute top-4 right-7 log-in-e text-slate-900"
            >
              <XMarkIcon className="w-6 h-6 " />
            </button>
            
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">Dodaj materiał</h3>
            
            <form onSubmit={handleSubmit(handleAddDocument)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                  Folder
                </label>
                <select
                  {...register('folderId')}
                  className="input-color w-full border border-gray-300 text-gray-900 sm:text-sm rounded-lg p-2.5 border-gray-600 focus:ring-slate-500 focus:border-slate-500"
                >
                  {folders.length === 0 ? (
                    <option value="">Brak folderów - utwórz folder</option>
                  ) : (
                    folders.map((folder) => (
                      <option key={folder.id} value={folder.id}>
                        {folder.foldername}
                      </option>
                    ))
                  )}
                </select>
                {errors.folderId && (
                  <p className="text-sm text-red-500 mt-1">{errors.folderId.message}</p>
                )}
              </div>

              <div>
                <Input
                  label="Nazwa pliku"
                  {...register('filename')}
                  inputClassName={classinput}
                  labelClassName={classlabel}
                  error={errors.filename}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                  Wybierz plik (PDF, DOCX, XLSX)
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  {...register('file')}
                  className="input-color w-full border border-gray-300 text-gray-900 sm:text-sm rounded-lg p-2.5 border-gray-600 focus:ring-slate-500 focus:border-slate-500"
                />
                {errors.file && (
                  <p className="text-sm text-red-500 mt-1">{errors.file.message as string}</p>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    reset();
                  }}
                  className="flex-1 log-in-e py-2 bg-gray-500 hover:bg-gray-600"
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

      {/* ADD FOLDER MODAL */}
      {showAddFolderModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="login-box  p-6 w-full max-w-md relative">
            <button
              onClick={() => {
                setShowAddFolderModal(false);
                resetFolder();
              }}
              className="absolute top-4 right-7 log-in-e text-slate-900"
            >
              <XMarkIcon className="w-6 h-6 " />
            </button>
            
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">Dodaj folder</h3>
            
            <form
  onSubmit={handleSubmitFolder(handleAddFolder)}
  className="space-y-4 md:space-y-6"
>
  <Input
    label="Nazwa folderu"
    {...registerFolder('foldername')}
    inputClassName={classinput}
    labelClassName={classlabel}
    error={errorsFolder.foldername}
  />

  <div className="flex gap-3 mt-6">
    <button
      type="button"
      onClick={() => {
        setShowAddFolderModal(false);
        resetFolder();
      }}
      className="flex-1 log-in-e py-2 bg-gray-500 hover:bg-gray-600"
    >
      Anuluj
    </button>

    <button type="submit" className="flex-1 log-in py-2 font-medium">
      Dodaj
    </button>
  </div>
</form>
          </div>
        </div>
      )}

      {/* SHARE MODAL */}
      {showShareModal && documentToShare && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="login-box p-6 w-full max-w-md relative">
            <button
              onClick={() => {
                setShowShareModal(false);
                setDocumentToShare(null);
                setSelectedFriends([]);
              }}
              className="absolute top-4 right-7 log-in-e text-slate-900"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
            
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Udostępnij materiał
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              {documentToShare?.filename}
            </p>
            
            <div className="space-y-3 max-h-64 overflow-y-auto mb-6">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">
                Wybierz znajomych:
              </p>
              {friends.map((friend) => (
                <label
                  key={friend.id}
                  className="flex items-center gap-3 p-3 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition"
                >
                  <input
                    type="checkbox"
                    checked={selectedFriends.includes(friend.id)}
                    onChange={() => toggleFriendSelection(friend.id)}
                    className="w-5 h-5 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                  />
                  <span className="text-slate-900 dark:text-slate-100">{friend.name}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowShareModal(false);
                  setDocumentToShare(null);
                  setSelectedFriends([]);
                }}
                className="flex-1 log-in-e py-2 bg-gray-500 hover:bg-gray-600"
              >
                Anuluj
              </button>
              <button
                onClick={handleConfirmShare}
                className="flex-1 log-in py-2 font-medium"
              >
                Udostępnij ({selectedFriends.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
