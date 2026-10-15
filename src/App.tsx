import React, { useState, useEffect } from 'react';
import { GameState, Song, GameSettings, GameStats } from './types/game';
import { SONGS, LIGHTING_THEMES } from './songs/songData';
import { PianoGame } from './components/PianoGame';
import { SongSelectModal } from './components/SongSelectModal';
import { LightingSettingsModal } from './components/LightingSettingsModal';
import { GameOverModal } from './components/GameOverModal';
import { HapticVisualizer } from './components/HapticVisualizer';
import { Smartphone, Maximize2, Wifi, BatteryMedium, Signal } from 'lucide-react';

export default function App() {
  // Current game state
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [selectedSong, setSelectedSong] = useState<Song>(SONGS[0]); // First song is Judas from Lady Gaga!
  const [lastStats, setLastStats] = useState<GameStats | null>(null);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [highScores, setHighScores] = useState<Record<string, number>>({});

  // Android time clock simulator
  const [androidTime, setAndroidTime] = useState<string>('12:00');

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setAndroidTime(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // Settings with defaults
  const [settings, setSettings] = useState<GameSettings>({
    soundEnabled: true,
    soundVolume: 0.85,
    instrument: 'synth',
    lightingTheme: 'judas-neon',
    bloomEffects: true,
    lasersEnabled: true,
    haptics: {
      enabled: true,
      strength: 'medium',
    },
    androidFrame: false, // Default to clean responsive portrait
  });

  // Load high scores
  useEffect(() => {
    try {
      const stored = localStorage.getItem('neon_piano_highscores');
      if (stored) {
        setHighScores(JSON.parse(stored));
      }
    } catch {
      // Ignore localStorage errors in sandbox
    }
  }, []);

  // Update high score
  const saveHighScore = (songId: string, score: number) => {
    setHighScores((prev) => {
      const current = prev[songId] || 0;
      if (score > current) {
        const updated = { ...prev, [songId]: score };
        try {
          localStorage.setItem('neon_piano_highscores', JSON.stringify(updated));
        } catch {
          // Ignore
        }
        return updated;
      }
      return prev;
    });
  };

  const handleStartGame = () => {
    setGameState('PLAYING');
  };

  const handleGameOver = (stats: GameStats) => {
    setLastStats(stats);
    setIsVictory(false);
    setGameState('GAMEOVER');
    saveHighScore(selectedSong.id, stats.score);
  };

  const handleVictory = (stats: GameStats) => {
    setLastStats(stats);
    setIsVictory(true);
    setGameState('VICTORY');
    saveHighScore(selectedSong.id, stats.score);
  };

  const handleNextSong = () => {
    const currIdx = SONGS.findIndex((s) => s.id === selectedSong.id);
    const nextSong = SONGS[(currIdx + 1) % SONGS.length];
    setSelectedSong(nextSong);
    setGameState('PLAYING');
  };

  const updateSettings = (partial: Partial<GameSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#060710] flex items-center justify-center select-none font-sans relative">
      {/* Visual Haptic feedback indicator ripple layer */}
      <HapticVisualizer />

      {/* Top Desktop Controls Bar (Switching between Android frame & full width) */}
      <div className="hidden lg:flex fixed top-4 right-4 z-50 items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-xl text-xs text-slate-300">
        <button
          onClick={() => updateSettings({ androidFrame: !settings.androidFrame })}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-colors ${
            settings.androidFrame ? 'bg-fuchsia-600 text-white font-medium' : 'hover:text-white'
          }`}
          title="Toggle Android Device Shell"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Android Frame</span>
        </button>
        <button
          onClick={() => updateSettings({ androidFrame: false })}
          className="flex items-center gap-1 px-2 py-1 rounded-full hover:text-white transition-colors"
          title="Full Viewport Mode"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span>Full Screen</span>
        </button>
      </div>

      {/* Android Device Shell Container or Direct Responsive Screen */}
      <div
        className={`relative w-full h-full overflow-hidden transition-all duration-300 ${
          settings.androidFrame
            ? 'max-w-[420px] max-h-[880px] rounded-[44px] border-[10px] border-slate-800 shadow-[0_0_60px_rgba(0,0,0,0.9),0_0_20px_rgba(139,92,246,0.3)] ring-1 ring-white/10'
            : 'max-w-md md:max-w-lg lg:max-w-xl mx-auto shadow-2xl'
        }`}
      >
        {/* Android Pinhole Camera & Status Bar */}
        {settings.androidFrame && (
          <div className="absolute top-0 inset-x-0 z-50 h-7 px-6 flex items-center justify-between text-white/80 text-[11px] font-mono pointer-events-none">
            <span>{androidTime}</span>
            {/* Pinhole camera notch */}
            <div className="w-3.5 h-3.5 rounded-full bg-black border border-white/20 mx-auto" />
            <div className="flex items-center gap-1.5 text-white/70">
              <Signal className="w-3 h-3" />
              <Wifi className="w-3 h-3" />
              <BatteryMedium className="w-3.5 h-3.5" />
            </div>
          </div>
        )}

        {/* Inner Game Views */}
        <div className="w-full h-full relative">
          {gameState === 'MENU' && (
            <SongSelectModal
              selectedSong={selectedSong}
              onSelectSong={setSelectedSong}
              onStartGame={handleStartGame}
              onOpenSettings={() => setShowSettings(true)}
              highScores={highScores}
            />
          )}

          {gameState === 'PLAYING' && (
            <PianoGame
              song={selectedSong}
              settings={settings}
              onGameOver={handleGameOver}
              onVictory={handleVictory}
              onExit={() => setGameState('MENU')}
            />
          )}

          {(gameState === 'GAMEOVER' || gameState === 'VICTORY') && lastStats && (
            <GameOverModal
              stats={lastStats}
              song={selectedSong}
              onRestart={handleStartGame}
              onSongSelect={() => setGameState('MENU')}
              onNextSong={handleNextSong}
              isVictory={isVictory}
            />
          )}

          {/* Settings Modal */}
          {showSettings && (
            <LightingSettingsModal
              settings={settings}
              onUpdateSettings={updateSettings}
              onClose={() => setShowSettings(false)}
            />
          )}
        </div>

        {/* Android Gesture Bar Pill at Bottom */}
        {settings.androidFrame && (
          <div className="absolute bottom-1 inset-x-0 flex justify-center pointer-events-none z-50">
            <div className="w-32 h-1 bg-white/40 rounded-full" />
          </div>
        )}
      </div>
    </div>
  );
}
