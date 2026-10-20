import * as THREE from 'three';
import { MaterialRegistry } from '../materials.ts';
import { ModelPartInfo, ProceduralSubject } from './types.ts';
import { createSolarCellTexture, createContactShadowTexture } from '../textures.ts';
import { damp } from '../../utils/math3d.ts';

export function createRoverModel(materials: MaterialRegistry): ProceduralSubject {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'AeroRover_Root';
  const parts: ModelPartInfo[] = [];

  // Ground contact shadow
  const shadowGeo = new THREE.PlaneGeometry(6.5, 5.0);
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

  // Helper to register parts
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

  // 1. Armored Chassis Hull (Primary silhouette)
  const hullGroup = new THREE.Group();
  hullGroup.position.set(0, 1.1, 0);

  // Extrude beveled faceted hull
  const hullShape = new THREE.Shape();
  hullShape.moveTo(-1.1, -0.4);
  hullShape.lineTo(1.1, -0.4);
  hullShape.lineTo(1.3, 0.2);
  hullShape.lineTo(0.9, 0.6);
  hullShape.lineTo(-0.9, 0.6);
  hullShape.lineTo(-1.3, 0.2);
  hullShape.closePath();

  const hullExtrudeSettings: THREE.ExtrudeGeometryOptions = {
    depth: 3.2,
    bevelEnabled: true,
    bevelSegments: 4,
    steps: 1,
    bevelSize: 0.12,
    bevelThickness: 0.12,
  };
  const hullGeo = new THREE.ExtrudeGeometry(hullShape, hullExtrudeSettings);
  hullGeo.center();
  const hullMesh = new THREE.Mesh(hullGeo, materials.primaryBodyMaterial);
  hullMesh.castShadow = true;
  hullMesh.receiveShadow = true;
  hullGroup.add(hullMesh);

  // Armor side trim strips (accent)
  const trimGeo = new THREE.BoxGeometry(2.8, 0.1, 3.4);
  const trimMesh = new THREE.Mesh(trimGeo, materials.darkStructuralMaterial);
  trimMesh.position.y = -0.15;
  hullGroup.add(trimMesh);

  registerPart(
    'chassis_hull',
    'Monocoque Armor Chassis',
    'chassis',
    'Multi-layer cellular titanium honeycomb chassis with ceramic ballistic armor plating.',
    'Ti-6Al-4V Grade 5 & Kevlar-Phenolic Core',
    340,
    '±0.05 mm',
    hullGroup,
    new THREE.Vector3(0, 0, 0),
    0
  );

  // 2. Cockpit / Pressurized Canopy
  const canopyGroup = new THREE.Group();
  canopyGroup.position.set(0, 1.85, 0.6);

  const glassGeo = new THREE.CylinderGeometry(0.7, 0.85, 0.8, 16, 1, false, 0, Math.PI);
  glassGeo.rotateZ(Math.PI / 2);
  const glassMesh = new THREE.Mesh(glassGeo, materials.glassMaterial);
  canopyGroup.add(glassMesh);

  const canopyFrameGeo = new THREE.TorusGeometry(0.78, 0.04, 8, 24, Math.PI);
  const canopyFrame = new THREE.Mesh(canopyFrameGeo, materials.darkStructuralMaterial);
  canopyFrame.rotation.y = Math.PI / 2;
  canopyGroup.add(canopyFrame);

  registerPart(
    'pressurized_canopy',
    'Sapphire Nav Canopy',
    'structure',
    'Chemically toughened laminated sapphire panoramic dome with HUD projection coatings.',
    'Optically Pure Al2O3 Sapphire',
    45,
    'Optical λ/4',
    canopyGroup,
    new THREE.Vector3(0, 1.8, 1.2),
    1.6,
    new THREE.Euler(-0.2, 0, 0)
  );

  // 3. Sensor Mast & Pan-Tilt Turret
  const mastGroup = new THREE.Group();
  mastGroup.position.set(0.65, 1.9, -0.6);

  const mastPillarGeo = new THREE.CylinderGeometry(0.06, 0.08, 1.3, 16);
  const mastPillar = new THREE.Mesh(mastPillarGeo, materials.darkStructuralMaterial);
  mastPillar.position.y = 0.65;
  mastGroup.add(mastPillar);

  const mastHead = new THREE.Group();
  mastHead.name = 'MastHead';
  mastHead.position.set(0, 1.35, 0);

  const turretHousingGeo = new THREE.BoxGeometry(0.4, 0.25, 0.35);
  const turretHousing = new THREE.Mesh(turretHousingGeo, materials.primaryBodyMaterial);
  mastHead.add(turretHousing);

  // Twin LiDAR / Camera lenses
  const lensGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.1, 16);
  lensGeo.rotateX(Math.PI / 2);
  const lensLeft = new THREE.Mesh(lensGeo, materials.rubyBearingMaterial);
  lensLeft.position.set(-0.12, 0.02, 0.18);
  const lensRight = new THREE.Mesh(lensGeo, materials.rubyBearingMaterial);
  lensRight.position.set(0.12, 0.02, 0.18);
  mastHead.add(lensLeft, lensRight);

  mastGroup.add(mastHead);

  registerPart(
    'sensor_mast',
    'Pan-Tilt Multispectral Mast',
    'optics',
    'Autonomous stereoscopic terrain navigation mast with 3D flash LiDAR and thermal infrared cameras.',
    'Carbon-Titanium Composite & Germanium Lenses',
    22,
    '±0.01 mm',
    mastGroup,
    new THREE.Vector3(0.6, 2.2, -0.4),
    1.8,
    new THREE.Euler(0.2, 0.4, 0)
  );

  // 4. Parabolic Comms Antenna Dish (Lathe geometry)
  const dishGroup = new THREE.Group();
  dishGroup.position.set(-0.65, 1.9, -0.7);

  const dishPoints: THREE.Vector2[] = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    dishPoints.push(new THREE.Vector2(t * 0.55, Math.pow(t, 2) * 0.25));
  }
  const dishGeo = new THREE.LatheGeometry(dishPoints, 24);
  const dishMesh = new THREE.Mesh(dishGeo, materials.goldMaterial);
  dishMesh.rotation.x = Math.PI / 4;
  dishMesh.castShadow = true;
  dishGroup.add(dishMesh);

  const feedhornGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.35, 8);
  const feedhorn = new THREE.Mesh(feedhornGeo, materials.bluedSteelMaterial);
  feedhorn.position.set(0, 0.2, 0.2);
  feedhorn.rotation.x = Math.PI / 4;
  dishGroup.add(feedhorn);

  registerPart(
    'high_gain_antenna',
    'Deep-Space High-Gain Dish',
    'optics',
    'Ka-band parabolic dish with gold-plated reflective mesh for planetary relay links.',
    'Electroformed 24K Au over Carbon Mesh',
    18,
    '±0.02 mm',
    dishGroup,
    new THREE.Vector3(-0.8, 2.0, -0.6),
    1.7,
    new THREE.Euler(0, -0.5, 0.2)
  );

  // 5. Dual Solar Array Wings
  const solarTex = createSolarCellTexture();
  const solarMat = new THREE.MeshStandardMaterial({
    map: solarTex,
    roughness: 0.15,
    metalness: 0.75,
  });

  const leftSolarWing = new THREE.Group();
  leftSolarWing.position.set(-1.45, 1.25, 0);
  const leftPanelGeo = new THREE.BoxGeometry(1.6, 0.05, 2.6);
  leftPanelGeo.center();
  const leftPanelMesh = new THREE.Mesh(leftPanelGeo, solarMat);
  leftPanelMesh.position.set(-0.8, 0, 0);
  leftPanelMesh.castShadow = true;
  leftSolarWing.add(leftPanelMesh);

  // Gold foil backing
  const foilGeo = new THREE.PlaneGeometry(1.58, 2.58);
  const foilMesh = new THREE.Mesh(foilGeo, materials.goldMaterial);
  foilMesh.rotation.x = Math.PI / 2;
  foilMesh.position.set(-0.8, -0.028, 0);
  leftSolarWing.add(foilMesh);

  registerPart(
    'solar_array_port',
    'Port Photovoltaic Array',
    'power',
    'Triple-junction gallium arsenide (GaAs) space-grade high-efficiency solar panel with gold foil thermal shielding.',
    'GaAs / InGaP Multi-Junction Photovoltaics',
    35,
    '±0.1 mm',
    leftSolarWing,
    new THREE.Vector3(-2.2, 0.8, 0),
    2.0,
    new THREE.Euler(0, 0, 0.3)
  );

  const rightSolarWing = new THREE.Group();
  rightSolarWing.position.set(1.45, 1.25, 0);
  const rightPanelMesh = leftPanelMesh.clone();
  rightPanelMesh.position.set(0.8, 0, 0);
  rightSolarWing.add(rightPanelMesh);
  const rightFoil = foilMesh.clone();
  rightFoil.position.set(0.8, -0.028, 0);
  rightSolarWing.add(rightFoil);

  registerPart(
    'solar_array_starboard',
    'Starboard Photovoltaic Array',
    'power',
    'Symmetric high-efficiency solar harvesting wing with auto-tracking gimbal actuator.',
    'GaAs / InGaP Multi-Junction Photovoltaics',
    35,
    '±0.1 mm',
    rightSolarWing,
    new THREE.Vector3(2.2, 0.8, 0),
    2.0,
    new THREE.Euler(0, 0, -0.3)
  );

  // 6. Nuclear RTG Power Core (Rear)
  const rtgGroup = new THREE.Group();
  rtgGroup.position.set(0, 1.05, -1.9);

  const rtgCylinderGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.9, 16);
  rtgCylinderGeo.rotateX(Math.PI / 2);
  const rtgCore = new THREE.Mesh(rtgCylinderGeo, materials.darkStructuralMaterial);
  rtgGroup.add(rtgCore);

  // Cooling fins
  for (let f = 0; f < 8; f++) {
    const angle = (f * Math.PI) / 4;
    const finGeo = new THREE.BoxGeometry(0.04, 0.35, 0.85);
    const fin = new THREE.Mesh(finGeo, materials.primaryBodyMaterial);
    fin.position.set(Math.cos(angle) * 0.42, Math.sin(angle) * 0.42, 0);
    fin.rotation.z = angle;
    rtgGroup.add(fin);
  }

  // Emissive thermal core ring
  const ringGeo = new THREE.TorusGeometry(0.25, 0.03, 12, 24);
  const ring = new THREE.Mesh(ringGeo, materials.emissiveIonMaterial);
  ring.position.z = 0.46;
  rtgGroup.add(ring);

  registerPart(
    'rtg_power_core',
    'Radioisotope Core (RTG)',
    'power',
    'General-purpose heat source radioisotope thermoelectric generator providing continuous 2.4 kW thermal output.',
    'Pu-238 Ceramic Dioxide & Si-Ge Thermocouples',
    78,
    '±0.02 mm',
    rtgGroup,
    new THREE.Vector3(0, 0.2, -2.2),
    1.9,
    new THREE.Euler(-0.3, 0, 0)
  );

  // 7. Front Searchlight & Halogen Rig
  const lightsGroup = new THREE.Group();
  lightsGroup.position.set(0, 0.85, 1.7);

  const lightBarGeo = new THREE.BoxGeometry(1.6, 0.12, 0.15);
  const lightBar = new THREE.Mesh(lightBarGeo, materials.darkStructuralMaterial);
  lightsGroup.add(lightBar);

  for (let l = -2; l <= 2; l++) {
    if (l === 0) continue;
    const spotGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.08, 16);
    spotGeo.rotateX(Math.PI / 2);
    const spot = new THREE.Mesh(spotGeo, materials.emissiveWarmMaterial);
    spot.position.set(l * 0.32, 0, 0.06);
    lightsGroup.add(spot);
  }

  registerPart(
    'searchlight_rig',
    'Extreme-Environment Luminaire',
    'optics',
    'Quad high-lumen sealed solid-state halogen/LED luminaires for polar and shadow-crater exploration.',
    'Tempered Quartz & Anodized Heat Sink',
    14,
    '±0.1 mm',
    lightsGroup,
    new THREE.Vector3(0, -0.4, 2.0),
    1.5
  );

  // 8. Rocker-Bogie Suspension Linkages (Port & Starboard)
  const suspensionGroup = new THREE.Group();
  suspensionGroup.position.set(0, 0.65, 0);

  const strutMat = materials.darkStructuralMaterial;
  const strutGeo = new THREE.CylinderGeometry(0.07, 0.07, 2.8, 12);
  strutGeo.rotateX(Math.PI / 2);

  const leftStrut = new THREE.Mesh(strutGeo, strutMat);
  leftStrut.position.set(-1.35, 0, 0);
  const rightStrut = new THREE.Mesh(strutGeo, strutMat);
  rightStrut.position.set(1.35, 0, 0);
  suspensionGroup.add(leftStrut, rightStrut);

  // Differential crossbar
  const crossbarGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.7, 12);
  crossbarGeo.rotateZ(Math.PI / 2);
  const crossbar = new THREE.Mesh(crossbarGeo, materials.primaryBodyMaterial);
  crossbar.position.set(0, 0.3, 0);
  suspensionGroup.add(crossbar);

  registerPart(
    'suspension_linkage',
    'Rocker-Bogie Differential',
    'kinematics',
    'Passive articulated kinematic suspension mechanism ensuring all 6 wheels maintain equal ground contact across rough boulders.',
    'Titanium Grade 5 Seamless Extrusion',
    88,
    '±0.03 mm',
    suspensionGroup,
    new THREE.Vector3(0, -0.6, 0),
    1.2
  );

  // 9. Six Articulated Drive Wheels (Port & Starboard: Front, Middle, Rear)
  const wheelGroups: THREE.Group[] = [];
  const wheelGroupAll = new THREE.Group();
  wheelGroupAll.position.set(0, 0.45, 0);

  const wheelPositions = [
    { x: -1.65, z: 1.3, id: 'wheel_fl', name: 'Front-Port Drive Wheel', side: 'left' },
    { x: -1.75, z: 0.0, id: 'wheel_ml', name: 'Mid-Port Drive Wheel', side: 'left' },
    { x: -1.65, z: -1.3, id: 'wheel_rl', name: 'Rear-Port Drive Wheel', side: 'left' },
    { x: 1.65, z: 1.3, id: 'wheel_fr', name: 'Front-Starboard Drive Wheel', side: 'right' },
    { x: 1.75, z: 0.0, id: 'wheel_mr', name: 'Mid-Starboard Drive Wheel', side: 'right' },
    { x: 1.65, z: -1.3, id: 'wheel_rr', name: 'Rear-Starboard Drive Wheel', side: 'right' },
  ];

  wheelPositions.forEach((wp) => {
    const wGroup = new THREE.Group();
    wGroup.position.set(wp.x, 0, wp.z);

    // Rubber chevron tire
    const tireGeo = new THREE.CylinderGeometry(0.44, 0.44, 0.36, 24);
    tireGeo.rotateZ(Math.PI / 2);
    const tire = new THREE.Mesh(tireGeo, materials.rubberTreadMaterial);
    tire.castShadow = true;
    wGroup.add(tire);

    // Beveled alloy rim hub
    const rimGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.38, 16);
    rimGeo.rotateZ(Math.PI / 2);
    const rim = new THREE.Mesh(rimGeo, materials.primaryBodyMaterial);
    wGroup.add(rim);

    // Center planetary cap in gold
    const capGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.42, 12);
    capGeo.rotateZ(Math.PI / 2);
    const cap = new THREE.Mesh(capGeo, materials.goldMaterial);
    wGroup.add(cap);

    wheelGroups.push(wGroup);
    wheelGroupAll.add(wGroup);
  });

  registerPart(
    'traction_wheels',
    'Hex-Wheel Planetary Drive Array',
    'propulsion',
    'Six independent in-hub brushless DC motors with planetary gearboxes and grooved aggressive Martian grousers.',
    'Forged Al-Li 2099 & High-Grip Synthetic Elastomer',
    115,
    '±0.04 mm',
    wheelGroupAll,
    new THREE.Vector3(0, -0.7, 0),
    1.4
  );

  // 10. Auxiliary Rear RCS Maneuver Bells
  const rcsGroup = new THREE.Group();
  rcsGroup.position.set(0, 0.6, -2.1);

  for (let s of [-0.5, 0.5]) {
    const nozzlePoints: THREE.Vector2[] = [
      new THREE.Vector2(0.06, 0),
      new THREE.Vector2(0.08, 0.1),
      new THREE.Vector2(0.18, 0.35),
    ];
    const nozzleGeo = new THREE.LatheGeometry(nozzlePoints, 16);
    nozzleGeo.rotateX(Math.PI / 2);
    const nozzle = new THREE.Mesh(nozzleGeo, materials.bluedSteelMaterial);
    nozzle.position.set(s, 0, 0);

    const plumeGeo = new THREE.ConeGeometry(0.12, 0.25, 12);
    plumeGeo.rotateX(-Math.PI / 2);
    const plume = new THREE.Mesh(plumeGeo, materials.emissiveIonMaterial);
    plume.position.set(s, 0, -0.2);
    rcsGroup.add(nozzle, plume);
  }

  registerPart(
    'rcs_attitude_nozzles',
    'Auxiliary Reaction Control Bells',
    'propulsion',
    'Pressurized cold-gas hydrazine pulsed thrusters for low-gravity slope stabilization and descent cushioning.',
    'Niobium Alloy C-103 with Disilicide Coating',
    16,
    '±0.02 mm',
    rcsGroup,
    new THREE.Vector3(0, -0.3, -1.8),
    1.5
  );

  // Animation controller
  let currentExplosion = 0;
  let targetExplosion = 0;

  function animate(dt: number, time: number, speedMultiplier: number) {
    const effectiveDt = Math.min(dt, 0.1);

    // Smoothly damp explosion transitions
    currentExplosion = damp(currentExplosion, targetExplosion, 5.0, effectiveDt);

    // Update positions and rotations based on current explosion progress
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

    // Kinematics: wheels rotate
    const wheelRotSpeed = 1.8 * speedMultiplier;
    wheelGroups.forEach((w) => {
      w.rotation.x += wheelRotSpeed * effectiveDt;
    });

    // Mast pan-tilt subtle radar sweep
    const mastHeadObj = mastGroup.getObjectByName('MastHead');
    if (mastHeadObj) {
      mastHeadObj.rotation.y = Math.sin(time * 0.8 * speedMultiplier) * 0.75;
      mastHeadObj.rotation.x = Math.sin(time * 0.4 * speedMultiplier) * 0.15;
    }

    // Subtle chassis roll/pitch suspension float
    if (currentExplosion < 0.1) {
      hullGroup.position.y = 1.1 + Math.sin(time * 2.0 * speedMultiplier) * 0.02;
      hullGroup.rotation.z = Math.sin(time * 1.2 * speedMultiplier) * 0.015;
    } else {
      hullGroup.position.y = 1.1;
      hullGroup.rotation.z = 0;
    }
  }

  function setExplosionProgress(progress: number) {
    targetExplosion = Math.max(0, Math.min(1, progress));
  }

  function dispose() {
    shadowGeo.dispose();
    shadowTex.dispose();
    shadowMat.dispose();
    solarTex.dispose();
    solarMat.dispose();
  }

  return {
    id: 'rover',
    name: 'Aero-Rover MK-IV',
    subtitle: 'Deep-Space Planetary Exploration Rover',
    category: 'Exo-Planetary Robotics',
    group: rootGroup,
    parts,
    contactShadow,
    animate,
    setExplosionProgress,
    dispose,
  };
}
