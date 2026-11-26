// The animated battle: the two armies in their own dress (the map's soldier
// figures), drawn live with Pixi. Horse gallop and charge, the foot fire
// volleys with flash and smoke, guns recoil and throw their shot, men fall as
// the losses come in, and at the end the winner holds the field.

import { Application, Container, Graphics } from 'pixi.js';
import { useEffect, useRef } from 'react';
import { FACTION_BY_ID } from '../data/factions';
import type { BattleReport, GameState } from '../engine/state';
import { kitFor, soldierFoot, soldierGun, soldierHorse, type Kit } from '../map/soldiers';

const W = 800,
  H = 240;

type Kind = 'horse' | 'foot' | 'gun';

interface Fig {
  g: Graphics;
  kind: Kind;
  side: 1 | -1;
  homeX: number;
  y: number;
  phase: number;
  fallen: number; // 0 standing → 1 down
  fireAt: number;
}

interface Particle {
  g: Graphics;
  vx: number;
  vy: number;
  life: number;
  max: number;
  grow: number;
  kind: 'smoke' | 'flash' | 'ball' | 'dust';
  tx?: number;
}

/** A rough picture of what each army brought, by who it was. */
function composition(s: GameState, owner: string): { horse: number; foot: number; gun: number; footUnit: string; horseUnit: string } {
  const sarkar = !!s.factions[owner]?.sarkar;
  if (owner === 'company') return { horse: 0.2, foot: 0.65, gun: 0.15, footUnit: 'sepoy', horseUnit: 'company_cav' };
  if (sarkar) return { horse: 0.3, foot: 0.5, gun: 0.2, footUnit: 'fauj_ain_inf', horseUnit: 'ghorchare' };
  if (owner === 'shaheedan') return { horse: 0.5, foot: 0.5, gun: 0, footUnit: 'nihang', horseUnit: 'nihang' };
  if (FACTION_BY_ID[owner]?.sikh) return { horse: 0.8, foot: 0.2, gun: 0, footUnit: 'jezailchi', horseUnit: 'ghorchare' };
  if (owner === 'durrani' || owner === 'maratha') return { horse: 0.75, foot: 0.15, gun: 0.1, footUnit: 'jezailchi', horseUnit: owner === 'durrani' ? 'durrani_cav' : 'maratha_cav' };
  return { horse: 0.4, foot: 0.45, gun: 0.15, footUnit: 'piyada', horseUnit: 'mughal_cav' };
}

export function BattleScene({ game, report, round, total, lost }: { game: GameState; report: BattleReport; round: number; total: number; lost: { a: number; d: number } }) {
  const host = useRef<HTMLDivElement>(null);
  const live = useRef({ round, total, lost, reduced: false });
  live.current = { round, total, lost, reduced: !!useReduced() };

  useEffect(() => {
    if (!host.current) return;
    const app = new Application();
    let alive = true;
    const figs: Fig[] = [];
    const parts: Particle[] = [];
    void (async () => {
      await app.init({ width: W, height: H, backgroundAlpha: 0, antialias: true, resolution: Math.min(2, window.devicePixelRatio || 1), autoDensity: true });
      if (!alive) {
        app.destroy({ removeView: true });
        return;
      }
      app.canvas.style.width = '100%';
      app.canvas.style.height = 'auto';
      host.current!.appendChild(app.canvas);
      const field = new Container();
      const fx = new Container();
      app.stage.addChild(field, fx);
      field.sortableChildren = true;

      // Ground: a strip of dry plain with a few tufts.
      const ground = new Graphics();
      ground.rect(0, 0, W, H).fill(0xe7d4a6);
      ground.moveTo(0, 92).quadraticCurveTo(200, 80, 400, 92).quadraticCurveTo(600, 100, 800, 88).lineTo(800, H).lineTo(0, H).closePath().fill(0xd8bf86);
      for (let i = 0; i < 26; i++) ground.moveTo((i * 37) % W, 110 + ((i * 53) % 120)).quadraticCurveTo(((i * 37) % W) + 3, 104 + ((i * 53) % 120), ((i * 37) % W) + 6, 110 + ((i * 53) % 120)).stroke({ width: 1, color: 0x8a8a4a, alpha: 0.6 });
      field.addChild(ground);

      const build = (owner: string, men: number, side: 1 | -1) => {
        const comp = composition(game, owner);
        const sarkar = !!game.factions[owner]?.sarkar;
        const kits: Record<Kind, Kit> = {
          horse: kitFor(owner, comp.horseUnit, false),
          foot: kitFor(owner, comp.footUnit, sarkar && comp.footUnit.startsWith('fauj')),
          gun: kitFor(owner, comp.footUnit, sarkar),
        };
        const cloth = FACTION_BY_ID[owner]?.color ?? '#C9A13B';
        const n = Math.min(26, Math.max(6, Math.round(Math.sqrt(men) / 3)));
        const nGun = comp.gun > 0 ? Math.max(1, Math.round(n * comp.gun * 0.5)) : 0;
        const nHorse = Math.round((n - nGun) * comp.horse / (comp.horse + comp.foot));
        const nFoot = n - nGun - nHorse;
        const list: Kind[] = [...Array(nGun).fill('gun'), ...Array(nFoot).fill('foot'), ...Array(nHorse).fill('horse')];
        // Guns at the back, foot in front of them, horse on the wing toward the enemy.
        const counters: Record<Kind, number> = { horse: 0, foot: 0, gun: 0 };
        for (const kind of list) {
          const i = counters[kind]++;
          const rank = i % 3;
          const file = Math.floor(i / 3);
          const base = kind === 'gun' ? 50 : kind === 'foot' ? 120 : 200;
          const x = side === 1 ? base + file * 22 + rank * 7 : W - base - file * 22 - rank * 7;
          const y = 120 + rank * 34 + (kind === 'gun' ? 10 : 0);
          const ctx = kind === 'horse' ? soldierHorse(kits.horse, i, cloth) : kind === 'foot' ? soldierFoot(kits.foot) : soldierGun(kits.gun, cloth);
          const g = new Graphics(ctx);
          g.scale.set(side * 1.25, 1.25);
          g.x = x;
          g.y = y;
          g.zIndex = y;
          field.addChild(g);
          figs.push({ g, kind, side, homeX: x, y, phase: Math.random() * 6, fallen: 0, fireAt: 400 + Math.random() * 2400 });
        }
      };
      build(report.attacker, report.aMen, 1);
      build(report.defender, report.dMen, -1);

      const puff = (x: number, y: number, kind: Particle['kind'], vx = 0, vy = 0, max = 1200, tx?: number) => {
        const g = new Graphics();
        if (kind === 'flash') g.star(0, 0, 6, 5, 2).fill(0xffe38a);
        else if (kind === 'ball') g.circle(0, 0, 2.2).fill(0x2a2a2a);
        else if (kind === 'dust') g.circle(0, 0, 8).fill({ color: 0xb08a5a, alpha: 0.5 });
        else g.circle(0, 0, 7).fill({ color: 0xf4f0e6, alpha: 0.85 });
        g.x = x;
        g.y = y;
        fx.addChild(g);
        parts.push({ g, vx, vy, life: 0, max, grow: kind === 'smoke' ? 1.6 : kind === 'dust' ? 2.2 : 0, kind, tx });
      };

      let t = 0;
      app.ticker.add((tk) => {
        const dt = tk.deltaMS;
        t += dt;
        const { round: r, total: tot, lost: l, reduced } = live.current;
        const done = r >= tot && tot > 0;
        const fighting = r > 0 && !done;
        const winner = report.winner === 'attacker' ? 1 : report.winner === 'defender' ? -1 : 0;
        const aFrac = Math.min(0.85, l.a / Math.max(1, report.aMen));
        const dFrac = Math.min(0.85, l.d / Math.max(1, report.dMen));
        const sideFigs = (side: 1 | -1) => figs.filter((f) => f.side === side);
        for (const side of [1, -1] as const) {
          const own = sideFigs(side);
          const want = Math.round(own.length * (side === 1 ? aFrac : dFrac));
          // The figures nearest the enemy fall first.
          const order = [...own].sort((a, b) => side * (b.homeX - a.homeX));
          order.forEach((f, i) => {
            const target = i < want ? 1 : 0;
            f.fallen += (target - f.fallen) * Math.min(1, dt / 500);
          });
        }
        for (const f of figs) {
          const g = f.g;
          const s = f.side;
          f.phase += dt / (f.kind === 'horse' ? 110 : 260);
          // Movement: horse charge in each round and wheel back between; the
          // winner advances at the end, the loser falls back.
          let dx = 0;
          if (f.kind === 'horse' && fighting) {
            const cyc = (t / 1900) % 1;
            const reach = report.stance === 'dhai_phat' && s === 1 ? 0.6 : 1;
            dx = Math.sin(cyc * Math.PI) * 150 * reach;
          } else if (f.kind === 'foot' && fighting) dx = Math.min(1, r / Math.max(1, tot)) * 40;
          if (done) dx = winner === s ? 70 : winner === -s ? -60 : 0;
          const targetX = f.homeX + s * dx;
          g.x += (targetX - g.x) * Math.min(1, dt / (f.kind === 'horse' ? 180 : 500));
          const bob = reduced || f.fallen > 0.5 ? 0 : f.kind === 'horse' && fighting ? Math.abs(Math.sin(f.phase)) * -3 : f.kind === 'foot' ? Math.sin(f.phase) * 0.4 : 0;
          g.y = f.y + bob + f.fallen * 6;
          g.rotation = s * f.fallen * -1.3;
          g.alpha = done && winner === -s ? Math.max(0.25, 1 - f.fallen * 0.7) * 0.85 : 1 - f.fallen * 0.55;
          // Fire.
          if (!fighting || reduced || f.fallen > 0.4) continue;
          f.fireAt -= dt;
          if (f.fireAt > 0) continue;
          if (f.kind === 'foot') {
            f.fireAt = 1600 + Math.random() * 1800;
            const mx = g.x + s * 17,
              my = g.y - 33;
            puff(mx, my, 'flash', 0, 0, 120);
            for (let k = 0; k < 3; k++) puff(mx + s * k * 3, my - k, 'smoke', s * (0.01 + Math.random() * 0.02), -0.008, 1600 + Math.random() * 800);
          } else if (f.kind === 'gun') {
            f.fireAt = 2600 + Math.random() * 1600;
            const mx = g.x + s * 21,
              my = g.y - 14;
            g.x -= s * 6; // recoil
            puff(mx, my, 'flash', 0, 0, 160);
            for (let k = 0; k < 6; k++) puff(mx + s * k * 4, my - k * 2, 'smoke', s * (0.015 + Math.random() * 0.03), -0.012, 2200 + Math.random() * 1000);
            const tx = W / 2 + s * (60 + Math.random() * 160);
            puff(mx, my, 'ball', s * 0.5, -0.32, 3000, tx);
          } else if (f.kind === 'horse') {
            f.fireAt = 900 + Math.random() * 900;
            if (Math.abs(g.x - W / 2) < 120) puff(g.x - s * 10, g.y + 2, 'dust', -s * 0.02, -0.01, 1100);
          }
        }
        for (let i = parts.length - 1; i >= 0; i--) {
          const p = parts[i];
          p.life += dt;
          if (p.kind === 'ball') {
            p.vy += 0.0006 * dt;
            p.g.x += p.vx * dt;
            p.g.y += p.vy * dt;
            if ((p.vx > 0 && p.g.x >= (p.tx ?? 0)) || (p.vx < 0 && p.g.x <= (p.tx ?? 0)) || p.g.y > 210) {
              for (let k = 0; k < 4; k++) puff(p.g.x + (Math.random() - 0.5) * 10, p.g.y, 'dust', (Math.random() - 0.5) * 0.04, -0.02, 1000);
              p.life = p.max;
            }
          } else {
            p.g.x += p.vx * dt;
            p.g.y += p.vy * dt;
            const k = p.life / p.max;
            p.g.scale.set(1 + k * p.grow);
            p.g.alpha = p.kind === 'flash' ? 1 - k : (1 - k) * (p.kind === 'smoke' ? 0.9 : 0.7);
          }
          if (p.life >= p.max) {
            p.g.destroy();
            parts.splice(i, 1);
          }
        }
      });
    })();
    return () => {
      alive = false;
      try {
        // Not destroy(true): that also releases Pixi's global pools, which the map's
        // own renderer is still using, and the map paints blank afterwards.
        app.destroy({ removeView: true }, { children: true });
      } catch {
        /* not initialised */
      }
    };
  }, [report.id]);

  return <div ref={host} className="battle-canvas" />;
}

function useReduced(): boolean {
  try {
    return document.querySelector('.game.reduced-motion') !== null;
  } catch {
    return false;
  }
}
