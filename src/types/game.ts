export type GameState = 'MENU' | 'PLAYING' | 'PAUSED' | 'VICTORY' | 'GAMEOVER';

export type TileType = 'tap' | 'hold';

export interface NoteData {
  id: number;
  lane: number; // 0, 1, 2, 3
  time: number; // in seconds from song start
  type: TileType;
  duration?: number; // for hold notes, in seconds
  noteName: string; // e.g. "C#4", "D#4"
  frequency: number; // in Hz
  isBass?: boolean;
}

export interface ActiveTile {
  id: number;
  lane: number;
  targetTime: number; // song time when note hits target line
  type: TileType;
  duration: number; // length in seconds for hold
  noteName: string;
  frequency: number;
  isBass?: boolean;
  
  // Runtime state
  y: number; // current y coordinate (or calculated from time)
  height: number;
  hit: boolean;
  holding: boolean;
  holdProgress: number; // 0 to 1
  missed: boolean;
  cleared: boolean;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Extreme';
  coverGradient: string;
  lightingTheme: LightingThemeId;
  totalNotes: number;
  notes: NoteData[];
}

export type LightingThemeId = 'judas-neon' | 'gaga-chromatica' | 'cyber-azure' | 'golden-crown';

export interface LightingTheme {
  id: LightingThemeId;
  name: string;
  description: string;
  primaryColor: string; // e.g. #ff0055
  secondaryColor: string; // e.g. #8b00ff
  accentColor: string; // e.g. #ffd700
  laneDividers: string;
  tileGradient: [string, string];
  lasers: boolean;
  bgGradient: string;
}

export interface HapticSettings {
  enabled: boolean;
  strength: 'light' | 'medium' | 'heavy';
}

export interface GameSettings {
  soundEnabled: boolean;
  soundVolume: number;
  instrument: 'synth' | 'grand-piano' | 'cyber-bass';
  lightingTheme: LightingThemeId;
  bloomEffects: boolean;
  lasersEnabled: boolean;
  haptics: HapticSettings;
  androidFrame: boolean; // toggle Android shell for desktop
}

export interface GameStats {
  score: number;
  combo: number;
  maxCombo: number;
  perfectHits: number;
  greatHits: number;
  goodHits: number;
  missCount: number;
  starsEarned: number; // 0 to 3
  crownsEarned: number; // 0 to 3
  accuracy: number; // 0 to 100%
  completed: boolean;
}
