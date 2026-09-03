import React, { useMemo } from 'react';
import { PIXEL_PALS, PALETTE, PAL_SIZE } from '../agents/pixelPals';

/*
 * An agent's pixel pal, drawn as a static SVG for the wall.
 *
 * Agent projects carry no screenshots, so their square tiles would otherwise be
 * type on a flat ground. The pals are already this site's mascot for the agents
 * (see HeroPals and AgentTerminal), so they're the natural artwork.
 *
 * Deliberately NOT the canvas + requestAnimationFrame renderer those two use.
 * The wall repeats its pack around the drum and stacks it into bands, so there
 * can be dozens of agent tiles on screen at once; dozens of canvases each
 * running a blink loop would burn real frame budget on a surface that already
 * spins. This draws one <rect> per opaque pixel, once, and memoises the result
 * per (slug, cell) — it never repaints, and identical tiles share the work.
 *
 * `shapeRendering="crispEdges"` keeps the pixels hard-edged when the drum's
 * perspective transform scales the tile.
 */

const WallPal = ({ slug, cell = 6, className }) => {
  const pal = PIXEL_PALS[slug];

  const rects = useMemo(() => {
    if (!pal) return null;
    // Frame 0 of the idle pair: eyes open, the pal's resting look.
    const grid = pal.idle[0];
    const out = [];

    for (let y = 0; y < PAL_SIZE; y += 1) {
      const row = grid[y] || '';
      // Merge horizontal runs of the same colour into one rect, so a 16x16
      // sprite emits a few dozen nodes instead of up to 256.
      let x = 0;
      while (x < PAL_SIZE) {
        const color = PALETTE[row[x]];
        if (!color) {
          x += 1;
          continue;
        }
        let run = 1;
        while (x + run < PAL_SIZE && PALETTE[row[x + run]] === color) run += 1;
        out.push(
          <rect
            key={`${x}-${y}`}
            x={x * cell}
            y={y * cell}
            width={run * cell}
            height={cell}
            fill={color}
          />
        );
        x += run;
      }
    }
    return out;
  }, [pal, cell]);

  if (!rects) return null;

  const size = PAL_SIZE * cell;

  return (
    <svg
      className={className}
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
    >
      {rects}
    </svg>
  );
};

export default WallPal;
