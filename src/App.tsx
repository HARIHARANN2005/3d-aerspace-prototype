/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { SceneManager, CameraPreset, SceneMetrics } from './three/SceneManager.ts';
import { LightingPreset } from './three/lighting.ts';
import { FinishPreset } from './three/materials.ts';
import { ModelPartInfo } from './three/models/types.ts';
import { HeaderOverlay, AppScreen } from './components/HeaderOverlay.tsx';
import { BottomDock } from './components/BottomDock.tsx';
import { PartDetailModal } from './components/PartDetailModal.tsx';
import { BlueprintOverlay } from './components/BlueprintOverlay.tsx';

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneManagerRef = useRef<SceneManager | null>(null);

  // Application State
  const [currentModel, setCurrentModel] = useState<'rover' | 'chrono' | 'drone'>('rover');
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('studio');
  const [isZenMode, setIsZenMode] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);

  // Studio & Model States
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('hero');
  const [lightingPreset, setLightingPreset] = useState<LightingPreset>('studioDaylight');
  const [autoRotate, setAutoRotate] = useState(false);
  const [wireframe, setWireframe] = useState(false);
  const [gridVisible, setGridVisible] = useState(true);
  const [explosionProgress, setExplosionProgress] = useState(0);
  const [currentFinish, setCurrentFinish] = useState<FinishPreset>('titanium');
  const [speedMultiplier, setSpeedMultiplier] = useState(1.0);
  const [isPaused, setIsPaused] = useState(false);

  // Selection & Telemetry
  const [selectedPart, setSelectedPart] = useState<ModelPartInfo | null>(null);
  const [, setHoveredPart] = useState<ModelPartInfo | null>(null);
  const [metrics, setMetrics] = useState<SceneMetrics>({
    fps: 60,
    triangles: 0,
    drawCalls: 0,
    geometries: 0,
    textures: 0,
  });

  // Initialize SceneManager once in ref
  useEffect(() => {
    if (!mountRef.current) return;

    const mgr = new SceneManager(mountRef.current);
    sceneManagerRef.current = mgr;

    mgr.setCallbacks(
      (part) => setSelectedPart(part),
      (part) => setHoveredPart(part)
    );

    // Update telemetry metrics every 1.5 seconds (never at 60Hz)
    const metricsInterval = setInterval(() => {
      if (sceneManagerRef.current) {
        setMetrics({ ...sceneManagerRef.current.metrics });
      }
    }, 1500);

    // Keyboard shortcut handler: 'H' for dock collapse, 'Space' for rotate
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'h' || e.key === 'H') {
        setIsDockCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearInterval(metricsInterval);
      window.removeEventListener('keydown', handleKeyDown);
      mgr.dispose();
      sceneManagerRef.current = null;
    };
  }, []);

  // Handlers
  const handleSelectModel = (modelId: 'rover' | 'chrono' | 'drone') => {
    setCurrentModel(modelId);
    setSelectedPart(null);
    if (sceneManagerRef.current) {
      sceneManagerRef.current.loadModel(modelId);
      sceneManagerRef.current.setExplosionProgress(explosionProgress);
      sceneManagerRef.current.applyFinish(currentFinish);
    }
  };

  const handleSelectScreen = (screen: AppScreen) => {
    setCurrentScreen(screen);
    // If switching to exploded view, expand dock automatically
    if (screen === 'exploded') {
      setIsDockCollapsed(false);
    }
  };

  const handleSelectCamera = (preset: CameraPreset) => {
    setCameraPreset(preset);
    sceneManagerRef.current?.setCameraPreset(preset);
  };

  const handleSelectLighting = (preset: LightingPreset) => {
    setLightingPreset(preset);
    sceneManagerRef.current?.applyLighting(preset);
  };

  const handleToggleAutoRotate = () => {
    const next = !autoRotate;
    setAutoRotate(next);
    if (sceneManagerRef.current) {
      sceneManagerRef.current.autoRotate = next;
    }
  };

  const handleToggleWireframe = () => {
    const next = !wireframe;
    setWireframe(next);
    sceneManagerRef.current?.setWireframe(next);
  };

  const handleToggleGrid = () => {
    const next = !gridVisible;
    setGridVisible(next);
    sceneManagerRef.current?.setGridVisible(next);
  };

  const handleExplosionChange = (val: number) => {
    setExplosionProgress(val);
    sceneManagerRef.current?.setExplosionProgress(val);
  };

  const handleSelectFinish = (finish: FinishPreset) => {
    setCurrentFinish(finish);
    sceneManagerRef.current?.applyFinish(finish);
  };

  const handleSelectSpeed = (speed: number) => {
    setSpeedMultiplier(speed);
    if (sceneManagerRef.current) {
      sceneManagerRef.current.speedMultiplier = speed;
    }
  };

  const handleTogglePause = () => {
    const next = !isPaused;
    setIsPaused(next);
    if (sceneManagerRef.current) {
      sceneManagerRef.current.speedMultiplier = next ? 0 : speedMultiplier;
    }
  };

  const handleSelectPart = (partId: string) => {
    sceneManagerRef.current?.selectPartById(partId);
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const activeSubject = sceneManagerRef.current?.currentSubject || null;

  return (
    <div
      className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none"
      data-state="ready"
      data-model={currentModel}
      data-screen={currentScreen}
    >
      {/* Isolated WebGL Canvas Mount Container */}
      <div
        ref={mountRef}
        data-testid="threejs-canvas-container"
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Top Header Navigation Overlay */}
      <HeaderOverlay
        currentModel={currentModel}
        onSelectModel={handleSelectModel}
        currentScreen={currentScreen}
        onSelectScreen={handleSelectScreen}
        isZenMode={isZenMode}
        onToggleZenMode={() => {
          setIsZenMode((prev) => !prev);
          setIsDockCollapsed((prev) => !prev);
        }}
        isMuted={isMuted}
        onToggleMute={() => setIsMuted((prev) => !prev)}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
      />

      {/* Collapsible Unified Bottom Control Dock */}
      {!isZenMode && (
        <BottomDock
          currentScreen={currentScreen}
          isCollapsed={isDockCollapsed}
          onToggleCollapse={() => setIsDockCollapsed((prev) => !prev)}
          activeModel={activeSubject}
          cameraPreset={cameraPreset}
          onSelectCamera={handleSelectCamera}
          lightingPreset={lightingPreset}
          onSelectLighting={handleSelectLighting}
          autoRotate={autoRotate}
          onToggleAutoRotate={handleToggleAutoRotate}
          wireframe={wireframe}
          onToggleWireframe={handleToggleWireframe}
          gridVisible={gridVisible}
          onToggleGrid={handleToggleGrid}
          explosionProgress={explosionProgress}
          onExplosionChange={handleExplosionChange}
          selectedPart={selectedPart}
          onSelectPart={handleSelectPart}
          currentFinish={currentFinish}
          onSelectFinish={handleSelectFinish}
          speedMultiplier={speedMultiplier}
          onSelectSpeed={handleSelectSpeed}
          isPaused={isPaused}
          onTogglePause={handleTogglePause}
          metrics={metrics}
        />
      )}

      {/* Part Inspection Detail Card */}
      <PartDetailModal part={selectedPart} onClose={() => setSelectedPart(null)} />

      {/* Blueprint & BOM Specifications Overlay */}
      {currentScreen === 'blueprint' && (
        <BlueprintOverlay
          model={activeSubject}
          onClose={() => setCurrentScreen('studio')}
        />
      )}
    </div>
  );
}
