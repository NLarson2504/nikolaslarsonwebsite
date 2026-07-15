import React, { useEffect, useRef, useState } from 'react';
import { PIXEL_PALS, PALETTE, PAL_SIZE } from './pixelPals';

/**
 * The "agent at work" render on the right of the Agents page: a panel holding
 * the agent's streaming log, with a tiny 8-bit "pixel pal" perched on the top
 * edge that bobs, blinks, and switches to its "working" face while the log runs.
 *
 * Each agent (lira / tallie / kidd) streams illustrative log lines so it reads
 * as a live backend service. Lines are generic by design — no real data;
 * nothing here calls a real backend.
 */

/* ---- pixel pal ------------------------------------------------------------
 * Draws a 16×16 sprite to a crisp canvas. Idle bobs 1px and blinks (frame 2);
 * while `working` it holds the work frame. */
function PixelPal({ slug, working }) {
  const canvasRef = useRef(null);
  const reduce =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    const pal = PIXEL_PALS[slug];
    const canvas = canvasRef.current;
    if (!pal || !canvas) return undefined;
    const cell = 5; // device px per sprite pixel (before DPR)
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const size = PAL_SIZE * cell;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.imageSmoothingEnabled = false;

    const drawGrid = (grid) => {
      ctx.clearRect(0, 0, size, size);
      for (let y = 0; y < PAL_SIZE; y += 1) {
        const row = grid[y] || '';
        for (let x = 0; x < PAL_SIZE; x += 1) {
          const color = PALETTE[row[x]];
          if (!color) continue;
          ctx.fillStyle = color;
          ctx.fillRect(x * cell, y * cell, cell, cell);
        }
      }
    };

    if (reduce) {
      drawGrid(working ? pal.work : pal.idle[0]);
      return undefined;
    }

    let raf;
    let last = 0;
    let blinkTimer = performance.now() + 2200 + Math.random() * 2000;
    let blinking = false;
    const loop = (now) => {
      // blink pulse every couple seconds
      if (!working && now > blinkTimer) {
        blinking = true;
        if (now > blinkTimer + 130) {
          blinking = false;
          blinkTimer = now + 2200 + Math.random() * 2200;
        }
      }
      if (now - last > 90) {
        last = now;
        const grid = working ? pal.work : blinking ? pal.idle[1] : pal.idle[0];
        drawGrid(grid);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [slug, working, reduce]);

  return (
    <canvas
      ref={canvasRef}
      className={`agt-pal${working ? ' is-working' : ''}`}
      aria-hidden="true"
    />
  );
}

// Illustrative, deliberately vague activity — evokes an agent working through a
// request (receive → understand → gather → analyze → respond) without exposing
// real tools, models, counts, or architecture.
const LOGS = {
  lira: [
    { dim: '$', text: 'lira · listening' },
    { ts: true, text: 'new document received' },
    { ts: true, text: 'reading…' },
    { ts: true, text: 'extracting the details that matter' },
    { ts: true, ok: true, text: 'reconciled against records' },
    { ts: true, ok: true, text: 'done' },
    { ts: true, text: 'waiting for the next one' },
  ],
  tallie: [
    { dim: '›', text: 'asked about recent cost changes' },
    { ts: true, text: 'understanding the question' },
    { ts: true, text: 'gathering the relevant figures…' },
    { ts: true, text: 'analyzing' },
    { ts: true, ok: true, text: 'found what matters' },
    { ts: true, ok: true, text: 'answered' },
  ],
  kidd: [
    { dim: '›', text: 'asked about campus' },
    { ts: true, text: 'understanding the question' },
    { ts: true, text: 'checking a few sources…' },
    { ts: true, ok: true, text: 'pulled the latest' },
    { ts: true, text: 'putting the answer together' },
    { ts: true, ok: true, text: 'answered' },
  ],
};

const stamp = (i) => {
  const base = 10 * 3600 + 42 * 60 + 1 + i;
  const hh = String(Math.floor(base / 3600) % 24).padStart(2, '0');
  const mm = String(Math.floor(base / 60) % 60).padStart(2, '0');
  const ss = String(base % 60).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
};

const AgentTerminal = ({ agent }) => {
  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const slug = agent?.slug || '';
  const script = LOGS[slug] || [];

  // Stream the log lines in; `n` lines shown. The pal is "working" while the
  // stream is advancing, then rests once the run completes.
  const [n, setN] = useState(reduceMotion ? script.length : 0);
  const timers = useRef([]);
  const logRef = useRef(null);

  useEffect(() => {
    setN(reduceMotion ? script.length : 0);
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (reduceMotion) return undefined;
    script.forEach((_, i) => {
      timers.current.push(setTimeout(() => setN(i + 1), 300 + i * 640));
    });
    return () => timers.current.forEach(clearTimeout);
  }, [slug, reduceMotion]); // eslint-disable-line react-hooks/exhaustive-deps

  // keep the latest line in view as the log fills
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [n]);

  const working = !reduceMotion && n < script.length;

  return (
    <div className="agt-render">
      <div className="agt-panel">
        {/* the little guy perches on the top-left edge of the panel */}
        <PixelPal slug={slug} working={working} />
        <div className="agt-panel__bar">
          <span className="agt-panel__name">{slug || 'agent'}</span>
        </div>
        <div className="agt-log" ref={logRef}>
          {script.slice(0, n).map((line, i) => (
            <div className="agt-line" key={i}>
              {line.dim && <span className="agt-dim">{line.dim} </span>}
              {line.ts && <span className="agt-dim">[{stamp(i)}] </span>}
              {line.ok && <span className="agt-ok">✓ </span>}
              <span className={line.dim ? 'agt-cmd' : 'agt-txt'}>{line.text}</span>
            </div>
          ))}
          <div className="agt-line">
            <span className="agt-dim">$</span>{' '}
            <span className="agt-cursor">▋</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentTerminal;
