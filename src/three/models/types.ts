import * as THREE from 'three';

export interface ModelPartInfo {
  id: string;
  name: string;
  category: 'chassis' | 'propulsion' | 'optics' | 'kinematics' | 'structure' | 'power';
  description: string;
  materialSpec: string;
  massKg: number;
  tolerance: string;
  mesh: THREE.Object3D;
  basePosition: THREE.Vector3;
  baseRotation: THREE.Euler;
  explodeDir: THREE.Vector3;
  explodeDistance: number;
  explodeRotDelta?: THREE.Euler;
}

export interface ProceduralSubject {
  id: string;
  name: string;
  subtitle: string;
  category: string;
  group: THREE.Group;
  parts: ModelPartInfo[];
  contactShadow: THREE.Mesh;
  animate: (dt: number, time: number, speedMultiplier: number) => void;
  setExplosionProgress: (progress: number) => void;
  dispose: () => void;
}
