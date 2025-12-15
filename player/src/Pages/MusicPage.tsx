import { useState, useRef } from 'react';
import {
  XMarkIcon,
  PlusIcon,
  ArrowLeftIcon,
  TrashIcon,
  PlayIcon,
  PauseIcon
} from '@heroicons/react/24/solid';
import ReactPlayer from 'react-player';
import { Input } from "../ui";
import { type MusicFormData, validationSchema } from "../types_music";
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type SubmitHandler } from "react-hook-form";

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

  const [selectedFolder, setSelectedFolder] = useState<number | null>(null);
  const [showAddSongModal, setShowAddSongModal] = useState(false);
  const [showAddPlaylistaModal, setShowAddPlaylistaModal] = useState(false);
  const [message, setMessage] = useState('');
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const playerRef = useRef<ReactPlayer>(null);

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<MusicFormData>({
    resolver: zodResolver(validationSchema)
  });

  // Mockup folders
  const [folders, setFolders] = useState<MusicFolder[]>([
    { id: 1, name: 'Nauka', icon: '📚' },
    { id: 2, name: 'Lokalizacja', icon: '📍' },
    { id: 3, name: 'Gatunki', icon: '🎸' },
    { id: 4, name: 'Znajomi', icon: '👥' },
    { id: 5, name: 'Playlista1', icon: '🎵' },
  ]);

  // Mockup songs
  const [songs, setSongs] = useState<Song[]>([
    { id: 1, name: 'Muzyka do nauki #1', youtubeUrl: 'https://www.youtube.com/watch?v=jfKfPfyJRdk', folderId: 1 },
    { id: 2, name: 'Focus Music', youtubeUrl: 'https://www.youtube.com/watch?v=5qap5aO4i9A', folderId: 1 },
  ]);

  const handleAddSong: SubmitHandler<MusicFormData> = (data) => {
    if (selectedFolder === null) return;

    const newSong: Song = {
      id: Date.now(),
      name: data.namesong,
      youtubeUrl: data.linkyt,
      folderId: selectedFolder,
    };

    setSongs(prev => [...prev, newSong]);
    setMessage('✅ Utwór dodany (mockup)');
    setShowAddSongModal(false);
    reset();
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

  const handlePlaySong = (song: Song) => {
    if (currentSong?.id === song.id) {
      setIsPlaying(prev => !prev);
    } else {
      setCurrentSong(song);
      setIsPlaying(true);
    }
  };

  const handleTogglePlay = () => setIsPlaying(prev => !prev);
  const handleStopSong = () => { setCurrentSong(null); setIsPlaying(false); };

  const handleSongEnded = () => {
    if (!currentSong) return;
    const folderSongs = songs.filter(s => s.folderId === currentSong.folderId);
    const currentIndex = folderSongs.findIndex(s => s.id === currentSong.id);
    if (currentIndex < folderSongs.length - 1) {
      setCurrentSong(folderSongs[currentIndex + 1]);
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  };

  const getYouTubeThumbnail = (url: string) => {
    const videoId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];
    return videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : '';
  };

  const currentFolderName = folders.find(f => f.id === selectedFolder)?.name || '';
  const currentFolderSongs = songs.filter(s => s.folderId === selectedFolder);

  /** PLAYER COMPONENT */
  const PlayerBar = () => {
    if (!currentSong) return null;

    return (
      <div className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 p-4 z-50">
        <div className="container mx-auto flex items-center gap-4">
          <div className="w-16 h-16 bg-slate-700 rounded overflow-hidden flex-shrink-0">
            <img src={getYouTubeThumbnail(currentSong.youtubeUrl)} alt={currentSong.name} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-white truncate">{currentSong.name}</h4>
            <p className="text-sm text-slate-400 truncate">{folders.find(f => f.id === currentSong.folderId)?.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleTogglePlay} className="p-3 bg-orange-500 hover:bg-orange-600 rounded-full transition">
              {isPlaying ? <PauseIcon className="w-6 h-6 text-white" /> : <PlayIcon className="w-6 h-6 text-white" />}
            </button>
            <button onClick={handleStopSong} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition">
              <XMarkIcon className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
        <div className="hidden">
          <ReactPlayer ref={playerRef} url={currentSong.youtubeUrl} playing={isPlaying} controls={false} width="0" height="0" onEnded={handleSongEnded} />
        </div>
      </div>
    );
  };

  /** RENDER: FOLDER VIEW */
  if (selectedFolder !== null) {
    return (
      <>
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
                  className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  title="Usuń utwór"
                >
                  <TrashIcon className="w-4 h-4 text-white" />
                </button>

                <button onClick={() => handlePlaySong(song)} className="w-full">
                  <div className="aspect-video bg-slate-200 dark:bg-slate-700 rounded-lg overflow-hidden mb-3 relative group">
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
        </div>
        <PlayerBar />
      </>
    );
  }

  /** RENDER: MAIN FOLDER VIEW */
  return (
    <>
      <div className="login-box container mx-auto p-4 pb-24">
        <h1 className="text-2xl font-bold mb-6 text-slate-900 dark:text-slate-100">Muzyka</h1>

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
                      className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      title="Usuń playlistę"
                    >
                      <TrashIcon className="w-4 h-4 text-white" />
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

        {/* Modal dodawania playlisty */}
        {showAddPlaylistaModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="login-box rounded-lg p-6 w-full max-w-md relative">
              <button
                onClick={() => {
                  setShowAddPlaylistaModal(false);
                  reset();
                }}
                className="absolute top-4 right-7 log-in-e"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">Dodaj playlistę</h3>

              <form
                onSubmit={handleSubmit((data) => {
                  const newFolder: MusicFolder = {
                    id: Date.now(),
                    name: data.playlistName,
                    icon: '🎵',
                  };
                  setFolders(prev => [...prev, newFolder]);
                  setShowAddPlaylistaModal(false);
                  setSelectedFolder(newFolder.id);
                  reset();
                })}
                className="space-y-4 md:space-y-6"
              >
                <Input
                  label="Nazwa playlisty"
                  {...register('playlistName', { required: 'Wprowadź co najmniej 3 znaki' })}
                  inputClassName={classinput}
                  labelClassName={classlabel}
                  error={errors.playlistName}
                />

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddPlaylistaModal(false);
                      reset();
                    }}
                    className="flex-1 log-in py-2"
                  >
                    Anuluj
                  </button>
                  <button type="submit" className="flex-1 log-in py-2">Dodaj playlistę</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal dodawania utworu */}
        {showAddSongModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="login-box rounded-lg p-6 w-full max-w-md relative">
              <button
                onClick={() => { setShowAddSongModal(false); reset(); }}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">Dodaj utwór</h3>

              <form onSubmit={handleSubmit(handleAddSong)} className="space-y-4 md:space-y-6">
                <Input
                  label="Nazwa utworu"
                  {...register("namesong", { required: "Podaj nazwę utworu" })}
                  error={errors.namesong}
                  inputClassName={classinput}
                  labelClassName={classlabel}
                />
                <Input
                  label="Link do YouTube"
                  {...register("linkyt", { required: "Podaj link do YouTube" })}
                  error={errors.linkyt}
                  inputClassName={classinput}
                  labelClassName={classlabel}
                />

                {/* Preview */}
                {watch("linkyt") && (
                  <div className="mt-3">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Podgląd:</p>
                    <img src={getYouTubeThumbnail(watch("linkyt"))} alt="Preview" className="w-full rounded-lg" />
                  </div>
                )}

                <div className="flex gap-3 mt-6">
                  <button type="button" onClick={() => reset()} className="flex-1 log-in py-2 rounded-lg bg-gray-500 hover:bg-gray-600">Anuluj</button>
                  <button type="submit" className="flex-1 log-in py-2 rounded-lg font-medium">Dodaj</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      <PlayerBar />
    </>
  );
};
