import React from 'react';
import { Star, Crown } from 'lucide-react';

interface ProgressBarProps {
  progress: number; // 0 to 1
  stars: number; // 0 to 3
  crowns: number; // 0 to 3
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, stars, crowns }) => {
  // Milestones on progress track (0.0 to 1.0)
  // Stars unlock at 15%, 35%, 55%
  // Crowns unlock at 70%, 85%, 100%
  const milestones = [
    { type: 'star', index: 1, pos: 0.15, unlocked: stars >= 1 },
    { type: 'star', index: 2, pos: 0.35, unlocked: stars >= 2 },
    { type: 'star', index: 3, pos: 0.55, unlocked: stars >= 3 },
    { type: 'crown', index: 1, pos: 0.70, unlocked: crowns >= 1 },
    { type: 'crown', index: 2, pos: 0.85, unlocked: crowns >= 2 },
    { type: 'crown', index: 3, pos: 1.00, unlocked: crowns >= 3 },
  ];

  return (
    <div className="relative w-full max-w-sm px-4 pt-3 pb-2 select-none pointer-events-none">
      {/* Background track line */}
      <div className="relative h-1 w-full bg-white/20 rounded-full">
        {/* Filled luminous progress track */}
        <div
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 rounded-full transition-all duration-75 shadow-[0_0_12px_rgba(255,225,50,0.8)]"
          style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
        />

        {/* Leading shooting star comet head */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-[0_0_14px_#fff,0_0_24px_#ffd700] transition-all duration-75 flex items-center justify-center"
          style={{ left: `${Math.min(100, Math.max(0, progress * 100))}%` }}
        >
          <div className="w-1.5 h-1.5 bg-amber-300 rounded-full" />
        </div>
      </div>

      {/* Star and Crown Icons positioned along the track */}
      <div className="relative w-full h-8 -mt-4.5 flex justify-between pointer-events-none">
        {milestones.map((m, i) => {
          const isStar = m.type === 'star';
          const isUnlocked = m.unlocked;

          return (
            <div
              key={i}
              className="absolute -translate-x-1/2 flex flex-col items-center transition-all duration-300"
              style={{ left: `${m.pos * 100}%` }}
            >
              <div
                className={`transition-all duration-300 ${
                  isUnlocked
                    ? 'text-yellow-300 scale-125 filter drop-shadow-[0_0_10px_rgba(255,215,0,0.9)] animate-pulse'
                    : 'text-white/40 scale-90'
                }`}
              >
                {isStar ? (
                  <Star
                    className={`w-4.5 h-4.5 ${isUnlocked ? 'fill-yellow-300 stroke-yellow-100' : 'fill-white/10 stroke-white/50'}`}
                  />
                ) : (
                  <Crown
                    className={`w-5 h-5 ${isUnlocked ? 'fill-amber-400 stroke-yellow-200' : 'fill-white/10 stroke-white/50'}`}
                  />
                )}
              </div>

              {/* Sub-dot beneath milestone like in screenshot */}
              <div
                className={`w-1 h-1 rounded-full mt-1.5 transition-colors ${
                  isUnlocked ? 'bg-yellow-300 shadow-[0_0_6px_#ffd700]' : 'bg-white/30'
                }`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
