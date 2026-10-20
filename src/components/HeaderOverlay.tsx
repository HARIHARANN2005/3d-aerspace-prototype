import React from 'react';
import {
  Boxes,
  Compass,
  Layers,
  Palette,
  Gauge,
  FileSpreadsheet,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { soundFx } from '../utils/audio.ts';

export type AppScreen = 'studio' | 'exploded' | 'materials' | 'kinematics' | 'blueprint';

interface HeaderOverlayProps {
  currentModel: 'rover' | 'chrono' | 'drone';
  onSelectModel: (model: 'rover' | 'chrono' | 'drone') => void;
  currentScreen: AppScreen;
  onSelectScreen: (screen: AppScreen) => void;
  isZenMode: boolean;
  onToggleZenMode: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const HeaderOverlay: React.FC<HeaderOverlayProps> = ({
  currentModel,
  onSelectModel,
  currentScreen,
  onSelectScreen,
  isZenMode,
  onToggleZenMode,
  isMuted,
  onToggleMute,
  isFullscreen,
  onToggleFullscreen,
}) => {
  const models = [
    { id: 'rover', name: 'Rover MK-IV', category: 'Exo-Planetary' },
    { id: 'chrono', name: 'Chrono 3000', category: 'Tourbillon' },
    { id: 'drone', name: 'Cyber-Drone', category: 'Aerospace' },
  ] as const;

  const screens = [
    { id: 'studio', label: 'Studio Showcase', icon: Compass },
    { id: 'exploded', label: 'Exploded View', icon: Layers },
    { id: 'materials', label: 'Materials Lab', icon: Palette },
    { id: 'kinematics', label: 'Kinematics', icon: Gauge },
    { id: 'blueprint', label: 'Specs & BOM', icon: FileSpreadsheet },
  ] as const;

  return (
    <header className="absolute top-0 left-0 right-0 z-30 pointer-events-none p-2 sm:p-4 transition-transform duration-300">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        {/* Brand & Model Switcher */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 shadow-lg text-slate-100">
            <div className="w-6 h-6 rounded bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-400">
              <Boxes className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[11px] font-bold tracking-wider uppercase text-slate-200">
                AERO-CHRONO 3D
              </div>
            </div>
          </div>

          {/* Model Switcher Segmented Control */}
          <nav
            aria-label="3D Model Selection"
            className="flex items-center p-0.5 rounded-lg bg-slate-900 border border-slate-700/80 shadow-lg"
          >
            {models.map((m) => {
              const isActive = currentModel === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    soundFx.playClick(1000);
                    onSelectModel(m.id);
                  }}
                  className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white font-semibold shadow'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                  aria-pressed={isActive}
                >
                  <span className="block">{m.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Screen / Mode Tabs */}
        {!isZenMode && (
          <nav
            aria-label="Workspace Modes"
            className="flex items-center p-1 rounded-lg bg-slate-900 border border-slate-700/80 shadow-lg pointer-events-auto overflow-x-auto max-w-full"
          >
            {screens.map((s) => {
              const Icon = s.icon;
              const isActive = currentScreen === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    soundFx.playClick(900);
                    onSelectScreen(s.id);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-slate-800 text-sky-400 font-semibold border border-slate-600/60'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                  aria-pressed={isActive}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{s.label}</span>
                </button>
              );
            })}
          </nav>
        )}

        {/* Utilities: Mute, Zen Mode, Fullscreen */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            onClick={() => {
              onToggleZenMode();
              soundFx.playClick(600);
            }}
            title={isZenMode ? 'Exit Zen Mode (H)' : 'Enter Zen Cinema Mode (H)'}
            aria-label={isZenMode ? 'Exit Zen Mode' : 'Enter Zen Mode'}
            className="p-2 rounded-lg bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors shadow-lg"
          >
            {isZenMode ? <Eye className="w-4 h-4 text-emerald-400" /> : <EyeOff className="w-4 h-4" />}
          </button>

          <button
            onClick={() => {
              onToggleMute();
              soundFx.playClick(700);
            }}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            className="p-2 rounded-lg bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors shadow-lg"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-sky-400" />}
          </button>

          <button
            onClick={() => {
              onToggleFullscreen();
              soundFx.playClick(800);
            }}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            className="p-2 rounded-lg bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors shadow-lg"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
