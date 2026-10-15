import React from 'react';
import { GameSettings, LightingThemeId } from '../types/game';
import { LIGHTING_THEMES } from '../songs/songData';
import { triggerHaptic } from '../utils/haptics';
import { X, Sparkles, Smartphone, Volume2, Vibrate } from 'lucide-react';

interface LightingSettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  onClose: () => void;
}

export const LightingSettingsModal: React.FC<LightingSettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
}) => {
  const handleTestHaptic = (strength: 'light' | 'medium' | 'heavy') => {
    triggerHaptic('perfect', { enabled: true, strength });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-md bg-slate-900 border border-white/15 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-fuchsia-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              Custom Lighting & Haptics
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Custom Lighting Presets */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Stage Lighting Themes
          </label>
          <div className="grid grid-cols-2 gap-2">
            {Object.values(LIGHTING_THEMES).map((theme) => {
              const isSelected = settings.lightingTheme === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => onUpdateSettings({ lightingTheme: theme.id as LightingThemeId })}
                  className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                    isSelected
                      ? 'border-fuchsia-400 bg-fuchsia-950/40 shadow-md shadow-fuchsia-500/20'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-3 h-3 rounded-full shadow-[0_0_6px]"
                      style={{ backgroundColor: theme.primaryColor, boxShadow: `0 0 8px ${theme.primaryColor}` }}
                    />
                    <span className="text-xs font-bold text-white truncate">
                      {theme.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 line-clamp-1">
                    {theme.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Visual Effects Toggles */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Dynamic Lighting Effects
          </label>
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
            <div>
              <div className="text-sm font-medium text-white">Stage Laser Beams</div>
              <div className="text-xs text-slate-400">Sweeping reactive cone spotlights</div>
            </div>
            <button
              onClick={() => onUpdateSettings({ lasersEnabled: !settings.lasersEnabled })}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                settings.lasersEnabled ? 'bg-fuchsia-600' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.lasersEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
            <div>
              <div className="text-sm font-medium text-white">Audio-Reactive Bloom</div>
              <div className="text-xs text-slate-400">Sub-bass kick floor glow & pulses</div>
            </div>
            <button
              onClick={() => onUpdateSettings({ bloomEffects: !settings.bloomEffects })}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                settings.bloomEffects ? 'bg-fuchsia-600' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.bloomEffects ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* 3. Responsive Haptic Feedback (Android & Mobile) */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Vibrate className="w-4 h-4 text-amber-400" />
              Responsive Haptic Feedback
            </label>
            <button
              onClick={() => handleTestHaptic(settings.haptics.strength)}
              className="text-[11px] text-fuchsia-400 hover:text-fuchsia-300 font-medium"
            >
              Test Haptic
            </button>
          </div>

          <div className="grid grid-cols-4 gap-1.5 p-1 bg-white/5 rounded-xl border border-white/10">
            {(['light', 'medium', 'heavy'] as const).map((level) => (
              <button
                key={level}
                onClick={() => {
                  onUpdateSettings({
                    haptics: { enabled: true, strength: level },
                  });
                  handleTestHaptic(level);
                }}
                className={`py-2 text-xs font-semibold rounded-lg capitalize transition-all ${
                  settings.haptics.enabled && settings.haptics.strength === level
                    ? 'bg-fuchsia-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {level}
              </button>
            ))}
            <button
              onClick={() =>
                onUpdateSettings({
                  haptics: { ...settings.haptics, enabled: !settings.haptics.enabled },
                })
              }
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                !settings.haptics.enabled
                  ? 'bg-red-600/80 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Off
            </button>
          </div>
        </div>

        {/* 4. Synthesizer Instrument Sound Style */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Volume2 className="w-4 h-4 text-emerald-400" />
            Synthesizer Timbre
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'synth', label: 'Cyber Synth', desc: 'Lady Gaga Lead' },
              { id: 'grand-piano', label: 'Grand Piano', desc: 'Acoustic Felt' },
              { id: 'cyber-bass', label: '808 Bass', desc: 'Club Low-end' },
            ].map((inst) => (
              <button
                key={inst.id}
                onClick={() => onUpdateSettings({ instrument: inst.id as any })}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  settings.instrument === inst.id
                    ? 'border-emerald-500 bg-emerald-950/40 text-white font-bold'
                    : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                <div className="text-xs font-bold">{inst.label}</div>
                <div className="text-[10px] opacity-70">{inst.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 5. Android Display Mode */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-sky-400" />
            <div>
              <div className="text-sm font-medium text-white">Android Device Frame</div>
              <div className="text-xs text-slate-400">Preview with Android notch & status bar</div>
            </div>
          </div>
          <button
            onClick={() => onUpdateSettings({ androidFrame: !settings.androidFrame })}
            className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
              settings.androidFrame ? 'bg-sky-600' : 'bg-slate-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                settings.androidFrame ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Done Button */}
        <button
          onClick={onClose}
          className="mt-2 w-full py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl active:scale-98 transition-colors"
        >
          Save & Return
        </button>
      </div>
    </div>
  );
};
