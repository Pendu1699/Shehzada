// Painted glyphs for the map, drawn with Pixi Graphics in a flat miniature manner:
// forts, towns, sacred sites, trees, hills and fields.

import { Graphics } from 'pixi.js';

const INK = 0x1b1712;

// The soldiers themselves are drawn in ./soldiers.ts, dressed by army.

/** A painted fort: crenellated walls and towers, sized by level (1..5). */
export function drawFort(g: Graphics, x: number, y: number, level: number, wall = 0xc58f5a, desecrated = false) {
  const s = 0.7 + level * 0.18;
  const w = 12 * s,
    h = 7 * s;
  const shade = desecrated ? 0x6f6a62 : wall;
  g.ellipse(x, y + 1, w * 0.9, 2.2 * s).fill({ color: 0x2a2014, alpha: 0.22 });
  g.rect(x - w / 2, y - h, w, h).fill(shade).stroke({ width: 0.8, color: INK, alpha: 0.7 });
  // merlons
  const n = 4 + level;
  for (let i = 0; i < n; i++) {
    const mx = x - w / 2 + (i + 0.25) * (w / n);
    g.rect(mx, y - h - 1.6 * s, (w / n) * 0.5, 1.6 * s).fill(shade);
  }
  // towers
  for (const tx of [x - w / 2, x + w / 2]) {
    g.rect(tx - 2.2 * s, y - h - 3 * s, 4.4 * s, h + 3 * s).fill(shade).stroke({ width: 0.7, color: INK, alpha: 0.7 });
    g.ellipse(tx, y - h - 3 * s, 2.6 * s, 1.3 * s).fill(desecrated ? 0x4f4a42 : 0xb83a2b);
  }
  // gate
  g.moveTo(x - 1.8 * s, y).lineTo(x - 1.8 * s, y - h * 0.5).arc(x, y - h * 0.5, 1.8 * s, Math.PI, 0).lineTo(x + 1.8 * s, y).closePath().fill(0x3a2a1a);
  if (level >= 4) {
    g.rect(x - 2.5 * s, y - h - 6 * s, 5 * s, 4 * s).fill(shade).stroke({ width: 0.6, color: INK, alpha: 0.6 });
    g.ellipse(x, y - h - 6 * s, 3 * s, 2 * s).fill(desecrated ? 0x4f4a42 : 0xe6c766);
  }
}

/** A small town glyph: a cluster of flat-roofed houses. */
export function drawTown(g: Graphics, x: number, y: number, s = 1) {
  g.rect(x - 4 * s, y - 3 * s, 3.4 * s, 3 * s).fill(0xe8d3a8).stroke({ width: 0.5, color: INK, alpha: 0.5 });
  g.rect(x - 0.4 * s, y - 4 * s, 3.8 * s, 4 * s).fill(0xdcc290).stroke({ width: 0.5, color: INK, alpha: 0.5 });
  g.rect(x + 3.6 * s, y - 2.4 * s, 2.6 * s, 2.4 * s).fill(0xe8d3a8).stroke({ width: 0.5, color: INK, alpha: 0.5 });
}

/** The Harmandir: a small gilded pavilion in the middle of the sarovar. */
export function drawHarmandir(g: Graphics, x: number, y: number, desecrated: boolean) {
  g.roundRect(x - 9, y - 4, 18, 8, 1.5).fill(desecrated ? 0x6d6a5c : 0x5e8c93).stroke({ width: 0.8, color: 0xf2e6c9 });
  g.rect(x - 0.6, y - 3.5, 1.2, 3).fill(0xf2e6c9);
  if (desecrated) {
    g.poly([x - 3, y - 1, x + 3, y - 1, x + 2, y - 4, x - 1, y - 2.5]).fill(0x5a5248);
    return;
  }
  g.rect(x - 3, y - 4, 6, 3.4).fill(0xc9a13b);
  g.ellipse(x, y - 4.4, 2.8, 2.2).fill(0xe6c766);
  g.moveTo(x, y - 6.6).lineTo(x, y - 8).stroke({ width: 0.5, color: 0xe6c766 });
}

export function drawNishanSahib(g: Graphics, x: number, y: number, s = 1) {
  g.moveTo(x, y).lineTo(x, y - 12 * s).stroke({ width: 0.8 * s, color: 0x5a3a1e });
  g.poly([x, y - 12 * s, x + 7 * s, y - 9.5 * s, x, y - 7 * s]).fill(0xe8870e);
}

export function drawMosque(g: Graphics, x: number, y: number) {
  g.rect(x - 4, y - 3, 8, 3).fill(0xf2e6c9).stroke({ width: 0.5, color: INK, alpha: 0.5 });
  g.ellipse(x, y - 3.4, 2.6, 2.4).fill(0xf2e6c9).stroke({ width: 0.5, color: INK, alpha: 0.5 });
  g.rect(x + 4.4, y - 7, 1.2, 7).fill(0xf2e6c9);
}

export function drawTemple(g: Graphics, x: number, y: number) {
  g.poly([x - 3.5, y, x + 3.5, y, x + 2.2, y - 5, x, y - 8, x - 2.2, y - 5]).fill(0xe8d3a8).stroke({ width: 0.5, color: INK, alpha: 0.5 });
  g.poly([x, y - 8, x + 2.5, y - 9.2, x, y - 10]).fill(0xb83a2b);
}

export function drawCrossedSwords(g: Graphics, x: number, y: number) {
  g.moveTo(x - 4, y + 4).lineTo(x + 4, y - 4).stroke({ width: 0.9, color: INK, alpha: 0.7 });
  g.moveTo(x + 4, y + 4).lineTo(x - 4, y - 4).stroke({ width: 0.9, color: INK, alpha: 0.7 });
}

/* ── Landscape decorations ──────────────────────────────────────────────── */

export function drawHill(g: Graphics, x: number, y: number, s: number, fill: number, pencil: boolean, mountain: boolean) {
  const h = (mountain ? 16 : 10) * s;
  const w = (mountain ? 14 : 13) * s;
  const path = [x - w, y, x - w * 0.55, y - h * 0.65, x - w * 0.1, y - h, x + w * 0.35, y - h * 0.8, x + w * 0.7, y - h * 0.45, x + w, y];
  if (pencil) {
    g.poly(path, false).stroke({ width: 0.6, color: 0x6b6257, alpha: 0.45 });
    return;
  }
  g.poly(path).fill(fill).stroke({ width: 0.7, color: 0x4a3a2a, alpha: 0.55 });
  // Pahari-style banded shading lines.
  g.moveTo(x - w * 0.5, y - h * 0.5).quadraticCurveTo(x - w * 0.1, y - h * 0.75, x + w * 0.3, y - h * 0.55).stroke({ width: 0.6, color: 0x4a3a2a, alpha: 0.3 });
  if (mountain) {
    g.poly([x - w * 0.25, y - h * 0.86, x - w * 0.1, y - h, x + w * 0.2, y - h * 0.85, x, y - h * 0.8]).fill({ color: 0xf2e6c9, alpha: 0.85 });
  } else {
    g.circle(x - w * 0.2, y - h * 0.95, 1.6 * s).fill(0x4f6b3a);
  }
}

export function drawTree(g: Graphics, x: number, y: number, s: number, kind: 'mango' | 'pipal' | 'kikar', pencil: boolean) {
  if (pencil) {
    g.circle(x, y - 5 * s, 3.4 * s).stroke({ width: 0.5, color: 0x6b6257, alpha: 0.4 });
    return;
  }
  g.moveTo(x, y).lineTo(x, y - 4 * s).stroke({ width: 1 * s, color: 0x5a3a1e });
  if (kind === 'mango') {
    g.ellipse(x, y - 6 * s, 4.2 * s, 3.6 * s).fill(0x3f5e2e).stroke({ width: 0.5, color: 0x24361a, alpha: 0.7 });
    g.circle(x - 1.4 * s, y - 7 * s, 1.2 * s).fill({ color: 0x6f8f4e, alpha: 0.8 });
  } else if (kind === 'pipal') {
    g.poly([x - 4.4 * s, y - 4 * s, x, y - 11 * s, x + 4.4 * s, y - 4 * s]).fill(0x4f6b3a).stroke({ width: 0.5, color: 0x24361a, alpha: 0.7 });
  } else {
    g.ellipse(x, y - 4.6 * s, 4.6 * s, 1.8 * s).fill(0x7a8a4a);
  }
}

export function drawField(g: Graphics, x: number, y: number, s: number, color: number, angle: number, pencil: boolean) {
  const w = 9 * s,
    h = 5 * s;
  const c = Math.cos(angle),
    sn = Math.sin(angle);
  const pt = (px: number, py: number) => [x + px * c - py * sn, y + px * sn + py * c];
  const poly = [...pt(-w / 2, -h / 2), ...pt(w / 2, -h / 2), ...pt(w / 2, h / 2), ...pt(-w / 2, h / 2)];
  if (pencil) {
    g.poly(poly).stroke({ width: 0.5, color: 0x6b6257, alpha: 0.35 });
    return;
  }
  g.poly(poly).fill({ color, alpha: 0.75 });
  for (let i = 1; i < 4; i++) {
    const a = pt(-w / 2, -h / 2 + (h * i) / 4),
      b = pt(w / 2, -h / 2 + (h * i) / 4);
    g.moveTo(a[0], a[1]).lineTo(b[0], b[1]).stroke({ width: 0.4, color: 0x6b5a2a, alpha: 0.4 });
  }
}

export function drawReeds(g: Graphics, x: number, y: number, s: number, pencil: boolean) {
  const col = pencil ? 0x6b6257 : 0x5e6b2e;
  for (let i = -2; i <= 2; i++) g.moveTo(x + i * 1.3 * s, y).quadraticCurveTo(x + i * 1.6 * s, y - 3 * s, x + i * 2.2 * s, y - (5 + Math.abs(i)) * s).stroke({ width: 0.6, color: col, alpha: pencil ? 0.35 : 0.8 });
}

export function drawDune(g: Graphics, x: number, y: number, s: number, pencil: boolean) {
  g.moveTo(x - 8 * s, y).quadraticCurveTo(x - 2 * s, y - 5 * s, x + 8 * s, y).stroke({ width: pencil ? 0.5 : 0.9, color: pencil ? 0x6b6257 : 0xa88a50, alpha: pencil ? 0.35 : 0.7 });
  if (!pencil) g.moveTo(x - 4 * s, y + 2.2 * s).quadraticCurveTo(x + 1 * s, y - 1.6 * s, x + 6 * s, y + 2.2 * s).stroke({ width: 0.6, color: 0xa88a50, alpha: 0.45 });
}

export function drawHut(g: Graphics, x: number, y: number, s: number, pencil: boolean) {
  if (pencil) {
    g.rect(x - 3 * s, y - 3 * s, 6 * s, 3 * s).stroke({ width: 0.5, color: 0x6b6257, alpha: 0.35 });
    return;
  }
  g.rect(x - 3 * s, y - 3 * s, 6 * s, 3 * s).fill(0xd8b98a).stroke({ width: 0.4, color: INK, alpha: 0.4 });
  g.poly([x - 3.6 * s, y - 3 * s, x, y - 5.4 * s, x + 3.6 * s, y - 3 * s]).fill(0x9a7a4a);
}
