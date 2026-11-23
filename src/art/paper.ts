// Procedural wasli paper: layered value noise for the grain, faint fibres, and
// foxing (brown age spots) gathering toward the edges. Everything is generated at
// runtime; there are no image assets.

import { mulberry } from './util';

export interface PaperOptions {
  width: number;
  height: number;
  base?: [number, number, number];
  seed?: number;
  foxing?: number; // 0..1
  fibres?: number;
  vignette?: number; // 0..1
}

function valueNoise(w: number, h: number, cell: number, rnd: () => number): Float32Array {
  const gw = Math.ceil(w / cell) + 2;
  const gh = Math.ceil(h / cell) + 2;
  const grid = new Float32Array(gw * gh);
  for (let i = 0; i < grid.length; i++) grid[i] = rnd();
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    const gy = y / cell;
    const y0 = Math.floor(gy);
    const fy = gy - y0;
    const sy = fy * fy * (3 - 2 * fy);
    for (let x = 0; x < w; x++) {
      const gx = x / cell;
      const x0 = Math.floor(gx);
      const fx = gx - x0;
      const sx = fx * fx * (3 - 2 * fx);
      const a = grid[y0 * gw + x0],
        b = grid[y0 * gw + x0 + 1],
        c = grid[(y0 + 1) * gw + x0],
        d = grid[(y0 + 1) * gw + x0 + 1];
      out[y * w + x] = a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
    }
  }
  return out;
}

export function makePaperCanvas(o: PaperOptions): HTMLCanvasElement {
  const { width: w, height: h } = o;
  const base = o.base ?? [242, 230, 201];
  const rnd = mulberry(o.seed ?? 7);
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext('2d')!;
  const img = ctx.createImageData(w, h);
  const n1 = valueNoise(w, h, 64, rnd);
  const n2 = valueNoise(w, h, 16, rnd);
  const n3 = valueNoise(w, h, 4, rnd);
  const vig = o.vignette ?? 0.35;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const grain = (n1[i] - 0.5) * 14 + (n2[i] - 0.5) * 9 + (n3[i] - 0.5) * 7 + (rnd() - 0.5) * 6;
      const dx = (x / w - 0.5) * 2,
        dy = (y / h - 0.5) * 2;
      const edge = Math.pow(Math.min(1, Math.max(Math.abs(dx), Math.abs(dy))), 6) * 40 * vig + (dx * dx + dy * dy) * 10 * vig;
      const k = i * 4;
      img.data[k] = Math.max(0, Math.min(255, base[0] + grain - edge * 0.8));
      img.data[k + 1] = Math.max(0, Math.min(255, base[1] + grain - edge * 1.0));
      img.data[k + 2] = Math.max(0, Math.min(255, base[2] + grain * 0.9 - edge * 1.3));
      img.data[k + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  // Fibres: short faint curved strokes.
  const fibres = o.fibres ?? Math.round((w * h) / 9000);
  ctx.lineCap = 'round';
  for (let f = 0; f < fibres; f++) {
    const x = rnd() * w,
      y = rnd() * h;
    const len = 6 + rnd() * 22;
    const ang = rnd() * Math.PI * 2;
    ctx.strokeStyle = rnd() < 0.5 ? 'rgba(120,95,55,0.10)' : 'rgba(255,250,235,0.20)';
    ctx.lineWidth = 0.6 + rnd() * 0.6;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + Math.cos(ang + 0.6) * len * 0.5, y + Math.sin(ang + 0.6) * len * 0.5, x + Math.cos(ang) * len, y + Math.sin(ang) * len);
    ctx.stroke();
  }
  // Foxing: soft brown spots, more numerous near the edges.
  const fox = Math.round(((o.foxing ?? 0.5) * (w * h)) / 25000);
  for (let f = 0; f < fox; f++) {
    let x = rnd() * w,
      y = rnd() * h;
    if (rnd() < 0.7) {
      // pull toward an edge
      if (rnd() < 0.5) x = rnd() < 0.5 ? rnd() * w * 0.12 : w - rnd() * w * 0.12;
      else y = rnd() < 0.5 ? rnd() * h * 0.12 : h - rnd() * h * 0.12;
    }
    const r = 2 + rnd() * 9;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(150,100,45,${0.10 + rnd() * 0.12})`);
    g.addColorStop(0.6, 'rgba(160,110,55,0.05)');
    g.addColorStop(1, 'rgba(160,110,55,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  return cv;
}

let cachedUrl: string | null = null;
/** A tileable-ish paper texture for CSS backgrounds (cached). */
export function paperDataUrl(): string {
  if (cachedUrl) return cachedUrl;
  const cv = makePaperCanvas({ width: 512, height: 512, seed: 11, foxing: 0.15, vignette: 0 });
  cachedUrl = cv.toDataURL('image/png');
  return cachedUrl;
}
