import React, { useEffect, useState } from 'react';
import { VisualHapticEventDetail } from '../utils/haptics';

interface Ripple {
  id: number;
  x: number;
  y: number;
  color: string;
  intensity: number;
}

export const HapticVisualizer: React.FC = () => {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  useEffect(() => {
    let nextId = 0;
    const handleHaptic = (e: Event) => {
      const customEvent = e as CustomEvent<VisualHapticEventDetail>;
      const detail = customEvent.detail;

      const x = detail.x ?? window.innerWidth / 2;
      const y = detail.y ?? window.innerHeight * 0.85;

      const color =
        detail.type === 'miss'
          ? 'rgba(239, 68, 68, 0.7)'
          : detail.type === 'perfect'
          ? 'rgba(250, 204, 21, 0.8)'
          : 'rgba(255, 255, 255, 0.6)';

      const rippleId = nextId++;
      setRipples((prev) => [
        ...prev.slice(-6),
        {
          id: rippleId,
          x,
          y,
          color,
          intensity: detail.intensity,
        },
      ]);

      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== rippleId));
      }, 500);
    };

    window.addEventListener('piano-visual-haptic', handleHaptic);
    return () => {
      window.removeEventListener('piano-visual-haptic', handleHaptic);
    };
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      {ripples.map((r) => (
        <div
          key={r.id}
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 animate-pulse-ring pointer-events-none"
          style={{
            left: `${r.x}px`,
            top: `${r.y}px`,
            width: `${50 * r.intensity + 30}px`,
            height: `${50 * r.intensity + 30}px`,
            borderColor: r.color,
            boxShadow: `0 0 15px ${r.color}`,
          }}
        />
      ))}
    </div>
  );
};
