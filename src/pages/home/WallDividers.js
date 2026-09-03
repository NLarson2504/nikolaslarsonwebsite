import React, { useMemo } from 'react';
import { COLS, PACK_ROWS, SLOTS } from './wallLayout';

/*
 * The divider grid, drawn from the packing itself.
 *
 * An earlier version painted a uniform square lattice with two repeating
 * gradients, one line every U in each axis. That was wrong: the wall's tiles
 * are 2x1, 1x2 and 1x1, so a lattice at every U ruled a line straight through
 * the middle of every landscape and portrait tile, cutting them in half. The
 * dividers have to follow the ACTUAL tile boundaries, and a repeating gradient
 * has no way to know where those are.
 *
 * So the lines are generated from SLOTS. Each tile contributes its top and left
 * edge; edges shared by two neighbouring tiles are deduplicated, so every seam
 * is drawn exactly once at a consistent weight rather than double-painted.
 *
 * This is one <svg> spanning the whole canvas, which is the other half of the
 * fix: as a single element it takes one curvature transform for the entire
 * surface, so the lines stay continuous. Per-tile borders could not do that —
 * each tile is rotated independently on the drum, so neighbouring edges met at
 * slightly different angles and the grid came out visibly stepped at every
 * join.
 *
 * Coordinates are in grid units and scaled by a `vectorEffect`-style
 * non-scaling stroke, so the line keeps its weight no matter how large U is.
 */

const WallDividers = ({ cols, rows }) => {
  const segments = useMemo(() => {
    // Dedupe by geometry: a seam between two tiles is one line, not two.
    const set = new Set();

    for (let copy = 0; copy < cols / COLS; copy += 1) {
      for (let band = 0; band < rows / PACK_ROWS; band += 1) {
        const dx = copy * COLS;
        const dy = band * PACK_ROWS;

        for (const slot of SLOTS) {
          const x = slot.col + dx;
          const y = slot.row + dy;
          // Top edge and left edge of this tile. Every internal seam is some
          // tile's top or left, so this covers the whole grid without needing
          // the bottom/right of each tile as well.
          set.add(`${x},${y},${x + slot.w},${y}`);
          set.add(`${x},${y},${x},${y + slot.h}`);
        }
      }
    }

    return Array.from(set).map((k) => k.split(',').map(Number));
  }, [cols, rows]);

  return (
    <svg
      className="wl-grid-lines"
      viewBox={`0 0 ${cols} ${rows}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      {segments.map(([x1, y1, x2, y2]) => (
        <line
          key={`${x1}-${y1}-${x2}-${y2}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          // Keeps the stroke a constant screen width despite the viewBox being
          // in grid units and stretched by preserveAspectRatio="none".
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
};

export default WallDividers;
