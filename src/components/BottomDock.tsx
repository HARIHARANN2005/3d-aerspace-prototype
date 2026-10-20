import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  RotateCw,
  Box,
  Grid,
  Sun,
  Camera,
  Play,
  Pause,
  Sliders,
  Sparkles,
  Info,
} from 'lucide-react';
import { AppScreen } from './HeaderOverlay.tsx';
import { CameraPreset, SceneMetrics } from '../three/SceneManager.ts';
import { LightingPreset, LIGHTING_PRESETS } from '../three/lighting.ts';
import { FinishPreset, FINISH_PRESETS } from '../three/materials.ts';
import { ModelPartInfo, ProceduralSubject } from '../three/models/types.ts';
import { soundFx } from '../utils/audio.ts';

interface BottomDockProps {
  currentScreen: AppScreen;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  activeModel: ProceduralSubject | null;
  // Studio controls
  cameraPreset: CameraPreset;
  onSelectCamera: (preset: CameraPreset) => void;
  lightingPreset: LightingPreset;
  onSelectLighting: (preset: LightingPreset) => void;
  autoRotate: boolean;
  onToggleAutoRotate: () => void;
  wireframe: boolean;
  onToggleWireframe: () => void;
  gridVisible: boolean;
  onToggleGrid: () => void;
  // Exploded controls
  explosionProgress: number;
  onExplosionChange: (val: number) => void;
  selectedPart: ModelPartInfo | null;
  onSelectPart: (partId: string) => void;
  // Materials controls
  currentFinish: FinishPreset;
  onSelectFinish: (finish: FinishPreset) => void;
  // Kinematics controls
  speedMultiplier: number;
  onSelectSpeed: (speed: number) => void;
  isPaused: boolean;
  onTogglePause: () => void;
  // Telemetry
  metrics: SceneMetrics;
}

export const BottomDock: React.FC<BottomDockProps> = ({
  currentScreen,
  isCollapsed,
  onToggleCollapse,
  activeModel,
  cameraPreset,
  onSelectCamera,
  lightingPreset,
  onSelectLighting,
  autoRotate,
  onToggleAutoRotate,
  wireframe,
  onToggleWireframe,
  gridVisible,
  onToggleGrid,
  explosionProgress,
  onExplosionChange,
  selectedPart,
  onSelectPart,
  currentFinish,
  onSelectFinish,
  speedMultiplier,
  onSelectSpeed,
  isPaused,
  onTogglePause,
  metrics,
}) => {
  const [internalTab, setInternalTab] = useState<'controls' | 'parts' | 'metrics'>('controls');

  const cameraOptions: { id: CameraPreset; label: string }[] = [
    { id: 'hero', label: 'Hero 3/4' },
    { id: 'top', label: 'Plan Top' },
    { id: 'macro', label: 'Macro' },
    { id: 'iso', label: '45° Iso' },
    { id: 'low', label: 'Low View' },
  ];

  const lightingOptions: { id: LightingPreset; label: string }[] = [
    { id: 'studioDaylight', label: 'Neutral Studio' },
    { id: 'cyberMidnight', label: 'Cyber Blue' },
    { id: 'goldenHour', label: 'Golden Hour' },
    { id: 'cleanLab', label: 'Clean Lab' },
  ];

  const speedOptions = [0.5, 1.0, 1.5, 2.0, 3.0];

  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-30 transition-transform duration-300 ease-out w-[95vw] max-w-[940px] pointer-events-none ${
        isCollapsed ? 'translate-y-[calc(100%-12px)]' : 'translate-y-0'
      }`}
    >
      {/* Collapse / Expand Tab */}
      <div className="flex justify-center -mb-px">
        <button
          onClick={() => {
            soundFx.playClick(650);
            onToggleCollapse();
          }}
          className="pointer-events-auto flex items-center gap-1.5 px-4 py-1.5 rounded-t-lg bg-slate-900 border-t border-x border-slate-700/80 text-xs font-medium text-slate-300 hover:text-white shadow-xl hover:bg-slate-800 transition-colors"
          aria-expanded={!isCollapsed}
          aria-label={isCollapsed ? 'Show Controls Dock' : 'Hide Controls Dock'}
        >
          {isCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 text-sky-400" />
              <span>Show Controls (H)</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              <span>Hide Controls (H)</span>
            </>
          )}
        </button>
      </div>

      {/* Main Dock Container (Solid slate background, no backdrop-blur for 60fps WebGL) */}
      <div className="pointer-events-auto bg-slate-900 border border-slate-700/90 rounded-2xl p-3 sm:p-4 shadow-2xl text-slate-200">
        {/* Top dock strip: Sub-tab switcher and active model summary */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              {activeModel?.name || 'Aero-Chrono'}
            </span>
            <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
              [{activeModel?.parts.length || 0} sub-assemblies]
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                soundFx.playClick(800);
                setInternalTab('controls');
              }}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                internalTab === 'controls'
                  ? 'bg-slate-800 text-sky-400 border border-slate-600/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Mode Controls
            </button>
            <button
              onClick={() => {
                soundFx.playClick(800);
                setInternalTab('parts');
              }}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                internalTab === 'parts'
                  ? 'bg-slate-800 text-sky-400 border border-slate-600/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Parts Manifest
            </button>
            <button
              onClick={() => {
                soundFx.playClick(800);
                setInternalTab('metrics');
              }}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                internalTab === 'metrics'
                  ? 'bg-slate-800 text-sky-400 border border-slate-600/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Telemetry
            </button>
          </div>
        </div>

        {/* Tab 1: Mode Controls */}
        {internalTab === 'controls' && (
          <div className="space-y-3">
            {/* Screen 1: Studio Showcase */}
            {currentScreen === 'studio' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Camera Angles */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <Camera className="w-3 h-3 text-sky-400" />
                    <span>Camera Presets</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {cameraOptions.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          soundFx.playClick(900);
                          onSelectCamera(c.id);
                        }}
                        className={`px-2 py-1 text-xs rounded-md transition-colors ${
                          cameraPreset === c.id
                            ? 'bg-indigo-600 text-white font-medium'
                            : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Studio Lighting */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <Sun className="w-3 h-3 text-amber-400" />
                    <span>Lighting Rig</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {lightingOptions.map((l) => (
                      <button
                        key={l.id}
                        onClick={() => {
                          soundFx.playClick(900);
                          onSelectLighting(l.id);
                        }}
                        className={`px-2 py-1 text-xs rounded-md transition-colors ${
                          lightingPreset === l.id
                            ? 'bg-amber-600/90 text-white font-medium'
                            : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80'
                        }`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Viewport Toggles */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <Sliders className="w-3 h-3 text-emerald-400" />
                    <span>Viewport Modes</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <button
                      onClick={() => {
                        soundFx.playClick(750);
                        onToggleAutoRotate();
                      }}
                      className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-md transition-colors ${
                        autoRotate
                          ? 'bg-emerald-600 text-white font-medium'
                          : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80'
                      }`}
                    >
                      <RotateCw className="w-3 h-3" />
                      <span>Rotate</span>
                    </button>
                    <button
                      onClick={() => {
                        soundFx.playClick(750);
                        onToggleWireframe();
                      }}
                      className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-md transition-colors ${
                        wireframe
                          ? 'bg-purple-600 text-white font-medium'
                          : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80'
                      }`}
                    >
                      <Box className="w-3 h-3" />
                      <span>Wireframe</span>
                    </button>
                    <button
                      onClick={() => {
                        soundFx.playClick(750);
                        onToggleGrid();
                      }}
                      className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-md transition-colors ${
                        gridVisible
                          ? 'bg-sky-600 text-white font-medium'
                          : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80'
                      }`}
                    >
                      <Grid className="w-3 h-3" />
                      <span>Grid</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Screen 2: Exploded Engineering View */}
            {currentScreen === 'exploded' && (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Disassembly Separation:
                    </span>
                    <span className="px-2 py-0.5 rounded bg-sky-950 border border-sky-600 text-sky-400 font-mono text-xs font-bold">
                      {Math.round(explosionProgress * 100)}%
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        soundFx.playPneumatic();
                        onExplosionChange(0);
                      }}
                      className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                    >
                      Assembled (0%)
                    </button>
                    <button
                      onClick={() => {
                        soundFx.playServo(350);
                        onExplosionChange(0.5);
                      }}
                      className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                    >
                      Half (50%)
                    </button>
                    <button
                      onClick={() => {
                        soundFx.playServo(450);
                        onExplosionChange(1.0);
                      }}
                      className="px-2.5 py-1 text-xs rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
                    >
                      Exploded (100%)
                    </button>
                  </div>
                </div>

                {/* Slider */}
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-mono text-slate-400">0%</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={explosionProgress}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (Math.abs(val - explosionProgress) > 0.05) {
                        soundFx.playServo(280 + val * 200);
                      }
                      onExplosionChange(val);
                    }}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-400"
                    aria-label="Exploded View Separation Slider"
                  />
                  <span className="text-[11px] font-mono text-slate-400">100%</span>
                </div>
              </div>
            )}

            {/* Screen 3: Materials & Finishes Lab */}
            {currentScreen === 'materials' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>PBR Finish Library</span>
                  </div>
                  <span className="text-xs font-mono text-sky-400">
                    Active: {FINISH_PRESETS[currentFinish].name}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5">
                  {(Object.keys(FINISH_PRESETS) as FinishPreset[]).map((fKey) => {
                    const finish = FINISH_PRESETS[fKey];
                    const isSelected = currentFinish === fKey;
                    return (
                      <button
                        key={fKey}
                        onClick={() => {
                          soundFx.playChime(1100);
                          onSelectFinish(fKey);
                        }}
                        className={`flex flex-col items-center p-2 rounded-lg border transition-all text-left ${
                          isSelected
                            ? 'bg-slate-800 border-sky-400 shadow-md ring-1 ring-sky-400'
                            : 'bg-slate-800/60 border-slate-700 hover:bg-slate-700/60'
                        }`}
                      >
                        <div
                          className="w-5 h-5 rounded-full border border-white/20 mb-1 shadow-inner"
                          style={{ backgroundColor: finish.colorHex }}
                        />
                        <span className="text-[10px] font-medium text-slate-200 text-center line-clamp-1">
                          {finish.name}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="text-[11px] text-slate-400 italic bg-slate-800/40 p-2 rounded-md border border-slate-800">
                  {FINISH_PRESETS[currentFinish].description}
                </div>
              </div>
            )}

            {/* Screen 4: Kinematics & Motion */}
            {currentScreen === 'kinematics' && (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        soundFx.playClick(600);
                        onTogglePause();
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        isPaused
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          : 'bg-amber-600 hover:bg-amber-500 text-white'
                      }`}
                    >
                      {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                      <span>{isPaused ? 'Resume Motion' : 'Pause Kinematics'}</span>
                    </button>

                    <span className="text-xs text-slate-400">
                      {isPaused ? 'Simulation paused' : 'Active mechanical simulation'}
                    </span>
                  </div>

                  {/* Speed multipliers */}
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-slate-400 uppercase font-mono mr-1">Speed:</span>
                    {speedOptions.map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          soundFx.playClick(750);
                          onSelectSpeed(s);
                        }}
                        className={`px-2 py-1 text-xs rounded font-mono font-medium transition-colors ${
                          speedMultiplier === s
                            ? 'bg-sky-600 text-white'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-2 rounded bg-slate-800/60 border border-slate-700 text-xs text-slate-300 flex items-center justify-between">
                  <span className="text-slate-400">Active Mechanism:</span>
                  <span className="font-mono text-sky-300">
                    {activeModel?.id === 'chrono' && 'Tourbillon 28,800 VPH (4Hz) + Dual Winding Spring'}
                    {activeModel?.id === 'rover' && '6-Wheel Rocker-Bogie Differential + Radar Mast Sweep'}
                    {activeModel?.id === 'drone' && 'Dual Pulsed Ion Thruster + Gyro-Stabilized Optical Pod'}
                  </span>
                </div>
              </div>
            )}

            {/* Screen 5: Blueprint & Telemetry preview */}
            {currentScreen === 'blueprint' && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-sky-400" />
                  <span className="text-slate-300">
                    Detailed engineering specification and bill-of-materials manifest.
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Sub-Assemblies:</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {activeModel?.parts.length} parts
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Parts Manifest */}
        {internalTab === 'parts' && (
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Sub-Assemblies ({activeModel?.parts.length || 0})</span>
              <span className="text-[11px] text-slate-400">Click to isolate & inspect</span>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
              {activeModel?.parts.map((p) => {
                const isSelected = selectedPart?.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      soundFx.playClick(1050);
                      onSelectPart(p.id);
                    }}
                    className={`px-2.5 py-1 text-xs rounded-md border text-left transition-colors ${
                      isSelected
                        ? 'bg-sky-950 border-sky-400 text-sky-300 font-semibold'
                        : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-700/80'
                    }`}
                  >
                    <span>{p.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Telemetry */}
        {internalTab === 'metrics' && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
            <div className="p-2 rounded bg-slate-800/80 border border-slate-700/80">
              <div className="text-[10px] text-slate-400 uppercase font-mono">Render FPS</div>
              <div className="text-base font-bold font-mono text-emerald-400">{metrics.fps}</div>
            </div>
            <div className="p-2 rounded bg-slate-800/80 border border-slate-700/80">
              <div className="text-[10px] text-slate-400 uppercase font-mono">Triangles</div>
              <div className="text-base font-bold font-mono text-sky-300">
                {metrics.triangles.toLocaleString()}
              </div>
            </div>
            <div className="p-2 rounded bg-slate-800/80 border border-slate-700/80">
              <div className="text-[10px] text-slate-400 uppercase font-mono">Draw Calls</div>
              <div className="text-base font-bold font-mono text-amber-300">{metrics.drawCalls}</div>
            </div>
            <div className="p-2 rounded bg-slate-800/80 border border-slate-700/80">
              <div className="text-[10px] text-slate-400 uppercase font-mono">Geometries</div>
              <div className="text-base font-bold font-mono text-purple-300">{metrics.geometries}</div>
            </div>
            <div className="p-2 rounded bg-slate-800/80 border border-slate-700/80">
              <div className="text-[10px] text-slate-400 uppercase font-mono">Textures</div>
              <div className="text-base font-bold font-mono text-indigo-300">{metrics.textures}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
