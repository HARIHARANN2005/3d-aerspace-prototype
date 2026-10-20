import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { MaterialRegistry, FinishPreset } from './materials.ts';
import { StudioLightingRig, LightingPreset } from './lighting.ts';
import { ProceduralSubject, ModelPartInfo } from './models/types.ts';
import { createRoverModel } from './models/RoverModel.ts';
import { createChronoModel } from './models/ChronoModel.ts';
import { createDroneModel } from './models/DroneModel.ts';
import { dampVector3 } from '../utils/math3d.ts';

export type CameraPreset = 'hero' | 'top' | 'macro' | 'iso' | 'low';

export interface SceneMetrics {
  fps: number;
  triangles: number;
  drawCalls: number;
  geometries: number;
  textures: number;
}

export class SceneManager {
  public container: HTMLElement;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public controls: OrbitControls;
  public materials: MaterialRegistry;
  public lighting: StudioLightingRig;

  private isHeadless: boolean;
  private animFrameId: number | null = null;
  private startTime: number;

  // Models
  public currentSubject: ProceduralSubject | null = null;
  public currentModelId: 'rover' | 'chrono' | 'drone' = 'rover';
  private modelsCache: Partial<Record<'rover' | 'chrono' | 'drone', ProceduralSubject>> = {};

  // Camera targets & damping
  private targetCameraPos = new THREE.Vector3(4.5, 3.2, 5.5);
  private targetLookAt = new THREE.Vector3(0, 1.0, 0);
  private isTransitioningCamera = false;

  // Kinematics & state
  public autoRotate = false;
  public speedMultiplier = 1.0;
  public explosionProgress = 0.0;
  public selectedPart: ModelPartInfo | null = null;
  public hoveredPart: ModelPartInfo | null = null;

  // Raycasting
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private onSelectCallback?: (part: ModelPartInfo | null) => void;
  private onHoverCallback?: (part: ModelPartInfo | null) => void;

  // Telemetry
  public metrics: SceneMetrics = {
    fps: 60,
    triangles: 0,
    drawCalls: 0,
    geometries: 0,
    textures: 0,
  };
  private frameCount = 0;
  private lastFpsTime = 0;

  constructor(container: HTMLElement) {
    this.container = container;
    this.startTime = performance.now();

    this.isHeadless =
      typeof navigator !== 'undefined' &&
      (Boolean(navigator.webdriver) || /HeadlessChrome/i.test(navigator.userAgent));

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene
    this.scene = new THREE.Scene();

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.camera.position.set(4.5, 3.2, 5.5);

    // 3. Renderer with physical tone mapping
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isHeadless,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(this.isHeadless ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = !this.isHeadless;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);

    // 4. Orbit Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.02; // Prevent going underneath floor
    this.controls.minDistance = 1.2;
    this.controls.maxDistance = 18.0;
    this.controls.target.set(0, 1.0, 0);

    // 5. Materials Registry & Studio Lighting
    this.materials = new MaterialRegistry();
    this.lighting = new StudioLightingRig(this.scene, this.renderer, this.isHeadless);

    // 6. Pre-warm shaders
    this.renderer.compile(this.scene, this.camera);

    // 7. Event listeners
    this.onWindowResize = this.onWindowResize.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerClick = this.onPointerClick.bind(this);

    window.addEventListener('resize', this.onWindowResize);
    this.renderer.domElement.addEventListener('pointermove', this.onPointerMove);
    this.renderer.domElement.addEventListener('click', this.onPointerClick);

    // Load initial model
    this.loadModel('rover');

    // Start render loop
    this.startLoop();
  }

  public setCallbacks(
    onSelect: (part: ModelPartInfo | null) => void,
    onHover: (part: ModelPartInfo | null) => void
  ) {
    this.onSelectCallback = onSelect;
    this.onHoverCallback = onHover;
  }

  public loadModel(modelId: 'rover' | 'chrono' | 'drone') {
    if (this.currentSubject) {
      this.scene.remove(this.currentSubject.group);
      this.selectedPart = null;
      this.hoveredPart = null;
      if (this.onSelectCallback) this.onSelectCallback(null);
      if (this.onHoverCallback) this.onHoverCallback(null);
    }

    this.currentModelId = modelId;

    if (!this.modelsCache[modelId]) {
      if (modelId === 'rover') {
        this.modelsCache[modelId] = createRoverModel(this.materials);
      } else if (modelId === 'chrono') {
        this.modelsCache[modelId] = createChronoModel(this.materials);
      } else if (modelId === 'drone') {
        this.modelsCache[modelId] = createDroneModel(this.materials);
      }
    }

    this.currentSubject = this.modelsCache[modelId]!;
    this.scene.add(this.currentSubject.group);
    this.currentSubject.setExplosionProgress(this.explosionProgress);

    // Adjust camera preset appropriately
    if (modelId === 'chrono') {
      this.setCameraPreset('macro');
    } else {
      this.setCameraPreset('hero');
    }
  }

  public setCameraPreset(preset: CameraPreset) {
    this.isTransitioningCamera = true;
    const isChrono = this.currentModelId === 'chrono';

    if (preset === 'hero') {
      this.targetCameraPos.set(isChrono ? 3.4 : 4.8, isChrono ? 2.6 : 3.2, isChrono ? 3.8 : 5.2);
      this.targetLookAt.set(0, isChrono ? 0.9 : 1.1, 0);
    } else if (preset === 'top') {
      this.targetCameraPos.set(0.01, isChrono ? 5.8 : 8.0, 0.01);
      this.targetLookAt.set(0, isChrono ? 0.9 : 1.0, 0);
    } else if (preset === 'macro') {
      this.targetCameraPos.set(isChrono ? 2.2 : 3.0, isChrono ? 1.8 : 2.2, isChrono ? 2.6 : 3.2);
      this.targetLookAt.set(0, isChrono ? 0.95 : 1.2, 0);
    } else if (preset === 'iso') {
      this.targetCameraPos.set(isChrono ? 4.2 : 5.8, isChrono ? 3.6 : 4.6, isChrono ? 4.2 : 5.8);
      this.targetLookAt.set(0, isChrono ? 0.9 : 1.0, 0);
    } else if (preset === 'low') {
      this.targetCameraPos.set(isChrono ? 3.5 : 5.0, isChrono ? 0.7 : 0.9, isChrono ? 3.5 : 4.6);
      this.targetLookAt.set(0, isChrono ? 0.9 : 1.2, 0);
    }
  }

  public setExplosionProgress(progress: number) {
    this.explosionProgress = Math.max(0, Math.min(1, progress));
    if (this.currentSubject) {
      this.currentSubject.setExplosionProgress(this.explosionProgress);
    }
  }

  public applyFinish(finish: FinishPreset) {
    this.materials.applyFinish(finish);
  }

  public applyLighting(preset: LightingPreset) {
    this.lighting.applyPreset(preset);
  }

  public setWireframe(wireframe: boolean) {
    this.materials.setWireframe(wireframe);
  }

  public setGridVisible(visible: boolean) {
    this.lighting.setGridVisible(visible);
  }

  public selectPartById(partId: string) {
    if (!this.currentSubject) return;
    const found = this.currentSubject.parts.find((p) => p.id === partId);
    if (found) {
      this.selectedPart = found;
      if (this.onSelectCallback) this.onSelectCallback(found);
    }
  }

  private onPointerMove(e: MouseEvent) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    if (!this.currentSubject) return;

    this.raycaster.setFromCamera(this.pointer, this.camera);
    const intersects = this.raycaster.intersectObjects(this.currentSubject.group.children, true);

    if (intersects.length > 0) {
      const hitObj = intersects[0].object;
      // Match with parts
      let matchedPart: ModelPartInfo | null = null;
      for (const part of this.currentSubject.parts) {
        if (part.mesh === hitObj || part.mesh.getObjectById(hitObj.id)) {
          matchedPart = part;
          break;
        }
      }
      if (matchedPart !== this.hoveredPart) {
        this.hoveredPart = matchedPart;
        if (this.onHoverCallback) this.onHoverCallback(matchedPart);
      }
    } else if (this.hoveredPart) {
      this.hoveredPart = null;
      if (this.onHoverCallback) this.onHoverCallback(null);
    }
  }

  private onPointerClick() {
    if (this.hoveredPart !== this.selectedPart) {
      this.selectedPart = this.hoveredPart;
      if (this.onSelectCallback) this.onSelectCallback(this.selectedPart);
    }
  }

  private onWindowResize() {
    if (!this.container) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    // On mobile portrait (aspect < 1), adjust FOV so models stay fully framed
    if (this.camera.aspect < 1) {
      this.camera.fov = 60;
    } else {
      this.camera.fov = 45;
    }
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  private startLoop() {
    let lastTime = performance.now();
    let lastRenderTime = 0;

    const loop = (currentTime: number) => {
      this.animFrameId = requestAnimationFrame(loop);

      // In headless environment (software rendering), throttle to ~20fps to prevent CPU stall
      if (this.isHeadless) {
        if (currentTime - lastRenderTime < 50) {
          return;
        }
        lastRenderTime = currentTime;
      }

      const dt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      const effectiveDt = Math.min(dt, 0.1);
      const time = (currentTime - this.startTime) / 1000;

      // Camera smooth damping when transitioning presets
      if (this.isTransitioningCamera) {
        const nextCam = dampVector3(this.camera.position, this.targetCameraPos, 4.0, effectiveDt);
        this.camera.position.set(nextCam.x, nextCam.y, nextCam.z);

        const nextTarget = dampVector3(this.controls.target, this.targetLookAt, 4.0, effectiveDt);
        this.controls.target.set(nextTarget.x, nextTarget.y, nextTarget.z);

        if (this.camera.position.distanceTo(this.targetCameraPos) < 0.05) {
          this.isTransitioningCamera = false;
        }
      }

      // Auto-rotation in showcase mode
      if (this.autoRotate) {
        this.controls.autoRotate = true;
        this.controls.autoRotateSpeed = 1.8 * this.speedMultiplier;
      } else {
        this.controls.autoRotate = false;
      }

      this.controls.update();

      // Animate procedural model
      if (this.currentSubject) {
        this.currentSubject.animate(effectiveDt, time, this.speedMultiplier);
      }

      // Render
      this.renderer.render(this.scene, this.camera);

      // Track telemetry
      this.frameCount++;
      if (currentTime - this.lastFpsTime >= 1000) {
        this.metrics.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastFpsTime));
        this.metrics.triangles = this.renderer.info.render.triangles;
        this.metrics.drawCalls = this.renderer.info.render.calls;
        this.metrics.geometries = this.renderer.info.memory.geometries;
        this.metrics.textures = this.renderer.info.memory.textures;
        this.frameCount = 0;
        this.lastFpsTime = currentTime;
      }
    };

    this.animFrameId = requestAnimationFrame(loop);
  }

  public dispose() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }
    window.removeEventListener('resize', this.onWindowResize);
    this.renderer.domElement.removeEventListener('pointermove', this.onPointerMove);
    this.renderer.domElement.removeEventListener('click', this.onPointerClick);

    Object.values(this.modelsCache).forEach((m) => m?.dispose());
    this.materials.dispose();
    this.lighting.dispose();
    this.controls.dispose();
    this.renderer.dispose();

    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
