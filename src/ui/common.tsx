import { useState, type ReactNode } from 'react';
import type { Breakdown } from '../engine/query';
import { useStore } from '../store';

export const fmt = (n: number, digits = 0) => (Math.round(n * 10 ** digits) / 10 ** digits).toLocaleString('en-IN', { maximumFractionDigits: digits, minimumFractionDigits: 0 });
export const rs = (n: number) => `₹${fmt(n)}k`;
export const signed = (n: number, d = 1) => `${n >= 0 ? '+' : '−'}${fmt(Math.abs(n), d)}`;

/** Hover tooltip that follows the pointer. Content can be any node. */
export function Tip({ title, content, children, className }: { title?: string; content: ReactNode; children: ReactNode; className?: string }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  return (
    <span
      className={className}
      onPointerEnter={(e) => setPos({ x: e.clientX, y: e.clientY })}
      onPointerMove={(e) => setPos({ x: e.clientX, y: e.clientY })}
      onPointerLeave={() => setPos(null)}
      onFocus={(e) => {
        const r = (e.target as HTMLElement).getBoundingClientRect();
        setPos({ x: r.left, y: r.bottom });
      }}
      onBlur={() => setPos(null)}
      style={{ display: 'inline-flex' }}
    >
      {children}
      {pos && (
        <div className="tip" style={{ left: Math.min(pos.x + 14, window.innerWidth - 330), top: Math.min(pos.y + 16, window.innerHeight - 160) }}>
          {title && <div className="tip-title">{title}</div>}
          {content}
        </div>
      )}
    </span>
  );
}

export function BreakdownView({ b, unit = '', digits = 1 }: { b: Breakdown; unit?: string; digits?: number }) {
  return (
    <div>
      {b.parts.map((p, i) => (
        <div className="tip-row" key={i}>
          <span>{p.label}</span>
          <span className={p.value < 0 ? 'neg' : 'pos'}>
            {signed(p.value, digits)}
            {unit}
          </span>
        </div>
      ))}
      <div className="tip-row" style={{ borderTop: '1px solid var(--gold)', marginTop: 3, fontWeight: 700 }}>
        <span>Total</span>
        <span>
          {signed(b.total, digits)}
          {unit}
        </span>
      </div>
    </div>
  );
}

export function Folio({ children, className, style }: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`folio ${className ?? ''}`} style={style}>
      <div className="folio-inner">{children}</div>
    </div>
  );
}

export function Heading({ en, pa, right }: { en: string; pa?: string; right?: ReactNode }) {
  return (
    <div className="heading-band">
      <h2>{en}</h2>
      {pa && <span className="gurmukhi">{pa}</span>}
      <span style={{ flex: 1 }} />
      {right}
    </div>
  );
}

export function Modal({ children, onClose, wide, className, hideClose }: { children: ReactNode; onClose?: () => void; wide?: boolean; className?: string; hideClose?: boolean }) {
  const close = useStore((s) => s.closeModal);
  const doClose = onClose ?? close;
  return (
    <div className="modal-backdrop" onPointerDown={(e) => e.target === e.currentTarget && doClose()}>
      <div className={`modal folio ${className ?? ''}`} style={wide ? { width: 'min(1100px, 96vw)' } : undefined} role="dialog" aria-modal="true">
        {!hideClose && (
          <button className="btn small neela modal-close" onClick={doClose} aria-label="Close">
            ✕
          </button>
        )}
        <div className="folio-inner">{children}</div>
      </div>
    </div>
  );
}

export function Bar({ value, max = 100, color }: { value: number; max?: number; color?: string }) {
  return (
    <div className="bar">
      <div style={{ width: `${Math.max(0, Math.min(100, (value / max) * 100))}%`, background: color }} />
    </div>
  );
}
