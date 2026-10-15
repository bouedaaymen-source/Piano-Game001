import React, { useEffect, useRef } from 'react';
import { LightingTheme } from '../types/game';
import { audioEngine } from '../audio/audioEngine';

interface StageLightingProps {
  theme: LightingTheme;
  lasersEnabled: boolean;
  bloomEnabled: boolean;
  combo: number;
}

export const StageLighting: React.FC<StageLightingProps> = ({
  theme,
  lasersEnabled,
  bloomEnabled,
  combo,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const render = () => {
      t += 0.03;
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      // Get real audio reactivity from Web Audio synthesizer!
      const audioEnergy = audioEngine.getAudioEnergy();
      const comboBoost = Math.min(1.5, 1 + combo * 0.015);
      const intensity = (0.3 + audioEnergy * 0.7) * comboBoost;

      // 1. Top Spotlights / Cone Lasers
      if (lasersEnabled) {
        // Left Laser
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        
        const leftAngle = Math.sin(t * 1.2) * 0.45 + 0.35;
        const leftGrad = ctx.createRadialGradient(
          w * 0.15, 0, 10,
          w * 0.15 + Math.sin(leftAngle) * h, h, w * 0.6
        );
        leftGrad.addColorStop(0, `${theme.primaryColor}88`);
        leftGrad.addColorStop(0.4, `${theme.primaryColor}33`);
        leftGrad.addColorStop(1, 'transparent');

        ctx.fillStyle = leftGrad;
        ctx.beginPath();
        ctx.moveTo(w * 0.15, 0);
        ctx.lineTo(w * 0.15 + Math.sin(leftAngle - 0.25) * h * 1.2, h);
        ctx.lineTo(w * 0.15 + Math.sin(leftAngle + 0.25) * h * 1.2, h);
        ctx.closePath();
        ctx.fill();

        // Right Laser
        const rightAngle = Math.cos(t * 1.1) * 0.45 - 0.35;
        const rightGrad = ctx.createRadialGradient(
          w * 0.85, 0, 10,
          w * 0.85 + Math.sin(rightAngle) * h, h, w * 0.6
        );
        rightGrad.addColorStop(0, `${theme.secondaryColor}88`);
        rightGrad.addColorStop(0.4, `${theme.secondaryColor}33`);
        rightGrad.addColorStop(1, 'transparent');

        ctx.fillStyle = rightGrad;
        ctx.beginPath();
        ctx.moveTo(w * 0.85, 0);
        ctx.lineTo(w * 0.85 + Math.sin(rightAngle - 0.25) * h * 1.2, h);
        ctx.lineTo(w * 0.85 + Math.sin(rightAngle + 0.25) * h * 1.2, h);
        ctx.closePath();
        ctx.fill();

        // Center Laser sweep during fever
        if (combo >= 20) {
          const centerAngle = Math.sin(t * 2.5) * 0.5;
          const centerGrad = ctx.createLinearGradient(w * 0.5, 0, w * 0.5 + centerAngle * w, h);
          centerGrad.addColorStop(0, `${theme.accentColor}aa`);
          centerGrad.addColorStop(1, 'transparent');
          ctx.strokeStyle = centerGrad;
          ctx.lineWidth = 4 + audioEnergy * 8;
          ctx.beginPath();
          ctx.moveTo(w * 0.5, 0);
          ctx.lineTo(w * 0.5 + centerAngle * w, h);
          ctx.stroke();
        }

        ctx.restore();
      }

      // 2. Audio-reactive ambient beat pulse
      if (bloomEnabled) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        
        // Bottom hit zone pulse
        const pulseGrad = ctx.createRadialGradient(
          w * 0.5, h * 0.85, 50,
          w * 0.5, h * 0.85, w * 0.75
        );
        pulseGrad.addColorStop(0, `${theme.primaryColor}${Math.floor(intensity * 40).toString(16).padStart(2, '0')}`);
        pulseGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = pulseGrad;
        ctx.fillRect(0, 0, w, h);

        // Center ambient star halo
        const haloGrad = ctx.createRadialGradient(
          w * 0.5, h * 0.35, 10,
          w * 0.5, h * 0.35, w * 0.6
        );
        haloGrad.addColorStop(0, `${theme.secondaryColor}${Math.floor(intensity * 35).toString(16).padStart(2, '0')}`);
        haloGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = haloGrad;
        ctx.fillRect(0, 0, w, h);

        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [theme, lasersEnabled, bloomEnabled, combo]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
    />
  );
};
