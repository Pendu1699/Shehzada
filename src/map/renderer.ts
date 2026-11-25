// The Painted Punjab: an unfinished Sikh/Pahari-school miniature on wasli paper.
//
//   unseen regions   → faint pencil underdrawing
//   explored regions → colour washes, painted hills, trees and fields
//   held regions     → faction wash; the player's get gold-leaf borders and banners
//   the Company      → red ink seeping into the paper from the south-east

import { Application, Container, CullerPlugin, Graphics, GraphicsContext, Matrix, Polygon, RenderTexture, Sprite, Text, Texture, extensions, type FederatedPointerEvent } from 'pixi.js';

// Off-screen regions are skipped each frame (the map is the whole subcontinent).
extensions.add(CullerPlugin);
import { CB_SAFE, PALETTE, TERRAIN_WASH } from '../art/palette';
import { makePaperCanvas } from '../art/paper';
import { hexToNum, mix, mulberry } from '../art/util';
import { FACTIONS, FACTION_BY_ID } from '../data/factions';
import { PUNJAB_REGION_IDS, REGIONS, REGION_BY_ID } from '../data/regions';
import { RIVERS } from '../data/rivers';
import { GEO } from '../engine/map';
import { armyMen, date, isCavalryArmy } from '../engine/query';
import type { Army, GameState } from '../engine/state';
import { UNIT_TYPES } from '../data/units';
import { kitFor, kitKey, soldierFoot, soldierGun, soldierHorse } from './soldiers';
import { bbox, meander, pointInPoly, polyPoints, smoothLine, type Pt } from './geometry';
import {
  drawCrossedSwords,
  drawDune,
  drawField,
  drawFort,
  drawHarmandir,
  drawHill,
  drawHut,
  drawMosque,
  drawNishanSahib,
  drawReeds,
  drawTemple,
  drawTown,
  drawTree,
} from './figures';

const W = GEO.meta.width;
const H = GEO.meta.height;
const MARGIN = 140;

export interface MapCallbacks {
  /** Left-click on land selects; right-click gives an order or opens quick actions. */
  onRegionClick(id: string, e: { shift: boolean; right: boolean; x: number; y: number }): void;
  onArmyClick(id: string): void;
  /** Right-click on an army token (screen coordinates for a menu). */
  onArmyContext(id: string, x: number, y: number): void;
  /** An army was dragged; returns whether it may be dragged (only your own). */
  onArmyDragStart(id: string): boolean;
  /** The dragged army was dropped on a region. split: Ctrl/Alt was held. */
  onArmyDrop(id: string, region: string | null, split: boolean): void;
  onHover(id: string | null): void;
}

export interface MapView {
  selectedRegion?: string | null;
  selectedArmy?: string | null;
  preview?: { path: string[]; turns: number } | null;
  colorBlind?: boolean;
  reducedMotion?: boolean;
  mourning?: boolean;
}

interface RegionGfx {
  pencil: Graphics;
  wash: Graphics;
  decor: Graphics;
  decorPencil: Graphics;
  washAlpha: number;
}

interface Token {
  c: Container;
  fig: Graphics;
  label: Text;
  ring: Graphics;
  glow: Graphics;
  x: number;
  y: number;
  tx: number;
  ty: number;
  key: string;
  badge: Text;
}

/** Armies in one region stand in rows this far apart (world units); below this zoom they gather into one token. */
const ARMY_SPACING = 36;
const ARMY_ROW = 3;
const GATHER_BELOW_ZOOM = 1.3;

/** Army figures are drawn larger than life so they read clearly on the map. */
const ARMY_SCALE = 0.75;

export class PaintedMap {
  app = new Application();
  world = new Container();
  private staticLayer = new Container();
  private staticDirty = false;
  private el: HTMLElement;
  private cb: MapCallbacks;
  private regionGfx: Record<string, RegionGfx> = {};
  private layers = {
    paper: new Container(),
    sea: new Graphics(),
    frame: new Container(),
    terrain: new Container(),
    bleed: new Graphics(),
    decor: new Container(),
    rivers: new Graphics(),
    shimmer: new Graphics(),
    owners: new Graphics(),
    ink: new Container(),
    borders: new Graphics(),
    gold: new Graphics(),
    sites: new Graphics(),
    diyas: new Graphics(),
    labels: new Container(),
    banners: new Graphics(),
    paths: new Graphics(),
    drag: new Graphics(),
    select: new Graphics(),
    hits: new Container(),
    armies: Object.assign(new Container(), { sortableChildren: true }),
    dust: new Graphics(),
    clouds: new Container(),
    mood: new Graphics(),
  };
  private tokens = new Map<string, Token>();
  private figureCache = new Map<string, GraphicsContext>();
  private state: GameState | null = null;
  private view: MapView = {};
  private zoom = 1;
  private minZoom = 0.1;
  private seaLabels: Text[] = [];
  private time = 0;
  private dustParticles: { x: number; y: number; life: number; r: number }[] = [];
  private riverLines: { pts: Pt[]; width: number; id: string }[] = [];
  private monsoonDrawn: boolean | null = null;
  private bannerSpots: { x: number; y: number; faction: string; player: boolean }[] = [];
  private diyaSpots: Pt[] = [];
  private regionLabels: Record<string, Text> = {};
  private cityLabels: Text[] = [];
  private riverLabels: Text[] = [];
  private inkRegions: Record<string, { g: Graphics; since: number }> = {};
  private destroyed = false;
  private dragging: { x: number; y: number; wx: number; wy: number; moved: boolean } | null = null;
  private armyDrag: { id: string; x: number; y: number; moved: boolean; ok: boolean } | null = null;
  private pinch: Map<number, { x: number; y: number }> = new Map();
  private pinchDist = 0;
  private hovered: string | null = null;
  private moodAlpha = 0;
  private bleeds: { id: string; t: number }[] = [];

  constructor(el: HTMLElement, cb: MapCallbacks) {
    this.el = el;
    this.cb = cb;
  }

  async init(): Promise<void> {
    await this.app.init({ resizeTo: this.el, antialias: (window.devicePixelRatio || 1) < 1.5 && !navigator.webdriver, background: '#d9c79c', resolution: Math.min(2, window.devicePixelRatio || 1), autoDensity: true });
    if (this.destroyed) return;
    this.el.appendChild(this.app.canvas);
    this.app.stage.addChild(this.world);
    const L = this.layers;
    // Static painting (paper, frame, landscape, rivers) is cached as one texture.
    this.world.addChild(this.staticLayer);
    const statics = new Set<Container>([L.paper, L.sea, L.frame, L.terrain, L.decor, L.rivers]);
    for (const layer of Object.values(L)) {
      if (layer === L.clouds || layer === L.mood) continue;
      if (statics.has(layer)) this.staticLayer.addChild(layer);
      else this.world.addChild(layer);
    }
    this.app.stage.addChild(L.clouds);
    this.app.stage.addChild(L.mood);
    this.buildPaper();
    this.buildSea();
    this.buildFrame();
    this.buildRegions();
    // The painting covers the whole subcontinent — far too large for one cached
    // texture — so it is pre-rendered into tiles: sharp over the Punjab, softer
    // for the wide lands beyond, which are seen from further away.
    this.buildTiles();
    this.buildHits();
    this.buildLabels();
    this.buildClouds();
    this.setupInput();
    this.fit();
    this.app.ticker.add((t) => this.tick(t.deltaMS));
  }

  destroy() {
    this.destroyed = true;
    for (const off of this.domOff) off();
    this.domOff = [];
    try {
      this.app.destroy(true, { children: true, texture: true });
    } catch {
      /* not initialised */
    }
  }

  /* ── Tiled static painting ─────────────────────────────────────────────── */

  private tiles: { rt: RenderTexture; x: number; y: number }[] = [];

  private buildTiles() {
    const T = 1024;
    // The Punjab's bounds: tiles over it get full sharpness.
    let px0 = Infinity,
      py0 = Infinity,
      px1 = -Infinity,
      py1 = -Infinity;
    for (const id of PUNJAB_REGION_IDS) {
      const b = bbox(GEO.regions[id].poly);
      px0 = Math.min(px0, b.x0);
      py0 = Math.min(py0, b.y0);
      px1 = Math.max(px1, b.x1);
      py1 = Math.max(py1, b.y1);
    }
    const x0 = -MARGIN - 40,
      y0 = -MARGIN - 40;
    const layer = new Container();
    layer.label = 'tiles';
    this.world.addChildAt(layer, this.world.getChildIndex(this.staticLayer));
    this.world.removeChild(this.staticLayer);
    for (let y = y0; y < H + MARGIN + 40; y += T)
      for (let x = x0; x < W + MARGIN + 40; x += T) {
        const sharp = x < px1 + 60 && x + T > px0 - 60 && y < py1 + 60 && y + T > py0 - 60;
        const rt = RenderTexture.create({ width: T, height: T, resolution: sharp ? 2 : 0.7, antialias: false });
        const sp = new Sprite(rt);
        sp.x = x;
        sp.y = y;
        sp.cullable = true;
        layer.addChild(sp);
        this.tiles.push({ rt, x, y });
      }
    this.renderTiles();
  }

  private renderTiles() {
    if (!this.tiles.length) return;
    for (const t of this.tiles)
      this.app.renderer.render({ container: this.staticLayer, target: t.rt, clear: true, transform: new Matrix(1, 0, 0, 1, -t.x, -t.y) });
  }

  /* ── Static layers ─────────────────────────────────────────────────────── */

  private buildPaper() {
    const k = Math.max(1.5, (Math.max(W, H) + MARGIN * 2) / 2048);
    const cv = makePaperCanvas({ width: Math.round((W + MARGIN * 2) / k), height: Math.round((H + MARGIN * 2) / k), seed: 21, foxing: 0.9, vignette: 0.55 });
    const sp = new Sprite(Texture.from(cv));
    sp.x = -MARGIN;
    sp.y = -MARGIN;
    sp.width = W + MARGIN * 2;
    sp.height = H + MARGIN * 2;
    this.layers.paper.addChild(sp);
  }

  /** The sea: a flat wash with rows of painted wavelets, the land cut out of it. */
  private buildSea() {
    const g = this.layers.sea;
    const pad = 30;
    g.rect(-pad, -pad, W + pad * 2, H + pad * 2).fill({ color: 0x7fa6a0, alpha: 0.55 });
    for (const poly of GEO.land) g.poly(poly).cut();
    // Coastline: a darker pooled edge, as where wet paint meets the land.
    for (const poly of GEO.land) {
      g.poly(poly).stroke({ width: 7, color: 0x4f7f7a, alpha: 0.25 });
      g.poly(poly).stroke({ width: 1.4, color: 0x3a5f5c, alpha: 0.6 });
    }
    // Wavelets in staggered rows, only on open water.
    const inLand = (x: number, y: number) => GEO.land.some((p) => pointInPoly(x, y, p));
    const rnd = mulberry(1757);
    for (let y = 40; y < H; y += 46)
      for (let x = ((y / 46) % 2) * 34; x < W; x += 68) {
        const jx = x + (rnd() - 0.5) * 20,
          jy = y + (rnd() - 0.5) * 10;
        if (inLand(jx, jy) || inLand(jx + 30, jy) || inLand(jx - 30, jy) || inLand(jx, jy + 24) || inLand(jx, jy - 24)) continue;
        g.moveTo(jx - 12, jy).quadraticCurveTo(jx - 6, jy - 6, jx, jy).quadraticCurveTo(jx + 6, jy - 6, jx + 12, jy).stroke({ width: 1.3, color: 0x3a5f5c, alpha: 0.45 });
      }
    // The two seas, named in the old way.
    for (const [name, lat, lon] of [['Bahr-i-Arab · the Arabian Sea', 15.5, 66.5], ['Khalij-i-Bangala · the Bay of Bengal', 15.5, 87.5]] as const) {
      const t = new Text({ text: name, style: { fontFamily: 'Cormorant Garamond, serif', fontSize: 40, fontStyle: 'italic', fontWeight: '600', fill: 0x2f4f4c, letterSpacing: 4 } });
      t.anchor.set(0.5);
      t.alpha = 0.55;
      this.seaLabels.push(t);
      t.x = (lon - 60) * 0.848 * 180;
      t.y = (37.6 - lat) * 180;
      this.layers.labels.addChild(t);
    }
  }

  /** The manuscript frame: a neela band with gold rules and rosettes, and a sindoori inner rule. */
  private buildFrame() {
    const g = new Graphics();
    this.layers.frame.addChild(g);
    const m = 34;
    const x0 = -m,
      y0 = -m,
      x1 = W + m,
      y1 = H + m;
    const band = 22;
    g.rect(x0 - band, y0 - band, x1 - x0 + band * 2, band).fill(PALETTE.neela);
    g.rect(x0 - band, y1, x1 - x0 + band * 2, band).fill(PALETTE.neela);
    g.rect(x0 - band, y0, band, y1 - y0).fill(PALETTE.neela);
    g.rect(x1, y0, band, y1 - y0).fill(PALETTE.neela);
    g.rect(x0 - band, y0 - band, x1 - x0 + band * 2, y1 - y0 + band * 2).stroke({ width: 2.5, color: PALETTE.gold });
    g.rect(x0, y0, x1 - x0, y1 - y0).stroke({ width: 2, color: PALETTE.gold });
    g.rect(x0 + 5, y0 + 5, x1 - x0 - 10, y1 - y0 - 10).stroke({ width: 1, color: PALETTE.sindoor, alpha: 0.8 });
    // Vine scroll along the band.
    const vine = (ax: number, ay: number, bx: number, by: number) => {
      const len = Math.hypot(bx - ax, by - ay);
      const n = Math.floor(len / 26);
      const dx = (bx - ax) / n,
        dy = (by - ay) / n;
      const nx = -dy / 26,
        ny = dx / 26;
      for (let i = 0; i < n; i++) {
        const cx = ax + dx * (i + 0.5),
          cy = ay + dy * (i + 0.5);
        const side = i % 2 ? 1 : -1;
        g.moveTo(ax + dx * i, ay + dy * i)
          .quadraticCurveTo(cx + nx * 6 * side, cy + ny * 6 * side, ax + dx * (i + 1), ay + dy * (i + 1))
          .stroke({ width: 1.2, color: PALETTE.gold, alpha: 0.9 });
        g.ellipse(cx + nx * 5 * side, cy + ny * 5 * side, 2.6, 1.3).fill(PALETTE.gold);
        if (i % 3 === 0) {
          for (let p = 0; p < 6; p++) {
            const a = (p * Math.PI) / 3;
            g.circle(cx - nx * 4 * side + Math.cos(a) * 2.2, cy - ny * 4 * side + Math.sin(a) * 2.2, 1.3).fill(PALETTE.goldLight);
          }
          g.circle(cx - nx * 4 * side, cy - ny * 4 * side, 1.2).fill(PALETTE.sindoor);
        }
      }
    };
    const mid = band / 2;
    vine(x0 - band + 20, y0 - mid, x1 + band - 20, y0 - mid);
    vine(x0 - band + 20, y1 + mid, x1 + band - 20, y1 + mid);
    vine(x0 - mid, y0 + 10, x0 - mid, y1 - 10);
    vine(x1 + mid, y0 + 10, x1 + mid, y1 - 10);
    for (const [cx, cy] of [
      [x0 - mid, y0 - mid],
      [x1 + mid, y0 - mid],
      [x0 - mid, y1 + mid],
      [x1 + mid, y1 + mid],
    ]) {
      for (let p = 0; p < 8; p++) {
        const a = (p * Math.PI) / 4;
        g.ellipse(cx + Math.cos(a) * 5, cy + Math.sin(a) * 5, 3.4, 1.6).fill(PALETTE.gold);
      }
      g.circle(cx, cy, 3).fill(PALETTE.sindoor).stroke({ width: 1, color: PALETTE.goldLight });
    }
    // Cartouche with the title, top centre.
    const cw = 520;
    const cx = W / 2;
    g.roundRect(cx - cw / 2, y0 - band - 6, cw, band + 12, 10).fill(PALETTE.wasli).stroke({ width: 2, color: PALETTE.gold });
    const title = new Text({ text: 'Hindustan and the Punjab · ਪੰਜਾਬ', style: { fontFamily: 'Cormorant Garamond, Tiro Gurmukhi, serif', fontSize: 20, fontWeight: '700', fill: PALETTE.ink, letterSpacing: 1 } });
    title.anchor.set(0.5);
    title.x = cx;
    title.y = y0 - band / 2;
    this.layers.frame.addChild(title);
    // Compass rose, bottom left: north marked in the manner of old route maps.
    const rx = 70,
      ry = H - 70;
    g.circle(rx, ry, 26).stroke({ width: 1, color: PALETTE.ink, alpha: 0.5 });
    g.poly([rx, ry - 30, rx + 5, ry, rx, ry + 30, rx - 5, ry]).fill({ color: PALETTE.sindoor, alpha: 0.8 });
    g.poly([rx - 30, ry, rx, ry - 5, rx + 30, ry, rx, ry + 5]).fill({ color: PALETTE.ink, alpha: 0.5 });
    const n = new Text({ text: 'N', style: { fontFamily: 'Cormorant Garamond, serif', fontSize: 14, fontWeight: '700', fill: PALETTE.ink } });
    n.anchor.set(0.5);
    n.x = rx;
    n.y = ry - 40;
    this.layers.frame.addChild(n);
  }

  private buildRegions() {
    for (const r of REGIONS) {
      const geo = GEO.regions[r.id];
      const pencil = new Graphics();
      const wash = new Graphics();
      const decor = new Graphics();
      const decorPencil = new Graphics();
      // Pencil underdrawing: a sketchy double line.
      const pts = geo.poly;
      const rnd = mulberry(r.id.length * 977 + r.id.charCodeAt(0));
      for (let pass = 0; pass < 2; pass++) {
        const jitter = pts.map((v) => v + (rnd() - 0.5) * 1.4);
        pencil.poly(jitter).stroke({ width: 0.7, color: 0x6b6257, alpha: 0.42 - pass * 0.12 });
      }
      // Watercolour wash: a base fill, then lighter and darker washes laid in smaller
      // concentric passes (pigment pools toward the middle), then a darker pooled edge.
      const base = TERRAIN_WASH[r.terrain];
      wash.poly(pts).fill({ color: base, alpha: 0.5 });
      const [ax, ay] = geo.anchor;
      const shrink = (k: number, dx: number, dy: number) => pts.map((v, i) => (i % 2 === 0 ? ax + (v - ax) * k + dx : ay + (v - ay) * k + dy));
      // Fewer pooled washes for the wide regions beyond the Punjab: they are seen
      // from afar, and every translucent layer costs a full fill.
      const passes = PUNJAB_REGION_IDS.has(r.id) ? 4 : 1;
      for (let i = 0; i < passes; i++) {
        const k = 0.82 - i * 0.16;
        const col = mix(base, i % 2 ? '#ffffff' : '#5e6b2e', 0.22);
        wash.poly(shrink(k, (rnd() - 0.5) * 8, (rnd() - 0.5) * 8)).fill({ color: col, alpha: 0.09 });
      }
      wash.poly(pts).stroke({ width: 5, color: mix(base, '#3a2a14', 0.45), alpha: 0.16 });
      wash.poly(pts).stroke({ width: 1.2, color: mix(base, '#3a2a14', 0.6), alpha: 0.28 });
      this.drawDecor(r.id, decor, false);
      this.drawDecor(r.id, decorPencil, true);
      this.layers.terrain.addChild(pencil);
      this.layers.terrain.addChild(wash);
      this.layers.decor.addChild(decorPencil);
      this.layers.decor.addChild(decor);
      wash.visible = false;
      decor.visible = false;
      this.regionGfx[r.id] = { pencil, wash, decor, decorPencil, washAlpha: 0 };
    }
  }

  private drawDecor(id: string, g: Graphics, pencil: boolean) {
    const r = REGION_BY_ID[id];
    const geo = GEO.regions[id];
    const pts = geo.poly;
    const bb = bbox(pts);
    const rnd = mulberry(id.split('').reduce((a, c) => a * 31 + c.charCodeAt(0), 7) >>> 0);
    const area = geo.cells * 16;
    const seat = geo.seat;
    const sample = (tries = 30): Pt | null => {
      for (let i = 0; i < tries; i++) {
        const x = bb.x0 + rnd() * (bb.x1 - bb.x0);
        const y = bb.y0 + rnd() * (bb.y1 - bb.y0);
        if (!pointInPoly(x, y, pts)) continue;
        if (Math.hypot(x - seat[0], y - seat[1]) < 26 * S) continue;
        if (Math.hypot(x - geo.anchor[0], y - geo.anchor[1]) < 22) continue;
        // keep away from the polygon edge a little
        if (!pointInPoly(x + 6, y, pts) || !pointInPoly(x - 6, y, pts) || !pointInPoly(x, y - 10, pts)) continue;
        return [x, y];
      }
      return null;
    };
    const items: { y: number; draw: () => void }[] = [];
    // Beyond the Punjab the regions are seen from afar: fewer, larger marks.
    const outer = !PUNJAB_REGION_IDS.has(id);
    const S = outer ? 2.2 : 1;
    const count = (per: number) => Math.max(2, Math.round((area / per) * (outer ? 0.16 : 1)));
    const t = r.terrain;
    if (t === 'mountain' || t === 'hills') {
      const n = count(t === 'mountain' ? 1100 : 1800);
      const fill = t === 'mountain' ? hexToNum(mix('#9a8f80', '#6f7a5a', rnd())) : hexToNum(mix('#a88f62', '#7a8a4a', rnd()));
      for (let i = 0; i < n; i++) {
        const p = sample();
        if (p) items.push({ y: p[1], draw: () => drawHill(g, p[0], p[1], (0.8 + rnd() * 0.6) * S, fill, pencil, t === 'mountain') });
      }
      for (let i = 0; i < n / 2; i++) {
        const p = sample();
        if (p) items.push({ y: p[1], draw: () => drawTree(g, p[0], p[1], (0.8) * S, 'pipal', pencil) });
      }
    }
    if (t === 'jungle' || t === 'bela') {
      const n = count(t === 'jungle' ? 700 : 1400);
      for (let i = 0; i < n; i++) {
        const p = sample();
        if (p) items.push({ y: p[1], draw: () => drawTree(g, p[0], p[1], (0.9 + rnd() * 0.4) * S, rnd() < 0.6 ? 'mango' : 'pipal', pencil) });
      }
      for (let i = 0; i < count(1600); i++) {
        const p = sample();
        if (p) items.push({ y: p[1], draw: () => drawReeds(g, p[0], p[1], (1) * S, pencil) });
      }
    }
    if (t === 'plains' || t === 'bela') {
      const n = count(1500) + r.fertility;
      for (let i = 0; i < n; i++) {
        const p = sample();
        const col = rnd() < 0.45 ? 0xe2c23a : rnd() < 0.5 ? 0xc9a85a : 0x8aa25a; // sarson, wheat, green fields
        const ang = (rnd() - 0.5) * 0.8;
        if (p) items.push({ y: p[1], draw: () => drawField(g, p[0], p[1], (0.9 + rnd() * 0.5) * S, col, ang, pencil) });
      }
      for (let i = 0; i < count(3000); i++) {
        const p = sample();
        if (p) items.push({ y: p[1], draw: () => drawTree(g, p[0], p[1], (1) * S, 'mango', pencil) });
      }
      for (let i = 0; i < count(4500); i++) {
        const p = sample();
        if (p) items.push({ y: p[1], draw: () => drawHut(g, p[0], p[1], (1) * S, pencil) });
      }
    }
    if (t === 'bar' || t === 'desert') {
      for (let i = 0; i < count(t === 'desert' ? 1200 : 2200); i++) {
        const p = sample();
        if (p) items.push({ y: p[1], draw: () => drawDune(g, p[0], p[1], (1 + rnd() * 0.6) * S, pencil) });
      }
      for (let i = 0; i < count(2400); i++) {
        const p = sample();
        if (p) items.push({ y: p[1], draw: () => drawTree(g, p[0], p[1], (0.9) * S, 'kikar', pencil) });
      }
    }
    items.sort((a, b) => a.y - b.y).forEach((it) => it.draw());
  }

  /**
   * Region picking. Region outlines are smoothed, which leaves hairline gaps
   * along borders, so clicks are resolved by point-in-polygon on the raw world
   * point with a fallback to the nearest region edge. One handler on the stage
   * means a click always does something.
   */
  private buildHits() {}

  regionAt(gx: number, gy: number): string | null {
    const x = (gx - this.world.x) / this.zoom,
      y = (gy - this.world.y) / this.zoom;
    let best: string | null = null,
      bestD = 22 * 22;
    for (const r of REGIONS) {
      const poly = GEO.regions[r.id].poly;
      let inside = false;
      for (let i = 0, j = poly.length - 2; i < poly.length; j = i, i += 2) {
        const xi = poly[i], yi = poly[i + 1], xj = poly[j], yj = poly[j + 1];
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
        // distance to this edge, for the near-border fallback
        const dx = xj - xi, dy = yj - yi;
        const t = Math.max(0, Math.min(1, ((x - xi) * dx + (y - yi) * dy) / (dx * dx + dy * dy || 1)));
        const ex = xi + dx * t - x, ey = yi + dy * t - y;
        const d = ex * ex + ey * ey;
        if (d < bestD) {
          bestD = d;
          best = r.id;
        }
      }
      if (inside) return r.id;
    }
    return best;
  }

  private setHover(id: string | null) {
    if (id === this.hovered) return;
    this.hovered = id;
    this.cb.onHover(id);
    this.app.canvas.style.cursor = id ? 'pointer' : 'grab';
  }

  private buildLabels() {
    // Doab names: large faint italic letters, the way old maps name tracts of country.
    const doabs: Record<string, string> = {
      bari: 'Bari Doab',
      rachna: 'Rachna Doab',
      chaj: 'Chaj Doab',
      sind_sagar: 'Sind Sagar Doab',
      bist_jalandhar: 'Bist Jalandhar',
      malwa: 'Malwa',
      kashmir: 'Kashmir',
      derajat: 'Derajat',
    };
    for (const [doab, name] of Object.entries(doabs)) {
      const regs = REGIONS.filter((r) => r.doab === doab);
      if (!regs.length) continue;
      let sx = 0,
        sy = 0;
      for (const r of regs) {
        sx += GEO.regions[r.id].anchor[0];
        sy += GEO.regions[r.id].anchor[1];
      }
      const t = new Text({ text: name.toUpperCase(), style: { fontFamily: 'Cormorant Garamond, serif', fontSize: 26, fontStyle: 'italic', fontWeight: '600', fill: 0x5a4a32, letterSpacing: 8 } });
      t.anchor.set(0.5);
      t.alpha = 0.16;
      t.x = sx / regs.length;
      t.y = sy / regs.length + 30;
      if (doab === 'bari') t.rotation = -0.45;
      if (doab === 'rachna' || doab === 'chaj') t.rotation = -0.55;
      this.layers.labels.addChild(t);
    }
    // River names along their courses.
    for (const rv of RIVERS) {
      const geo = GEO.rivers.find((x) => x.id === rv.id);
      if (!geo || rv.id === 'jhelum_vale') continue;
      const pts = polyPoints(geo.points);
      const i = Math.floor(pts.length * 0.45);
      const a = pts[i],
        b = pts[Math.min(pts.length - 1, i + 1)];
      let ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
      if (ang > Math.PI / 2) ang -= Math.PI;
      if (ang < -Math.PI / 2) ang += Math.PI;
      const t = new Text({ text: rv.name, style: { fontFamily: 'Cormorant Garamond, serif', fontSize: 13, fontStyle: 'italic', fill: 0x2f5a62 } });
      t.anchor.set(0.5, 1.3);
      t.x = a[0];
      t.y = a[1];
      t.rotation = ang;
      t.alpha = 0.85;
      this.riverLabels.push(t);
      this.layers.labels.addChild(t);
    }
    // Region names at anchors; cities at seats.
    const placed: { x: number; y: number; w: number }[] = [];
    for (const r of REGIONS) {
      const geo = GEO.regions[r.id];
      const name = r.name.replace(/ \(.*\)$/, '');
      const t = new Text({ text: name, style: { fontFamily: 'Cormorant Garamond, serif', fontSize: 13, fontWeight: '700', fill: PALETTE.ink, letterSpacing: 0.5, stroke: { color: PALETTE.wasli, width: 3 } } });
      t.anchor.set(0.5);
      t.x = geo.anchor[0];
      // Armies stand in a row just below the seat (and the fort and banner just
      // above it). Put the name at the region's centre if that is clear of them;
      // otherwise below the army row, or above the banner — whichever stays
      // inside the region.
      const [sx, sy] = geo.seat;
      // Any region's fort/army zone counts, not just this one's: towns can be
      // close. Names already placed count too, but armies matter more.
      const nearSeat = (x: number, y: number) =>
        REGIONS.some((o) => {
          const [ox, oy] = GEO.regions[o.id].seat;
          return Math.abs(x - ox) < (o.id === r.id ? 70 : 50) && y > oy - 34 && y < oy + 52;
        });
      const nearName = (x: number, y: number) => placed.some((b) => Math.abs(x - b.x) < (t.width + b.w) / 2 + 4 && Math.abs(y - b.y) < 15);
      const busy = (x: number, y: number) => nearSeat(x, y) || nearName(x, y);
      const w = t.width / 2;
      const inside = (x: number, y: number) => pointInPoly(x - w * 0.8, y, geo.poly) && pointInPoly(x + w * 0.8, y, geo.poly);
      const spots: [number, number][] = [geo.anchor as [number, number], [sx, sy + 62], [sx, sy - 46], [geo.anchor[0], sy + 62], [geo.anchor[0], sy - 46]];
      // Also try a ring of points around the centre, nearest first.
      for (const rad of [24, 44, 64]) for (let k = 0; k < 8; k++) spots.push([geo.anchor[0] + Math.cos((k * Math.PI) / 4) * rad, geo.anchor[1] + Math.sin((k * Math.PI) / 4) * rad * 0.7]);
      let spot = spots.find(([x, y]) => !busy(x, y) && inside(x, y));
      // A narrow region: try the short name ("Kapurthala" for "Kapurthala & Sultanpur").
      if (!spot && name.includes(' & ')) {
        t.text = name.split(' & ')[0];
        const w2 = t.width / 2;
        spot = spots.find(([x, y]) => !busy(x, y) && pointInPoly(x - w2 * 0.8, y, geo.poly) && pointInPoly(x + w2 * 0.8, y, geo.poly));
      }
      spot ??=
        spots.find(([x, y]) => !busy(x, y) && pointInPoly(x, y, geo.poly)) ??
        spots.find(([x, y]) => !nearSeat(x, y) && pointInPoly(x, y, geo.poly)) ??
        spots.find(([x, y]) => !nearSeat(x, y)) ??
        [geo.anchor[0], sy + 62];
      t.x = spot[0];
      t.y = spot[1];
      placed.push({ x: t.x, y: t.y, w: t.width });
      this.regionLabels[r.id] = t;
      this.layers.labels.addChild(t);
    }
    for (const town of GEO.towns) {
      const t = new Text({ text: town.name, style: { fontFamily: 'EB Garamond, serif', fontSize: 9, fontStyle: 'italic', fill: 0x3a3024 } });
      t.anchor.set(0, 0.5);
      t.x = town.pos[0] + 3;
      t.y = town.pos[1];
      t.alpha = 0;
      this.cityLabels.push(t);
      this.layers.labels.addChild(t);
    }
  }

  private buildClouds() {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 256;
    const ctx = cv.getContext('2d')!;
    const g = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
    g.addColorStop(0, 'rgba(60,50,35,0.55)');
    g.addColorStop(1, 'rgba(60,50,35,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    const tex = Texture.from(cv);
    for (let i = 0; i < 3; i++) {
      const s = new Sprite(tex);
      s.anchor.set(0.5);
      s.scale.set(2.5 + i * 0.6, 1.6 + (i % 2) * 0.5);
      s.alpha = 0.06;
      s.x = (i * 397) % 1600;
      s.y = (i * 251) % 900;
      this.layers.clouds.addChild(s);
    }
  }

  /* ── Rivers ────────────────────────────────────────────────────────────── */

  private drawRivers(monsoon: boolean) {
    const g = this.layers.rivers;
    g.clear();
    this.riverLines = [];
    for (const rv of RIVERS) {
      const geo = GEO.rivers.find((x) => x.id === rv.id);
      if (!geo) continue;
      const raw = polyPoints(geo.points);
      const pts = meander(smoothLine(raw, 10), 1.6, 0.9, rv.id.length);
      const maxW = rv.width * (monsoon ? 1.55 : 1);
      this.riverLines.push({ pts, width: maxW, id: rv.id });
      const water = monsoon ? '#a9a982' : '#9cc0c0';
      const bank = monsoon ? '#8a7a52' : '#6f9198';
      // Taper from source to mouth in a few continuous chunks (solid colours, so no banding).
      const chunks = 6;
      const passes: [string, (w: number) => number, number][] = [
        [bank, (w) => w + 1.8, 1],
        [water, (w) => w, 1],
      ];
      for (const [col, wf, alpha] of passes) {
        for (let c = 0; c < chunks; c++) {
          const i0 = Math.floor((c * (pts.length - 1)) / chunks);
          const i1 = Math.floor(((c + 1) * (pts.length - 1)) / chunks);
          const w = maxW * (0.4 + (0.6 * (c + 1)) / chunks);
          g.moveTo(pts[i0][0], pts[i0][1]);
          for (let i = i0 + 1; i <= i1; i++) g.lineTo(pts[i][0], pts[i][1]);
          g.stroke({ width: wf(w), color: col, alpha, cap: 'round', join: 'round' });
        }
      }
    }
    // Fords and ferries.
    for (const f of GEO.fords) {
      const [x, y] = f.pos;
      g.circle(x, y, 3.2).fill({ color: PALETTE.wasli }).stroke({ width: 1, color: PALETTE.ink, alpha: 0.7 });
      g.moveTo(x - 2, y).lineTo(x + 2, y).stroke({ width: 0.8, color: PALETTE.ink });
    }
  }

  private drawShimmer() {
    const g = this.layers.shimmer;
    g.clear();
    if (this.view.reducedMotion) return;
    const t = this.time / 1000;
    for (const rl of this.riverLines) {
      const n = rl.pts.length;
      for (let i = 3; i < n - 1; i += 7) {
        const ph = Math.sin(t * 1.6 + i * 0.7 + rl.id.length);
        if (ph < 0.55) continue;
        const a = rl.pts[i],
          b = rl.pts[i + 1];
        g.moveTo(a[0], a[1]).lineTo(b[0], b[1]).stroke({ width: Math.max(0.6, rl.width * 0.25), color: 0xffffff, alpha: (ph - 0.55) * 1.4, cap: 'round' });
      }
    }
  }

  /* ── Dynamic: state-dependent layers ───────────────────────────────────── */

  factionColor(f: string): string {
    if (this.view.colorBlind) {
      const i = FACTIONS.findIndex((x) => x.id === f);
      return CB_SAFE[i % CB_SAFE.length];
    }
    return FACTION_BY_ID[f]?.color ?? '#888888';
  }

  update(state: GameState, view: MapView) {
    if (!this.app.renderer) return;
    const prevState = this.state;
    this.state = state;
    this.view = view;
    const d = date(state);
    if (this.monsoonDrawn !== d.monsoon) {
      this.drawRivers(d.monsoon);
      this.staticDirty = true;
      this.monsoonDrawn = d.monsoon;
    }
    // Exploration: colour washes replace the pencil underdrawing.
    let changed = false;
    for (const r of REGIONS) {
      const gfx = this.regionGfx[r.id];
      const seen = (state.explored[r.id] ?? 0) > 0;
      if (gfx.wash.visible !== seen) {
        gfx.wash.visible = seen;
        gfx.decor.visible = seen;
        gfx.decorPencil.visible = !seen;
        gfx.washAlpha = seen ? 1 : 0;
        changed = true;
        if (prevState) this.bleeds.push({ id: r.id, t: 0 });
      }
      const lbl = this.regionLabels[r.id];
      lbl.style.fill = seen ? PALETTE.ink : 0x7a7064;
      lbl.alpha = seen ? 1 : 0.7;
    }
    if (changed || this.staticDirty) {
      this.renderTiles();
      this.staticDirty = false;
    }
    this.drawOwners(state);
    this.drawSites(state);
    this.drawPaths(state);
    this.drawSelection(state);
    this.syncTokens(state);
    this.moodAlpha = view.mourning ? 0.32 : 0;
  }

  private drawOwners(s: GameState) {
    const g = this.layers.owners;
    const b = this.layers.borders;
    const gold = this.layers.gold;
    g.clear();
    b.clear();
    gold.clear();
    this.bannerSpots = [];
    this.diyaSpots = [];
    const player = s.playerFaction;
    const d = date(s);
    for (const r of REGIONS) {
      const st = s.regions[r.id];
      const geo = GEO.regions[r.id];
      const seen = (s.explored[r.id] ?? 0) > 0;
      if (!st.owner || !seen) {
        if (st.rakhi === player && seen) b.poly(geo.poly).stroke({ width: 1.4, color: PALETTE.kesri, alpha: 0.7 });
        continue;
      }
      if (st.owner === 'company') continue; // drawn as ink
      const col = this.factionColor(st.owner);
      g.poly(geo.poly).fill({ color: col, alpha: st.owner === player ? 0.26 : 0.22 });
      if (st.owner === player) {
        gold.poly(geo.poly).stroke({ width: 4.2, color: 0x6b4a14, alpha: 0.35 });
        gold.poly(geo.poly).stroke({ width: 2.4, color: PALETTE.gold, alpha: 0.95 });
        gold.poly(geo.poly).stroke({ width: 0.7, color: PALETTE.goldLight, alpha: 0.9 });
      } else {
        b.poly(geo.poly).stroke({ width: 1.3, color: mix(col, '#1b1712', 0.25), alpha: 0.75 });
      }
      if (st.rakhi === player) b.poly(geo.poly).stroke({ width: 1, color: PALETTE.kesri, alpha: 0.8 });
      this.bannerSpots.push({ x: geo.anchor[0] - 10, y: geo.anchor[1] - 2, faction: st.owner, player: st.owner === player });
      if (d.festival === 'diwali' && FACTION_BY_ID[st.owner]?.sikh) this.diyaSpots.push([geo.seat[0], geo.seat[1]]);
    }
    // Red ink of the Company, seeping in from the south-east.
    for (const r of REGIONS) {
      const st = s.regions[r.id];
      const has = st.owner === 'company';
      const existing = this.inkRegions[r.id];
      if (has && !existing) {
        const geo = GEO.regions[r.id];
        const ig = new Graphics();
        const bb = bbox(geo.poly);
        // Red ink seeps in from the south-east: washes laid in from that corner.
        const px = bb.x1,
          py = bb.y1;
        const toward = (k: number) => geo.poly.map((v, i) => (i % 2 === 0 ? px + (v - px) * k : py + (v - py) * k));
        ig.poly(geo.poly).fill({ color: PALETTE.company, alpha: 0.16 });
        for (const k of [0.9, 0.72, 0.55, 0.38]) ig.poly(toward(k)).fill({ color: PALETTE.company, alpha: 0.1 });
        ig.poly(geo.poly).stroke({ width: 6, color: 0x7a1010, alpha: 0.3 });
        ig.poly(geo.poly).stroke({ width: 1.2, color: 0x6a0c0c, alpha: 0.6 });
        ig.alpha = 0;
        this.layers.ink.addChild(ig);
        this.inkRegions[r.id] = { g: ig, since: this.time };
      } else if (!has && existing) {
        existing.g.destroy();
        delete this.inkRegions[r.id];
      }
    }
  }

  private drawSites(s: GameState) {
    const g = this.layers.sites;
    g.clear();
    for (const r of REGIONS) {
      const st = s.regions[r.id];
      const geo = GEO.regions[r.id];
      const seen = (s.explored[r.id] ?? 0) > 0;
      const [x, y] = geo.seat;
      if (!seen) {
        g.circle(x, y, 2).stroke({ width: 0.7, color: 0x6b6257, alpha: 0.6 });
        continue;
      }
      const desecrated = st.desecrated.length > 0;
      if (st.fort > 0) drawFort(g, x, y, st.fort, r.terrain === 'hills' || r.terrain === 'mountain' ? 0xb8a58a : 0xc58f5a, false);
      else drawTown(g, x, y, 1);
      let k = 0;
      for (const site of r.sites) {
        const ox = x + 14 + (k % 2) * 10,
          oy = y + 10 + Math.floor(k / 2) * 9;
        if (site.id === 'harmandir') {
          drawHarmandir(g, x - 2, y + 16, desecrated);
          continue;
        }
        if (site.id === 'akal_takht') continue;
        if (site.kind === 'gurdwara' || site.kind === 'takht') {
          drawNishanSahib(g, ox, oy, 0.8);
          k++;
        } else if (site.kind === 'mosque' || site.kind === 'shrine') {
          drawMosque(g, ox, oy);
          k++;
        } else if (site.kind === 'temple') {
          drawTemple(g, ox, oy);
          k++;
        } else if (site.kind === 'battlefield' && this.zoom > 1.4) {
          drawCrossedSwords(g, ox, oy);
          k++;
        }
      }
      if (st.siege) {
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          g.circle(x + Math.cos(a) * 16, y - 4 + Math.sin(a) * 10, 1.6).fill({ color: PALETTE.sindoor, alpha: 0.8 });
        }
      }
    }
    for (const town of GEO.towns) {
      if ((s.explored[town.region] ?? 0) === 0) continue;
      g.circle(town.pos[0], town.pos[1], 1.5).fill({ color: PALETTE.ink, alpha: 0.7 });
    }
  }

  /** Light update while the pointer moves: only the march preview. */
  setPreview(preview: MapView['preview']) {
    if (!this.state) return;
    this.view = { ...this.view, preview };
    this.drawPaths(this.state);
  }

  private drawPaths(s: GameState) {
    const g = this.layers.paths;
    g.clear();
    const drawPath = (from: string, path: string[], color: number, alpha: number, dashed: boolean) => {
      let prev = GEO.regions[from].seat;
      for (const r of path) {
        const next = GEO.regions[r].seat;
        const dx = next[0] - prev[0],
          dy = next[1] - prev[1];
        const len = Math.hypot(dx, dy);
        const n = Math.max(1, Math.floor(len / 7));
        for (let i = 0; i < n; i += dashed ? 2 : 1) {
          const a = i / n,
            b = Math.min(1, (i + 1) / n);
          g.moveTo(prev[0] + dx * a, prev[1] + dy * a).lineTo(prev[0] + dx * b, prev[1] + dy * b).stroke({ width: 2, color, alpha, cap: 'round' });
        }
        const ang = Math.atan2(dy, dx);
        const ax = next[0] - Math.cos(ang) * 8,
          ay = next[1] - Math.sin(ang) * 8;
        g.poly([ax, ay, ax - Math.cos(ang - 0.5) * 7, ay - Math.sin(ang - 0.5) * 7, ax - Math.cos(ang + 0.5) * 7, ay - Math.sin(ang + 0.5) * 7]).fill({ color, alpha });
        prev = next;
      }
    };
    for (const a of Object.values(s.armies)) {
      if (a.owner !== s.playerFaction || !a.path.length) continue;
      drawPath(a.region, a.path, 0x1b1712, a.id === this.view.selectedArmy ? 0.85 : 0.5, false);
    }
    const pv = this.view.preview;
    const sel = this.view.selectedArmy ? s.armies[this.view.selectedArmy] : undefined;
    if (pv && sel && pv.path.length) drawPath(sel.region, pv.path, hexToNum(PALETTE.sindoor), 0.8, true);
  }

  private drawSelection(_s: GameState) {
    const g = this.layers.select;
    g.clear();
    const id = this.view.selectedRegion;
    if (id && GEO.regions[id]) {
      g.poly(GEO.regions[id].poly).stroke({ width: 6, color: PALETTE.goldLight, alpha: 0.45 });
      g.poly(GEO.regions[id].poly).stroke({ width: 1.6, color: PALETTE.ink, alpha: 0.9 });
    }
  }

  /* ── Army tokens ───────────────────────────────────────────────────────── */

  private figureFor(a: Army): GraphicsContext {
    let kind: 'horse' | 'foot' | 'gun' = isCavalryArmy(a) ? 'horse' : 'foot';
    const men = armyMen(a);
    const guns = a.units.filter((u) => UNIT_TYPES[u.type]?.cls === 'artillery').reduce((t, u) => t + u.men, 0);
    if (men && guns / men > 0.5) kind = 'gun';
    // Dress by the troops the army is mostly made of (excluding guns).
    const main = [...a.units].filter((u) => UNIT_TYPES[u.type]?.cls !== 'artillery' || kind === 'gun').sort((x, y) => y.men - x.men)[0]?.type ?? '';
    const regular = !!this.state?.factions[a.owner]?.sarkar && main.startsWith('fauj_ain');
    const kit = kitFor(a.owner, main, regular);
    const cloth = this.factionColor(a.owner);
    const coat = a.owner.length % 5;
    const key = `${kind}|${kitKey(kit)}|${cloth}|${coat}`;
    let ctx = this.figureCache.get(key);
    if (!ctx) {
      ctx = kind === 'horse' ? soldierHorse(kit, coat, cloth) : kind === 'foot' ? soldierFoot(kit) : soldierGun(kit, cloth);
      this.figureCache.set(key, ctx);
    }
    return ctx;
  }

  private syncTokens(s: GameState) {
    const seen = new Set<string>();
    const byRegion = new Map<string, Army[]>();
    for (const a of Object.values(s.armies)) {
      const visible = a.owner === s.playerFaction || (s.explored[a.region] ?? 0) >= 1;
      if (!visible) continue;
      const l = byRegion.get(a.region) ?? [];
      l.push(a);
      byRegion.set(a.region, l);
    }
    for (const [region, list] of byRegion) {
      list.sort((a, b) => (a.owner === s.playerFaction ? -1 : 0) - (b.owner === s.playerFaction ? -1 : 0) || armyMen(b) - armyMen(a));
      const seat = GEO.regions[region].seat;
      list.forEach((a, i) => {
        seen.add(a.id);
        // Spread several armies in one region side by side in a row below the seat.
        // Close up, every army gets its own place in a row below the town, with
        // clear space between plates; far out they gather into one token with a
        // count, so the map never turns into a pile.
        const n = list.length;
        const gathered = n > 1 && this.zoom < GATHER_BELOW_ZOOM;
        const row = Math.floor(i / ARMY_ROW),
          col = i % ARMY_ROW;
        const inRow = Math.min(ARMY_ROW, n - row * ARMY_ROW);
        const tx = gathered ? seat[0] : seat[0] + (col - (inRow - 1) / 2) * ARMY_SPACING;
        const ty = gathered ? seat[1] + 26 : seat[1] + 26 + row * 40;
        let tok = this.tokens.get(a.id);
        const fig = this.figureFor(a);
        const key = `${a.owner}|${fig.uid}`;
        if (!tok) {
          const c = new Container();
          const glow = new Graphics();
          const ring = new Graphics();
          const g = new Graphics(fig);
          const label = new Text({ text: '', style: { fontFamily: 'EB Garamond, serif', fontSize: 11, fontWeight: '700', fill: PALETTE.ink } });
          label.anchor.set(0.5, 0);
          label.y = 3.5;
          const badge = new Text({ text: '', style: { fontFamily: 'EB Garamond, serif', fontSize: 10, fontWeight: '700', fill: '#fff8e6' } });
          badge.anchor.set(0.5, 0.5);
          badge.position.set(18, 3);
          c.addChild(glow, ring, g, label, badge);
          c.scale.set(ARMY_SCALE);
          c.eventMode = 'static';
          c.cursor = 'pointer';
          c.hitArea = new Polygon([-12, -40, 15, -40, 15, 16, -12, 16]);
          // Left button: press and release selects; press and drag gives a march order.
          c.on('pointerdown', (e: FederatedPointerEvent) => {
            if (e.button !== 0 || this.pinch.size > 0) return;
            e.stopPropagation();
            this.armyDrag = { id: a.id, x: e.global.x, y: e.global.y, moved: false, ok: false };
          });
          c.on('rightclick', (e: FederatedPointerEvent) => {
            e.stopPropagation();
            this.cb.onArmyContext(a.id, e.clientX, e.clientY);
          });
          c.on('pointerover', () => this.setHover(null));
          c.x = tx;
          c.y = ty;
          this.layers.armies.addChild(c);
          tok = { c, fig: g, label, ring, glow, x: tx, y: ty, tx, ty, key, badge };
          this.tokens.set(a.id, tok);
        } else if (tok.key !== key) {
          tok.fig.context = fig;
          tok.key = key;
        }
        tok.tx = tx;
        tok.ty = ty;
        const men = armyMen(a);
        tok.label.text = men >= 1000 ? `${(men / 1000).toFixed(men >= 10000 ? 0 : 1)}k` : `${men}`;
        tok.fig.scale.set(Math.min(1.1, 0.85 + Math.sqrt(men) / 260));
        const mine = a.owner === s.playerFaction;
        const selected = a.id === this.view.selectedArmy;
        // Hidden behind the lead token when gathered.
        tok.c.visible = !(gathered && i > 0);
        tok.c.zIndex = selected ? 10 : mine ? 2 : 1;
        tok.badge.text = gathered && i === 0 ? `+${n - 1}` : '';
        // The plate carries the owner's colour; yours has a gold double border.
        const own = this.factionColor(a.owner);
        tok.ring.clear();
        const plateW = Math.max(28, tok.label.width + 10);
        if (selected) tok.ring.ellipse(0, 0, 21, 7.5).fill({ color: PALETTE.goldLight, alpha: 0.45 }).stroke({ width: 3, color: PALETTE.kesri });
        else tok.ring.ellipse(0, 0, 15, 5).fill({ color: own, alpha: 0.35 });
        if (mine) {
          tok.ring.roundRect(-plateW / 2 - 2, 0.5, plateW + 4, 17, 4).fill({ color: PALETTE.gold });
          tok.ring.roundRect(-plateW / 2, 2.5, plateW, 13, 3).fill({ color: PALETTE.wasli }).stroke({ width: 1, color: 0x8c6a1e });
        } else {
          tok.ring.roundRect(-plateW / 2, 2.5, plateW, 13, 3).fill({ color: mix(own, '#ffffff', 0.62) }).stroke({ width: 1.8, color: own });
        }
        if (tok.badge.text) tok.ring.circle(18, 3, 7).fill({ color: PALETTE.sindoor }).stroke({ width: 1, color: PALETTE.goldLight });
        // Selected army stands a little forward so it is never hidden.
        tok.c.scale.set(ARMY_SCALE * (selected ? 1.12 : 1));
        tok.glow.clear();
        if (a.josh && a.josh > 0) tok.glow.ellipse(0, -14, 20, 24).fill({ color: PALETTE.kesri, alpha: 0.28 });
        if (a.baggage && a.baggage.captives > 0) tok.glow.roundRect(-24, -10, 8, 8, 1).fill({ color: 0x8a6a3a }).stroke({ width: 0.6, color: PALETTE.ink });
      });
    }
    this.separateTokens();
    for (const [id, tok] of this.tokens) {
      if (!seen.has(id)) {
        tok.c.destroy({ children: true });
        this.tokens.delete(id);
      }
    }
  }

  /**
   * Keep visible army tokens apart across neighbouring regions too: towns can
   * sit close together, so after each region lays out its own row, any two
   * tokens closer than a plate's width are pushed apart (a few relaxation
   * passes, each pair moved equally).
   */
  private separateTokens() {
    const toks = [...this.tokens.values()].filter((t) => t.c.visible);
    const minX = ARMY_SPACING * 0.92,
      minY = 34;
    for (let pass = 0; pass < 24; pass++) {
      let moved = false;
      for (let i = 0; i < toks.length; i++)
        for (let j = i + 1; j < toks.length; j++) {
          const a = toks[i],
            b = toks[j];
          const dx = b.tx - a.tx,
            dy = b.ty - a.ty;
          // Overlap measured on an ellipse: plates are wider than tall.
          const nx = dx / minX,
            ny = dy / minY;
          const d = Math.hypot(nx, ny);
          if (d >= 1) continue;
          moved = true;
          const push = (1 - d) / 2 + 0.01;
          // Prefer sideways separation; nearly-coincident tokens split left/right.
          const ux = d < 1e-3 ? (i % 2 ? 1 : -1) : nx / d,
            uy = d < 1e-3 ? 0 : ny / d;
          a.tx -= ux * push * minX;
          a.ty -= uy * push * minY;
          b.tx += ux * push * minX;
          b.ty += uy * push * minY;
        }
      if (!moved) break;
    }
  }

  /* ── Animation ─────────────────────────────────────────────────────────── */

  private tick(dt: number) {
    if (!this.state) return;
    this.time += dt;
    const reduced = !!this.view.reducedMotion;
    // Newly seen country: a wash of colour spreads outward like ink into wet paper.
    const bg = this.layers.bleed;
    bg.clear();
    this.bleeds = this.bleeds.filter((b) => (b.t += dt / 1400) < 1);
    if (!reduced)
      for (const b of this.bleeds) {
        const geo = GEO.regions[b.id];
        const [ax, ay] = geo.anchor;
        const k = b.t;
        bg.poly(geo.poly.map((v, i) => (i % 2 === 0 ? ax + (v - ax) * k : ay + (v - ay) * k))).fill({ color: TERRAIN_WASH[REGION_BY_ID[b.id].terrain], alpha: 0.5 * (1 - k) });
        bg.poly(geo.poly).fill({ color: PALETTE.wasli, alpha: 0.55 * (1 - k) * (1 - k) });
      }
    for (const ink of Object.values(this.inkRegions)) {
      const age = (this.time - ink.since) / 4000;
      ink.g.alpha = reduced ? 1 : Math.min(1, age);
    }
    // Shimmer and banners at ~20 fps.
    if (Math.floor(this.time / 50) !== Math.floor((this.time - dt) / 50)) {
      this.drawShimmer();
      this.drawBanners();
      this.drawDiyas();
    }
    // Tokens glide toward their regions; dust rises on the march.
    for (const tok of this.tokens.values()) {
      const dx = tok.tx - tok.c.x,
        dy = tok.ty - tok.c.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 0.5) {
        const k = reduced ? 1 : Math.min(1, dt / 600);
        tok.c.x += dx * k;
        tok.c.y += dy * k;
        if (!reduced && dist > 4 && Math.random() < 0.5) this.dustParticles.push({ x: tok.c.x - Math.sign(dx) * 8, y: tok.c.y, life: 1, r: 2 + Math.random() * 3 });
      }
    }
    const dg = this.layers.dust;
    dg.clear();
    this.dustParticles = this.dustParticles.filter((p) => (p.life -= dt / 900) > 0);
    for (const p of this.dustParticles) dg.circle(p.x, p.y - (1 - p.life) * 6, p.r * (2 - p.life)).fill({ color: 0xa88a5a, alpha: p.life * 0.35 });
    // Clouds drift.
    if (!reduced) {
      for (const c of this.layers.clouds.children) {
        c.x += dt * 0.006;
        if (c.x > this.app.screen.width + 400) c.x = -400;
      }
    }
    // Mourning: muted colours when a sacred site is desecrated or a martyr falls.
    const mg = this.layers.mood;
    const target = this.moodAlpha;
    if (target > 0 || mg.alpha > 0.002) {
      mg.clear();
      mg.rect(0, 0, this.app.screen.width, this.app.screen.height).fill({ color: 0x4a443c });
      mg.alpha += (target - mg.alpha) * Math.min(1, dt / 1200);
    } else if (mg.alpha !== 0) {
      mg.clear();
      mg.alpha = 0;
    }
    // Labels by zoom.
    const showTowns = this.zoom > 1.25;
    const st = this.state;
    this.cityLabels.forEach((t, i) => {
      const seen = (st.explored[GEO.towns[i].region] ?? 0) > 0;
      t.alpha = showTowns && seen ? Math.min(1, (this.zoom - 1.25) * 3) : 0;
    });
    // Region names: each appears once its region is big enough on screen to
    // hold it. The wide regions beyond the Punjab keep their names readable when
    // zoomed far out by growing in the world as the view shrinks.
    for (const [id, t] of Object.entries(this.regionLabels)) {
      const span = Math.sqrt(GEO.regions[id].cells) * GEO.meta.cell;
      const onScreen = span * this.zoom;
      t.visible = onScreen > 60;
      if (!t.visible) continue;
      const want = PUNJAB_REGION_IDS.has(id) ? Math.max(0.75, Math.min(1.4, 1 / Math.sqrt(this.zoom))) : Math.max(0.9, Math.min((span * 0.7) / Math.max(1, t.width / t.scale.x), 1 / this.zoom));
      t.scale.set(want);
    }
    for (const t of this.seaLabels) t.scale.set(Math.max(1, 0.42 / this.zoom));

  }

  private drawBanners() {
    const g = this.layers.banners;
    g.clear();
    const t = this.time / 1000;
    const reduced = !!this.view.reducedMotion;
    for (const b of this.bannerSpots) {
      const f = FACTION_BY_ID[b.faction];
      if (!f) continue;
      const s = b.player ? 1.15 : 0.9;
      const px = b.x,
        py = b.y;
      g.moveTo(px, py).lineTo(px, py - 26 * s).stroke({ width: 1.2, color: 0x5a3a1e });
      g.circle(px, py - 26 * s, 1.4).fill(PALETTE.gold);
      const pts: number[] = [];
      const len = 18 * s;
      const segs = 6;
      for (let i = 0; i <= segs; i++) {
        const u = i / segs;
        const wave = reduced ? 0 : Math.sin(t * 3 + u * 4 + px * 0.01) * 1.6 * u;
        pts.push(px + u * len, py - 25 * s + u * 6 * s + wave);
      }
      for (let i = segs; i >= 0; i--) {
        const u = i / segs;
        const wave = reduced ? 0 : Math.sin(t * 3 + u * 4 + px * 0.01) * 1.6 * u;
        pts.push(px + u * len, py - 13 * s - u * 6 * s + wave);
      }
      g.poly(pts).fill(hexToNum(this.view.colorBlind ? this.factionColor(b.faction) : f.banner.field)).stroke({ width: 0.6, color: PALETTE.ink, alpha: 0.6 });
      g.moveTo(px, py - 15 * s).lineTo(px + len * 0.7, py - 18 * s).stroke({ width: 2 * s, color: hexToNum(f.banner.band), alpha: 0.95 });
    }
  }

  private drawDiyas() {
    const g = this.layers.diyas;
    g.clear();
    if (!this.diyaSpots.length) return;
    const t = this.time / 1000;
    for (const [x, y] of this.diyaSpots) {
      for (let i = 0; i < 5; i++) {
        const fx = x - 10 + i * 5,
          fy = y + 6 + (i % 2) * 2;
        const fl = 0.6 + 0.4 * Math.sin(t * 9 + i * 1.7 + x);
        g.circle(fx, fy, 3.2).fill({ color: 0xffc04a, alpha: 0.18 * fl });
        g.ellipse(fx, fy - 0.6, 0.8, 1.5).fill({ color: 0xffe08a, alpha: 0.9 * fl });
      }
    }
  }

  /* ── Camera ────────────────────────────────────────────────────────────── */

  fit() {
    const sw = this.app.screen.width,
      sh = this.app.screen.height;
    const z = Math.min(sw / (W + 160), sh / (H + 160));
    this.minZoom = z * 0.85;
    this.setZoom(z);
    this.world.x = (sw - W * z) / 2;
    this.world.y = (sh - H * z) / 2;
  }

  focusOn(region: string, zoom = 1.6) {
    const geo = GEO.regions[region];
    if (!geo) return;
    this.setZoom(zoom);
    this.world.x = this.app.screen.width / 2 - geo.anchor[0] * zoom;
    this.world.y = this.app.screen.height / 2 - geo.anchor[1] * zoom;
  }

  private setZoom(z: number) {
    const wasGathered = this.zoom < GATHER_BELOW_ZOOM;
    this.zoom = Math.max(this.minZoom, Math.min(6, z));
    this.world.scale.set(this.zoom);
    // Crossing the gathering threshold re-lays out the army tokens.
    if (wasGathered !== this.zoom < GATHER_BELOW_ZOOM && this.state) this.syncTokens(this.state);
  }

  zoomBy(f: number, cx = this.app.screen.width / 2, cy = this.app.screen.height / 2) {
    const wx = (cx - this.world.x) / this.zoom;
    const wy = (cy - this.world.y) / this.zoom;
    this.setZoom(this.zoom * f);
    this.world.x = cx - wx * this.zoom;
    this.world.y = cy - wy * this.zoom;
  }

  panBy(dx: number, dy: number) {
    this.world.x += dx;
    this.world.y += dy;
  }

  /** The arrow drawn while an army is dragged: from the army to the pointer. */
  private drawDragArrow(id: string, gx: number, gy: number, split: boolean) {
    const tok = this.tokens.get(id);
    const g = this.layers.drag;
    g.clear();
    if (!tok) return;
    const x0 = tok.c.x,
      y0 = tok.c.y - 12;
    const x1 = (gx - this.world.x) / this.zoom,
      y1 = (gy - this.world.y) / this.zoom;
    const color = split ? 0x1f3a68 : PALETTE.sindoor;
    const ang = Math.atan2(y1 - y0, x1 - x0);
    g.moveTo(x0, y0).lineTo(x1 - Math.cos(ang) * 6, y1 - Math.sin(ang) * 6).stroke({ width: 3 / Math.sqrt(this.zoom), color, alpha: 0.85, cap: 'round' });
    const s = 11 / Math.sqrt(this.zoom);
    g.poly([x1, y1, x1 - Math.cos(ang - 0.45) * s, y1 - Math.sin(ang - 0.45) * s, x1 - Math.cos(ang + 0.45) * s, y1 - Math.sin(ang + 0.45) * s]).fill({ color, alpha: 0.95 });
    g.circle(x0, y0 + 12, 9).stroke({ width: 2, color, alpha: 0.8 });
  }

  /**
   * Input. Army tokens are the only Pixi-interactive objects (the stage stays
   * 'passive', because a 'static' ancestor makes every overlay and label
   * hit-testable in Pixi 8 and they would swallow clicks). Everything else —
   * clicks on land, right-clicks, panning, army drags, pinch and wheel zoom — is
   * read from plain DOM pointer events on the canvas.
   *
   *   left click on land      → select the region
   *   left click on an army   → select the army      (token pointerdown, below)
   *   left drag on land       → pan
   *   left drag on your army  → march order (Ctrl/Alt: divide and send half)
   *   right click on land     → order / quick actions
   *   right click on an army  → army orders          (token rightclick)
   */
  private domOff: (() => void)[] = [];

  private tokenAt(x: number, y: number): boolean {
    const hit = this.app.renderer.events.rootBoundary.hitTest(x, y);
    for (let c = hit as Container | null; c; c = c.parent) if (c.parent === this.layers.armies) return true;
    return false;
  }

  private setupInput() {
    this.app.stage.eventMode = 'passive';
    const canvas = this.app.canvas;
    const local = (e: PointerEvent | MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const on = <K extends keyof WindowEventMap>(t: Window | HTMLElement, type: K, fn: (e: WindowEventMap[K]) => void, opts?: AddEventListenerOptions) => {
      t.addEventListener(type, fn as EventListener, opts);
      this.domOff.push(() => t.removeEventListener(type, fn as EventListener, opts));
    };

    on(canvas, 'contextmenu', (e) => {
      e.preventDefault();
      const p = local(e);
      if (this.tokenAt(p.x, p.y)) return; // the token's own rightclick handles it
      const id = this.regionAt(p.x, p.y);
      if (id) this.cb.onRegionClick(id, { shift: e.shiftKey, right: true, x: e.clientX, y: e.clientY });
    });

    // Pixi's own canvas listener runs first, so a press on a token has already
    // set armyDrag by the time this runs.
    on(canvas, 'pointerdown', (e) => {
      const p = local(e);
      this.pinch.set(e.pointerId, p);
      if (this.pinch.size === 2) {
        const [a, b] = [...this.pinch.values()];
        this.pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
        this.armyDrag = null;
        this.layers.drag.clear();
      }
      if (e.button !== 0 || this.armyDrag) return;
      this.dragging = { x: p.x, y: p.y, wx: this.world.x, wy: this.world.y, moved: false };
    });

    on(window, 'pointermove', (e) => {
      const p = local(e);
      if (this.pinch.has(e.pointerId)) this.pinch.set(e.pointerId, p);
      if (this.pinch.size === 2) {
        const [a, b] = [...this.pinch.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (this.pinchDist > 0) this.zoomBy(d / this.pinchDist, (a.x + b.x) / 2, (a.y + b.y) / 2);
        this.pinchDist = d;
        if (this.dragging) this.dragging.moved = true;
        return;
      }
      if (this.armyDrag) {
        const d = this.armyDrag;
        if (!d.moved && Math.hypot(p.x - d.x, p.y - d.y) > 8) {
          d.moved = true;
          d.ok = this.cb.onArmyDragStart(d.id);
        }
        if (d.moved && d.ok) {
          this.setHover(this.regionAt(p.x, p.y));
          this.drawDragArrow(d.id, p.x, p.y, e.ctrlKey || e.altKey);
        }
        return;
      }
      if (this.dragging) {
        const dx = p.x - this.dragging.x,
          dy = p.y - this.dragging.y;
        if (!this.dragging.moved && Math.hypot(dx, dy) > 8) this.dragging.moved = true;
        if (this.dragging.moved) {
          this.world.x = this.dragging.wx + dx;
          this.world.y = this.dragging.wy + dy;
          canvas.style.cursor = 'grabbing';
        }
        return;
      }
      // Over a panel, button or tooltip: the map is not being hovered, so its
      // card must not cover the UI's own tooltips.
      if (e.target !== canvas) {
        this.setHover(null);
        canvas.style.cursor = '';
        return;
      }
      if (this.tokenAt(p.x, p.y)) {
        this.setHover(null);
        canvas.style.cursor = 'pointer';
      } else this.setHover(this.regionAt(p.x, p.y));
    });

    const up = (e: PointerEvent) => {
      const p = local(e);
      this.pinch.delete(e.pointerId);
      if (this.pinch.size < 2) this.pinchDist = 0;
      const d = this.armyDrag;
      if (d) {
        this.armyDrag = null;
        this.layers.drag.clear();
        if (!d.moved) {
          // A gathered stack: come closer so its armies spread out.
          const tok = this.tokens.get(d.id);
          const army = this.state?.armies[d.id];
          if (tok?.badge.text && army) this.focusOn(army.region, Math.max(GATHER_BELOW_ZOOM + 0.5, this.zoom * 1.6));
          this.cb.onArmyClick(d.id);
        } else if (d.ok) this.cb.onArmyDrop(d.id, this.regionAt(p.x, p.y), e.ctrlKey || e.altKey);
        return;
      }
      const g = this.dragging;
      this.dragging = null;
      if (!g || e.button !== 0) return;
      canvas.style.cursor = '';
      if (g.moved || e.target !== canvas) return;
      const id = this.regionAt(p.x, p.y);
      if (id) this.cb.onRegionClick(id, { shift: e.shiftKey, right: false, x: e.clientX, y: e.clientY });
    };
    on(window, 'pointerup', up);
    on(canvas, 'pointerleave', () => {
      if (!this.armyDrag && !this.dragging) this.setHover(null);
    });
    on(window, 'pointercancel', (e) => {
      this.pinch.delete(e.pointerId);
      this.dragging = null;
      this.armyDrag = null;
      this.layers.drag.clear();
    });
    on(
      canvas,
      'wheel',
      (e) => {
        e.preventDefault();
        const p = local(e);
        this.zoomBy(Math.exp(-e.deltaY * 0.0015), p.x, p.y);
      },
      { passive: false },
    );
  }
}
