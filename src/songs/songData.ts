import { Song, NoteData, LightingTheme } from '../types/game';

// Note frequencies map
const FREQS: Record<string, number> = {
  'C#3': 138.59, 'D#3': 155.56, 'E3': 164.81, 'F#3': 185.00, 'G#3': 207.65, 'A3': 220.00, 'B3': 246.94,
  'C3': 130.81, 'D3': 146.83, 'F3': 174.61, 'G3': 196.00,
  'C#4': 277.18, 'D#4': 311.13, 'E4': 329.63, 'F#4': 369.99, 'G#4': 415.30, 'A4': 440.00, 'B4': 493.88,
  'C4': 261.63, 'D4': 293.66, 'F4': 349.23, 'G4': 392.00,
  'C#5': 554.37, 'D#5': 622.25, 'E5': 659.25, 'F#5': 739.99, 'G#5': 830.61, 'A5': 880.00, 'B5': 987.77,
  'C5': 523.25, 'D5': 587.33, 'F5': 698.46, 'G5': 783.99,
};

// Generates Judas - Lady Gaga chart
function buildJudasChart(): NoteData[] {
  const bpm = 131;
  const beat = 60 / bpm; // ~0.458s per beat
  const notes: NoteData[] = [];
  let id = 1;
  let t = 1.0; // Start at 1.0s

  const add = (lane: number, noteName: string, beats: number, type: 'tap' | 'hold' = 'tap', holdBeats: number = 0) => {
    notes.push({
      id: id++,
      lane: lane % 4,
      time: t,
      type,
      duration: type === 'hold' ? holdBeats * beat : undefined,
      noteName,
      frequency: FREQS[noteName] || 440,
    });
    t += beats * beat;
  };

  // Section 1: Iconic Chant Intro ("Ohohoh, I'm in love with Juda-as, Juda-as")
  // "Oh-oh-oh-oh-oh"
  add(1, 'G#4', 0.5);
  add(2, 'G#4', 0.5);
  add(1, 'G#4', 0.5);
  add(3, 'B4', 0.5);
  add(2, 'G#4', 1.0, 'hold', 1.0); // "Ohohoh"

  // "I'm in love with Juda-as, Juda-as"
  add(0, 'E4', 0.5);
  add(1, 'F#4', 0.5);
  add(2, 'G#4', 0.5);
  add(1, 'F#4', 0.5);
  add(0, 'E4', 0.5);
  add(2, 'G#4', 1.0, 'hold', 1.2); // "Judas"
  add(1, 'F#4', 0.5);
  add(0, 'E4', 1.0, 'hold', 1.2);

  // Chant Repeat with more punch
  add(1, 'G#4', 0.5);
  add(2, 'G#4', 0.5);
  add(3, 'B4', 0.5);
  add(2, 'G#4', 0.5);
  add(1, 'E4', 0.5);
  add(2, 'F#4', 0.5);
  add(3, 'G#4', 0.5);
  add(2, 'F#4', 0.5);
  add(1, 'E4', 0.5);
  add(0, 'D#4', 0.5);
  add(1, 'C#4', 1.5, 'hold', 1.5); // "Juda-as Gaga!"

  // Section 2: Relentless Synth Bass Riff & Stabs
  const bassRiff = [
    { l: 0, n: 'C#3' }, { l: 1, n: 'C#3' }, { l: 2, n: 'E3' }, { l: 3, n: 'F#3' },
    { l: 2, n: 'G#3' }, { l: 1, n: 'F#3' }, { l: 0, n: 'E3' }, { l: 1, n: 'D#3' },
  ];
  for (let r = 0; r < 2; r++) {
    bassRiff.forEach((b) => {
      add(b.l, b.n, 0.35);
    });
  }

  // Section 3: Verse 1 ("When he calls to me I am ready...")
  // "When he calls to me I am ready"
  add(1, 'G#4', 0.5);
  add(2, 'G#4', 0.5);
  add(1, 'G#4', 0.5);
  add(0, 'F#4', 0.5);
  add(1, 'E4', 0.5);
  add(2, 'G#4', 1.0, 'hold', 1.0);

  // "I'll wash his feet with my hair if he needs"
  add(3, 'G#4', 0.5);
  add(2, 'G#4', 0.5);
  add(1, 'F#4', 0.5);
  add(0, 'E4', 0.5);
  add(1, 'D#4', 0.5);
  add(2, 'E4', 0.5);
  add(1, 'F#4', 1.0, 'hold', 1.2);

  // "Forgive him when his tongue lies through his brain"
  add(0, 'G#4', 0.5);
  add(1, 'G#4', 0.5);
  add(2, 'G#4', 0.5);
  add(3, 'B4', 0.5);
  add(2, 'A4', 0.5);
  add(1, 'G#4', 0.5);
  add(0, 'F#4', 1.0);

  // "Even after three times he betrays me"
  add(1, 'E4', 0.5);
  add(2, 'F#4', 0.5);
  add(3, 'G#4', 0.5);
  add(2, 'F#4', 0.5);
  add(1, 'E4', 0.5);
  add(0, 'D#4', 0.5);
  add(1, 'C#4', 1.5, 'hold', 1.8);

  // Section 4: Pre-Chorus ("I wanna love you, but something's pulling me away from you")
  add(0, 'B4', 0.5);
  add(1, 'C#5', 0.5);
  add(2, 'D#5', 0.5);
  add(1, 'C#5', 0.5);
  add(0, 'B4', 0.5);
  add(2, 'C#5', 1.0, 'hold', 1.2);

  // "Jesus is my virtue, and Judas is the demon I cling to!"
  add(3, 'C#5', 0.4);
  add(2, 'D#5', 0.4);
  add(1, 'E5', 0.4);
  add(0, 'D#5', 0.4);
  add(2, 'C#5', 0.4);
  add(3, 'B4', 0.4);
  add(1, 'A4', 0.4);
  add(2, 'G#4', 1.2, 'hold', 1.5);

  // Build up rapid fire climb
  add(0, 'C#4', 0.25);
  add(1, 'E4', 0.25);
  add(2, 'G#4', 0.25);
  add(3, 'B4', 0.25);
  add(2, 'C#5', 0.25);
  add(1, 'D#5', 0.25);
  add(0, 'E5', 0.25);
  add(3, 'G#5', 0.5, 'hold', 0.8);

  // Section 5: Explosive Chorus ("I'm in love with Judas, Judas!")
  // JU-DAS! JU-DAS!
  add(1, 'G#5', 0.5);
  add(2, 'G#5', 0.5);
  add(3, 'B5', 0.5);
  add(2, 'G#5', 0.5);
  add(0, 'E5', 0.5);
  add(1, 'F#5', 1.0, 'hold', 1.5);

  // JU-DA-A-AS, GAGA!
  add(2, 'G#5', 0.4);
  add(1, 'F#5', 0.4);
  add(0, 'E5', 0.4);
  add(1, 'D#5', 0.4);
  add(2, 'C#5', 1.2, 'hold', 1.8);

  // Chorus Part 2 ("I'm in love with Judas, Judas!")
  add(0, 'G#5', 0.5);
  add(1, 'G#5', 0.5);
  add(2, 'B5', 0.5);
  add(3, 'G#5', 0.5);
  add(1, 'E5', 0.5);
  add(2, 'F#5', 1.0, 'hold', 1.2);

  // Climax ending rapid cascade
  const climaxLanes = [0, 1, 2, 3, 2, 1, 0, 1, 2, 3, 1, 2, 0, 3];
  const climaxNotes = ['C#5', 'D#5', 'E5', 'G#5', 'B5', 'C#6', 'B5', 'G#5', 'E5', 'F#5', 'G#5', 'E5', 'D#5', 'C#5'];
  climaxLanes.forEach((lane, idx) => {
    add(lane, climaxNotes[idx % climaxNotes.length], 0.3);
  });

  // Final hold note
  add(1, 'C#5', 2.0, 'hold', 2.5);

  return notes;
}

// Generates Bad Romance - Lady Gaga chart
function buildBadRomanceChart(): NoteData[] {
  const bpm = 119;
  const beat = 60 / bpm;
  const notes: NoteData[] = [];
  let id = 1000;
  let t = 1.0;

  const add = (lane: number, noteName: string, beats: number, type: 'tap' | 'hold' = 'tap', holdBeats: number = 0) => {
    notes.push({
      id: id++,
      lane: lane % 4,
      time: t,
      type,
      duration: type === 'hold' ? holdBeats * beat : undefined,
      noteName,
      frequency: FREQS[noteName] || 440,
    });
    t += beats * beat;
  };

  // "Rah-rah-ah-ah-ah, Roma-roma-ma"
  const intro = [
    { l: 0, n: 'A4', b: 0.5 }, { l: 1, n: 'A4', b: 0.5 }, { l: 2, n: 'A4', b: 0.5 }, { l: 1, n: 'G4', b: 0.5 }, { l: 0, n: 'A4', b: 1.0, h: 1.0 },
    { l: 3, n: 'A4', b: 0.5 }, { l: 2, n: 'A4', b: 0.5 }, { l: 1, n: 'A4', b: 0.5 }, { l: 2, n: 'G4', b: 0.5 }, { l: 3, n: 'A4', b: 1.0, h: 1.0 },
    { l: 1, n: 'C5', b: 0.5 }, { l: 2, n: 'B4', b: 0.5 }, { l: 1, n: 'A4', b: 0.5 }, { l: 0, n: 'G4', b: 0.5 }, { l: 1, n: 'A4', b: 1.5, h: 1.5 },
  ];

  intro.forEach((item) => {
    add(item.l, item.n, item.b, item.h ? 'hold' : 'tap', item.h || 0);
  });

  // Chorus ("I want your ugly, I want your disease...")
  const chorus = [
    { l: 0, n: 'E4', b: 0.5 }, { l: 1, n: 'E4', b: 0.5 }, { l: 2, n: 'E4', b: 0.5 }, { l: 3, n: 'G4', b: 0.5 }, { l: 2, n: 'A4', b: 1.0 },
    { l: 1, n: 'E4', b: 0.5 }, { l: 0, n: 'E4', b: 0.5 }, { l: 2, n: 'G4', b: 0.5 }, { l: 3, n: 'A4', b: 1.5, h: 1.2 },
    { l: 0, n: 'C5', b: 0.5 }, { l: 1, n: 'B4', b: 0.5 }, { l: 2, n: 'A4', b: 0.5 }, { l: 3, n: 'B4', b: 0.5 }, { l: 2, n: 'C5', b: 1.0 },
    { l: 1, n: 'D5', b: 0.5 }, { l: 2, n: 'C5', b: 0.5 }, { l: 1, n: 'B4', b: 0.5 }, { l: 0, n: 'A4', b: 1.5, h: 1.8 },
  ];

  chorus.forEach((item) => {
    add(item.l, item.n, item.b, item.h ? 'hold' : 'tap', item.h || 0);
  });

  // Fast Run
  for (let i = 0; i < 16; i++) {
    add(i % 4, ['A4', 'C5', 'E5', 'A5'][i % 4], 0.25);
  }
  add(2, 'A5', 2.0, 'hold', 2.0);

  return notes;
}

// Generates Bloody Mary - Lady Gaga chart
function buildBloodyMaryChart(): NoteData[] {
  const bpm = 100;
  const beat = 60 / bpm;
  const notes: NoteData[] = [];
  let id = 2000;
  let t = 1.0;

  const add = (lane: number, noteName: string, beats: number, type: 'tap' | 'hold' = 'tap', holdBeats: number = 0) => {
    notes.push({
      id: id++,
      lane: lane % 4,
      time: t,
      type,
      duration: type === 'hold' ? holdBeats * beat : undefined,
      noteName,
      frequency: FREQS[noteName] || 440,
    });
    t += beats * beat;
  };

  // "I'll dance dance dance with my hands hands hands"
  const hook = [
    { l: 1, n: 'F#4', b: 0.5 }, { l: 2, n: 'F#4', b: 0.5 }, { l: 3, n: 'F#4', b: 0.5 },
    { l: 2, n: 'E4', b: 0.5 }, { l: 1, n: 'F#4', b: 0.5 }, { l: 2, n: 'G#4', b: 0.5 },
    { l: 3, n: 'A4', b: 0.5 }, { l: 2, n: 'G#4', b: 0.5 }, { l: 1, n: 'F#4', b: 1.0, h: 1.2 },
    // "Above my head, head, head"
    { l: 0, n: 'D4', b: 0.5 }, { l: 1, n: 'D4', b: 0.5 }, { l: 2, n: 'D4', b: 0.5 },
    { l: 1, n: 'E4', b: 0.5 }, { l: 2, n: 'F#4', b: 1.5, h: 1.5 },
  ];

  for (let rep = 0; rep < 2; rep++) {
    hook.forEach((item) => {
      add(item.l, item.n, item.b, item.h ? 'hold' : 'tap', item.h || 0);
    });
  }

  // Synth arpeggio
  const arp = [0, 1, 2, 3, 2, 1, 0, 1, 2, 3, 2, 1, 0, 2, 1, 3];
  arp.forEach((l) => {
    add(l, ['F#4', 'A4', 'C#5', 'F#5'][l], 0.3);
  });
  add(1, 'F#5', 2.0, 'hold', 2.0);

  return notes;
}

// Generates Fur Elise EDM Remix chart
function buildFurEliseChart(): NoteData[] {
  const bpm = 135;
  const beat = 60 / bpm;
  const notes: NoteData[] = [];
  let id = 3000;
  let t = 1.0;

  const add = (lane: number, noteName: string, beats: number, type: 'tap' | 'hold' = 'tap', holdBeats: number = 0) => {
    notes.push({
      id: id++,
      lane: lane % 4,
      time: t,
      type,
      duration: type === 'hold' ? holdBeats * beat : undefined,
      noteName,
      frequency: FREQS[noteName] || 440,
    });
    t += beats * beat;
  };

  // E - D# - E - D# - E - B - D - C - A
  const motif = [
    { l: 3, n: 'E5', b: 0.35 }, { l: 2, n: 'D#5', b: 0.35 }, { l: 3, n: 'E5', b: 0.35 },
    { l: 2, n: 'D#5', b: 0.35 }, { l: 3, n: 'E5', b: 0.35 }, { l: 1, n: 'B4', b: 0.35 },
    { l: 2, n: 'D5', b: 0.35 }, { l: 1, n: 'C5', b: 0.35 }, { l: 0, n: 'A4', b: 1.0, h: 1.2 },
  ];

  for (let rep = 0; rep < 3; rep++) {
    motif.forEach((item) => {
      add(item.l, item.n, item.b, item.h ? 'hold' : 'tap', item.h || 0);
    });
  }

  // Fast Arp Cascade
  for (let i = 0; i < 20; i++) {
    add(i % 4, ['A4', 'C5', 'E5', 'A5'][i % 4], 0.2);
  }
  add(3, 'E5', 2.0, 'hold', 2.2);

  return notes;
}

// Lighting themes
export const LIGHTING_THEMES: Record<string, LightingTheme> = {
  'judas-neon': {
    id: 'judas-neon',
    name: 'Judas Gothic Neon',
    description: 'Deep violet stage lights with holy golden aura and cyber-crimson flares',
    primaryColor: '#ff0055',
    secondaryColor: '#7928ca',
    accentColor: '#ffd700',
    laneDividers: 'rgba(255, 255, 255, 0.15)',
    tileGradient: ['#120826', '#2b0c4a'],
    lasers: true,
    bgGradient: 'from-[#070514] via-[#120a2e] to-[#04020a]',
  },
  'gaga-chromatica': {
    id: 'gaga-chromatica',
    name: 'Gaga Chromatica',
    description: 'Electric magenta lasers, radiant cyan rim glow, high-energy pop pulse',
    primaryColor: '#ff007f',
    secondaryColor: '#00e5ff',
    accentColor: '#ffea00',
    laneDividers: 'rgba(0, 229, 255, 0.25)',
    tileGradient: ['#1c0326', '#470a59'],
    lasers: true,
    bgGradient: 'from-[#0d021c] via-[#210535] to-[#050010]',
  },
  'cyber-azure': {
    id: 'cyber-azure',
    name: 'Cyber Azure',
    description: 'Deep royal blue, neon cyan laser grid, ultra clean arcade glass',
    primaryColor: '#00d2ff',
    secondaryColor: '#3a7bd5',
    accentColor: '#00ffcc',
    laneDividers: 'rgba(0, 210, 255, 0.2)',
    tileGradient: ['#04152d', '#0b2b57'],
    lasers: true,
    bgGradient: 'from-[#020b18] via-[#091f3d] to-[#020812]',
  },
  'golden-crown': {
    id: 'golden-crown',
    name: 'Royal Gold Royale',
    description: 'Luxurious 24K gold particle trails, royal crown beams, warm starlight',
    primaryColor: '#ffd700',
    secondaryColor: '#ff9900',
    accentColor: '#ffffff',
    laneDividers: 'rgba(255, 215, 0, 0.25)',
    tileGradient: ['#1a1402', '#3d2e05'],
    lasers: true,
    bgGradient: 'from-[#0e0b02] via-[#261d06] to-[#080601]',
  },
};

export const SONGS: Song[] = [
  {
    id: 'judas',
    title: 'Judas',
    artist: 'Lady Gaga',
    bpm: 131,
    difficulty: 'Extreme',
    coverGradient: 'from-fuchsia-600 via-rose-600 to-amber-500',
    lightingTheme: 'judas-neon',
    totalNotes: 0,
    notes: [],
  },
  {
    id: 'bad-romance',
    title: 'Bad Romance',
    artist: 'Lady Gaga',
    bpm: 119,
    difficulty: 'Hard',
    coverGradient: 'from-pink-600 via-purple-600 to-indigo-600',
    lightingTheme: 'gaga-chromatica',
    totalNotes: 0,
    notes: [],
  },
  {
    id: 'bloody-mary',
    title: 'Bloody Mary',
    artist: 'Lady Gaga',
    bpm: 100,
    difficulty: 'Medium',
    coverGradient: 'from-red-600 via-violet-800 to-slate-900',
    lightingTheme: 'judas-neon',
    totalNotes: 0,
    notes: [],
  },
  {
    id: 'fur-elise-edm',
    title: 'Für Elise (EDM Remix)',
    artist: 'Beethoven x Gaga Style',
    bpm: 135,
    difficulty: 'Hard',
    coverGradient: 'from-cyan-500 via-blue-600 to-purple-700',
    lightingTheme: 'cyber-azure',
    totalNotes: 0,
    notes: [],
  },
];

// Initialize note charts and counts
SONGS[0].notes = buildJudasChart();
SONGS[0].totalNotes = SONGS[0].notes.length;

SONGS[1].notes = buildBadRomanceChart();
SONGS[1].totalNotes = SONGS[1].notes.length;

SONGS[2].notes = buildBloodyMaryChart();
SONGS[2].totalNotes = SONGS[2].notes.length;

SONGS[3].notes = buildFurEliseChart();
SONGS[3].totalNotes = SONGS[3].notes.length;
