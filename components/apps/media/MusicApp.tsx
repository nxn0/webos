
import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, Music, FolderPlus, FileAudio, ListMusic } from 'lucide-react';
import { saveFile, listFiles, FSItem } from '../../../services/fileSystem';

export const MusicApp = () => {
  const [playing, setPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [playlist, setPlaylist] = useState<FSItem[]>([]);
  const [loading, setLoading] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);

  // Load playlist from /Music folder on mount
  useEffect(() => {
    loadLibrary();
  }, []);

  const loadLibrary = async () => {
    try {
        const files = await listFiles('/Music');
        // Filter only audio files
        const audioFiles = files.filter(f => f.type === 'file' && f.mimeType?.startsWith('audio/'));
        setPlaylist(audioFiles);
    } catch (e) {
        console.error("Failed to load library", e);
    }
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          setLoading(true);
          const files = Array.from(e.target.files) as File[];
          for (const file of files) {
              if (file.type.startsWith('audio/')) {
                  await saveFile(file, '/Music');
              }
          }
          await loadLibrary();
          setLoading(false);
      }
  };

  // Play a specific track
  const playTrack = (index: number) => {
      if (index < 0 || index >= playlist.length) return;
      setCurrentTrackIndex(index);
      setPlaying(true);
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
        audioRef.current.pause();
    } else {
        audioRef.current.play().catch(e => console.error(e));
    }
    setPlaying(!playing);
  };

  const nextTrack = () => {
      let next = currentTrackIndex + 1;
      if (next >= playlist.length) next = 0;
      playTrack(next);
  };

  const prevTrack = () => {
      let prev = currentTrackIndex - 1;
      if (prev < 0) prev = playlist.length - 1;
      playTrack(prev);
  };
  
  // Get current track URL
  const currentTrackUrl = React.useMemo(() => {
      if (playlist.length > 0 && playlist[currentTrackIndex]?.content) {
          return URL.createObjectURL(playlist[currentTrackIndex].content as Blob);
      }
      // Fallback for demo if empty
      return "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
  }, [playlist, currentTrackIndex]);

  const currentTrackName = playlist[currentTrackIndex]?.name || "No Music";

  return (
    <div className="h-full bg-transparent text-neutral-200 flex flex-col">
      {/* Visualizer Area */}
      <div className="h-1/3 flex items-center justify-center relative overflow-hidden bg-black/20 border-b border-white/5">
         <div className={`w-32 h-32 bg-purple-500/10 rounded-full blur-3xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${playing ? 'animate-pulse' : ''}`}></div>
         <div className="z-10 flex flex-col items-center">
             <div className={`w-24 h-24 bg-white/5 rounded-xl shadow-lg flex items-center justify-center border border-white/10 backdrop-blur-sm ${playing ? 'animate-spin-slow' : ''}`}>
                <Music size={40} className="text-purple-300" />
             </div>
             <div className="mt-4 text-center px-4">
                 <h3 className="font-bold text-lg truncate max-w-[300px] text-neutral-200">{currentTrackName}</h3>
                 <p className="text-neutral-500 text-sm">{playlist.length} Tracks</p>
             </div>
         </div>
      </div>

      {/* Controls */}
      <div className="p-4 flex flex-col items-center gap-4 bg-white/5 backdrop-blur-md">
          <audio 
            ref={audioRef} 
            src={currentTrackUrl} 
            autoPlay={playing} 
            onEnded={nextTrack}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
          />
          
          <div className="flex items-center gap-6">
            <button onClick={prevTrack} className="text-neutral-400 hover:text-white transition-colors"><SkipBack size={24} /></button>
            <button 
                onClick={togglePlay} 
                className="w-14 h-14 bg-purple-500/20 border border-purple-500/20 rounded-full flex items-center justify-center hover:bg-purple-500/30 shadow-lg hover:scale-105 transition-all text-purple-200"
            >
              {playing ? <Pause fill="currentColor" size={24} /> : <Play fill="currentColor" size={24} className="ml-1" />}
            </button>
            <button onClick={nextTrack} className="text-neutral-400 hover:text-white transition-colors"><SkipForward size={24} /></button>
          </div>
      </div>

      {/* Toolbar */}
      <div className="px-4 py-2 flex items-center justify-between border-t border-white/5 bg-black/10">
          <span className="text-xs font-bold text-neutral-500 uppercase flex items-center gap-1"><ListMusic size={14}/> Library</span>
          <div className="flex gap-2">
              <label className="p-1.5 hover:bg-white/10 rounded cursor-pointer text-neutral-400 hover:text-blue-300 transition-colors" title="Import Files">
                  <FileAudio size={18} />
                  <input type="file" multiple accept="audio/*" className="hidden" onChange={handleFileImport} />
              </label>
              {/* Note: directory selection is non-standard but works in Chrome */}
              <label className="p-1.5 hover:bg-white/10 rounded cursor-pointer text-neutral-400 hover:text-blue-300 transition-colors" title="Import Folder">
                  <FolderPlus size={18} />
                  <input 
                    type="file" 
                    // @ts-ignore
                    webkitdirectory="" 
                    directory="" 
                    className="hidden" 
                    onChange={handleFileImport} 
                  />
              </label>
          </div>
      </div>

      {/* Playlist */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loading && <div className="text-center text-neutral-500 py-4">Importing...</div>}
          
          {playlist.length === 0 && !loading && (
              <div className="text-center text-neutral-600 py-10 px-6">
                  <p>Library is empty.</p>
                  <p className="text-xs mt-2">Use the buttons above to import music files or folders.</p>
              </div>
          )}

          {playlist.map((track, i) => (
              <div 
                key={track.path}
                onClick={() => playTrack(i)}
                className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                    i === currentTrackIndex ? 'bg-purple-500/10 border border-purple-500/10' : 'hover:bg-white/5 border border-transparent'
                }`}
              >
                  <div className="flex items-center gap-3 min-w-0">
                      <div className={`text-xs w-6 text-center ${i === currentTrackIndex ? 'text-purple-300 font-bold' : 'text-neutral-500'}`}>
                          {i === currentTrackIndex && playing ? <div className="animate-pulse">▶</div> : i + 1}
                      </div>
                      <div className="truncate">
                          <div className={`text-sm truncate ${i === currentTrackIndex ? 'text-neutral-200 font-medium' : 'text-neutral-400'}`}>
                              {track.name}
                          </div>
                      </div>
                  </div>
              </div>
          ))}
      </div>
    </div>
  );
};
