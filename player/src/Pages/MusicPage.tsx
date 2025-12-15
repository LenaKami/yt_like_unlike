import { useState } from 'react';
import {
  XMarkIcon,
  PlusIcon,
  ArrowLeftIcon,
  TrashIcon,
  PlayIcon,
  PauseIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/solid';
import { Input } from "../ui";
import { type SongFormData, type PlaylistFormData, songValidationSchema, playlistValidationSchema } from "../types_music";
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type SubmitHandler } from "react-hook-form";
import { useMusicContext } from "../Music/MusicContext";

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
  const classinput = "input-color border border-gray-300 text-white sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 border-gray-600 placeholder-gray-400 focus:ring-slate-500 focus:border-slate-500";
  const classlabel = "block mb-2 text-sm font-medium text-white";

  const {
    currentSong,
    isPlaying,
    folders,
    songs,
    setFolders,
    setSongs,
    handlePlaySong,
    getYouTubeThumbnail,
  } = useMusicContext();

  const [selectedFolder, setSelectedFolder] = useState<number | null>(null);
  const [showAddSongModal, setShowAddSongModal] = useState(false);
  const [showAddPlaylistaModal, setShowAddPlaylistaModal] = useState(false);
  const [message, setMessage] = useState('');

  // Formularz dla utworów
  const { register: registerSong, handleSubmit: handleSubmitSong, formState: { errors: errorsSong }, reset: resetSong, watch: watchSong } = useForm<SongFormData>({
    resolver: zodResolver(songValidationSchema)
  });

  // Formularz dla playlist
  const { register: registerPlaylist, handleSubmit: handleSubmitPlaylist, formState: { errors: errorsPlaylist }, reset: resetPlaylist } = useForm<PlaylistFormData>({
    resolver: zodResolver(playlistValidationSchema)
  });

  const handleAddSong: SubmitHandler<SongFormData> = (data) => {
    if (selectedFolder === null) return;

    const newSong: Song = {
      id: Date.now(),
      name: data.namesong,
      youtubeUrl: data.linkyt,
      folderId: selectedFolder,
    };

    setSongs(prev => [...prev, newSong]);
    setMessage('✅ Utwór dodany');
    setShowAddSongModal(false);
    resetSong();
  };

  const handleDeleteSong = (songId: number) => {
    if (confirm('Czy na pewno chcesz usunąć ten utwór?')) {
      setSongs(prev => prev.filter(s => s.id !== songId));
      setMessage('✅ Utwór usunięty');
    }
  };

  const handleDeleteFolder = (folderId: number) => {
    const folderSongs = songs.filter(s => s.folderId === folderId);
    const confirmMsg = folderSongs.length > 0
      ? `Folder zawiera ${folderSongs.length} utworów. Czy na pewno chcesz usunąć folder i wszystkie utwory?`
      : 'Czy na pewno chcesz usunąć ten folder?';

    if (confirm(confirmMsg)) {
      setFolders(prev => prev.filter(f => f.id !== folderId));
      setSongs(prev => prev.filter(s => s.folderId !== folderId));
      setMessage('✅ Folder usunięty');
    }
  };

  const currentFolderName = folders.find(f => f.id === selectedFolder)?.name || '';
  const currentFolderSongs = songs.filter(s => s.folderId === selectedFolder);

  /** RENDER: FOLDER VIEW */
  if (selectedFolder !== null) {
    return (
      <div className="login-box container mx-auto p-4 pb-24">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => setSelectedFolder(null)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition">
            <ArrowLeftIcon className="w-6 h-6 text-slate-900 dark:text-slate-100" />
          </button>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{currentFolderName}</h1>
        </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentFolderSongs.map((song) => (
              <div key={song.id} className="login-box p-4 rounded shadow relative group">
                <button
                  onClick={() => handleDeleteSong(song.id)}
                  className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 dark:bg-red-500 dark:hover:bg-red-600 dark:bg-red-500 dark:hover:bg-red-600 rounded-lg opacity-0 group-hover:opacity-100 z-10"
                  title="Usuń utwór"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>

                <button onClick={() => handlePlaySong(song)} className="w-full">
                  <div className="aspect-video  rounded-lg overflow-hidden mb-3 relative group">
                    <img src={getYouTubeThumbnail(song.youtubeUrl)} alt={song.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                      {currentSong?.id === song.id && isPlaying ? (
                        <PauseIcon className="w-12 h-12 text-white" />
                      ) : (
                        <PlayIcon className="w-12 h-12 text-white" />
                      )}
                    </div>
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2 text-left">{song.name}</h3>
                </button>
              </div>
            ))}

            {/* Dodaj utwór */}
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

          {/* Modal dodawania utworu */}
          {showAddSongModal && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
              <div className="login-box rounded-lg p-6 w-full max-w-md relative">
                <button
                  onClick={() => { setShowAddSongModal(false); resetSong(); }}
                  className="absolute top-4 right-7 log-in-e text-slate-900"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>

                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">Dodaj utwór</h3>

                <form onSubmit={handleSubmitSong(handleAddSong)} className="space-y-4 md:space-y-6">
                  <Input
                    label="Nazwa utworu"
                    {...registerSong("namesong")}
                    error={errorsSong.namesong}
                    inputClassName={classinput}
                    labelClassName={classlabel}
                  />
                  <Input
                    label="Link do YouTube"
                    {...registerSong("linkyt")}
                    error={errorsSong.linkyt}
                    inputClassName={classinput}
                    labelClassName={classlabel}
                  />

                  {/* Preview */}
                  {watchSong("linkyt") && (
                    <div className="mt-3">
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Podgląd:</p>
                      <img src={getYouTubeThumbnail(watchSong("linkyt"))} alt="Preview" className="w-full rounded-lg" />
                    </div>
                  )}

                  <div className="flex gap-3 mt-6">
                    <button 
                      type="button" 
                      onClick={() => {
                        setShowAddSongModal(false);
                        resetSong();
                      }} 
                      className="flex-1 log-in-e py-2  bg-gray-500 hover:bg-gray-600"
                    >
                      Anuluj
                    </button>
                    <button type="submit" className="flex-1 log-in py-2  font-medium">Dodaj</button>
                  </div>
                </form>
              </div>
            </div>
          )}
      </div>
    );
  }

  /** RENDER: MAIN FOLDER VIEW */
  return (
    <div className="login-box container mx-auto p-4 pb-24">
      <div className="flex items-center gap-2 mb-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Muzyka</h1>
        <div className="group relative">
          <QuestionMarkCircleIcon className="w-5 h-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-help" />
          <div className="absolute left-0 top-8 w-64 p-3 bg-white text-slate-900 text-sm rounded-lg shadow-xl border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            Zarządzaj swoimi playlistami YouTube. Odtwarzacz działa globalnie we wszystkich widokach.
            <div className="absolute -top-1 left-4 w-2 h-2 bg-white border-l border-t border-slate-200 rotate-45"></div>
          </div>
        </div>
      </div>

        <div className="login-box p-6 rounded shadow">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {folders.map((folder) => (
              <div key={folder.id} className="relative group">
                <button
                  onClick={() => setSelectedFolder(folder.id)}
                  className="w-full bg-slate-100 dark:bg-slate-700 p-6 rounded-xl border-2 border-slate-300 dark:border-slate-600 hover:border-orange-400 dark:hover:border-orange-400 transition flex flex-col items-center gap-4"
                >
                  {folder.id > 4 && (
                    <button
                      onClick={() => handleDeleteFolder(folder.id)}
                      className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 dark:bg-red-500 dark:hover:bg-red-600 dark:bg-red-500 dark:hover:bg-red-600 rounded-lg opacity-0 group-hover:opacity-100 z-10"
                  title="Usuń playlistę"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  )}

                  <div className="w-24 h-24 bg-slate-200 dark:bg-slate-600 rounded-2xl flex items-center justify-center text-5xl">
                    {folder.icon}
                  </div>
                  <span className="font-semibold text-lg text-slate-900 dark:text-slate-100">{folder.name}</span>
                </button>
              </div>
            ))}

            {/* Dodaj playlistę */}
            <button
              onClick={() => setShowAddPlaylistaModal(true)}
              className="bg-slate-100 dark:bg-slate-700 p-6 rounded-xl border-2 border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-400 transition flex flex-col items-center gap-4"
            >
              <div className="w-24 h-24 bg-slate-300 dark:bg-slate-600 rounded-full flex items-center justify-center">
                <PlusIcon className="w-12 h-12 text-slate-600 dark:text-slate-300" />
              </div>
              <span className="font-semibold text-lg text-slate-900 dark:text-slate-100">Dodaj playlistę</span>
            </button>
          </div>
        </div>
        <p className="text-green-200">message</p>

        {/* Modal dodawania playlisty */}
        {showAddPlaylistaModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="login-box rounded-lg p-6 w-full max-w-md relative">
              <button
                onClick={() => {
                  setShowAddPlaylistaModal(false);
                  resetPlaylist();
                }}
                className="absolute top-4 right-7 log-in-e text-slate-900"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">Dodaj playlistę</h3>

              <form
                onSubmit={handleSubmitPlaylist((data) => {
                  const newFolder: MusicFolder = {
                    id: Date.now(),
                    name: data.playlistName,
                    icon: '🎵',
                  };
                  setFolders(prev => [...prev, newFolder]);
                  setShowAddPlaylistaModal(false);
                  setSelectedFolder(newFolder.id);
                  resetPlaylist();
                })}
                className="space-y-4 md:space-y-6"
              >
                <Input
                  label="Nazwa playlisty"
                  {...registerPlaylist('playlistName')}
                  inputClassName={classinput}
                  labelClassName={classlabel}
                  error={errorsPlaylist.playlistName}
                />

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddPlaylistaModal(false);
                      resetPlaylist();
                    }}
                    className="flex-1 log-in-e py-2"
                  >
                    Anuluj
                  </button>
                  <button type="submit" className="flex-1 log-in py-2">Dodaj playlistę</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
  );
};