import { useState, useEffect } from 'react';
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
import { useMusicContext, type MusicFolder, type Song } from "../Music/MusicContext";
import musicApi from "../api/musicApi";
import { useAuthContext } from "../Auth/AuthContext";
import { useToast } from "../Toast/ToastContext";


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
    canAddSongs,
  } = useMusicContext();

  const auth = (() => { try { return useAuthContext(); } catch { return null as any; } })();

    const { showToast } = useToast();

  const [selectedFolder, setSelectedFolder] = useState<MusicFolder | null>(null);
  const [showAddSongModal, setShowAddSongModal] = useState(false);
  const [showAddPlaylistaModal, setShowAddPlaylistaModal] = useState(false);
  const [subfolders, setSubfolders] = useState<MusicFolder[]>([]);

  useEffect(() => {
    (async () => {
      const cats = await musicApi.getCategories();
      if (cats && cats.length) {
        const mapIcon = (name: string) => {
          const n = name.toLowerCase();
          if (n.includes('nau')) return '📚';
          if (n.includes('lok')) return '📍';
          if (n.includes('gat')) return '🎸';
          return '🎧';
        };
        const mapped = cats.map((c: any) => ({ id: c.id, name: c.name, icon: mapIcon(c.name), type: 'category' }));
        let newFolders: MusicFolder[] = [...mapped];

        // If user is logged in, fetch their playlists and show them next to categories
        if (auth && auth.isLoggedIn) {
          try {
            const userPlaylists = await musicApi.getUserPlaylists(auth.username);
            if (userPlaylists && userPlaylists.length) {
              const mappedPlaylists = userPlaylists.map((p: any) => ({ id: p.id, name: p.name, icon: '🎵', type: 'playlist', owner: p.owner_login, song_count: p.song_count }));
              newFolders = [...newFolders, ...mappedPlaylists];
            }
          } catch (e) {
            console.error('getUserPlaylists', e);
          }
        }

        // Add friends folder and other non-category/non-playlist folders
        const otherFolders = [
          { id: 4, name: 'Znajomi', icon: '👥', type: 'friends' }
        ];
        newFolders = [...newFolders, ...otherFolders];

        // Replace entire folders list instead of merging
        setFolders(newFolders);
      }
    })();
  }, [setFolders, auth?.isLoggedIn, auth?.username]);

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

    // If we're inside a server-backed playlist and user is logged in, persist to backend
    if (selectedFolder.type === 'playlist' && auth && auth.isLoggedIn) {
      (async () => {
        try {
          const payload = { title: data.namesong, source: data.linkyt };
          const resp = await musicApi.addSongToPlaylist(selectedFolder.id, payload);
          if (resp && resp.status === 200 && resp.data && resp.data.id) {
            const newSong: Song = { id: resp.data.id, name: data.namesong, youtubeUrl: data.linkyt, folderId: selectedFolder.id };
            setSongs(prev => [...prev, newSong]);
              showToast('Utwór dodany do playlisty', 'success');
          } else {
              showToast('Nie udało się dodać utworu na serwerze', 'error');
          }
        } catch (e) {
          console.error('addSongToPlaylist', e);
            showToast('Błąd podczas dodawania utworu', 'error');
        } finally {
          setShowAddSongModal(false);
          resetSong();
        }
      })();
      return;
    }

    // local playlist / folder (no backend)
    const newSong: Song = {
      id: Date.now(),
      name: data.namesong,
      youtubeUrl: data.linkyt,
      folderId: selectedFolder.id,
    };

    setSongs(prev => [...prev, newSong]);
    showToast('Utwór dodany', 'success');
    setShowAddSongModal(false);
    resetSong();
  };

  const handleDeleteSong = (songId: number) => {
    if (!confirm('Czy na pewno chcesz usunąć ten utwór?')) return;

    // If this is a server-backed playlist, remove from backend first
    if (selectedFolder && selectedFolder.type === 'playlist' && auth && auth.isLoggedIn) {
      (async () => {
        try {
          const resp = await musicApi.removeSongFromPlaylist(selectedFolder.id, songId);
          if (resp && resp.status === 200) {
            setSongs(prev => prev.filter(s => s.id !== songId));
            showToast('Utwór usunięty z playlisty', 'success');
          } else {
            showToast('Nie udało się usunąć utworu na serwerze', 'error');
          }
        } catch (e) {
          console.error('removeSongFromPlaylist', e);
          showToast('Błąd podczas usuwania utworu', 'error');
        }
      })();
      return;
    }

    // local removal
    setSongs(prev => prev.filter(s => s.id !== songId));
    showToast('Utwór usunięty', 'success');
  };

  const handleDeleteFolder = async (folderId: number) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;

    const folderSongs = songs.filter(s => s.folderId === folderId);
    const confirmMsg = folderSongs.length > 0
      ? `Folder zawiera ${folderSongs.length} utworów. Czy na pewno chcesz usunąć folder i wszystkie utwory?`
      : 'Czy na pewno chcesz usunąć ten folder?';
    if (!confirm(confirmMsg)) return;

    try {
      if (folder.type === 'playlist' && auth?.isLoggedIn) {
        // Delete playlist from backend
        const resp = await musicApi.deletePlaylist(folderId);
        if (resp?.status !== 200) {
            showToast('Nie udało się usunąć playlisty na serwerze', 'error');
          return;
        }
        
        // After successful deletion, reload playlists from backend
        const userPlaylists = await musicApi.getUserPlaylists(auth.username);
        setFolders(prev => {
          const mapped = userPlaylists.map((p: any) => ({ id: p.id, name: p.name, icon: '🎵', type: 'playlist', owner: p.owner_login, song_count: p.song_count }));
          // Keep categories and friends folder, replace playlists
          return prev.filter(f => f.type === 'category' || f.type === 'friends').concat(mapped);
        });
      } else {
        // Local folder deletion
        setFolders(prev => prev.filter(f => f.id !== folderId));
      }

      setSongs(prev => prev.filter(s => s.folderId !== folderId));
      showToast('Folder i jego utwory usunięte', 'success');
      setSelectedFolder(null);
    } catch (e) {
      console.error('deleteFolder', e);
      showToast('Błąd podczas usuwania folderu', 'error');
    }
  };

  const currentFolderName = selectedFolder?.name || '';
  const currentFolderSongs = selectedFolder ? songs.filter(s => s.folderId === selectedFolder.id) : [];

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

          {/* If selected is a category, show subcategories */}
          {selectedFolder.type === 'category' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subfolders.map((sf) => (
                <div key={sf.id} className="login-box p-4 rounded shadow relative group">
                  <button onClick={async () => {
                    setSelectedFolder({ ...sf, type: 'subcategory' });
                    const songsFromApi = await musicApi.getSongsForSubcategory(sf.id);
                    const mapped: Song[] = songsFromApi.map((r: any) => ({ id: r.id, name: r.title || r.name || r.title, youtubeUrl: r.source || '', folderId: sf.id }));
                    setSongs(mapped);
                  }} className="w-full">
                    <div className="aspect-video rounded-lg overflow-hidden mb-3 relative group">
                      <div className="w-full h-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-4xl">🎧</div>
                    </div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2 text-left">{sf.name}</h3>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* If selected is "friends" folder, show friend playlists without add song form */}
          {selectedFolder.type === 'friends' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subfolders.map((fp) => (
                <div key={fp.id} className="login-box p-4 rounded shadow">
                  <button onClick={async () => {
                    setSelectedFolder({ ...fp, type: 'friend-playlist' });
                    const songsFromPlaylist = await musicApi.getPlaylistSongs(fp.id);
                    const mapped: Song[] = songsFromPlaylist.map((r: any) => ({ id: r.id, name: r.title || r.name, youtubeUrl: r.source || '', folderId: fp.id }));
                    setSongs(mapped);
                  }} className="w-full">
                    <div className="aspect-video rounded-lg overflow-hidden mb-3 relative group bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-4xl">
                      🎵
                    </div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1 text-left">{fp.name}</h3>
                    {fp.song_count && <p className="text-sm text-slate-600 dark:text-slate-400">Piosenek: {fp.song_count}</p>}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* If selected is friend-playlist, show songs without add form */}
          {selectedFolder.type === 'friend-playlist' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentFolderSongs.map((song) => (
                <div key={song.id} className="login-box p-4 rounded shadow">
                  <button onClick={() => handlePlaySong(song)} className="w-full">
                    <div className="aspect-video rounded-lg overflow-hidden mb-3 relative group">
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
            </div>
          )}

          {/* If selected is a subcategory or local playlist, show songs */}
          {(selectedFolder.type === 'subcategory' || selectedFolder.type === 'local' || selectedFolder.type === 'playlist') && (
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

              {/* Dodaj utwór - tylko gdy kontekst na to pozwala (własne playlisty/local) */}
              {canAddSongs(selectedFolder) && (
                <button
                  onClick={() => setShowAddSongModal(true)}
                  className="login-box p-4 rounded shadow flex flex-col items-center justify-center aspect-square hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                >
                <div className="w-20 h-20 bg-slate-300 dark:bg-slate-600 rounded-full flex items-center justify-center mb-3">
                  <PlusIcon className="w-10 h-10 text-slate-600 dark:text-slate-300" />
                </div>
                <span className="font-semibold text-slate-900 dark:text-slate-100">Dodaj utwór</span>
              </button>
              )}
            </div>
          )}


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
            {folders
              .slice()
              .sort((a, b) => {
                if (a.type === 'friends') return -1; // Znajomi na górze
                if (b.type === 'friends') return 1;
                return 0; // reszta pozostaje w tej samej kolejności
              })
              .map((folder) => (
                <div key={folder.id} className="relative group">
                  <button
                    onClick={async () => {
                      if (folder.type === 'category') {
                        const subs = await musicApi.getSubcategories(folder.id);
                        const mapped = subs.map((s: any) => ({ id: s.id, name: s.name, icon: '🎧', type: 'subcategory' }));
                        setSubfolders(mapped);
                        setSelectedFolder({ ...folder, type: 'category' });
                      } else if (folder.type === 'friends') {
                        const friendsPlaylists = await musicApi.getFriendsPlaylists(auth.username);
                        const mapped = friendsPlaylists.map((p: any) => ({ id: p.id, name: `${p.owner_login} - ${p.name}`, icon: '🎵', type: 'friend-playlist', owner: p.owner_login, song_count: p.song_count }));
                        setSubfolders(mapped);
                        setSelectedFolder(folder);
                      } else if (folder.type === 'playlist') {
                        try {
                          const songsFromPlaylist = await musicApi.getPlaylistSongs(folder.id);
                          const mapped: Song[] = songsFromPlaylist.map((r: any) => ({ id: r.id, name: r.title || r.name, youtubeUrl: r.source || '', folderId: folder.id }));
                          setSongs(mapped);
                        } catch (e) {
                          console.error('getPlaylistSongs', e);
                          setSongs([]);
                        }
                        setSelectedFolder(folder);
                      } else {
                        setSelectedFolder(folder);
                      }
                    }}
                    className="w-full bg-slate-100 dark:bg-slate-700 p-6 rounded-xl border-2 border-slate-300 dark:border-slate-600 hover:border-orange-400 dark:hover:border-orange-400 transition flex flex-col items-center gap-4"
                  >
                    {folder.type !== 'category' && folder.type !== 'friends' ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFolder(folder.id);
                      }}
                      className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 dark:bg-red-500 dark:hover:bg-red-600 rounded-lg opacity-0 group-hover:opacity-100 z-10"
                      title="Usuń playlistę"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  ) : null}

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
                  resetPlaylist();
                }}
                className="absolute top-4 right-7 log-in-e text-slate-900"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">Dodaj playlistę</h3>

              <form
                onSubmit={handleSubmitPlaylist(async (data) => {
                  try {
                    if (auth && auth.isLoggedIn) {
                      const resp = await musicApi.createPlaylist(auth.username, data.playlistName, false);
                      if (resp && resp.status === 200 && resp.data && resp.data.id) {
                        const newFolder: MusicFolder = { id: resp.data.id, name: data.playlistName, icon: '🎵', type: 'playlist' };
                        setFolders(prev => [...prev, newFolder]);
                        setSelectedFolder(newFolder);
                        showToast('Dodano playlistę', 'success');
                      }
                    } else {
                      const newFolder: MusicFolder = { id: Date.now(), name: data.playlistName, icon: '🎵', type: 'local' };
                      setFolders(prev => [...prev, newFolder]);
                      setSelectedFolder(newFolder);
                    }
                  } catch (e) {
                    console.error('create playlist', e);
                  }
                  setShowAddPlaylistaModal(false);
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