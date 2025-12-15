import { createContext, useContext, useState, useRef, ReactNode } from 'react';
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

type MusicContextType = {
  currentSong: Song | null;
  isPlaying: boolean;
  folders: MusicFolder[];
  songs: Song[];
  playerRef: React.RefObject<ReactPlayer>;
  setCurrentSong: (song: Song | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setFolders: React.Dispatch<React.SetStateAction<MusicFolder[]>>;
  setSongs: React.Dispatch<React.SetStateAction<Song[]>>;
  handlePlaySong: (song: Song) => void;
  handleTogglePlay: () => void;
  handleStopSong: () => void;
  handleNextSong: () => void;
  handlePreviousSong: () => void;
  handleSongEnded: () => void;
  getYouTubeThumbnail: (url: string) => string;
};

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export const MusicContextProvider = ({ children }: { children: ReactNode }) => {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const playerRef = useRef<ReactPlayer>(null);

  const [folders, setFolders] = useState<MusicFolder[]>([
    { id: 1, name: 'Nauka', icon: '📚' },
    { id: 2, name: 'Lokalizacja', icon: '📍' },
    { id: 3, name: 'Gatunki', icon: '🎸' },
    { id: 4, name: 'Znajomi', icon: '👥' },
    { id: 5, name: 'Playlista1', icon: '🎵' },
  ]);

  const [songs, setSongs] = useState<Song[]>([
    { id: 1, name: 'Lofi Study Beats', youtubeUrl: 'https://www.youtube.com/watch?v=4xDzrJKXOOY', folderId: 1 },
    { id: 2, name: 'Chill Piano Music', youtubeUrl: 'https://www.youtube.com/watch?v=lTRiuFIWV54', folderId: 1 },
  ]);

  const handlePlaySong = (song: Song) => {
    if (currentSong?.id === song.id) {
      setIsPlaying(prev => !prev);
    } else {
      setCurrentSong(song);
      setIsPlaying(true);
    }
  };

  const handleTogglePlay = () => setIsPlaying(prev => !prev);
  
  const handleStopSong = () => {
    setCurrentSong(null);
    setIsPlaying(false);
  };

  const handleNextSong = () => {
    if (!currentSong) return;
    const folderSongs = songs.filter(s => s.folderId === currentSong.folderId);
    const currentIndex = folderSongs.findIndex(s => s.id === currentSong.id);
    if (currentIndex < folderSongs.length - 1) {
      setCurrentSong(folderSongs[currentIndex + 1]);
      setIsPlaying(true);
    }
  };

  const handlePreviousSong = () => {
    if (!currentSong) return;
    const folderSongs = songs.filter(s => s.folderId === currentSong.folderId);
    const currentIndex = folderSongs.findIndex(s => s.id === currentSong.id);
    if (currentIndex > 0) {
      setCurrentSong(folderSongs[currentIndex - 1]);
      setIsPlaying(true);
    }
  };

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

  return (
    <MusicContext.Provider
      value={{
        currentSong,
        isPlaying,
        folders,
        songs,
        playerRef,
        setCurrentSong,
        setIsPlaying,
        setFolders,
        setSongs,
        handlePlaySong,
        handleTogglePlay,
        handleStopSong,
        handleNextSong,
        handlePreviousSong,
        handleSongEnded,
        getYouTubeThumbnail,
      }}
    >
      {children}
    </MusicContext.Provider>
  );
};

export const useMusicContext = () => {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error('useMusicContext must be used within MusicContextProvider');
  }
  return context;
};
