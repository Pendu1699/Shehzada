// The ending: the player's Vaar on an illuminated manuscript page, exportable as PNG.

import { useMemo } from 'react';
import { audio } from '../audio/engine';
import { Banner } from '../art/Banner';
import { makePaperCanvas } from '../art/paper';
import { PALETTE } from '../art/palette';
import { composeVaar, type Vaar } from '../narrative/vaar';
import { useStore } from '../store';

const ENDING_NAMES: Record<string, string> = {
  sovereign: 'The Khalsa Raj endures',
  protected: 'A protected state',
  annexation: 'Annexation',
  ghallughara: 'Ghallughara',
};

function wrap(ctx: CanvasRenderingContext2D, text: string, width: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (ctx.measureText(t).width > width && line) {
      lines.push(line);
      line = w;
    } else line = t;
  }
  if (line) lines.push(line);
  return lines;
}

/** Draw the Vaar onto a canvas as an illuminated page and download it. */
export async function exportVaarPng(v: Vaar, ending: string) {
  await document.fonts.ready;
  const W = 1400,
    H = 1900;
  const cv = makePaperCanvas({ width: W, height: H, seed: 99, foxing: 0.8, vignette: 0.5 });
  const ctx = cv.getContext('2d')!;
  // Borders: neela band, gold rules, sindoor inner rule, rosettes.
  ctx.fillStyle = PALETTE.neela;
  const b = 60;
  ctx.fillRect(30, 30, W - 60, b);
  ctx.fillRect(30, H - 30 - b, W - 60, b);
  ctx.fillRect(30, 30, b, H - 60);
  ctx.fillRect(W - 30 - b, 30, b, H - 60);
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 4;
  ctx.strokeRect(30, 30, W - 60, H - 60);
  ctx.lineWidth = 3;
  ctx.strokeRect(30 + b, 30 + b, W - 60 - 2 * b, H - 60 - 2 * b);
  ctx.strokeStyle = PALETTE.sindoor;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(30 + b + 10, 30 + b + 10, W - 60 - 2 * b - 20, H - 60 - 2 * b - 20);
  const rosette = (x: number, y: number, r: number) => {
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      ctx.fillStyle = PALETTE.gold;
      ctx.beginPath();
      ctx.ellipse(x + Math.cos(a) * r, y + Math.sin(a) * r, r * 0.7, r * 0.32, a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = PALETTE.sindoor;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.5, 0, Math.PI * 2);
    ctx.fill();
  };
  for (const [x, y] of [
    [60, 60],
    [W - 60, 60],
    [60, H - 60],
    [W - 60, H - 60],
  ])
    rosette(x, y, 16);
  for (let x = 140; x < W - 120; x += 90) {
    rosette(x, 60, 7);
    rosette(x, H - 60, 7);
  }
  for (let y = 150; y < H - 120; y += 90) {
    rosette(60, y, 7);
    rosette(W - 60, y, 7);
  }
  // Title.
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.sindoor;
  ctx.font = '64px "Tiro Gurmukhi", serif';
  ctx.fillText('ਵਾਰ', W / 2, 190);
  ctx.fillStyle = PALETTE.neela;
  ctx.font = '700 52px "Cormorant Garamond", serif';
  ctx.fillText(v.title, W / 2, 255);
  ctx.fillStyle = PALETTE.ink;
  ctx.font = 'italic 600 30px "Cormorant Garamond", serif';
  ctx.fillText(`${v.subtitle} · ${ENDING_NAMES[ending] ?? ''}`, W / 2, 300);
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(200, 325);
  ctx.lineTo(W - 200, 325);
  ctx.stroke();
  // Stanzas.
  ctx.textAlign = 'left';
  let y = 380;
  const x0 = 170,
    width = W - 340;
  for (const [i, st] of v.stanzas.entries()) {
    ctx.font = '27px "EB Garamond", serif';
    const lines = wrap(ctx, st, width - 50);
    if (y + lines.length * 36 > H - 330) break;
    ctx.fillStyle = PALETTE.sindoor;
    ctx.font = '40px "Rozha One", serif';
    ctx.fillText(String.fromCharCode(0x2766), x0 - 50, y + 4);
    ctx.fillStyle = PALETTE.ink;
    ctx.font = '27px "EB Garamond", serif';
    for (const l of lines) {
      ctx.fillText(l, x0, y);
      y += 36;
    }
    y += i === 0 ? 20 : 12;
  }
  // Tallies.
  y = Math.max(y + 10, H - 300);
  ctx.font = '600 24px "Cormorant Garamond", serif';
  const colW = width / 4;
  v.tallies.forEach((t, i) => {
    const cx = x0 + (i % 4) * colW;
    const cy = y + Math.floor(i / 4) * 64;
    ctx.fillStyle = PALETTE.sindoor;
    ctx.fillText(t.value, cx, cy);
    ctx.fillStyle = PALETTE.ink;
    ctx.font = '20px "EB Garamond", serif';
    ctx.fillText(t.label, cx, cy + 26);
    ctx.font = '600 24px "Cormorant Garamond", serif';
  });
  ctx.textAlign = 'center';
  ctx.font = 'italic 24px "EB Garamond", serif';
  ctx.fillStyle = PALETTE.ink;
  ctx.fillText(v.closing, W / 2, H - 120);
  const url = cv.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = 'my-vaar.png';
  a.click();
}

export function VaarPage() {
  const game = useStore((s) => s.game)!;
  const setScreen = useStore((s) => s.setScreen);
  const v = useMemo(() => composeVaar(game), [game]);
  const ending = game.ending?.kind ?? 'annexation';
  useMemo(() => {
    audio.setMood(ending === 'sovereign' ? 'celebration' : ending === 'ghallughara' || ending === 'annexation' ? 'mourning' : 'twilight');
  }, [ending]);
  return (
    <div className="modal-backdrop" style={{ background: 'rgba(20,14,8,0.8)' }}>
      <div className="modal folio" style={{ width: 'min(980px, 96vw)', maxHeight: '94vh' }} role="dialog" aria-label="Your vaar">
        <div className="folio-inner" style={{ maxHeight: 'calc(94vh - 30px)' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="gurmukhi" style={{ fontSize: '2.4em', color: 'var(--sindoor)' }}>
              ਵਾਰ
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--neela)', margin: 0, fontSize: '2.2em' }}>{v.title}</h1>
            <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '1.2em' }}>
              {v.subtitle} · {ENDING_NAMES[ending]}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', margin: '6px 0' }}>
              <Banner faction={game.playerFaction} height={90} />
            </div>
          </div>
          <div className="rule" />
          <div className="dhadi-text" style={{ columns: '2 320px', columnGap: 30 }}>
            {v.stanzas.map((st, i) => (
              <p key={i} style={{ breakInside: 'avoid' }}>
                {st}
              </p>
            ))}
          </div>
          <div className="rule" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, textAlign: 'center' }}>
            {v.tallies.map((t) => (
              <div key={t.label}>
                <div style={{ fontFamily: 'var(--font-accent)', fontSize: '1.6em', color: 'var(--sindoor)' }}>{t.value}</div>
                <div className="small">{t.label}</div>
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', fontStyle: 'italic' }}>{v.closing}</p>
          <div className="row" style={{ justifyContent: 'center' }}>
            <button className="btn kesri" onClick={() => exportVaarPng(v, ending)}>
              Save the page as an image
            </button>
            <button className="btn" onClick={() => setScreen('title')}>
              Return to the title
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
