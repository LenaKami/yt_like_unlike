import { useMusicContext } from './MusicContext';
import ReactPlayer from 'react-player';
import {
  XMarkIcon,
  PlayIcon,
  PauseIcon,
  ForwardIcon,
  BackwardIcon
} from '@heroicons/react/24/solid';

export const PlayerBar = () => {
  const {
    currentSong,
    isPlaying,
    folders,
    playerRef,
    handleTogglePlay,
    handleStopSong,
    handleNextSong,
    handlePreviousSong,
    handleSongEnded,
    getYouTubeThumbnail,
  } = useMusicContext();

  if (!currentSong) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 p-4 z-50">
      <div className="container mx-auto flex items-center gap-4">
        <div className="w-16 h-16 bg-slate-700 rounded overflow-hidden flex-shrink-0">
          <img 
            src={getYouTubeThumbnail(currentSong.youtubeUrl)} 
            alt={currentSong.name} 
            className="w-full h-full object-cover" 
          />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-white truncate">{currentSong.name}</h4>
          <p className="text-sm text-slate-400 truncate">
            {folders.find(f => f.id === currentSong.folderId)?.name}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handlePreviousSong} 
            className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
            title="Poprzedni utwór"
          >
            <BackwardIcon className="w-5 h-5 text-white" />
          </button>
          <button 
            onClick={handleTogglePlay} 
            className="p-3 bg-orange-500 hover:bg-orange-600 rounded-full transition"
            title={isPlaying ? "Pauza" : "Odtwórz"}
          >
            {isPlaying ? (
              <PauseIcon className="w-6 h-6 text-white" />
            ) : (
              <PlayIcon className="w-6 h-6 text-white" />
            )}
          </button>
          <button 
            onClick={handleNextSong} 
            className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
            title="Następny utwór"
          >
            <ForwardIcon className="w-5 h-5 text-white" />
          </button>
          <button 
            onClick={handleStopSong} 
            className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
            title="Zatrzymaj"
          >
            <XMarkIcon className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
      <div className="hidden">
        <ReactPlayer 
          ref={playerRef} 
          url={currentSong.youtubeUrl} 
          playing={isPlaying} 
          controls={false} 
          width="0" 
          height="0" 
          onEnded={handleSongEnded} 
        />
      </div>
    </div>
  );
};
