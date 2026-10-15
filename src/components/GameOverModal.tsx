import React from 'react';
import { GameStats, Song } from '../types/game';
import { Star, Crown, RotateCcw, ArrowRight, ListMusic, Trophy } from 'lucide-react';

interface GameOverModalProps {
  stats: GameStats;
  song: Song;
  onRestart: () => void;
  onSongSelect: () => void;
  onNextSong?: () => void;
  isVictory: boolean;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  song,
  onRestart,
  onSongSelect,
  onNextSong,
  isVictory,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-sm bg-gradient-to-b from-slate-900 to-purple-950 border border-white/15 rounded-3xl p-6 text-center shadow-2xl flex flex-col items-center gap-5">
        {/* Victory / Defeat Badge */}
        <div className="flex flex-col items-center gap-2">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
              isVictory
                ? 'bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 shadow-yellow-400/40'
                : 'bg-gradient-to-tr from-rose-600 to-fuchsia-600 text-white shadow-rose-600/30'
            }`}
          >
            <Trophy className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight uppercase">
            {isVictory ? 'Track Completed!' : 'Song Over'}
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            {song.title} · {song.artist}
          </p>
        </div>

        {/* Stars & Crowns Trophy Shelf */}
        <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-2xl bg-white/5 border border-white/10 w-full">
          {/* 3 Stars */}
          {[1, 2, 3].map((starNum) => (
            <Star
              key={starNum}
              className={`w-6 h-6 transition-transform ${
                stats.starsEarned >= starNum
                  ? 'fill-yellow-400 text-yellow-300 drop-shadow-[0_0_8px_rgba(255,215,0,0.8)] scale-110'
                  : 'fill-white/10 text-white/30'
              }`}
            />
          ))}

          <div className="w-px h-6 bg-white/15 mx-1" />

          {/* 3 Crowns */}
          {[1, 2, 3].map((crownNum) => (
            <Crown
              key={crownNum}
              className={`w-6 h-6 transition-transform ${
                stats.crownsEarned >= crownNum
                  ? 'fill-amber-400 text-yellow-200 drop-shadow-[0_0_10px_rgba(255,215,0,0.9)] scale-110'
                  : 'fill-white/10 text-white/30'
              }`}
            />
          ))}
        </div>

        {/* Big Final Score */}
        <div className="flex flex-col items-center">
          <span className="text-5xl font-black text-white tracking-tight font-mono tabular-nums">
            {stats.score}
          </span>
          <span className="text-[11px] uppercase tracking-widest text-slate-400 mt-1">
            Total Points
          </span>
        </div>

        {/* Detailed Breakdown Grid */}
        <div className="grid grid-cols-3 gap-2 w-full text-center">
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
            <div className="text-xs text-slate-400">Max Combo</div>
            <div className="text-sm font-bold text-yellow-300 font-mono mt-0.5">
              {stats.maxCombo}×
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
            <div className="text-xs text-slate-400">Perfects</div>
            <div className="text-sm font-bold text-fuchsia-300 font-mono mt-0.5">
              {stats.perfectHits}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
            <div className="text-xs text-slate-400">Misses</div>
            <div className="text-sm font-bold text-rose-400 font-mono mt-0.5">
              {stats.missCount}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 w-full pt-1">
          <button
            onClick={onRestart}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-fuchsia-600 via-rose-600 to-amber-500 hover:from-fuchsia-500 hover:via-rose-500 hover:to-amber-400 text-white font-bold tracking-wide uppercase shadow-lg shadow-rose-600/30 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Play Again
          </button>

          {onNextSong && isVictory && (
            <button
              onClick={onNextSong}
              className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium active:scale-98 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <span>Next Song</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onSongSelect}
            className="w-full py-2.5 px-4 rounded-xl bg-transparent hover:bg-white/5 text-slate-400 hover:text-white font-medium active:scale-98 transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <ListMusic className="w-4 h-4" />
            Song Select
          </button>
        </div>
      </div>
    </div>
  );
};
