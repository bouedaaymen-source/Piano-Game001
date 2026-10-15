import { HapticSettings } from '../types/game';

type HapticFeedbackType = 'tap' | 'perfect' | 'hold' | 'milestone' | 'miss';

export interface VisualHapticEventDetail {
  type: HapticFeedbackType;
  x?: number;
  y?: number;
  intensity: number;
}

export const triggerHaptic = (
  type: HapticFeedbackType,
  settings: HapticSettings,
  coords?: { x: number; y: number }
) => {
  // Always dispatch visual haptic ripple event so UI can display reactive feedback
  const visualDetail: VisualHapticEventDetail = {
    type,
    x: coords?.x,
    y: coords?.y,
    intensity: settings.strength === 'heavy' ? 1.0 : settings.strength === 'medium' ? 0.7 : 0.4,
  };

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('piano-visual-haptic', { detail: visualDetail })
    );
  }

  if (!settings.enabled) return;
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return;

  const mult = settings.strength === 'heavy' ? 1.4 : settings.strength === 'medium' ? 1.0 : 0.6;

  try {
    switch (type) {
      case 'tap':
        navigator.vibrate(Math.round(20 * mult));
        break;
      case 'perfect':
        navigator.vibrate([
          Math.round(15 * mult),
          20,
          Math.round(22 * mult),
        ]);
        break;
      case 'hold':
        navigator.vibrate(Math.round(12 * mult));
        break;
      case 'milestone':
        navigator.vibrate([
          Math.round(25 * mult),
          25,
          Math.round(30 * mult),
          25,
          Math.round(50 * mult),
        ]);
        break;
      case 'miss':
        navigator.vibrate([
          Math.round(70 * mult),
          40,
          Math.round(100 * mult),
        ]);
        break;
    }
  } catch (err) {
    // Gracefully handle browsers with strict permissions
  }
};
