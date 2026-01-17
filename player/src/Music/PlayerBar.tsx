import { useMusicContext } from './MusicContext';
import ReactPlayer from 'react-player';
import { useState } from 'react';
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
    currentTime,
    duration,
    setCurrentTime,
    setDuration,
    handleSeek,
  } = useMusicContext();

  const [isDragging, setIsDragging] = useState(false);

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
  };

  const handleProgressMouseUp = (e: React.MouseEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    const newTime = parseFloat(target.value);
    handleSeek(newTime);
    setIsDragging(false);
  };

  const handleProgressMouseDown = () => {
    setIsDragging(true);
  };

  if (!currentSong) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 music-box border-t border-slate-700 p-2 z-50">
      {/* Progress bar */}
      <div className="container mx-auto mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 min-w-[40px]">{formatTime(isDragging ? currentTime : currentTime)}</span>
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={isDragging ? currentTime : currentTime}
            onChange={handleProgressChange}
            onMouseDown={handleProgressMouseDown}
            onMouseUp={handleProgressMouseUp}
            onTouchStart={handleProgressMouseDown}
            onTouchEnd={handleProgressMouseUp}
            className="flex-1 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
            style={{
              background: `linear-gradient(to right, rgb(249, 115, 22) 0%, rgb(249, 115, 22) ${duration ? (currentTime / duration) * 100 : 0}%, rgb(55, 65, 81) ${duration ? (currentTime / duration) * 100 : 0}%, rgb(55, 65, 81) 100%)`
            }}
          />
          <span className="text-xs text-slate-400 min-w-[40px] text-right">{formatTime(duration)}</span>
        </div>
      </div>

      <div className="container mx-auto flex items-center gap-2">
        <div className="w-12 h-12 bg-slate-700 rounded overflow-hidden flex-shrink-0">
          <img 
            src={getYouTubeThumbnail(currentSong.youtubeUrl)} 
            alt={currentSong.name} 
            className="w-full h-full object-cover" 
          />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-white truncate text-sm">{currentSong.name}</h4>
          <div className="flex gap-1 text-xs text-white">
            <p>{folders.find(f => f.id === currentSong.folderId)?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handlePreviousSong} 
            className="p-1 log-in"
            title="Poprzedni utwór"
          >
            <BackwardIcon className="w-4 h-4" />
          </button>
          <button 
            onClick={handleTogglePlay} 
            className="p-2 log-in-e"
            title={isPlaying ? "Pauza" : "Odtwórz"}
          >
            {isPlaying ? (
              <PauseIcon className="w-5 h-5 " />
            ) : (
              <PlayIcon className="w-5 h-5" />
            )}
          </button>
          <button 
            onClick={handleNextSong} 
            className="p-1 log-in"
            title="Następny utwór"
          >
            <ForwardIcon className="w-4 h-4" />
          </button>
          <button 
            onClick={handleStopSong} 
            className="p-1 bg-slate-600 hover:bg-slate-400 dark:bg-slate-500 dark:hover:bg-slate-300 rounded-lg transition"
            title="Zatrzymaj"
          >
            <XMarkIcon className="w-4 h-4 text-white" />
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
          onProgress={(state) => {
            if (!isDragging) {
              setCurrentTime(state.played * (duration || 1));
            }
          }}
          onDuration={(dur) => setDuration(dur)}
        />
      </div>
    </div>
  );
};
