/**
 * Generates src/data/generated/mapGeometry.json from the hand-authored region seats
 * (src/data/regions.ts) and river polylines (src/data/rivers.ts).
 *
 * Method (see PLAN.md §2):
 *   1. Rasterise barrier rivers onto a grid.
 *   2. Multi-source Dijkstra from every region seat; entering a river cell is costly,
 *      so borders snap to rivers and the doabs emerge.
 *   3. Cells beyond a terrain-dependent reach stay blank (the map's organic edge).
 *   4. Islands are merged into their neighbours, so every region is one piece.
 *   5. Borders are traced on the shared grid-vertex graph and Laplacian-smoothed once
 *      for all regions together, so neighbouring outlines match exactly with no gaps.
 *   6. Adjacency, river crossings and fords are read off the grid.
 *
 * Run: npm run build-map
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { REGIONS } from '../src/data/regions';
import { RIVERS, FORDS } from '../src/data/rivers';
import { project, WORLD_W, WORLD_H } from '../src/data/projection';

const CELL = 4;
const GW = Math.ceil(WORLD_W / CELL);
const GH = Math.ceil(WORLD_H / CELL);
const N = GW * GH;
const idx = (i: number, j: number) => j * GW + i;

// ── 1. Rivers ────────────────────────────────────────────────────────────────
const riverOf = new Int16Array(N).fill(-1);
const barrierRivers = RIVERS.map((r, k) => ({ ...r, k })).filter((r) => r.barrier);
for (const r of barrierRivers) {
  const pts = r.points.map(([la, lo]) => project(la, lo));
  for (let s = 0; s < pts.length - 1; s++) {
    const [x0, y0] = pts[s];
    const [x1, y1] = pts[s + 1];
    const len = Math.hypot(x1 - x0, y1 - y0);
    const steps = Math.ceil(len / 1);
    for (let t = 0; t <= steps; t++) {
      const x = x0 + ((x1 - x0) * t) / steps;
      const y = y0 + ((y1 - y0) * t) / steps;
      const rad = 4.6;
      for (let dj = -2; dj <= 2; dj++)
        for (let di = -2; di <= 2; di++) {
          const ci = Math.floor(x / CELL) + di;
          const cj = Math.floor(y / CELL) + dj;
          if (ci < 0 || cj < 0 || ci >= GW || cj >= GH) continue;
          const cx = (ci + 0.5) * CELL;
          const cy = (cj + 0.5) * CELL;
          if (Math.hypot(cx - x, cy - y) <= rad) riverOf[idx(ci, cj)] = r.k;
        }
    }
  }
}

// ── 2–3. Dijkstra flood ──────────────────────────────────────────────────────
const REACH: Record<string, number> = {
  plains: 150,
  bela: 150,
  jungle: 140,
  hills: 140,
  bar: 170,
  desert: 185,
  mountain: 130,
};
// Smooth deterministic wobble so the blank edge of the painting looks organic:
// each region's reach varies gently with the bearing from its seat.
const edgeNoise = (k: number, i: number, j: number, si: number, sj: number) => {
  const th = Math.atan2(j - sj, i - si);
  const ph = k * 1.618;
  return 0.97 + 0.07 * Math.sin(3 * th + ph) + 0.05 * Math.sin(5 * th + 2.3 * ph) + 0.03 * Math.sin(i * 0.31 + j * 0.27);
};
const seatCell: [number, number][] = REGIONS.map((r) => {
  const [x, y] = project(r.seat[0], r.seat[1]);
  return [Math.floor(x / CELL), Math.floor(y / CELL)];
});
const RIVER_COST = 40;

const label = new Int16Array(N).fill(-1);
const dist = new Float64Array(N).fill(Infinity);

class Heap {
  a: number[] = [];
  d: number[] = [];
  push(i: number, d: number) {
    const a = this.a,
      dd = this.d;
    a.push(i);
    dd.push(d);
    let c = a.length - 1;
    while (c > 0) {
      const p = (c - 1) >> 1;
      if (dd[p] <= dd[c]) break;
      [a[p], a[c]] = [a[c], a[p]];
      [dd[p], dd[c]] = [dd[c], dd[p]];
      c = p;
    }
  }
  pop(): [number, number] | undefined {
    const a = this.a,
      dd = this.d;
    if (!a.length) return undefined;
    const top: [number, number] = [a[0], dd[0]];
    const li = a.pop()!,
      ld = dd.pop()!;
    if (a.length) {
      a[0] = li;
      dd[0] = ld;
      let p = 0;
      for (;;) {
        const l = 2 * p + 1,
          r = l + 1;
        let m = p;
        if (l < a.length && dd[l] < dd[m]) m = l;
        if (r < a.length && dd[r] < dd[m]) m = r;
        if (m === p) break;
        [a[p], a[m]] = [a[m], a[p]];
        [dd[p], dd[m]] = [dd[m], dd[p]];
        p = m;
      }
    }
    return top;
  }
}

const heap = new Heap();
const wet = new Uint8Array(N); // 1 if the claiming path has entered a river from dry land
REGIONS.forEach((r, k) => {
  const [x, y] = project(r.seat[0], r.seat[1]);
  const i = Math.floor(x / CELL),
    j = Math.floor(y / CELL);
  const c = idx(i, j);
  dist[c] = 0;
  label[c] = k;
  heap.push(c, 0);
});
const NB8: [number, number, number][] = [
  [1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1],
  [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2],
];
for (let item = heap.pop(); item; item = heap.pop()) {
  const [c, d] = item;
  if (d > dist[c]) continue;
  const i = c % GW,
    j = (c / GW) | 0;
  const k = label[c];
  const reach = REACH[REGIONS[k].terrain] ?? 120;
  for (const [di, dj, w] of NB8) {
    const ni = i + di,
      nj = j + dj;
    if (ni < 0 || nj < 0 || ni >= GW || nj >= GH) continue;
    const n = idx(ni, nj);
    const [si, sj] = seatCell[k];
    const g = Math.hypot(ni - si, nj - sj) * CELL;
    if (g > reach * edgeNoise(k, ni, nj, si, sj)) continue;
    // Barrier rivers: a region may claim the river bed but never the far bank
    // (unless its seat stands on the river itself). No cutting corners past a river.
    const corner = di !== 0 && dj !== 0 && (riverOf[idx(ni, j)] >= 0 || riverOf[idx(i, nj)] >= 0);
    if (corner && riverOf[n] < 0 && riverOf[c] < 0) continue;
    if (wet[c] && riverOf[n] < 0) continue;
    const enterRiver = riverOf[n] >= 0 && riverOf[c] < 0;
    const nd = d + w * CELL + (enterRiver ? RIVER_COST : 0);
    if (nd < dist[n]) {
      dist[n] = nd;
      wet[n] = wet[c] || (enterRiver ? 1 : 0);
      label[n] = k;
      heap.push(n, nd);
    }
  }
}

// ── 4. Merge islands ─────────────────────────────────────────────────────────
function components(k: number): number[][] {
  const seen = new Uint8Array(N);
  const comps: number[][] = [];
  for (let c = 0; c < N; c++) {
    if (label[c] !== k || seen[c]) continue;
    const comp: number[] = [];
    const stack = [c];
    seen[c] = 1;
    while (stack.length) {
      const q = stack.pop()!;
      comp.push(q);
      const qi = q % GW,
        qj = (q / GW) | 0;
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const ni = qi + di,
          nj = qj + dj;
        if (ni < 0 || nj < 0 || ni >= GW || nj >= GH) continue;
        const n = idx(ni, nj);
        if (!seen[n] && label[n] === k) {
          seen[n] = 1;
          stack.push(n);
        }
      }
    }
    comps.push(comp);
  }
  return comps;
}
for (let pass = 0; pass < 3; pass++) {
  REGIONS.forEach((_, k) => {
    const comps = components(k).sort((a, b) => b.length - a.length);
    for (const comp of comps.slice(1)) for (const c of comp) label[c] = -2; // orphan
  });
  // Reassign orphans to the most common 4-neighbour label, repeatedly.
  for (let it = 0; it < 50; it++) {
    let changed = 0;
    for (let c = 0; c < N; c++) {
      if (label[c] !== -2) continue;
      const i = c % GW,
        j = (c / GW) | 0;
      const counts = new Map<number, number>();
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const ni = i + di,
          nj = j + dj;
        if (ni < 0 || nj < 0 || ni >= GW || nj >= GH) continue;
        const l = label[idx(ni, nj)];
        if (l >= 0) counts.set(l, (counts.get(l) ?? 0) + 1);
      }
      let best = -1,
        bc = 0;
      for (const [l, n] of counts) if (n > bc) ((best = l), (bc = n));
      if (best >= 0) {
        label[c] = best;
        changed++;
      }
    }
    if (!changed) break;
  }
  for (let c = 0; c < N; c++) if (label[c] === -2) label[c] = -1;
}
// Fill enclosed blank holes (blank cells not connected to the grid edge).
{
  const outside = new Uint8Array(N);
  const stack: number[] = [];
  for (let i = 0; i < GW; i++) for (const j of [0, GH - 1]) if (label[idx(i, j)] < 0) stack.push(idx(i, j));
  for (let j = 0; j < GH; j++) for (const i of [0, GW - 1]) if (label[idx(i, j)] < 0) stack.push(idx(i, j));
  for (const s of stack) outside[s] = 1;
  while (stack.length) {
    const q = stack.pop()!;
    const qi = q % GW,
      qj = (q / GW) | 0;
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const ni = qi + di,
        nj = qj + dj;
      if (ni < 0 || nj < 0 || ni >= GW || nj >= GH) continue;
      const n = idx(ni, nj);
      if (!outside[n] && label[n] < 0) {
        outside[n] = 1;
        stack.push(n);
      }
    }
  }
  for (let pass = 0; pass < 20; pass++)
    for (let c = 0; c < N; c++) {
      if (label[c] >= 0 || outside[c]) continue;
      const i = c % GW,
        j = (c / GW) | 0;
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const ni = i + di,
          nj = j + dj;
        if (ni < 0 || nj < 0 || ni >= GW || nj >= GH) continue;
        const l = label[idx(ni, nj)];
        if (l >= 0) {
          label[c] = l;
          break;
        }
      }
    }
}

// ── 5. Border tracing on the shared vertex graph ─────────────────────────────
const VW = GW + 1;
const vid = (x: number, y: number) => y * VW + x;
const labAt = (i: number, j: number) => (i < 0 || j < 0 || i >= GW || j >= GH ? -1 : label[idx(i, j)]);

// Boundary vertex adjacency (undirected), for smoothing.
const vNeighbors = new Map<number, Set<number>>();
const addVE = (a: number, b: number) => {
  if (!vNeighbors.has(a)) vNeighbors.set(a, new Set());
  if (!vNeighbors.has(b)) vNeighbors.set(b, new Set());
  vNeighbors.get(a)!.add(b);
  vNeighbors.get(b)!.add(a);
};
for (let j = 0; j <= GH; j++)
  for (let i = 0; i <= GW; i++) {
    // horizontal edge (i,j)-(i+1,j) separates cell (i,j-1) and (i,j)
    if (i < GW && labAt(i, j - 1) !== labAt(i, j)) addVE(vid(i, j), vid(i + 1, j));
    // vertical edge (i,j)-(i,j+1) separates cell (i-1,j) and (i,j)
    if (j < GH && labAt(i - 1, j) !== labAt(i, j)) addVE(vid(i, j), vid(i, j + 1));
  }
// Laplacian smoothing: degree-2 vertices move toward the mean of their neighbours.
const pos = new Map<number, [number, number]>();
for (const v of vNeighbors.keys()) pos.set(v, [(v % VW) * CELL, Math.floor(v / VW) * CELL]);
for (let it = 0; it < 10; it++) {
  const next = new Map<number, [number, number]>();
  for (const [v, nb] of vNeighbors) {
    const p = pos.get(v)!;
    if (nb.size !== 2) {
      next.set(v, p);
      continue;
    }
    let sx = 0,
      sy = 0;
    for (const n of nb) {
      const q = pos.get(n)!;
      sx += q[0];
      sy += q[1];
    }
    next.set(v, [p[0] * 0.4 + (sx / 2) * 0.6, p[1] * 0.4 + (sy / 2) * 0.6]);
  }
  for (const [v, p] of next) pos.set(v, p);
}

function traceRegion(k: number): number[] {
  // Directed boundary edges with the region on the left (clockwise in screen space).
  const out = new Map<number, number[]>();
  const add = (a: number, b: number) => {
    if (!out.has(a)) out.set(a, []);
    out.get(a)!.push(b);
  };
  for (let j = 0; j < GH; j++)
    for (let i = 0; i < GW; i++) {
      if (label[idx(i, j)] !== k) continue;
      if (labAt(i, j - 1) !== k) add(vid(i, j), vid(i + 1, j));
      if (labAt(i + 1, j) !== k) add(vid(i + 1, j), vid(i + 1, j + 1));
      if (labAt(i, j + 1) !== k) add(vid(i + 1, j + 1), vid(i, j + 1));
      if (labAt(i - 1, j) !== k) add(vid(i, j + 1), vid(i, j));
    }
  const loops: number[][] = [];
  for (const start of [...out.keys()]) {
    while (out.get(start)?.length) {
      const loop = [start];
      let cur = out.get(start)!.pop()!;
      while (cur !== start) {
        loop.push(cur);
        const nx = out.get(cur);
        if (!nx || !nx.length) break;
        cur = nx.pop()!;
      }
      loops.push(loop);
    }
  }
  const area = (l: number[]) => {
    let a = 0;
    for (let t = 0; t < l.length; t++) {
      const p = pos.get(l[t])!,
        q = pos.get(l[(t + 1) % l.length])!;
      a += p[0] * q[1] - q[0] * p[1];
    }
    return Math.abs(a / 2);
  };
  loops.sort((a, b) => area(b) - area(a));
  const loop = loops[0];
  // Decimate consistently: keep junctions and even-parity vertices, so shared
  // borders keep the same points on both sides.
  const kept = loop.filter((v) => vNeighbors.get(v)!.size !== 2 || ((v % VW) + Math.floor(v / VW)) % 2 === 0);
  const flat: number[] = [];
  for (const v of kept) {
    const p = pos.get(v)!;
    flat.push(Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10);
  }
  return flat;
}

// Anchor: the cell deepest inside the region (distance transform), for banners/labels.
function anchorOf(k: number): [number, number] {
  const d = new Int32Array(N).fill(-1);
  const q: number[] = [];
  for (let c = 0; c < N; c++) {
    if (label[c] !== k) continue;
    const i = c % GW,
      j = (c / GW) | 0;
    if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([di, dj]) => labAt(i + di, j + dj) !== k)) {
      d[c] = 0;
      q.push(c);
    }
  }
  let best = q[0] ?? 0;
  for (let h = 0; h < q.length; h++) {
    const c = q[h];
    const i = c % GW,
      j = (c / GW) | 0;
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const ni = i + di,
        nj = j + dj;
      if (labAt(ni, nj) !== k) continue;
      const n = idx(ni, nj);
      if (d[n] < 0) {
        d[n] = d[c] + 1;
        q.push(n);
        if (d[n] > d[best]) best = n;
      }
    }
  }
  return [((best % GW) + 0.5) * CELL, (((best / GW) | 0) + 0.5) * CELL];
}

// ── 6. Adjacency, river crossings, fords ─────────────────────────────────────
interface Contact {
  count: number;
  river: Map<number, number>;
  pts: [number, number][];
}
const contacts = new Map<string, Contact>();
const key = (a: number, b: number) => (a < b ? `${a}|${b}` : `${b}|${a}`);
for (let j = 0; j < GH; j++)
  for (let i = 0; i < GW; i++) {
    const a = label[idx(i, j)];
    if (a < 0) continue;
    for (const [di, dj] of [[1, 0], [0, 1], [1, 1], [1, -1]]) {
      const ni = i + di,
        nj = j + dj;
      if (ni < 0 || nj < 0 || ni >= GW || nj >= GH) continue;
      const b = label[idx(ni, nj)];
      if (b < 0 || b === a) continue;
      const kk = key(a, b);
      if (!contacts.has(kk)) contacts.set(kk, { count: 0, river: new Map(), pts: [] });
      const ct = contacts.get(kk)!;
      ct.count++;
      // A river separates them if any cell within 2 of the contact line is river.
      let rv = -1;
      for (let s = -2; s <= 3 && rv < 0; s++) {
        const ci = Math.round(i + (di * s) / 2),
          cj = Math.round(j + (dj * s) / 2);
        if (ci >= 0 && cj >= 0 && ci < GW && cj < GH && riverOf[idx(ci, cj)] >= 0) rv = riverOf[idx(ci, cj)];
      }
      if (rv >= 0) ct.river.set(rv, (ct.river.get(rv) ?? 0) + 1);
      ct.pts.push([(i + 0.5 + di / 2) * CELL, (j + 0.5 + dj / 2) * CELL]);
    }
  }

interface Adj {
  a: string;
  b: string;
  border: number;
  river?: string;
  ford?: string;
  mid: [number, number];
}
const adjacency: Adj[] = [];
const adjPts: [number, number][][] = [];
for (const [kk, ct] of contacts) {
  if (ct.count < 3) continue;
  const [a, b] = kk.split('|').map(Number);
  let river: string | undefined;
  let best = 0;
  for (const [rv, n] of ct.river)
    if (n > best) {
      best = n;
      river = RIVERS[rv].id;
    }
  if (best / ct.count < 0.35) river = undefined;
  const mid = ct.pts[Math.floor(ct.pts.length / 2)];
  adjacency.push({ a: REGIONS[a].id, b: REGIONS[b].id, border: ct.count, river, mid: [Math.round(mid[0]), Math.round(mid[1])] });
  adjPts.push(ct.pts);
}
for (const f of FORDS) {
  const [fx, fy] = project(f.at[0], f.at[1]);
  let bi = -1,
    bd = Infinity;
  adjacency.forEach((ad, t) => {
    if (ad.river !== f.river) return;
    for (const p of adjPts[t]) {
      const d = Math.hypot(p[0] - fx, p[1] - fy);
      if (d < bd) ((bd = d), (bi = t));
    }
  });
  if (bi >= 0 && bd < 40) adjacency[bi].ford = f.id;
  else console.warn(`ford ${f.id} matched no crossing (nearest ${bd.toFixed(1)})`);
}

// ── Output ───────────────────────────────────────────────────────────────────
const regions: Record<string, { poly: number[]; seat: [number, number]; anchor: [number, number]; cells: number }> = {};
REGIONS.forEach((r, k) => {
  let cells = 0;
  for (let c = 0; c < N; c++) if (label[c] === k) cells++;
  if (!cells) throw new Error(`region ${r.id} has no cells`);
  const [sx, sy] = project(r.seat[0], r.seat[1]);
  regions[r.id] = { poly: traceRegion(k), seat: [Math.round(sx), Math.round(sy)], anchor: anchorOf(k), cells };
});
const rivers = RIVERS.map((r) => ({
  id: r.id,
  points: r.points.flatMap(([la, lo]) => project(la, lo).map((v) => Math.round(v * 10) / 10)),
}));
const fords = FORDS.map((f) => ({ id: f.id, pos: project(f.at[0], f.at[1]).map(Math.round) }));
const towns = REGIONS.flatMap((r) => (r.towns ?? []).map(([name, la, lo]) => ({ region: r.id, name, pos: project(la, lo).map(Math.round) })));

const outPath = resolve(dirname(fileURLToPath(import.meta.url)), '../src/data/generated/mapGeometry.json');
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(
  outPath,
  JSON.stringify({ meta: { width: WORLD_W, height: WORLD_H, cell: CELL, note: 'Generated by scripts/build-map.ts — do not edit by hand.' }, regions, adjacency, rivers, fords, towns }),
);

// Report
const deg = new Map<string, number>();
for (const a of adjacency) {
  deg.set(a.a, (deg.get(a.a) ?? 0) + 1);
  deg.set(a.b, (deg.get(a.b) ?? 0) + 1);
}
console.log(`regions ${REGIONS.length}, adjacencies ${adjacency.length}, river crossings ${adjacency.filter((a) => a.river).length}, fords ${adjacency.filter((a) => a.ford).length}`);
for (const r of REGIONS) if (!deg.get(r.id)) console.warn(`isolated region ${r.id}`);
console.log(`wrote ${outPath}`);

if (process.env.DEBUG_RASTER) {
  const { writeFileSync: wf } = await import('node:fs');
  const buf: number[] = [];
  for (let c = 0; c < N; c++) {
    const l = label[c];
    if (riverOf[c] >= 0) buf.push(0, 0, 255);
    else if (l < 0) buf.push(230, 230, 230);
    else buf.push((l * 97) % 200 + 40, (l * 53) % 200 + 40, (l * 31) % 200 + 40);
  }
  wf(process.env.DEBUG_RASTER, Buffer.concat([Buffer.from(`P6 ${GW} ${GH} 255\n`), Buffer.from(buf)]));
}
