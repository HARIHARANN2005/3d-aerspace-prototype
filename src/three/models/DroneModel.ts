import * as THREE from 'three';
import { MaterialRegistry } from '../materials.ts';
import { ModelPartInfo, ProceduralSubject } from './types.ts';
import { createContactShadowTexture } from '../textures.ts';
import { damp } from '../../utils/math3d.ts';

export function createDroneModel(materials: MaterialRegistry): ProceduralSubject {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'CyberDrone_Root';
  const parts: ModelPartInfo[] = [];

  // Contact shadow
  const shadowGeo = new THREE.PlaneGeometry(6.0, 5.0);
  const shadowTex = createContactShadowTexture();
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
  });
  const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.y = 0.015;
  rootGroup.add(contactShadow);

  function registerPart(
    id: string,
    name: string,
    category: ModelPartInfo['category'],
    desc: string,
    materialSpec: string,
    mass: number,
    tolerance: string,
    mesh: THREE.Object3D,
    explodeDir: THREE.Vector3,
    explodeDist: number,
    explodeRotDelta?: THREE.Euler
  ) {
    rootGroup.add(mesh);
    parts.push({
      id,
      name,
      category,
      description: desc,
      materialSpec,
      massKg: mass,
      tolerance,
      mesh,
      basePosition: mesh.position.clone(),
      baseRotation: mesh.rotation.clone(),
      explodeDir,
      explodeDistance: explodeDist,
      explodeRotDelta,
    });
  }

  // 1. Fuselage Hull (Stealth faceted monocoque body)
  const fuselageGroup = new THREE.Group();
  fuselageGroup.position.set(0, 1.2, 0);

  const bodyShape = new THREE.Shape();
  bodyShape.moveTo(0, 2.2); // nose
  bodyShape.lineTo(0.8, 0.4);
  bodyShape.lineTo(0.65, -1.8);
  bodyShape.lineTo(-0.65, -1.8);
  bodyShape.lineTo(-0.8, 0.4);
  bodyShape.closePath();

  const bodyGeo = new THREE.ExtrudeGeometry(bodyShape, {
    depth: 0.5,
    bevelEnabled: true,
    bevelSize: 0.12,
    bevelThickness: 0.15,
  });
  bodyGeo.rotateX(Math.PI / 2);
  bodyGeo.center();
  const bodyMesh = new THREE.Mesh(bodyGeo, materials.primaryBodyMaterial);
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  fuselageGroup.add(bodyMesh);

  // Carbon spine ridge
  const spineGeo = new THREE.BoxGeometry(0.3, 0.25, 3.2);
  const spine = new THREE.Mesh(spineGeo, materials.darkStructuralMaterial);
  spine.position.y = 0.25;
  fuselageGroup.add(spine);

  registerPart(
    'stealth_fuselage',
    'Aero-Dynamic Stealth Monocoque',
    'chassis',
    'Low-radar-cross-section faceted airframe with embedded carbon-nanotube radar absorbent material (RAM).',
    'RAM Carbon-Bismaleimide Composite',
    185,
    '±0.02 mm',
    fuselageGroup,
    new THREE.Vector3(0, 0, 0),
    0
  );

  // 2. Port Swept Wing
  const portWingGroup = new THREE.Group();
  portWingGroup.name = 'PortWing';
  portWingGroup.position.set(-0.8, 1.25, -0.2);

  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0.8);
  wingShape.lineTo(-2.2, -0.6);
  wingShape.lineTo(-2.0, -1.2);
  wingShape.lineTo(0, -0.8);
  wingShape.closePath();

  const wingGeo = new THREE.ExtrudeGeometry(wingShape, {
    depth: 0.12,
    bevelEnabled: true,
    bevelSize: 0.04,
    bevelThickness: 0.04,
  });
  wingGeo.rotateX(Math.PI / 2);
  const portWingMesh = new THREE.Mesh(wingGeo, materials.primaryBodyMaterial);
  portWingMesh.castShadow = true;
  portWingGroup.add(portWingMesh);

  // Wingtip navigation emitter
  const wingtipNavGeo = new THREE.BoxGeometry(0.08, 0.08, 0.4);
  const portNav = new THREE.Mesh(wingtipNavGeo, materials.emissiveIonMaterial);
  portNav.position.set(-2.1, 0, -0.9);
  portWingGroup.add(portNav);

  registerPart(
    'swept_wing_port',
    'Port Variable-Geometry Wing',
    'structure',
    'Supercritical aero-elastic carbon wing with active piezoelectric boundary-layer laminar flow controls.',
    'Toray T1100G Carbon Matrix',
    42,
    '±0.05 mm',
    portWingGroup,
    new THREE.Vector3(-1.8, 0.4, 0),
    1.6,
    new THREE.Euler(0, 0, 0.2)
  );

  // 3. Starboard Swept Wing
  const starboardWingGroup = new THREE.Group();
  starboardWingGroup.name = 'StarboardWing';
  starboardWingGroup.position.set(0.8, 1.25, -0.2);

  const starWingShape = new THREE.Shape();
  starWingShape.moveTo(0, 0.8);
  starWingShape.lineTo(2.2, -0.6);
  starWingShape.lineTo(2.0, -1.2);
  starWingShape.lineTo(0, -0.8);
  starWingShape.closePath();

  const starWingGeo = new THREE.ExtrudeGeometry(starWingShape, {
    depth: 0.12,
    bevelEnabled: true,
    bevelSize: 0.04,
    bevelThickness: 0.04,
  });
  starWingGeo.rotateX(Math.PI / 2);
  const starWingMesh = new THREE.Mesh(starWingGeo, materials.primaryBodyMaterial);
  starWingMesh.castShadow = true;
  starboardWingGroup.add(starWingMesh);

  const starNav = new THREE.Mesh(wingtipNavGeo, materials.emissiveWarmMaterial);
  starNav.position.set(2.1, 0, -0.9);
  starboardWingGroup.add(starNav);

  registerPart(
    'swept_wing_starboard',
    'Starboard Variable-Geometry Wing',
    'structure',
    'Symmetric starboard lifting body with integrated conformal microwave antenna and fly-by-light actuators.',
    'Toray T1100G Carbon Matrix',
    42,
    '±0.05 mm',
    starboardWingGroup,
    new THREE.Vector3(1.8, 0.4, 0),
    1.6,
    new THREE.Euler(0, 0, -0.2)
  );

  // 4. Twin Vectored Ion Thrusters
  const thrustersGroup = new THREE.Group();
  thrustersGroup.name = 'IonThrusters';
  thrustersGroup.position.set(0, 1.2, -2.0);

  [-0.45, 0.45].forEach((tx) => {
    // Engine nacelle
    const nacelleGeo = new THREE.CylinderGeometry(0.28, 0.32, 1.1, 24);
    nacelleGeo.rotateX(Math.PI / 2);
    const nacelle = new THREE.Mesh(nacelleGeo, materials.darkStructuralMaterial);
    nacelle.position.set(tx, 0, 0);

    // Thrust vectoring petals (gimbal ring)
    const ringGeo = new THREE.TorusGeometry(0.29, 0.03, 8, 24);
    const ring = new THREE.Mesh(ringGeo, materials.bluedSteelMaterial);
    ring.position.set(tx, 0, -0.5);

    // Glowing ion plasma column
    const plasmaGeo = new THREE.ConeGeometry(0.22, 1.2, 16);
    plasmaGeo.rotateX(-Math.PI / 2);
    const plasma = new THREE.Mesh(plasmaGeo, materials.emissiveIonMaterial);
    plasma.position.set(tx, 0, -1.0);
    thrustersGroup.add(nacelle, ring, plasma);
  });

  registerPart(
    'ion_thrusters',
    'Dual Vectored Ion Pulse Drives',
    'propulsion',
    'High-specific-impulse Hall-effect xenon ion thrusters with magnetic plasma acceleration and 3D thrust vectoring nozzles.',
    'Tungsten-Rhenium & Samarium Cobalt Magnets',
    96,
    '±0.01 mm',
    thrustersGroup,
    new THREE.Vector3(0, 0, -1.8),
    1.8
  );

  // 5. Gimbal Targeting Sensor Pod (Nose underbelly)
  const sensorPodGroup = new THREE.Group();
  sensorPodGroup.name = 'SensorPod';
  sensorPodGroup.position.set(0, 0.85, 1.4);

  const sphereGeo = new THREE.SphereGeometry(0.28, 24, 24);
  const sphere = new THREE.Mesh(sphereGeo, materials.darkStructuralMaterial);
  sensorPodGroup.add(sphere);

  // Optical aperture
  const eyeGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.15, 16);
  eyeGeo.rotateX(Math.PI / 2);
  const eye = new THREE.Mesh(eyeGeo, materials.glassMaterial);
  eye.position.set(0, -0.05, 0.22);
  const eyeSensor = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.05, 16), materials.rubyBearingMaterial);
  eyeSensor.rotateX(Math.PI / 2);
  eyeSensor.position.set(0, -0.05, 0.2);
  sensorPodGroup.add(eye, eyeSensor);

  registerPart(
    'sensor_gimbal',
    'Full-Motion Multispectral Gimbal Pod',
    'optics',
    'Continuous 360-degree electro-optical/infrared (EO/IR) targeting ball with laser designator and quantum sensor stabilization.',
    'Sapphire Lens & InSb Cryo-Cooled Infrared',
    15,
    'Optical λ/8',
    sensorPodGroup,
    new THREE.Vector3(0, -1.2, 1.2),
    1.5
  );

  // 6. Landing Struts & Dampeners
  const landingGroup = new THREE.Group();
  landingGroup.position.set(0, 0.5, 0);

  const skidGeo = new THREE.BoxGeometry(0.1, 0.08, 2.8);
  [-1.0, 1.0].forEach((sx) => {
    const skid = new THREE.Mesh(skidGeo, materials.darkStructuralMaterial);
    skid.position.set(sx, -0.4, 0);

    // Diagonal support struts
    const strutGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.8, 12);
    const strutFront = new THREE.Mesh(strutGeo, materials.primaryBodyMaterial);
    strutFront.position.set(sx * 0.7, -0.1, 0.8);
    strutFront.rotation.z = sx > 0 ? 0.4 : -0.4;

    const strutRear = new THREE.Mesh(strutGeo, materials.primaryBodyMaterial);
    strutRear.position.set(sx * 0.7, -0.1, -0.8);
    strutRear.rotation.z = sx > 0 ? 0.4 : -0.4;
    landingGroup.add(skid, strutFront, strutRear);
  });

  registerPart(
    'landing_struts',
    'Hydraulic Carbon Skid Gear',
    'kinematics',
    'Magnetorheological fluid shock absorbing landing skids rated for 5g hard landings on uneven terra firma.',
    'Ultra-High Strength Carbon & Titanium Piston',
    38,
    '±0.05 mm',
    landingGroup,
    new THREE.Vector3(0, -1.4, 0),
    1.4
  );

  // 7. Dorsal Stabilizer & Communications Fin
  const finGroup = new THREE.Group();
  finGroup.position.set(0, 1.6, -1.0);

  const finShape = new THREE.Shape();
  finShape.moveTo(0, 0);
  finShape.lineTo(-0.6, 0.9);
  finShape.lineTo(-0.9, 0.9);
  finShape.lineTo(-1.2, 0);
  finShape.closePath();

  const finGeo = new THREE.ExtrudeGeometry(finShape, {
    depth: 0.06,
    bevelEnabled: true,
    bevelSize: 0.02,
    bevelThickness: 0.02,
  });
  finGeo.rotateY(Math.PI / 2);
  const fin = new THREE.Mesh(finGeo, materials.primaryBodyMaterial);
  finGroup.add(fin);

  registerPart(
    'dorsal_fin',
    'Vertical Stabilizer & UHF Comms Fin',
    'structure',
    'High-aspect-ratio vertical tail plane with conformal phased-array antenna for satellite up/downlinks.',
    'Bismaleimide Carbon Honeycomb',
    12,
    '±0.03 mm',
    finGroup,
    new THREE.Vector3(0, 1.8, -0.5),
    1.6,
    new THREE.Euler(-0.2, 0, 0)
  );

  // 8. Plasma Rail Cannons
  const cannonGroup = new THREE.Group();
  cannonGroup.position.set(0, 1.05, 0.8);

  [-0.45, 0.45].forEach((cx) => {
    const barrelGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.6, 16);
    barrelGeo.rotateX(Math.PI / 2);
    const barrel = new THREE.Mesh(barrelGeo, materials.bluedSteelMaterial);
    barrel.position.set(cx, 0, 0);

    const muzzleGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.15, 16);
    muzzleGeo.rotateX(Math.PI / 2);
    const muzzle = new THREE.Mesh(muzzleGeo, materials.goldMaterial);
    muzzle.position.set(cx, 0, 0.8);
    cannonGroup.add(barrel, muzzle);
  });

  registerPart(
    'plasma_cannons',
    'Twin Electro-Magnetic Rail Tubes',
    'propulsion',
    'Superconducting magnetic accelerator barrels firing hypervelocity penetrator darts with zero propellant signature.',
    'Yttrium Barium Copper Oxide (YBCO) & Blued Steel',
    30,
    '±0.005 mm',
    cannonGroup,
    new THREE.Vector3(0, -0.5, 1.5),
    1.5
  );

  // 9. Supersonic RAM-Air Ducts & Radiator Grille
  const intakeGroup = new THREE.Group();
  intakeGroup.position.set(0, 1.45, -0.1);

  const ductGeo = new THREE.BoxGeometry(0.7, 0.18, 0.9);
  const duct = new THREE.Mesh(ductGeo, materials.darkStructuralMaterial);
  intakeGroup.add(duct);

  // Honeycomb radiator mesh
  const grilleGeo = new THREE.PlaneGeometry(0.65, 0.14);
  const grille = new THREE.Mesh(grilleGeo, materials.goldMaterial);
  grille.position.set(0, 0.02, 0.46);
  intakeGroup.add(grille);

  registerPart(
    'avionics_radiator',
    'Supersonic RAM-Air Cooling Core',
    'power',
    'Cryogenic phase-change heat exchanger dissipating 45 kW of waste avionics heat through conformal micro-channels.',
    'Micro-Porous Sintered Copper-Graphite',
    16,
    '±0.01 mm',
    intakeGroup,
    new THREE.Vector3(0, 1.4, 0),
    1.4
  );

  let currentExplosion = 0;
  let targetExplosion = 0;

  function animate(dt: number, time: number, speedMultiplier: number) {
    const effectiveDt = Math.min(dt, 0.1);
    currentExplosion = damp(currentExplosion, targetExplosion, 5.0, effectiveDt);

    parts.forEach((p) => {
      p.mesh.position.set(
        p.basePosition.x + p.explodeDir.x * p.explodeDistance * currentExplosion,
        p.basePosition.y + p.explodeDir.y * p.explodeDistance * currentExplosion,
        p.basePosition.z + p.explodeDir.z * p.explodeDistance * currentExplosion
      );
      if (p.explodeRotDelta) {
        p.mesh.rotation.set(
          p.baseRotation.x + p.explodeRotDelta.x * currentExplosion,
          p.baseRotation.y + p.explodeRotDelta.y * currentExplosion,
          p.baseRotation.z + p.explodeRotDelta.z * currentExplosion
        );
      }
    });

    // Flight kinematics: gentle hover bob and bank
    if (currentExplosion < 0.15) {
      fuselageGroup.position.y = 1.2 + Math.sin(time * 2.2 * speedMultiplier) * 0.04;
      fuselageGroup.rotation.z = Math.sin(time * 1.5 * speedMultiplier) * 0.03;
      fuselageGroup.rotation.x = Math.sin(time * 1.1 * speedMultiplier) * 0.02;
    } else {
      fuselageGroup.position.y = 1.2;
      fuselageGroup.rotation.set(0, 0, 0);
    }

    // Targeting pod tracks
    const pod = rootGroup.getObjectByName('SensorPod');
    if (pod) {
      pod.rotation.y = Math.sin(time * 1.2 * speedMultiplier) * 0.6;
      pod.rotation.x = Math.sin(time * 0.7 * speedMultiplier) * 0.2;
    }

    // Ion thruster pulse
    const thrusters = rootGroup.getObjectByName('IonThrusters');
    if (thrusters) {
      const pulseScale = 1.0 + Math.sin(time * 18.0 * speedMultiplier) * 0.08;
      thrusters.scale.set(1.0, 1.0, pulseScale);
    }
  }

  function setExplosionProgress(progress: number) {
    targetExplosion = Math.max(0, Math.min(1, progress));
  }

  function dispose() {
    shadowGeo.dispose();
    shadowTex.dispose();
    shadowMat.dispose();
  }

  return {
    id: 'drone',
    name: 'Cyber-Drone Titan',
    subtitle: 'Stealth Autonomous Strike & Reconnaissance Platform',
    category: 'Unmanned Aerospace',
    group: rootGroup,
    parts,
    contactShadow,
    animate,
    setExplosionProgress,
    dispose,
  };
}
