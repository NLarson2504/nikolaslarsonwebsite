import React, { useEffect, useRef } from 'react';
import { PIXEL_PALS, PALETTE, PAL_SIZE } from '../agents/pixelPals';

// The pals, in a fixed order so the index fallback below is stable.
const SLUGS = ['kidd', 'tallie', 'lira'];

/*
 * Resolve an agent project to a pal sprite.
 *
 * A project whose slug IS a pal's name gets that pal. Everything else falls
 * back to picking one by a hash of the slug — the pals are a small fixed cast
 * (they predate the current project data), so most agents won't have a matching
 * name, and this at least gives each one a consistent pal rather than a
 * different sprite on every hover.
 */
const palForSlug = (slug = '') => {
  if (PIXEL_PALS[slug]) return slug;
  let hash = 0;
  for (let i = 0; i < slug.length; i += 1) {
    hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  }
  return SLUGS[hash % SLUGS.length];
};

/**
 * An agent's pixel pal, drawn crisp on a canvas — the list view's stand-in for
 * the screenshot preview that web and app projects get.
 *
 * Agents are case-study work with no screenshots (see tileImage in
 * wallTexture.js), so without this they were the one kind that showed nothing on
 * hover. Same drawing approach as HeroPals and AgentCard: nearest-neighbour
 * fills on a DPR-scaled canvas, with a gentle blink.
 */
const WallListPal = ({ slug, cell = 9 }) => {
  const canvasRef = useRef(null);
  const reduce =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    const pal = PIXEL_PALS[palForSlug(slug)];
    const canvas = canvasRef.current;
    if (!pal || !canvas) return undefined;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const size = PAL_SIZE * cell;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    // The sprites are 16x16 grids blown up many times over; smoothing would
    // turn every hard pixel edge into a blur.
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

    // Occasional blink: frame 2 for ~130ms, then back to frame 1.
    let raf;
    let blinkTimer = performance.now() + 1500 + Math.random() * 2600;
    let blinking = false;
    drawGrid(pal.idle[0]);

    const loop = (now) => {
      if (now > blinkTimer) {
        if (!blinking) {
          blinking = true;
          drawGrid(pal.idle[1] || pal.idle[0]);
        } else if (now > blinkTimer + 130) {
          blinking = false;
          drawGrid(pal.idle[0]);
          blinkTimer = now + 1800 + Math.random() * 2800;
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [slug, cell, reduce]);

  return <canvas ref={canvasRef} className="wls-pal" />;
};

export default WallListPal;
