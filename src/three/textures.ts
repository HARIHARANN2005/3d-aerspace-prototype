import * as THREE from 'three';

/**
 * Procedural texture generators using HTML5 2D Canvas.
 * 100% zero-dependency, zero-404, high-fidelity PBR maps.
 */

export function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2
  );
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
  gradient.addColorStop(0.3, 'rgba(0, 0, 0, 0.55)');
  gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.18)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createBrushedMetalTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  // Micro-scratches along horizontal axis
  for (let y = 0; y < size; y++) {
    const val = 120 + Math.floor(Math.random() * 25);
    ctx.strokeStyle = `rgb(${val}, ${val}, ${val})`;
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(size, y + 0.5);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}

export function createCarbonFiberTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const tileSize = 16;
  ctx.fillStyle = '#111317';
  ctx.fillRect(0, 0, size, size);

  for (let y = 0; y < size; y += tileSize) {
    for (let x = 0; x < size; x += tileSize) {
      const isAlt = ((x / tileSize) + (y / tileSize)) % 2 === 0;
      ctx.fillStyle = isAlt ? '#1e222a' : '#14171d';
      ctx.fillRect(x, y, tileSize, tileSize);

      // Micro weave highlight
      ctx.strokeStyle = isAlt ? '#2d3340' : '#1a1d24';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + tileSize, y + tileSize);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 8);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createWatchDialTexture(maxAnisotropy: number = 4): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const center = size / 2;
  const radius = size * 0.46;

  // Background dark sunray circle
  const bgGrad = ctx.createRadialGradient(center, center, 10, center, center, radius);
  bgGrad.addColorStop(0, '#1c222e');
  bgGrad.addColorStop(0.7, '#11151c');
  bgGrad.addColorStop(1, '#090b0e');
  ctx.fillStyle = bgGrad;
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.fill();

  // Outer chapter ring
  ctx.strokeStyle = '#c5a059'; // Polished gold trim
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(center, center, radius - 6, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = '#5a6275';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(center, center, radius - 30, 0, Math.PI * 2);
  ctx.stroke();

  // 60 minute ticks and 12 hour baton markers
  for (let i = 0; i < 60; i++) {
    const angle = (i * Math.PI) / 30 - Math.PI / 2;
    const isHour = i % 5 === 0;
    const innerR = isHour ? radius - 36 : radius - 20;
    const outerR = radius - 10;

    const x1 = center + Math.cos(angle) * innerR;
    const y1 = center + Math.sin(angle) * innerR;
    const x2 = center + Math.cos(angle) * outerR;
    const y2 = center + Math.sin(angle) * outerR;

    ctx.strokeStyle = isHour ? '#e6c888' : '#7b879d';
    ctx.lineWidth = isHour ? 4 : 1.5;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // Dial typography
  ctx.fillStyle = '#e6c888';
  ctx.font = 'bold 36px "SF Pro Display", -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('CHRONO', center, center - 130);

  ctx.font = '600 22px "SF Pro Display", -apple-system, sans-serif';
  ctx.fillStyle = '#8ea1b8';
  ctx.fillText('TOURBILLON 3000', center, center - 98);

  ctx.font = '600 18px monospace';
  ctx.fillStyle = '#64748b';
  ctx.fillText('CALIBRE CH-99 // 28,800 VPH', center, center + 140);
  ctx.fillText('SWISS CRAFTED', center, center + 170);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  return texture;
}

export function createSolarCellTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Deep navy metallic base
  ctx.fillStyle = '#0f1c3f';
  ctx.fillRect(0, 0, size, size);

  // Solar wafer grid (4x4 cells)
  const cellSize = size / 4;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const x = c * cellSize;
      const y = r * cellSize;

      ctx.fillStyle = '#142554';
      ctx.fillRect(x + 2, y + 2, cellSize - 4, cellSize - 4);

      // Micro busbars (silver conductor lines)
      ctx.strokeStyle = '#82aaff';
      ctx.lineWidth = 1;
      for (let bus = 8; bus < cellSize - 8; bus += 12) {
        ctx.beginPath();
        ctx.moveTo(x + 4, y + bus);
        ctx.lineTo(x + cellSize - 4, y + bus);
        ctx.stroke();
      }

      ctx.strokeStyle = '#c5d8ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + cellSize / 3, y + 2);
      ctx.lineTo(x + cellSize / 3, y + cellSize - 2);
      ctx.moveTo(x + (2 * cellSize) / 3, y + 2);
      ctx.lineTo(x + (2 * cellSize) / 3, y + cellSize - 2);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
