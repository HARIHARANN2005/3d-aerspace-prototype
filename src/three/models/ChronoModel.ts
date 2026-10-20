import * as THREE from 'three';
import { MaterialRegistry } from '../materials.ts';
import { ModelPartInfo, ProceduralSubject } from './types.ts';
import { createWatchDialTexture, createContactShadowTexture } from '../textures.ts';
import { damp } from '../../utils/math3d.ts';

export function createChronoModel(materials: MaterialRegistry): ProceduralSubject {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'ChronoTourbillon_Root';
  const parts: ModelPartInfo[] = [];

  // Contact shadow
  const shadowGeo = new THREE.PlaneGeometry(5.0, 5.0);
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

  // 1. Titanium Case & Bezel (Outer housing)
  const caseGroup = new THREE.Group();
  caseGroup.position.set(0, 0.7, 0);

  // Outer case cylinder with bevel
  const caseGeo = new THREE.CylinderGeometry(1.9, 1.85, 0.5, 36);
  const caseMesh = new THREE.Mesh(caseGeo, materials.primaryBodyMaterial);
  caseMesh.castShadow = true;
  caseMesh.receiveShadow = true;
  caseGroup.add(caseMesh);

  // Lugs (4 corner mounting lugs)
  const lugGeo = new THREE.BoxGeometry(0.35, 0.45, 1.2);
  const lugPositions = [
    [-1.5, 0, 1.8],
    [1.5, 0, 1.8],
    [-1.5, 0, -1.8],
    [1.5, 0, -1.8],
  ];
  lugPositions.forEach(([lx, ly, lz]) => {
    const lug = new THREE.Mesh(lugGeo, materials.primaryBodyMaterial);
    lug.position.set(lx, ly, lz);
    lug.rotation.x = lz > 0 ? -0.15 : 0.15;
    caseGroup.add(lug);
  });

  registerPart(
    'casing_bezel',
    'Sculpted Titanium Case & Bezel',
    'chassis',
    'High-tensile Grade 5 titanium 43mm monobloc chassis with chamfered alternating brushed and polished flanks.',
    'Ti-6Al-4V Grade 5 Titanium',
    0.068,
    '±0.005 mm',
    caseGroup,
    new THREE.Vector3(0, -0.6, 0),
    1.2
  );

  // 2. Domed Sapphire Crystal Cover
  const crystalGroup = new THREE.Group();
  crystalGroup.position.set(0, 1.25, 0);

  const crystalGeo = new THREE.CylinderGeometry(1.78, 1.78, 0.16, 36);
  const crystalMesh = new THREE.Mesh(crystalGeo, materials.glassMaterial);
  crystalGroup.add(crystalMesh);

  registerPart(
    'sapphire_crystal',
    'Domed Glare-Proof Sapphire Crystal',
    'optics',
    'Scratch-resistant synthetic single-crystal corundum sapphire with multi-layer interior anti-reflective treatment.',
    'Al2O3 Monocrystalline Sapphire (Mohs 9)',
    0.012,
    'Optical Flat λ/10',
    crystalGroup,
    new THREE.Vector3(0, 1.6, 0),
    2.2
  );

  // 3. Mainplate Dial & Chapter Ring
  const dialGroup = new THREE.Group();
  dialGroup.position.set(0, 0.88, 0);

  const dialTex = createWatchDialTexture();
  const dialMat = new THREE.MeshStandardMaterial({
    map: dialTex,
    roughness: 0.25,
    metalness: 0.85,
  });
  const dialGeo = new THREE.CylinderGeometry(1.72, 1.72, 0.04, 48);
  const dialMesh = new THREE.Mesh(dialGeo, dialMat);
  dialGroup.add(dialMesh);

  registerPart(
    'mainplate_dial',
    'Sunray Guilloché Dial Mainplate',
    'structure',
    'Skeletonized architectural titanium mainplate with micro-blasted galvanic finish and printed chapter ring scales.',
    'Galvanic Anthracite Titanium & Gold Trims',
    0.024,
    '±0.003 mm',
    dialGroup,
    new THREE.Vector3(0, 0.5, 0),
    1.4
  );

  // 4. Tourbillon Carriage Cage (Rotating 60-second carriage)
  const tourbillonGroup = new THREE.Group();
  tourbillonGroup.name = 'TourbillonCage';
  tourbillonGroup.position.set(0, 1.0, 0.75); // positioned at 6 o'clock

  // Titanium 3-arm cage bridge
  const cagePillarGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.35, 12);
  for (let i = 0; i < 3; i++) {
    const angle = (i * Math.PI * 2) / 3;
    const pillar = new THREE.Mesh(cagePillarGeo, materials.primaryBodyMaterial);
    pillar.position.set(Math.cos(angle) * 0.38, 0, Math.sin(angle) * 0.38);
    tourbillonGroup.add(pillar);
  }

  // Top polished carriage bridge
  const bridgeGeo = new THREE.TorusGeometry(0.42, 0.03, 8, 24);
  bridgeGeo.rotateX(Math.PI / 2);
  const bridgeMesh = new THREE.Mesh(bridgeGeo, materials.bluedSteelMaterial);
  tourbillonGroup.add(bridgeMesh);

  registerPart(
    'tourbillon_cage',
    'Gravity-Neutralizing Tourbillon Cage',
    'kinematics',
    'Ultra-light 0.28-gram titanium carriage completing one full rotation every 60 seconds to counteract positional gravity errors.',
    'Grade 5 Ti Cage & Polished Steel Bridges',
    0.0003,
    '±0.001 mm',
    tourbillonGroup,
    new THREE.Vector3(0, 1.2, 0.8),
    1.8
  );

  // 5. Beating Balance Wheel & Hairspring
  const balanceWheelGroup = new THREE.Group();
  balanceWheelGroup.name = 'BalanceWheel';
  balanceWheelGroup.position.set(0, 1.0, 0.75);

  const balanceRimGeo = new THREE.TorusGeometry(0.32, 0.024, 8, 24);
  balanceRimGeo.rotateX(Math.PI / 2);
  const balanceRim = new THREE.Mesh(balanceRimGeo, materials.goldMaterial);
  balanceWheelGroup.add(balanceRim);

  // 4 gold adjustment inertia screws
  const screwGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.05, 8);
  for (let s = 0; s < 4; s++) {
    const a = (s * Math.PI) / 2;
    const screw = new THREE.Mesh(screwGeo, materials.goldMaterial);
    screw.position.set(Math.cos(a) * 0.33, 0, Math.sin(a) * 0.33);
    balanceWheelGroup.add(screw);
  }

  registerPart(
    'balance_wheel',
    'Glucydur Variable-Inertia Balance Wheel',
    'kinematics',
    'Temperature-compensated Glucydur balance wheel vibrating at 28,800 vibrations per hour (4 Hz) with Nivarox-1 hairspring.',
    'Beryllium Bronze Alloy & 18K Micro-Screws',
    0.0004,
    '±0.0008 mm',
    balanceWheelGroup,
    new THREE.Vector3(0, 1.4, 0.8),
    2.0
  );

  // 6. Interlocking Brass Gear Train
  const gearTrainGroup = new THREE.Group();
  gearTrainGroup.position.set(0, 0.95, 0);

  // Function to create toothed gear
  function createGear(radius: number, teethCount: number, thickness: number) {
    const gearShape = new THREE.Shape();
    for (let i = 0; i < teethCount; i++) {
      const a1 = (i / teethCount) * Math.PI * 2;
      const a2 = ((i + 0.3) / teethCount) * Math.PI * 2;
      const a3 = ((i + 0.7) / teethCount) * Math.PI * 2;
      const rInner = radius * 0.88;
      const rOuter = radius;

      if (i === 0) gearShape.moveTo(Math.cos(a1) * rInner, Math.sin(a1) * rInner);
      else gearShape.lineTo(Math.cos(a1) * rInner, Math.sin(a1) * rInner);
      gearShape.lineTo(Math.cos(a2) * rOuter, Math.sin(a2) * rOuter);
      gearShape.lineTo(Math.cos(a3) * rOuter, Math.sin(a3) * rOuter);
    }
    gearShape.closePath();

    const gExt = new THREE.ExtrudeGeometry(gearShape, {
      depth: thickness,
      bevelEnabled: true,
      bevelSize: 0.01,
      bevelThickness: 0.01,
    });
    gExt.rotateX(Math.PI / 2);
    gExt.center();
    return gExt;
  }

  // Center wheel (large)
  const centerGearGeo = createGear(0.65, 32, 0.06);
  const centerGear = new THREE.Mesh(centerGearGeo, materials.brassGearMaterial);
  centerGear.name = 'CenterGear';
  centerGear.position.set(0, 0, 0);
  gearTrainGroup.add(centerGear);

  // Third wheel (medium)
  const thirdGearGeo = createGear(0.42, 24, 0.05);
  const thirdGear = new THREE.Mesh(thirdGearGeo, materials.brassGearMaterial);
  thirdGear.name = 'ThirdGear';
  thirdGear.position.set(0.65, 0.02, 0.35);
  gearTrainGroup.add(thirdGear);

  // Fourth wheel (small)
  const fourthGearGeo = createGear(0.28, 16, 0.04);
  const fourthGear = new THREE.Mesh(fourthGearGeo, materials.brassGearMaterial);
  fourthGear.name = 'FourthGear';
  fourthGear.position.set(-0.55, 0.03, 0.4);
  gearTrainGroup.add(fourthGear);

  registerPart(
    'gear_train',
    'Interlocking Epicyclic Gear Train',
    'kinematics',
    'Hand-beveled CuZn39Pb3 brass gear train transmitting steady torque from the mainspring barrel with cycloidal tooth geometry.',
    '2N Gilded Hard Brass & Micro-Polished Pinions',
    0.008,
    '±0.002 mm',
    gearTrainGroup,
    new THREE.Vector3(0, 0.3, 0),
    1.1
  );

  // 7. Ruby Jewel Bearings Array
  const jewelsGroup = new THREE.Group();
  jewelsGroup.position.set(0, 1.02, 0);

  const jewelGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.04, 16);
  const jewelPositions = [
    [0, 0, 0],
    [0.65, 0, 0.35],
    [-0.55, 0, 0.4],
    [0, 0, 0.75],
    [-0.45, 0, -0.6],
    [0.45, 0, -0.6],
  ];

  jewelPositions.forEach(([jx, jy, jz]) => {
    // Polished gold chaton setting
    const chatonGeo = new THREE.TorusGeometry(0.075, 0.02, 8, 16);
    chatonGeo.rotateX(Math.PI / 2);
    const chaton = new THREE.Mesh(chatonGeo, materials.goldMaterial);
    chaton.position.set(jx, jy, jz);

    const jewel = new THREE.Mesh(jewelGeo, materials.rubyBearingMaterial);
    jewel.position.set(jx, jy, jz);
    jewelsGroup.add(chaton, jewel);
  });

  registerPart(
    'jewel_bearings',
    'Synthetic Corundum Jewel Bearings',
    'structure',
    '33 functional synthetic pigeon-blood ruby cup jewels friction-fitted in screwed 18K solid gold chatons for frictionless pivots.',
    'Al2O3:Cr Single Crystal Ruby (Mohs 9)',
    0.002,
    '±0.0005 mm',
    jewelsGroup,
    new THREE.Vector3(0, 0.8, 0),
    1.6
  );

  // 8. Faceted Blued-Steel Hands (Hour & Minute)
  const handsGroup = new THREE.Group();
  handsGroup.name = 'HandsAssembly';
  handsGroup.position.set(0, 1.15, 0);

  // Minute hand
  const minuteHandGroup = new THREE.Group();
  minuteHandGroup.name = 'MinuteHand';
  const mShape = new THREE.Shape();
  mShape.moveTo(-0.04, -0.15);
  mShape.lineTo(0.04, -0.15);
  mShape.lineTo(0.02, 1.25);
  mShape.lineTo(0, 1.35);
  mShape.lineTo(-0.02, 1.25);
  mShape.closePath();
  const mGeo = new THREE.ExtrudeGeometry(mShape, {
    depth: 0.025,
    bevelEnabled: true,
    bevelSize: 0.008,
    bevelThickness: 0.008,
  });
  mGeo.rotateX(-Math.PI / 2);
  const mMesh = new THREE.Mesh(mGeo, materials.bluedSteelMaterial);
  minuteHandGroup.add(mMesh);
  handsGroup.add(minuteHandGroup);

  // Hour hand
  const hourHandGroup = new THREE.Group();
  hourHandGroup.name = 'HourHand';
  const hShape = new THREE.Shape();
  hShape.moveTo(-0.05, -0.12);
  hShape.lineTo(0.05, -0.12);
  hShape.lineTo(0.03, 0.85);
  hShape.lineTo(0, 0.95);
  hShape.lineTo(-0.03, 0.85);
  hShape.closePath();
  const hGeo = new THREE.ExtrudeGeometry(hShape, {
    depth: 0.028,
    bevelEnabled: true,
    bevelSize: 0.008,
    bevelThickness: 0.008,
  });
  hGeo.rotateX(-Math.PI / 2);
  const hMesh = new THREE.Mesh(hGeo, materials.bluedSteelMaterial);
  hMesh.position.y = -0.02;
  hourHandGroup.add(hMesh);
  handsGroup.add(hourHandGroup);

  // Center retaining cap in polished rose gold
  const capGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.04, 16);
  const cap = new THREE.Mesh(capGeo, materials.goldMaterial);
  cap.position.y = 0.02;
  handsGroup.add(cap);

  registerPart(
    'time_hands',
    'Faceted Thermal-Blued Steel Hands',
    'optics',
    'Precision openworked lance-profile hands individually heated to 300°C for deep cornflower blue oxidation with chamfered bevels.',
    'Thermal Oxidation Carbon Steel 20AP',
    0.0008,
    '±0.002 mm',
    handsGroup,
    new THREE.Vector3(0, 1.3, 0),
    2.1
  );

  // 9. Mainspring Power Reserve Barrel
  const barrelGroup = new THREE.Group();
  barrelGroup.position.set(-0.6, 0.85, -0.55);

  const barrelGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.18, 32);
  const barrel = new THREE.Mesh(barrelGeo, materials.darkStructuralMaterial);
  barrelGroup.add(barrel);

  // Barrel ratchet wheel on top
  const ratchetGeo = createGear(0.46, 20, 0.03);
  const ratchet = new THREE.Mesh(ratchetGeo, materials.primaryBodyMaterial);
  ratchet.position.y = 0.1;
  barrelGroup.add(ratchet);

  registerPart(
    'power_barrel',
    'Twin Mainspring Torque Barrel',
    'power',
    'Parallel dual barrels delivering 72 hours of linear chronometric power reserve with Nivaflex continuous-tension alloy spring.',
    'Nivaflex Alloy & DLC Coated Drum',
    0.015,
    '±0.003 mm',
    barrelGroup,
    new THREE.Vector3(-0.8, -0.2, -0.6),
    1.4
  );

  // 10. Oscillating Winding Rotor (Base)
  const rotorGroup = new THREE.Group();
  rotorGroup.name = 'OscillatingRotor';
  rotorGroup.position.set(0, 0.4, 0);

  // Half-circle heavy segment in platinum
  const rotorShape = new THREE.Shape();
  rotorShape.absarc(0, 0, 1.6, 0, Math.PI, false);
  rotorShape.lineTo(0.3, 0);
  rotorShape.absarc(0, 0, 0.4, Math.PI, 0, true);
  rotorShape.closePath();

  const rotorGeo = new THREE.ExtrudeGeometry(rotorShape, {
    depth: 0.1,
    bevelEnabled: true,
    bevelSize: 0.02,
    bevelThickness: 0.02,
  });
  rotorGeo.rotateX(Math.PI / 2);
  rotorGeo.center();
  const rotorMesh = new THREE.Mesh(rotorGeo, materials.goldMaterial);
  rotorMesh.position.set(0, 0, 0.55);
  rotorGroup.add(rotorMesh);

  // Central ball bearing race
  const raceGeo = new THREE.TorusGeometry(0.28, 0.04, 12, 24);
  raceGeo.rotateX(Math.PI / 2);
  const race = new THREE.Mesh(raceGeo, materials.bluedSteelMaterial);
  rotorGroup.add(race);

  registerPart(
    'winding_rotor',
    'High-Inertia 22K Gold Bi-Directional Rotor',
    'propulsion',
    'Heavy semi-annular 22-carat gold oscillating weight with ceramic ball bearings for self-winding kinetic charging.',
    '22K 3N Gold (Density 17.5 g/cm³)',
    0.022,
    '±0.002 mm',
    rotorGroup,
    new THREE.Vector3(0, -1.0, 0),
    1.6,
    new THREE.Euler(0, 0, 0.5)
  );

  // 11. Knurled Winding Crown & Pushers (3 o'clock)
  const crownGroup = new THREE.Group();
  crownGroup.position.set(2.0, 0.7, 0);

  const crownPoints: THREE.Vector2[] = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.12, 0),
    new THREE.Vector2(0.16, 0.1),
    new THREE.Vector2(0.16, 0.3),
    new THREE.Vector2(0.12, 0.35),
    new THREE.Vector2(0, 0.35),
  ];
  const crownGeo = new THREE.LatheGeometry(crownPoints, 24);
  crownGeo.rotateZ(-Math.PI / 2);
  const crown = new THREE.Mesh(crownGeo, materials.primaryBodyMaterial);
  crownGroup.add(crown);

  // Fluted grip notches
  const notchGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.15, 12);
  notchGeo.rotateZ(Math.PI / 2);
  const notch = new THREE.Mesh(notchGeo, materials.darkStructuralMaterial);
  crownGroup.add(notch);

  registerPart(
    'winding_crown',
    'Twinlock Knurled Winding Crown',
    'chassis',
    'Fluted ergonomic winding crown with dual Viton hermetic gaskets for 100-meter hydrostatic water resistance.',
    'Grade 5 Ti & Viton O-Rings',
    0.005,
    '±0.005 mm',
    crownGroup,
    new THREE.Vector3(1.8, 0, 0),
    1.6
  );

  // Animation controller
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

    // Kinematics:
    // 1. Tourbillon rotates 360 deg every 60s
    tourbillonGroup.rotation.y += (Math.PI * 2 / 12) * speedMultiplier * effectiveDt;

    // 2. Balance wheel rapid oscillation (4Hz / 28,800 VPH)
    const balanceObj = rootGroup.getObjectByName('BalanceWheel');
    if (balanceObj) {
      balanceObj.rotation.y = Math.sin(time * 25.13 * speedMultiplier) * 0.95;
    }

    // 3. Gear train rotation
    const centerGearObj = rootGroup.getObjectByName('CenterGear');
    if (centerGearObj) centerGearObj.rotation.y += 0.2 * speedMultiplier * effectiveDt;

    const thirdGearObj = rootGroup.getObjectByName('ThirdGear');
    if (thirdGearObj) thirdGearObj.rotation.y -= 0.5 * speedMultiplier * effectiveDt;

    const fourthGearObj = rootGroup.getObjectByName('FourthGear');
    if (fourthGearObj) fourthGearObj.rotation.y += 1.2 * speedMultiplier * effectiveDt;

    // 4. Hands sweep
    const minuteHandObj = rootGroup.getObjectByName('MinuteHand');
    if (minuteHandObj) minuteHandObj.rotation.y += 0.08 * speedMultiplier * effectiveDt;

    const hourHandObj = rootGroup.getObjectByName('HourHand');
    if (hourHandObj) hourHandObj.rotation.y += (0.08 / 12) * speedMultiplier * effectiveDt;

    // 5. Oscillating rotor pendular motion
    const rotorObj = rootGroup.getObjectByName('OscillatingRotor');
    if (rotorObj) {
      rotorObj.rotation.y = Math.sin(time * 1.5 * speedMultiplier) * 1.8;
    }
  }

  function setExplosionProgress(progress: number) {
    targetExplosion = Math.max(0, Math.min(1, progress));
  }

  function dispose() {
    shadowGeo.dispose();
    shadowTex.dispose();
    shadowMat.dispose();
    dialTex.dispose();
    dialMat.dispose();
  }

  return {
    id: 'chrono',
    name: 'Chrono-Calibre 3000',
    subtitle: 'High-Complication Tourbillon Horology',
    category: 'Haute Horlogerie',
    group: rootGroup,
    parts,
    contactShadow,
    animate,
    setExplosionProgress,
    dispose,
  };
}
