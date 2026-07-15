import React, { useEffect, useRef } from 'react';
import { PIXEL_PALS, PALETTE, PAL_SIZE } from '../pages/agents/pixelPals';

// display order for the home-preview column (1st and 3rd swapped)
const SLUGS = ['kidd', 'tallie', 'lira'];

/**
 * One tile in the Agents home-preview grid: a small glassy terminal card with a
 * single "pixel pal" sprite drawn crisp inside it, gently bobbing/blinking. The
 * card picks a pal by index (round-robins through the available pals) so the
 * grid shows them one at a time, the way the Web/Apps grids show one page /
 * phone per cell.
 */
const AgentCard = ({ imageIndex = 0, className = '' }) => {
  const canvasRef = useRef(null);
  const slug = SLUGS[imageIndex % SLUGS.length];
  const reduce =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    const pal = PIXEL_PALS[slug];
    const canvas = canvasRef.current;
    if (!pal || !canvas) return undefined;
    const cell = 9; // device px per sprite pixel (before DPR)
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
      drawGrid(pal.idle[0]);
      return undefined;
    }

    let raf;
    let last = 0;
    // stagger blink timers per-card so the grid doesn't blink in unison
    let blinkTimer = performance.now() + 1500 + Math.random() * 2600;
    let blinking = false;
    const loop = (now) => {
      if (now > blinkTimer) {
        blinking = true;
        if (now > blinkTimer + 130) {
          blinking = false;
          blinkTimer = now + 2200 + Math.random() * 2600;
        }
      }
      if (now - last > 90) {
        last = now;
        drawGrid(blinking ? pal.idle[1] : pal.idle[0]);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [slug, reduce]);

  return (
    <div className={`agent-card ${className}`}>
      <div className="w-[18rem] h-[18rem] bg-gray-950 rounded-[28px] border border-white border-opacity-10 shadow-2xl relative overflow-hidden flex items-center justify-center">
        {/* faint terminal header dots */}
        <div className="absolute top-4 left-4 flex gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
          <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
          <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
        </div>
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          style={{ imageRendering: 'pixelated', width: '160px', height: '160px' }}
        />
      </div>
    </div>
  );
};

export default AgentCard;
