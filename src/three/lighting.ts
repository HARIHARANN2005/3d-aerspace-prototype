import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export type LightingPreset = 'studioDaylight' | 'cyberMidnight' | 'goldenHour' | 'cleanLab';

export interface LightingPresetConfig {
  id: LightingPreset;
  name: string;
  bgColor: number;
  fogDensity: number;
  keyColor: number;
  keyIntensity: number;
  fillSkyColor: number;
  fillGroundColor: number;
  fillIntensity: number;
  rimColor: number;
  rimIntensity: number;
  exposure: number;
}

export const LIGHTING_PRESETS: Record<LightingPreset, LightingPresetConfig> = {
  studioDaylight: {
    id: 'studioDaylight',
    name: 'Studio Neutral',
    bgColor: 0x0c0f17,
    fogDensity: 0.035,
    keyColor: 0xfff4e6, // Warm 4500K
    keyIntensity: 2.4,
    fillSkyColor: 0x8ec5fc, // Cool sky
    fillGroundColor: 0x222836,
    fillIntensity: 1.2,
    rimColor: 0x90b8f8,
    rimIntensity: 1.5,
    exposure: 1.15,
  },
  cyberMidnight: {
    id: 'cyberMidnight',
    name: 'Cyber Midnight',
    bgColor: 0x05070d,
    fogDensity: 0.045,
    keyColor: 0x00e5ff,
    keyIntensity: 2.8,
    fillSkyColor: 0x1a263f,
    fillGroundColor: 0x090d18,
    fillIntensity: 0.8,
    rimColor: 0x8a2be2,
    rimIntensity: 2.2,
    exposure: 1.2,
  },
  goldenHour: {
    id: 'goldenHour',
    name: 'Golden Hour',
    bgColor: 0x140e0b,
    fogDensity: 0.038,
    keyColor: 0xffaa5e, // Warm 3200K amber
    keyIntensity: 3.0,
    fillSkyColor: 0xd97736,
    fillGroundColor: 0x261208,
    fillIntensity: 1.1,
    rimColor: 0xffd166,
    rimIntensity: 1.6,
    exposure: 1.1,
  },
  cleanLab: {
    id: 'cleanLab',
    name: 'Clean Laboratory',
    bgColor: 0x1a1e27,
    fogDensity: 0.03,
    keyColor: 0xffffff,
    keyIntensity: 2.6,
    fillSkyColor: 0xcfd8dc,
    fillGroundColor: 0x37474f,
    fillIntensity: 1.4,
    rimColor: 0xffffff,
    rimIntensity: 1.2,
    exposure: 1.05,
  },
};

export class StudioLightingRig {
  public keyLight: THREE.DirectionalLight;
  public fillLight: THREE.HemisphereLight;
  public rimLight: THREE.DirectionalLight;
  public floorGrid: THREE.GridHelper;
  public floorDisc: THREE.Mesh;
  public envTexture: THREE.Texture;

  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;

  constructor(scene: THREE.Scene, renderer: THREE.WebGLRenderer, isHeadless: boolean) {
    this.scene = scene;
    this.renderer = renderer;

    // 1. Mandatory Studio Environment via RoomEnvironment & PMREMGenerator
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    this.envTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = this.envTexture;
    pmremGenerator.dispose();

    // 2. Warm Key Light with tight shadow frustum
    this.keyLight = new THREE.DirectionalLight(0xfff4e6, 2.4);
    this.keyLight.position.set(5, 8, 4);
    if (!isHeadless) {
      this.keyLight.castShadow = true;
      this.keyLight.shadow.mapSize.width = 1024;
      this.keyLight.shadow.mapSize.height = 1024;
      this.keyLight.shadow.camera.near = 0.5;
      this.keyLight.shadow.camera.far = 25;
      this.keyLight.shadow.camera.left = -4.5;
      this.keyLight.shadow.camera.right = 4.5;
      this.keyLight.shadow.camera.top = 4.5;
      this.keyLight.shadow.camera.bottom = -4.5;
      this.keyLight.shadow.bias = -0.0005;
      this.keyLight.shadow.normalBias = 0.02;
    }
    scene.add(this.keyLight);

    // 3. Cool Hemisphere fill light (sky vs ground temperature contrast)
    this.fillLight = new THREE.HemisphereLight(0x8ec5fc, 0x222836, 1.2);
    this.fillLight.position.set(0, 10, 0);
    scene.add(this.fillLight);

    // 4. Studio Rim/Backlight
    this.rimLight = new THREE.DirectionalLight(0x90b8f8, 1.5);
    this.rimLight.position.set(-6, 5, -5);
    scene.add(this.rimLight);

    // 5. Studio Floor Grid & Concentric Circle Marker
    this.floorGrid = new THREE.GridHelper(30, 30, 0x334155, 0x1e293b);
    this.floorGrid.position.y = 0;
    scene.add(this.floorGrid);

    const discGeo = new THREE.RingGeometry(2.8, 2.85, 64);
    discGeo.rotateX(-Math.PI / 2);
    const discMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
    });
    this.floorDisc = new THREE.Mesh(discGeo, discMat);
    this.floorDisc.position.y = 0.005;
    scene.add(this.floorDisc);

    // Initial fog
    scene.fog = new THREE.FogExp2(0x0c0f17, 0.035);
    scene.background = new THREE.Color(0x0c0f17);
  }

  public applyPreset(presetKey: LightingPreset) {
    const config = LIGHTING_PRESETS[presetKey];
    if (!config) return;

    this.scene.background = new THREE.Color(config.bgColor);
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.set(config.bgColor);
      this.scene.fog.density = config.fogDensity;
    }

    this.keyLight.color.set(config.keyColor);
    this.keyLight.intensity = config.keyIntensity;

    this.fillLight.color.set(config.fillSkyColor);
    this.fillLight.groundColor.set(config.fillGroundColor);
    this.fillLight.intensity = config.fillIntensity;

    this.rimLight.color.set(config.rimColor);
    this.rimLight.intensity = config.rimIntensity;

    this.renderer.toneMappingExposure = config.exposure;
  }

  public setGridVisible(visible: boolean) {
    this.floorGrid.visible = visible;
    this.floorDisc.visible = visible;
  }

  public dispose() {
    this.envTexture.dispose();
    this.floorGrid.geometry.dispose();
    this.floorDisc.geometry.dispose();
  }
}
