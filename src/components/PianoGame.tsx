import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Song, ActiveTile, GameSettings, GameStats } from '../types/game';
import { audioEngine } from '../audio/audioEngine';
import { triggerHaptic } from '../utils/haptics';
import { LIGHTING_THEMES } from '../songs/songData';
import { StageLighting } from './StageLighting';
import { ProgressBar } from './ProgressBar';
import { Pause, Play, RotateCcw, Volume2, VolumeX, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PianoGameProps {
  song: Song;
  settings: GameSettings;
  onGameOver: (stats: GameStats) => void;
  onVictory: (stats: GameStats) => void;
  onExit: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

interface FloatingText {
  id: number;
  text: string;
  subText?: string;
  x: number;
  y: number;
  color: string;
  alpha: number;
  scale: number;
}

interface LaneFlash {
  active: boolean;
  alpha: number;
  color: string;
}

export const PianoGame: React.FC<PianoGameProps> = ({
  song,
  settings,
  onGameOver,
  onVictory,
  onExit,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // React state for HUD
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [stars, setStars] = useState<number>(0);
  const [crowns, setCrowns] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(!settings.soundEnabled);
  const [audioStarted, setAudioStarted] = useState<boolean>(false);

  // Game stats tracking
  const statsRef = useRef<GameStats>({
    score: 0,
    combo: 0,
    maxCombo: 0,
    perfectHits: 0,
    greatHits: 0,
    goodHits: 0,
    missCount: 0,
    starsEarned: 0,
    crownsEarned: 0,
    accuracy: 100,
    completed: false,
  });

  // Game internal mutable state (kept in refs to avoid React re-render overhead in 60fps loop)
  const gameStateRef = useRef({
    activeTiles: [] as ActiveTile[],
    songStartTime: 0,
    pausedTime: 0,
    pauseStart: 0,
    currentTime: 0,
    laneFlashes: [
      { active: false, alpha: 0, color: '#fff' },
      { active: false, alpha: 0, color: '#fff' },
      { active: false, alpha: 0, color: '#fff' },
      { active: false, alpha: 0, color: '#fff' },
    ] as LaneFlash[],
    particles: [] as Particle[],
    floatingTexts: [] as FloatingText[],
    activeHolds: new Map<number, { tileId: number; releaseSound: () => void; lastTick: number }>(), // lane -> data
    cameraShake: { x: 0, y: 0, decay: 0.9 },
    isGameOver: false,
    speedMultiplier: 1.0,
    speedPxPerSec: 520, // baseline scroll speed
  });

  const theme = LIGHTING_THEMES[settings.lightingTheme] || LIGHTING_THEMES['judas-neon'];

  // Initialize Song Chart
  const initSong = useCallback(() => {
    audioEngine.init();
    audioEngine.setVolume(settings.soundVolume);
    audioEngine.setMuted(isMuted);
    audioEngine.setInstrument(settings.instrument);

    // Convert song notes to active tiles
    const activeTiles: ActiveTile[] = song.notes.map((note) => ({
      id: note.id,
      lane: note.lane,
      targetTime: note.time,
      type: note.type,
      duration: note.duration || 0,
      noteName: note.noteName,
      frequency: note.frequency,
      isBass: note.isBass,
      y: -200,
      height: note.type === 'hold' ? Math.max(160, (note.duration || 0.5) * 520) : 150,
      hit: false,
      holding: false,
      holdProgress: 0,
      missed: false,
      cleared: false,
    }));

    gameStateRef.current.activeTiles = activeTiles;
    gameStateRef.current.songStartTime = performance.now() / 1000 + 0.8; // 0.8s prep lead-in
    gameStateRef.current.pausedTime = 0;
    gameStateRef.current.currentTime = 0;
    gameStateRef.current.isGameOver = false;
    gameStateRef.current.particles = [];
    gameStateRef.current.floatingTexts = [];
    gameStateRef.current.activeHolds.clear();

    statsRef.current = {
      score: 0,
      combo: 0,
      maxCombo: 0,
      perfectHits: 0,
      greatHits: 0,
      goodHits: 0,
      missCount: 0,
      starsEarned: 0,
      crownsEarned: 0,
      accuracy: 100,
      completed: false,
    };

    setScore(0);
    setCombo(0);
    setProgress(0);
    setStars(0);
    setCrowns(0);
    setIsPaused(false);
  }, [song, settings, isMuted]);

  useEffect(() => {
    initSong();
  }, [initSong]);

  // Audio Toggle
  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    audioEngine.setMuted(nextMuted);
  };

  // Trigger floating popup score text
  const addFloatingText = (text: string, subText: string | undefined, x: number, y: number, color: string) => {
    gameStateRef.current.floatingTexts.push({
      id: Math.random(),
      text,
      subText,
      x,
      y,
      color,
      alpha: 1.0,
      scale: 1.2,
    });
  };

  // Trigger burst of sparks and glowing rings
  const spawnParticles = (x: number, y: number, color: string, count: number = 20) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6 + 2;
      gameStateRef.current.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        radius: Math.random() * 3 + 2,
        color,
        alpha: 1.0,
        life: 0,
        maxLife: Math.random() * 20 + 20,
      });
    }
  };

  // Milestone check for Stars and Crowns
  const checkMilestones = (currProgress: number) => {
    const prevStars = statsRef.current.starsEarned;
    const prevCrowns = statsRef.current.crownsEarned;

    let newStars = 0;
    if (currProgress >= 0.15) newStars = 1;
    if (currProgress >= 0.35) newStars = 2;
    if (currProgress >= 0.55) newStars = 3;

    let newCrowns = 0;
    if (currProgress >= 0.70) newCrowns = 1;
    if (currProgress >= 0.85) newCrowns = 2;
    if (currProgress >= 0.99) newCrowns = 3;

    if (newStars > prevStars || newCrowns > prevCrowns) {
      statsRef.current.starsEarned = newStars;
      statsRef.current.crownsEarned = newCrowns;
      setStars(newStars);
      setCrowns(newCrowns);

      // Play milestone fanfare & celebration
      audioEngine.playChime();
      triggerHaptic('milestone', settings.haptics);

      if (newCrowns > prevCrowns || newStars === 3) {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.15 },
          colors: ['#ffd700', '#ff007f', '#00e5ff', '#ffffff'],
        });
      }
    }
  };

  // Lane input hit handler
  const handleLanePress = (laneIndex: number, clientX?: number, clientY?: number) => {
    if (gameStateRef.current.isGameOver || isPaused) return;

    if (!audioStarted) {
      audioEngine.resume();
      setAudioStarted(true);
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const hitLineY = canvas.height * 0.82;
    const laneWidth = canvas.width / 4;
    const targetX = clientX ?? (laneIndex + 0.5) * laneWidth;
    const targetY = clientY ?? hitLineY;

    // Flash lane visually
    gameStateRef.current.laneFlashes[laneIndex] = {
      active: true,
      alpha: 0.75,
      color: theme.primaryColor,
    };

    // Find the closest unhit tile in this lane near hit line
    const unhitTiles = gameStateRef.current.activeTiles.filter(
      (t) => t.lane === laneIndex && !t.hit && !t.cleared
    );

    if (unhitTiles.length === 0) {
      // Empty lane tap miss (slight penalty or tap sound)
      audioEngine.playMiss();
      triggerHaptic('tap', settings.haptics, { x: targetX, y: targetY });
      return;
    }

    // Sort by y position (closest to hit line)
    unhitTiles.sort((a, b) => b.y - a.y);
    const candidate = unhitTiles[0];

    // Distance from hit line
    const dist = Math.abs(candidate.y - hitLineY);
    const hitTolerance = 140; // in pixels

    if (dist <= hitTolerance) {
      // SUCCESSFUL HIT!
      candidate.hit = true;

      // Accuracy judgment
      let rating: 'PERFECT' | 'GREAT' | 'GOOD';
      let pts = 0;
      let textCol = '#fff';

      if (dist < 40) {
        rating = 'PERFECT';
        pts = 50;
        textCol = '#ffd700';
        statsRef.current.perfectHits++;
        triggerHaptic('perfect', settings.haptics, { x: targetX, y: targetY });
      } else if (dist < 80) {
        rating = 'GREAT';
        pts = 30;
        textCol = '#00f0ff';
        statsRef.current.greatHits++;
        triggerHaptic('tap', settings.haptics, { x: targetX, y: targetY });
      } else {
        rating = 'GOOD';
        pts = 15;
        textCol = '#a3e635';
        statsRef.current.goodHits++;
        triggerHaptic('tap', settings.haptics, { x: targetX, y: targetY });
      }

      // Combo update
      const newCombo = statsRef.current.combo + 1;
      statsRef.current.combo = newCombo;
      statsRef.current.maxCombo = Math.max(statsRef.current.maxCombo, newCombo);
      setCombo(newCombo);

      // Score bonus based on combo
      const comboBonus = Math.min(50, Math.floor(newCombo / 5) * 5);
      const totalPts = pts + comboBonus;
      statsRef.current.score += totalPts;
      setScore(statsRef.current.score);

      // Play instrument note sound
      if (candidate.type === 'hold') {
        const release = audioEngine.playNote(candidate.frequency, candidate.duration, true);
        candidate.holding = true;
        gameStateRef.current.activeHolds.set(laneIndex, {
          tileId: candidate.id,
          releaseSound: release,
          lastTick: performance.now(),
        });
      } else {
        audioEngine.playNote(candidate.frequency, 0.4, false);
        candidate.cleared = true;
      }

      // Backing kick punch on every hit
      audioEngine.playKick(0.7);

      // Visual feedback
      spawnParticles(targetX, hitLineY, theme.primaryColor, 22);
      addFloatingText(rating, `+${totalPts}`, targetX, hitLineY - 40, textCol);

      // Slight screen bump on high combo
      if (newCombo % 10 === 0) {
        gameStateRef.current.cameraShake.x = (Math.random() - 0.5) * 8;
        gameStateRef.current.cameraShake.y = (Math.random() - 0.5) * 8;
      }
    } else if (candidate.y < hitLineY - hitTolerance) {
      // Tapped too early - ignore or slight tap sound
      audioEngine.playNote(candidate.frequency * 0.5, 0.1, false);
      triggerHaptic('tap', settings.haptics, { x: targetX, y: targetY });
    }
  };

  // Lane input release handler (for hold notes)
  const handleLaneRelease = (laneIndex: number) => {
    const activeHold = gameStateRef.current.activeHolds.get(laneIndex);
    if (!activeHold) return;

    activeHold.releaseSound();
    gameStateRef.current.activeHolds.delete(laneIndex);

    const tile = gameStateRef.current.activeTiles.find((t) => t.id === activeHold.tileId);
    if (tile) {
      tile.holding = false;
      tile.cleared = true;

      // Finished hold bonus
      if (tile.holdProgress > 0.8) {
        spawnParticles(
          (laneIndex + 0.5) * (canvasRef.current?.width || 360) / 4,
          (canvasRef.current?.height || 640) * 0.82,
          '#ffd700',
          30
        );
        addFloatingText('HOLD COMPLETE!', '+100', (laneIndex + 0.5) * (canvasRef.current?.width || 360) / 4, (canvasRef.current?.height || 640) * 0.82 - 60, '#ffd700');
        statsRef.current.score += 100;
        setScore(statsRef.current.score);
        triggerHaptic('perfect', settings.haptics);
      }
    }
  };

  // Keyboard navigation listener (D, F, J, K or 1, 2, 3, 4)
  useEffect(() => {
    const keyMap: Record<string, number> = {
      d: 0, D: 0, '1': 0,
      f: 1, F: 1, '2': 1,
      j: 2, J: 2, '3': 2,
      k: 3, K: 3, '4': 3,
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.key === ' ' || e.key === 'Escape') {
        setIsPaused((p) => !p);
        return;
      }
      const lane = keyMap[e.key];
      if (lane !== undefined) {
        handleLanePress(lane);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const lane = keyMap[e.key];
      if (lane !== undefined) {
        handleLaneRelease(lane);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [theme, isPaused, settings]);

  // Main 60fps Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();

    const gameLoop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05); // clamped dt
      lastTime = now;

      const w = canvas.width;
      const h = canvas.height;
      const hitLineY = h * 0.82;
      const laneWidth = w / 4;

      if (!isPaused && !gameStateRef.current.isGameOver) {
        const songTime = now / 1000 - gameStateRef.current.songStartTime - gameStateRef.current.pausedTime;
        gameStateRef.current.currentTime = songTime;

        // Dynamic speed acceleration based on combo and song difficulty
        const comboSpeed = Math.min(1.3, 1 + statsRef.current.combo * 0.005);
        const speedPx = gameStateRef.current.speedPxPerSec * comboSpeed;

        // Update song progress
        const totalDuration = song.notes[song.notes.length - 1]?.time + 2.0 || 60;
        const currentProgress = Math.min(1, Math.max(0, songTime / totalDuration));
        setProgress(currentProgress);
        checkMilestones(currentProgress);

        // Update active hold notes
        gameStateRef.current.activeHolds.forEach((hold, lane) => {
          if (now - hold.lastTick > 90) {
            hold.lastTick = now;
            statsRef.current.score += 5;
            setScore(statsRef.current.score);
            triggerHaptic('hold', settings.haptics);
            audioEngine.playKick(0.3);

            const tile = gameStateRef.current.activeTiles.find((t) => t.id === hold.tileId);
            if (tile) {
              tile.holdProgress = Math.min(1, tile.holdProgress + 0.08);
            }
          }
        });

        // Update tile positions & check misses
        let allCleared = true;

        for (const tile of gameStateRef.current.activeTiles) {
          if (tile.cleared) continue;

          // Target line alignment: when songTime == tile.targetTime, tile top reaches hitLineY
          const timeUntilHit = tile.targetTime - songTime;
          tile.y = hitLineY - timeUntilHit * speedPx;

          // Check if tile passed bottom without being hit (Miss!)
          if (!tile.hit && tile.y > hitLineY + 110 && !tile.missed) {
            tile.missed = true;
            statsRef.current.combo = 0;
            statsRef.current.missCount++;
            setCombo(0);

            audioEngine.playMiss();
            triggerHaptic('miss', settings.haptics);

            addFloatingText('MISS!', undefined, (tile.lane + 0.5) * laneWidth, hitLineY, '#ef4444');
            gameStateRef.current.cameraShake.x = (Math.random() - 0.5) * 16;
            gameStateRef.current.cameraShake.y = (Math.random() - 0.5) * 16;

            // In extreme mode, 3 misses = game over; in casual, combo resets
            if (statsRef.current.missCount >= 5) {
              gameStateRef.current.isGameOver = true;
              statsRef.current.completed = false;
              onGameOver(statsRef.current);
              return;
            }
          }

          if (tile.y > h + tile.height) {
            tile.cleared = true;
          } else {
            allCleared = false;
          }
        }

        // Check Victory
        if (allCleared && currentProgress >= 0.98 && !gameStateRef.current.isGameOver) {
          gameStateRef.current.isGameOver = true;
          statsRef.current.completed = true;
          confetti({
            particleCount: 120,
            spread: 90,
            origin: { y: 0.3 },
          });
          onVictory(statsRef.current);
          return;
        }

        // Camera Shake decay
        gameStateRef.current.cameraShake.x *= gameStateRef.current.cameraShake.decay;
        gameStateRef.current.cameraShake.y *= gameStateRef.current.cameraShake.decay;
      }

      // ----------------------------------------------------
      // DRAW CANVAS
      // ----------------------------------------------------
      ctx.save();
      ctx.translate(gameStateRef.current.cameraShake.x, gameStateRef.current.cameraShake.y);
      ctx.clearRect(-20, -20, w + 40, h + 40);

      // 1. Draw Lanes & Lane Dividers (like in screenshot)
      for (let i = 0; i < 4; i++) {
        const laneX = i * laneWidth;

        // Lane divider lines
        ctx.strokeStyle = theme.laneDividers;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(laneX, 0);
        ctx.lineTo(laneX, h);
        ctx.stroke();

        // Active Lane Flash
        const flash = gameStateRef.current.laneFlashes[i];
        if (flash.alpha > 0.01) {
          const grad = ctx.createLinearGradient(laneX, hitLineY - 200, laneX, h);
          grad.addColorStop(0, 'transparent');
          grad.addColorStop(0.5, `${flash.color}${Math.floor(flash.alpha * 40).toString(16).padStart(2, '0')}`);
          grad.addColorStop(1, `${flash.color}${Math.floor(flash.alpha * 90).toString(16).padStart(2, '0')}`);
          ctx.fillStyle = grad;
          ctx.fillRect(laneX, 0, laneWidth, h);

          flash.alpha = Math.max(0, flash.alpha - dt * 2.8);
        }
      }

      // Right boundary
      ctx.strokeStyle = theme.laneDividers;
      ctx.beginPath();
      ctx.moveTo(w, 0);
      ctx.lineTo(w, h);
      ctx.stroke();

      // 2. Draw Hit Line (Glowing horizontal neon receptor)
      ctx.save();
      ctx.shadowColor = theme.accentColor;
      ctx.shadowBlur = 15;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, hitLineY);
      ctx.lineTo(w, hitLineY);
      ctx.stroke();

      // Receptors circles on hit line for each lane
      for (let i = 0; i < 4; i++) {
        const rx = (i + 0.5) * laneWidth;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(rx, hitLineY, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // 3. Draw Tiles
      for (const tile of gameStateRef.current.activeTiles) {
        if (tile.cleared) continue;
        if (tile.y + tile.height < -50 || tile.y > h + 100) continue;

        const tileX = tile.lane * laneWidth + 2;
        const tileW = laneWidth - 4;
        const tileY = tile.y - tile.height; // Tile falls downward, top is tileY, bottom is tile.y
        const tileH = tile.height;

        if (tile.type === 'hold') {
          // LONG HOLD TILE (Neon Ribbon with energy track)
          const isHolding = tile.holding;

          // Tail ribbon gradient
          const holdGrad = ctx.createLinearGradient(tileX, tileY, tileX, tile.y);
          if (tile.hit) {
            holdGrad.addColorStop(0, '#ffd700');
            holdGrad.addColorStop(1, '#ff007f');
          } else {
            holdGrad.addColorStop(0, '#100520');
            holdGrad.addColorStop(0.5, '#2b0c4a');
            holdGrad.addColorStop(1, '#05020c');
          }

          ctx.save();
          ctx.fillStyle = holdGrad;
          ctx.beginPath();
          ctx.roundRect(tileX + 4, tileY, tileW - 8, tileH, 8);
          ctx.fill();

          // Border glow
          ctx.strokeStyle = isHolding ? '#ffd700' : 'rgba(255, 255, 255, 0.2)';
          ctx.lineWidth = isHolding ? 3 : 1.5;
          ctx.stroke();

          // Energy lightning centerline
          ctx.strokeStyle = isHolding ? '#ffffff' : 'rgba(255, 215, 0, 0.5)';
          ctx.lineWidth = isHolding ? 3 : 1;
          ctx.beginPath();
          ctx.moveTo(tileX + tileW / 2, tileY);
          ctx.lineTo(tileX + tileW / 2, tile.y);
          ctx.stroke();

          // Bottom tap head of the hold tile
          ctx.fillStyle = isHolding ? '#ffd700' : '#111116';
          ctx.beginPath();
          ctx.roundRect(tileX + 2, tile.y - 45, tileW - 4, 45, 6);
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.stroke();

          ctx.restore();
        } else {
          // REGULAR TAP TILE (Sleek piano tile matched to screenshot)
          ctx.save();

          if (tile.hit) {
            // Hit state: disintegrating glowing burst
            ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.beginPath();
            ctx.roundRect(tileX, tileY, tileW, tileH, 4);
            ctx.fill();
          } else {
            // Sleek Black Piano Tile with specular sheen
            const tileGrad = ctx.createLinearGradient(tileX, tileY, tileX + tileW, tile.y);
            tileGrad.addColorStop(0, '#0a0a14');
            tileGrad.addColorStop(0.5, '#121224');
            tileGrad.addColorStop(1, '#06060c');

            ctx.fillStyle = tileGrad;
            ctx.beginPath();
            ctx.roundRect(tileX, tileY, tileW, tileH, 4);
            ctx.fill();

            // Subtle highlight rim like in screenshot
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Diagonal glossy glass reflection
            const glossGrad = ctx.createLinearGradient(tileX, tileY, tileX + tileW, tileY + 40);
            glossGrad.addColorStop(0, 'rgba(255, 255, 255, 0.18)');
            glossGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = glossGrad;
            ctx.beginPath();
            ctx.roundRect(tileX, tileY, tileW, 35, 4);
            ctx.fill();

            // Soft bottom border glow
            ctx.fillStyle = `${theme.primaryColor}55`;
            ctx.fillRect(tileX, tile.y - 4, tileW, 4);
          }

          ctx.restore();
        }
      }

      // 4. Draw Particles (Sparkles & Shards)
      for (let i = gameStateRef.current.particles.length - 1; i >= 0; i--) {
        const p = gameStateRef.current.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12; // gravity
        p.life++;
        p.alpha = Math.max(0, 1 - p.life / p.maxLife);

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (p.life >= p.maxLife) {
          gameStateRef.current.particles.splice(i, 1);
        }
      }

      // 5. Draw Floating Text Popups ("PERFECT", "GREAT")
      for (let i = gameStateRef.current.floatingTexts.length - 1; i >= 0; i--) {
        const ft = gameStateRef.current.floatingTexts[i];
        ft.y -= 1.2;
        ft.alpha -= 0.025;

        ctx.save();
        ctx.globalAlpha = Math.max(0, ft.alpha);
        ctx.font = 'bold 22px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = ft.color;
        ctx.shadowColor = ft.color;
        ctx.shadowBlur = 12;
        ctx.fillText(ft.text, ft.x, ft.y);

        if (ft.subText) {
          ctx.font = '600 14px "JetBrains Mono", monospace';
          ctx.fillStyle = '#ffffff';
          ctx.fillText(ft.subText, ft.x, ft.y + 18);
        }
        ctx.restore();

        if (ft.alpha <= 0) {
          gameStateRef.current.floatingTexts.splice(i, 1);
        }
      }

      ctx.restore();

      animId = requestAnimationFrame(gameLoop);
    };

    const handleResize = () => {
      if (!canvas || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    animId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isPaused, song, theme, settings, onGameOver, onVictory]);

  // Touch Event Handlers for Android & Touchscreens (Multi-touch support)
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const laneWidth = rect.width / 4;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const relX = touch.clientX - rect.left;
      const relY = touch.clientY - rect.top;
      const lane = Math.min(3, Math.max(0, Math.floor(relX / laneWidth)));
      handleLanePress(lane, touch.clientX, touch.clientY);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const laneWidth = rect.width / 4;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const relX = touch.clientX - rect.left;
      const lane = Math.min(3, Math.max(0, Math.floor(relX / laneWidth)));
      handleLaneRelease(lane);
    }
  };

  const handleMouseDown = (lane: number, e: React.MouseEvent) => {
    handleLanePress(lane, e.clientX, e.clientY);
  };

  const handleMouseUp = (lane: number) => {
    handleLaneRelease(lane);
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden select-none touch-none bg-gradient-to-b ${theme.bgGradient}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* Dynamic Stage Lighting (Audio-reactive lasers & ambient spotlights) */}
      <StageLighting
        theme={theme}
        lasersEnabled={settings.lasersEnabled}
        bloomEnabled={settings.bloomEffects}
        combo={combo}
      />

      {/* Main 60fps Gameplay Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full z-10 pointer-events-none"
      />

      {/* Top HUD Cluster (Aligned with user screenshot) */}
      <div className="absolute top-0 inset-x-0 z-30 flex flex-col items-center pointer-events-none pt-2">
        {/* Navigation & Controls Bar */}
        <div className="w-full px-4 flex items-center justify-between pointer-events-auto">
          {/* Pause Button */}
          <button
            onClick={() => setIsPaused((p) => !p)}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white backdrop-blur-md transition-all shadow-lg"
            title="Pause Game"
          >
            {isPaused ? <Play className="w-5 h-5 fill-white" /> : <Pause className="w-5 h-5 fill-white" />}
          </button>

          {/* Song Title and Combo Badge */}
          <div className="flex flex-col items-center">
            <span className="text-xs uppercase tracking-widest text-white/70 font-semibold">
              {song.title} · {song.artist}
            </span>
            {combo > 4 && (
              <span className="text-xs font-mono font-bold text-yellow-300 drop-shadow-[0_0_8px_rgba(255,215,0,0.8)] animate-pulse">
                COMBO ×{combo}
              </span>
            )}
          </div>

          {/* Audio Mute Toggle */}
          <button
            onClick={toggleMute}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white backdrop-blur-md transition-all shadow-lg"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
          </button>
        </div>

        {/* Milestone Progress Bar (Stars & Crowns from user image) */}
        <ProgressBar progress={progress} stars={stars} crowns={crowns} />

        {/* Big Center Score (157 in user image) */}
        <div className="mt-8 flex flex-col items-center pointer-events-none">
          <span className="text-6xl md:text-7xl font-extrabold text-white tracking-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)] font-mono tabular-nums">
            {score}
          </span>
          <span className="text-[11px] uppercase tracking-widest text-white/50 font-medium -mt-1">
            SCORE
          </span>
        </div>
      </div>

      {/* Mouse Click / Keyboard fallbacks invisible touch zones */}
      <div className="absolute inset-0 z-20 grid grid-cols-4 pointer-events-auto md:pointer-events-auto">
        {[0, 1, 2, 3].map((lane) => (
          <div
            key={lane}
            onMouseDown={(e) => handleMouseDown(lane, e)}
            onMouseUp={() => handleMouseUp(lane)}
            onMouseLeave={() => handleMouseUp(lane)}
            className="h-full active:bg-white/5 transition-colors cursor-pointer flex flex-col justify-end pb-4 items-center"
          >
            {/* Desktop Keybind indicators */}
            <span className="hidden md:inline-block text-[11px] font-mono text-white/20 px-2 py-1 rounded bg-black/30 border border-white/5 pointer-events-none mb-2">
              {['D', 'F', 'J', 'K'][lane]}
            </span>
          </div>
        ))}
      </div>

      {/* Pause Modal Overlay */}
      {isPaused && (
        <div className="absolute inset-0 z-40 bg-black/75 backdrop-blur-md flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-xs bg-slate-900/90 border border-white/10 rounded-2xl p-6 text-center shadow-2xl flex flex-col gap-4">
            <h2 className="text-2xl font-bold text-white tracking-tight">Game Paused</h2>
            <p className="text-sm text-slate-400">
              Current Score: <span className="text-yellow-400 font-mono font-bold">{score}</span>
            </p>

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                onClick={() => setIsPaused(false)}
                className="w-full py-3 px-4 bg-gradient-to-r from-fuchsia-600 to-rose-600 hover:from-fuchsia-500 hover:to-rose-500 text-white font-semibold rounded-xl active:scale-98 transition-transform shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-white" />
                Resume
              </button>

              <button
                onClick={initSong}
                className="w-full py-2.5 px-4 bg-white/10 hover:bg-white/15 text-white font-medium rounded-xl active:scale-98 transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Restart Song
              </button>

              <button
                onClick={onExit}
                className="w-full py-2.5 px-4 bg-transparent hover:bg-white/5 text-slate-400 hover:text-white font-medium rounded-xl active:scale-98 transition-colors text-sm"
              >
                Quit to Song Select
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
