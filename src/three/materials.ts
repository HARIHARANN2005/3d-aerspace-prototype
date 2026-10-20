import * as THREE from 'three';
import {
  createBrushedMetalTexture,
  createCarbonFiberTexture,
} from './textures.ts';

export type FinishPreset =
  | 'titanium'
  | 'carbon'
  | 'obsidian'
  | 'roseGold'
  | 'emerald'
  | 'ceramic'
  | 'cyberBlue';

export interface FinishDefinition {
  id: FinishPreset;
  name: string;
  colorHex: string;
  metalness: number;
  roughness: number;
  clearcoat?: number;
  description: string;
}

export const FINISH_PRESETS: Record<FinishPreset, FinishDefinition> = {
  titanium: {
    id: 'titanium',
    name: 'Brushed Titanium',
    colorHex: '#9ba2ad',
    metalness: 0.92,
    roughness: 0.26,
    description: 'Aerospace-grade Grade 5 titanium with directional micro-brushing.',
  },
  carbon: {
    id: 'carbon',
    name: 'Forged Carbon',
    colorHex: '#1e222a',
    metalness: 0.15,
    roughness: 0.45,
    description: 'High-modulus carbon-fiber weave with matte resin matrix.',
  },
  obsidian: {
    id: 'obsidian',
    name: 'Obsidian Stealth',
    colorHex: '#121418',
    metalness: 0.75,
    roughness: 0.32,
    description: 'PVD diamond-like carbon (DLC) coating with deep optical absorption.',
  },
  roseGold: {
    id: 'roseGold',
    name: '18K Rose Gold',
    colorHex: '#e8ad8e',
    metalness: 0.96,
    roughness: 0.18,
    description: 'Precision hallmarked 4N alloy with warm champagne luster.',
  },
  emerald: {
    id: 'emerald',
    name: 'Anodized Emerald',
    colorHex: '#0f4d38',
    metalness: 0.88,
    roughness: 0.22,
    description: 'Hard-coat Type III galvanic anodized emerald finish.',
  },
  ceramic: {
    id: 'ceramic',
    name: 'Arctic Ceramic',
    colorHex: '#edf0f5',
    metalness: 0.08,
    roughness: 0.12,
    clearcoat: 1.0,
    description: 'Zirconia (ZrO2) sintered ceramic with diamond-polished glaze.',
  },
  cyberBlue: {
    id: 'cyberBlue',
    name: 'Ion Cyan',
    colorHex: '#0088ff',
    metalness: 0.85,
    roughness: 0.2,
    description: 'Electroluminescent micro-plated alloy with vivid spectral tint.',
  },
};

export class MaterialRegistry {
  public brushedTexture: THREE.CanvasTexture;
  public carbonTexture: THREE.CanvasTexture;

  // Cached materials
  public glassMaterial: THREE.MeshPhysicalMaterial;
  public rubyBearingMaterial: THREE.MeshPhysicalMaterial;
  public bluedSteelMaterial: THREE.MeshStandardMaterial;
  public brassGearMaterial: THREE.MeshStandardMaterial;
  public goldMaterial: THREE.MeshStandardMaterial;
  public emissiveIonMaterial: THREE.MeshStandardMaterial;
  public emissiveWarmMaterial: THREE.MeshStandardMaterial;
  public rubberTreadMaterial: THREE.MeshStandardMaterial;
  public darkStructuralMaterial: THREE.MeshStandardMaterial;

  // Dynamic primary body material
  public primaryBodyMaterial: THREE.MeshStandardMaterial;

  constructor() {
    this.brushedTexture = createBrushedMetalTexture();
    this.carbonTexture = createCarbonFiberTexture();

    this.primaryBodyMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(FINISH_PRESETS.titanium.colorHex),
      metalness: FINISH_PRESETS.titanium.metalness,
      roughness: FINISH_PRESETS.titanium.roughness,
      bumpMap: this.brushedTexture,
      bumpScale: 0.02,
    });

    // Optical sapphire glass cover
    this.glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.94,
      opacity: 1.0,
      transparent: true,
      roughness: 0.04,
      ior: 1.58,
      thickness: 1.2,
      clearcoat: 1.0,
      depthWrite: false,
    });

    // Synthetic ruby jewel bearings (corundum)
    this.rubyBearingMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xdf1645,
      emissive: 0x3d0010,
      emissiveIntensity: 0.2,
      roughness: 0.08,
      metalness: 0.1,
      transmission: 0.65,
      thickness: 0.8,
      ior: 1.76,
    });

    // Blued steel hands & screws (thermal temper blue)
    this.bluedSteelMaterial = new THREE.MeshStandardMaterial({
      color: 0x1d4ed8,
      metalness: 0.92,
      roughness: 0.18,
    });

    // Polished watchmaker brass for gear train
    this.brassGearMaterial = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.9,
      roughness: 0.24,
      bumpMap: this.brushedTexture,
      bumpScale: 0.015,
    });

    // 18K Yellow Gold
    this.goldMaterial = new THREE.MeshStandardMaterial({
      color: 0xf5c35b,
      metalness: 0.95,
      roughness: 0.16,
    });

    // Ion reactor emissive glow
    this.emissiveIonMaterial = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00c8e6,
      emissiveIntensity: 1.8,
      roughness: 0.2,
    });

    // Warm searchlight emissive
    this.emissiveWarmMaterial = new THREE.MeshStandardMaterial({
      color: 0xffe6a3,
      emissive: 0xffb84d,
      emissiveIntensity: 2.0,
      roughness: 0.1,
    });

    // Heavy duty vulcanized rubber for tires
    this.rubberTreadMaterial = new THREE.MeshStandardMaterial({
      color: 0x18191c,
      metalness: 0.05,
      roughness: 0.85,
    });

    // Dark chassis structural titanium
    this.darkStructuralMaterial = new THREE.MeshStandardMaterial({
      color: 0x242831,
      metalness: 0.85,
      roughness: 0.38,
    });
  }

  public applyFinish(finish: FinishPreset) {
    const spec = FINISH_PRESETS[finish];
    if (!spec) return;

    this.primaryBodyMaterial.color.set(spec.colorHex);
    this.primaryBodyMaterial.metalness = spec.metalness;
    this.primaryBodyMaterial.roughness = spec.roughness;

    if (finish === 'carbon') {
      this.primaryBodyMaterial.map = this.carbonTexture;
      this.primaryBodyMaterial.bumpMap = null;
    } else {
      this.primaryBodyMaterial.map = null;
      this.primaryBodyMaterial.bumpMap = this.brushedTexture;
      this.primaryBodyMaterial.bumpScale = 0.02;
    }
    this.primaryBodyMaterial.needsUpdate = true;
  }

  public setWireframe(wireframe: boolean) {
    this.primaryBodyMaterial.wireframe = wireframe;
    this.brassGearMaterial.wireframe = wireframe;
    this.darkStructuralMaterial.wireframe = wireframe;
    this.rubberTreadMaterial.wireframe = wireframe;
  }

  public dispose() {
    this.brushedTexture.dispose();
    this.carbonTexture.dispose();
    this.glassMaterial.dispose();
    this.rubyBearingMaterial.dispose();
    this.bluedSteelMaterial.dispose();
    this.brassGearMaterial.dispose();
    this.goldMaterial.dispose();
    this.emissiveIonMaterial.dispose();
    this.emissiveWarmMaterial.dispose();
    this.rubberTreadMaterial.dispose();
    this.darkStructuralMaterial.dispose();
    this.primaryBodyMaterial.dispose();
  }
}
