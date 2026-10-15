import React from 'react';
import { Song } from '../types/game';
import { SONGS } from '../songs/songData';
import { Play, Flame, Music, Sparkles, Sliders } from 'lucide-react';

interface SongSelectModalProps {
  selectedSong: Song;
  onSelectSong: (song: Song) => void;
  onStartGame: () => void;
  onOpenSettings: () => void;
  highScores: Record<string, number>;
}

export const SongSelectModal: React.FC<SongSelectModalProps> = ({
  selectedSong,
  onSelectSong,
  onStartGame,
  onOpenSettings,
  highScores,
}) => {
  return (
    <div className="relative w-full h-full flex flex-col justify-between p-4 md:p-6 select-none overflow-y-auto">
      {/* Header Lockup */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-fuchsia-600 to-rose-500 flex items-center justify-center shadow-lg shadow-fuchsia-500/30">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight uppercase">
              Magic Neon Tiles
            </h1>
            <p className="text-[11px] text-fuchsia-300 font-medium tracking-wide">
              Judas Edition · Android Ready
            </p>
          </div>
        </div>

        <button
          onClick={onOpenSettings}
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/15 active:scale-95 text-white backdrop-blur-md transition-all border border-white/10"
          title="Lighting & Haptics Settings"
        >
          <Sliders className="w-5 h-5 text-fuchsia-300" />
        </button>
      </div>

      {/* Featured Song Hero Banner (Judas by Lady Gaga) */}
      <div className="my-auto py-4 flex flex-col gap-4">
        <div className="relative rounded-2xl overflow-hidden p-5 border border-white/15 bg-gradient-to-br from-purple-950/80 via-slate-900/90 to-fuchsia-950/70 shadow-2xl backdrop-blur-lg">
          <div className="absolute top-0 right-0 w-44 h-44 bg-fuchsia-600/20 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center gap-2 text-xs font-semibold text-rose-400 uppercase tracking-wider mb-2">
            <Flame className="w-4 h-4 fill-rose-500 stroke-none" />
            <span>Featured Track</span>
          </div>

          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight drop-shadow-md">
            {selectedSong.title}
          </h2>
          <p className="text-lg text-white/80 font-medium">
            {selectedSong.artist}
          </p>

          <div className="flex items-center gap-4 mt-4 text-xs font-mono text-slate-300">
            <span>BPM: {selectedSong.bpm}</span>
            <span>·</span>
            <span className="text-rose-400 font-bold">{selectedSong.difficulty}</span>
            <span>·</span>
            <span>{selectedSong.totalNotes} Notes</span>
          </div>

          {highScores[selectedSong.id] && (
            <div className="mt-3 text-xs text-amber-300 font-mono font-semibold">
              Best Score: {highScores[selectedSong.id]} pts
            </div>
          )}

          <button
            onClick={onStartGame}
            className="mt-5 w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-fuchsia-600 via-rose-600 to-amber-500 hover:from-fuchsia-500 hover:via-rose-500 hover:to-amber-400 text-white font-bold text-base tracking-wide uppercase shadow-lg shadow-rose-600/40 active:scale-98 transition-all flex items-center justify-center gap-3"
          >
            <Play className="w-5 h-5 fill-white" />
            Play Track Now
          </button>
        </div>

        {/* Song Catalog Strip */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1">
            Choose Track
          </span>

          <div className="grid grid-cols-1 gap-2">
            {SONGS.map((song) => {
              const isSelected = song.id === selectedSong.id;
              return (
                <div
                  key={song.id}
                  onClick={() => onSelectSong(song)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-white/15 border-rose-500 shadow-md shadow-rose-500/20'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg bg-gradient-to-tr ${song.coverGradient} flex items-center justify-center shadow-md`}
                    >
                      <Music className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        {song.title}
                        {song.id === 'judas' && (
                          <span className="text-[10px] bg-rose-500/30 text-rose-300 border border-rose-500/40 px-1.5 py-0.5 rounded">
                            HOT
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400">{song.artist}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-mono font-semibold text-slate-300">
                      {song.difficulty}
                    </span>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {song.bpm} BPM
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Control Hints Footer */}
      <div className="text-center py-2 text-xs text-slate-400 font-mono">
        Mobile: Tap / Multi-touch lanes · PC: D, F, J, K or 1, 2, 3, 4
      </div>
    </div>
  );
};
