/**
 * Pure 3D math and kinematics calculations for procedural models,
 * exploded views, and camera transitions.
 */

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface PartExplosionConfig {
  id: string;
  name: string;
  direction: Vector3D;
  distanceMultiplier: number;
  rotationDelta?: Vector3D;
}

/**
 * Frame-rate independent exponential damping.
 * Matches: 1 - Math.exp(-lambda * dt)
 */
export function damp(current: number, target: number, lambda: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

/**
 * Frame-rate independent exponential damping for 3D coordinates.
 */
export function dampVector3(
  current: Vector3D,
  target: Vector3D,
  lambda: number,
  dt: number
): Vector3D {
  return {
    x: damp(current.x, target.x, lambda, dt),
    y: damp(current.y, target.y, lambda, dt),
    z: damp(current.z, target.z, lambda, dt),
  };
}

/**
 * Calculates the exploded position of a part given its base position,
 * its explosion vector, and the normalized explosion progress (0.0 to 1.0).
 */
export function calculateExplodedPosition(
  basePosition: Vector3D,
  direction: Vector3D,
  multiplier: number,
  progress: number
): Vector3D {
  const clampedProgress = Math.max(0, Math.min(1, progress));
  return {
    x: basePosition.x + direction.x * multiplier * clampedProgress,
    y: basePosition.y + direction.y * multiplier * clampedProgress,
    z: basePosition.z + direction.z * multiplier * clampedProgress,
  };
}

/**
 * Calculates current rotation with optional exploded flare rotation.
 */
export function calculateExplodedRotation(
  baseRotation: Vector3D,
  rotDelta: Vector3D | undefined,
  progress: number
): Vector3D {
  if (!rotDelta) return { ...baseRotation };
  const clampedProgress = Math.max(0, Math.min(1, progress));
  return {
    x: baseRotation.x + rotDelta.x * clampedProgress,
    y: baseRotation.y + rotDelta.y * clampedProgress,
    z: baseRotation.z + rotDelta.z * clampedProgress,
  };
}

/**
 * Clamps a number between min and max.
 */
export function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}

/**
 * Interpolates smoothly between 0 and 1 using hermite smoothstep.
 */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}
