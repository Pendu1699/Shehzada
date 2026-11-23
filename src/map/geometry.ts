// Geometry helpers for the renderer.

export type Pt = [number, number];

export function polyPoints(flat: number[]): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < flat.length; i += 2) out.push([flat[i], flat[i + 1]]);
  return out;
}

export function pointInPoly(x: number, y: number, flat: number[]): boolean {
  let inside = false;
  for (let i = 0, j = flat.length - 2; i < flat.length; j = i, i += 2) {
    const xi = flat[i],
      yi = flat[i + 1],
      xj = flat[j],
      yj = flat[j + 1];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export function bbox(flat: number[]): { x0: number; y0: number; x1: number; y1: number } {
  let x0 = Infinity,
    y0 = Infinity,
    x1 = -Infinity,
    y1 = -Infinity;
  for (let i = 0; i < flat.length; i += 2) {
    x0 = Math.min(x0, flat[i]);
    x1 = Math.max(x1, flat[i]);
    y0 = Math.min(y0, flat[i + 1]);
    y1 = Math.max(y1, flat[i + 1]);
  }
  return { x0, y0, x1, y1 };
}

/** Catmull–Rom spline through points, sampled `seg` times per span. */
export function smoothLine(pts: Pt[], seg = 8): Pt[] {
  if (pts.length < 3) return pts;
  const out: Pt[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)],
      p1 = pts[i],
      p2 = pts[i + 1],
      p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let t = 0; t < seg; t++) {
      const u = t / seg,
        u2 = u * u,
        u3 = u2 * u;
      out.push([
        0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * u + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * u2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * u3),
        0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * u + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * u2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * u3),
      ]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

/** Add a gentle meander to a sampled line. */
export function meander(pts: Pt[], amp: number, freq: number, seed: number): Pt[] {
  return pts.map((p, i) => {
    if (i === 0 || i === pts.length - 1) return p;
    const a = pts[i - 1],
      b = pts[i + 1];
    const dx = b[0] - a[0],
      dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len,
      ny = dx / len;
    const off = Math.sin(i * freq + seed) * amp + Math.sin(i * freq * 2.7 + seed * 1.3) * amp * 0.4;
    return [p[0] + nx * off, p[1] + ny * off];
  });
}

export function lineLength(pts: Pt[]): number {
  let l = 0;
  for (let i = 1; i < pts.length; i++) l += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return l;
}
