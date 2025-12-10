import { useState } from 'react';
import { XMarkIcon, PlusIcon, ArrowLeftIcon, MusicalNoteIcon, TrashIcon } from '@heroicons/react/24/solid';
import ReactPlayer from 'react-player';

type MusicFolder = {
  id: number;
  name: string;
  icon: string;
};

type Song = {
  id: number;
  name: string;
  youtubeUrl: string;
  folderId: number;
};

export const MusicPage = () => {
  const [selectedFolder, setSelectedFolder] = useState<number | null>(null);
  const [showAddSongModal, setShowAddSongModal] = useState(false);
  const [newSongName, setNewSongName] = useState('');
  const [newSongUrl, setNewSongUrl] = useState('');
  const [message, setMessage] = useState('');

  // Mockup folders
  const [folders, setFolders] = useState<MusicFolder[]>([
    { id: 1, name: 'Nauka', icon: '📚' },
    { id: 2, name: 'Lokalizacja', icon: '📍' },
    { id: 3, name: 'Twoje playlisty', icon: '🎵' },
    { id: 4, name: 'Gatunki', icon: '🎸' },
    { id: 5, name: 'Znajomi', icon: '👥' },
  ]);

  // Mockup songs
  const [songs, setSongs] = useState<Song[]>([
    { id: 1, name: 'Muzyka do nauki #1', youtubeUrl: 'https://www.youtube.com/watch?v=jfKfPfyJRdk', folderId: 1 },
    { id: 2, name: 'Focus Music', youtubeUrl: 'https://www.youtube.com/watch?v=5qap5aO4i9A', folderId: 1 },
  ]);

  const handleAddSong = () => {
    if (!newSongName || !newSongUrl || selectedFolder === null) {
      setMessage('❌ Podaj nazwę i link do utworu');
      return;
    }
    
    const newSong: Song = {
      id: songs.length + 1,
      name: newSongName,
      youtubeUrl: newSongUrl,
      folderId: selectedFolder,
    };
    
    setSongs([...songs, newSong]);
    setMessage('✅ Utwór dodany (mockup)');
    setShowAddSongModal(false);
    setNewSongName('');
    setNewSongUrl('');
  };

  const handleDeleteSong = (songId: number) => {
    if (confirm('Czy na pewno chcesz usunąć ten utwór?')) {
      setSongs(songs.filter(s => s.id !== songId));
      setMessage('✅ Utwór usunięty');
    }
  };

  const handleDeleteFolder = (folderId: number) => {
    const folderSongs = songs.filter(s => s.folderId === folderId);
    const confirmMsg = folderSongs.length > 0 
      ? `Folder zawiera ${folderSongs.length} utworów. Czy na pewno chcesz usunąć folder i wszystkie utwory?`
      : 'Czy na pewno chcesz usunąć ten folder?';
    
    if (confirm(confirmMsg)) {
      setFolders(folders.filter(f => f.id !== folderId));
      setSongs(songs.filter(s => s.folderId !== folderId));
      setMessage('✅ Folder usunięty');
    }
  };

  const getYouTubeThumbnail = (url: string) => {
    const videoId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];
    return videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : '';
  };

  const currentFolderName = folders.find(f => f.id === selectedFolder)?.name || '';
  const currentFolderSongs = songs.filter(s => s.folderId === selectedFolder);

  if (selectedFolder !== null) {
    // Widok szczegółów folderu z utworami
    return (
      <div className="login-box container mx-auto p-4">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => setSelectedFolder(null)}
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
          >
            <ArrowLeftIcon className="w-6 h-6 text-slate-900 dark:text-slate-100" />
          </button>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{currentFolderName}</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentFolderSongs.map((song) => (
            <div key={song.id} className="login-box p-4 rounded shadow relative">
              <button
                onClick={() => handleDeleteSong(song.id)}
                className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 rounded-lg transition"
                title="Usuń utwór"
              >
                <TrashIcon className="w-4 h-4 text-white" />
              </button>
              <div className="aspect-video bg-slate-200 dark:bg-slate-700 rounded-lg overflow-hidden mb-3">
                {song.youtubeUrl && (
                  <img 
                    src={getYouTubeThumbnail(song.youtubeUrl)} 
                    alt={song.name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">{song.name}</h3>
              <a 
                href={song.youtubeUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Odtwórz na YouTube
              </a>
            </div>
          ))}

          {/* Kafelek dodawania */}
          <button
            onClick={() => setShowAddSongModal(true)}
            className="login-box p-4 rounded shadow flex flex-col items-center justify-center aspect-square hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            <div className="w-20 h-20 bg-slate-300 dark:bg-slate-600 rounded-full flex items-center justify-center mb-3">
              <PlusIcon className="w-10 h-10 text-slate-600 dark:text-slate-300" />
            </div>
            <span className="font-semibold text-slate-900 dark:text-slate-100">Dodaj utwór</span>
          </button>
        </div>

        {message && <p className="mt-4 text-sm text-slate-700 dark:text-slate-300">{message}</p>}

        {/* Add Song Modal */}
        {showAddSongModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="login-box rounded-lg p-6 w-full max-w-md relative">
              <button
                onClick={() => {
                  setShowAddSongModal(false);
                  setNewSongName('');
                  setNewSongUrl('');
                }}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
              
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">Dodaj utwór</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">Nazwa utworu</label>
                  <input
                    type="text"
                    value={newSongName}
                    onChange={(e) => setNewSongName(e.target.value)}
                    placeholder="np. Muzyka relaksacyjna"
                    className="input-color w-full border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block p-2.5 border-gray-600 placeholder-gray-400 focus:ring-slate-500 focus:border-slate-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">Link YouTube</label>
                  <input
                    type="text"
                    value={newSongUrl}
                    onChange={(e) => setNewSongUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="input-color w-full border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block p-2.5 border-gray-600 placeholder-gray-400 focus:ring-slate-500 focus:border-slate-500"
                  />
                </div>

                {newSongUrl && (
                  <div className="mt-3">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Podgląd:</p>
                    <img 
                      src={getYouTubeThumbnail(newSongUrl)} 
                      alt="Preview"
                      className="w-full rounded-lg"
                    />
                  </div>
                )}
                
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowAddSongModal(false);
                      setNewSongName('');
                      setNewSongUrl('');
                    }}
                    className="flex-1 log-in py-2 rounded-lg bg-gray-500 hover:bg-gray-600"
                  >
                    Anuluj
                  </button>
                  <button
                    onClick={handleAddSong}
                    className="flex-1 log-in py-2 rounded-lg font-medium"
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
  }

  // Główny widok z kafelkami folderów
  return (
    <div className="login-box container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-slate-900 dark:text-slate-100">Muzyka</h1>
      
      <div className="login-box p-6 rounded shadow">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {folders.map((folder) => (
            <div key={folder.id} className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteFolder(folder.id);
                }}
                className="absolute top-2 right-2 z-10 p-2 bg-red-500 hover:bg-red-600 rounded-lg transition"
                title="Usuń folder"
              >
                <TrashIcon className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={() => setSelectedFolder(folder.id)}
                className="w-full bg-slate-100 dark:bg-slate-700 p-6 rounded-xl border-2 border-slate-300 dark:border-slate-600 hover:border-orange-400 dark:hover:border-orange-400 transition flex flex-col items-center gap-4"
              >
                <div className="w-24 h-24 bg-slate-200 dark:bg-slate-600 rounded-2xl flex items-center justify-center text-5xl">
                  {folder.icon}
                </div>
                <span className="font-semibold text-lg text-slate-900 dark:text-slate-100">{folder.name}</span>
              </button>
            </div>
          ))}

          {/* Kafelek dodawania muzyki */}
          <button
            onClick={() => {
              setSelectedFolder(1); // Default to first folder or create new logic
              setShowAddSongModal(true);
            }}
            className="bg-slate-100 dark:bg-slate-700 p-6 rounded-xl border-2 border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-400 transition flex flex-col items-center gap-4"
          >
            <div className="w-24 h-24 bg-slate-300 dark:bg-slate-600 rounded-full flex items-center justify-center">
              <PlusIcon className="w-12 h-12 text-slate-600 dark:text-slate-300" />
            </div>
            <span className="font-semibold text-lg text-slate-900 dark:text-slate-100">Dodaj muzykę</span>
          </button>
        </div>
      </div>
    </div>
  );
};
