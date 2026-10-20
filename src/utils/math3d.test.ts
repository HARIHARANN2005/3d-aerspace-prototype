import test from 'node:test';
import assert from 'node:assert/strict';
import {
  damp,
  dampVector3,
  calculateExplodedPosition,
  calculateExplodedRotation,
  clamp,
  smoothstep,
} from './math3d.ts';

test('damp approaches target smoothly over time', () => {
  const current = 0;
  const target = 10;
  const lambda = 4;
  const dt = 0.016; // ~60fps
  const next = damp(current, target, lambda, dt);
  assert.ok(next > current);
  assert.ok(next < target);

  // Over a large dt it should be virtually equal to target
  const settled = damp(current, target, lambda, 5.0);
  assert.ok(Math.abs(settled - target) < 1e-4);
});

test('dampVector3 damps all three components', () => {
  const current = { x: 0, y: 10, z: -5 };
  const target = { x: 10, y: 0, z: 5 };
  const res = dampVector3(current, target, 5, 0.1);
  assert.ok(res.x > 0 && res.x < 10);
  assert.ok(res.y < 10 && res.y > 0);
  assert.ok(res.z > -5 && res.z < 5);
});

test('calculateExplodedPosition scales along direction vector', () => {
  const base = { x: 1, y: 2, z: 3 };
  const dir = { x: 0, y: 1, z: 0 };
  const multiplier = 4;

  const pos0 = calculateExplodedPosition(base, dir, multiplier, 0);
  assert.deepEqual(pos0, base);

  const posHalf = calculateExplodedPosition(base, dir, multiplier, 0.5);
  assert.deepEqual(posHalf, { x: 1, y: 4, z: 3 });

  const posFull = calculateExplodedPosition(base, dir, multiplier, 1.0);
  assert.deepEqual(posFull, { x: 1, y: 6, z: 3 });

  // Clamps out of range progress
  const posOver = calculateExplodedPosition(base, dir, multiplier, 1.5);
  assert.deepEqual(posOver, { x: 1, y: 6, z: 3 });
});

test('calculateExplodedRotation handles optional deltas', () => {
  const base = { x: 0, y: 0, z: 0 };
  const delta = { x: Math.PI / 4, y: 0, z: 0 };

  const rot0 = calculateExplodedRotation(base, delta, 0);
  assert.deepEqual(rot0, base);

  const rotFull = calculateExplodedRotation(base, delta, 1);
  assert.deepEqual(rotFull, delta);

  const rotNone = calculateExplodedRotation(base, undefined, 0.5);
  assert.deepEqual(rotNone, base);
});

test('clamp and smoothstep behave correctly', () => {
  assert.equal(clamp(15, 0, 10), 10);
  assert.equal(clamp(-5, 0, 10), 0);
  assert.equal(clamp(5, 0, 10), 5);

  assert.equal(smoothstep(0, 1, 0), 0);
  assert.equal(smoothstep(0, 1, 1), 1);
  assert.equal(smoothstep(0, 1, 0.5), 0.5);
});
