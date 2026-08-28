/*
 * The gallery wall's packing.
 *
 * Shape is the taxonomy: a tile's silhouette tells you what kind of work it is,
 * so the wall needs no tag pills to be readable.
 *
 *   site  (web)    -> 2x1 landscape
 *   app   (mobile) -> 1x2 portrait
 *   agent          -> 1x1 square
 *
 * Every tile is a whole multiple of one square base unit U, so these are
 * dominoes and monominoes on a square grid and they tessellate with zero gaps.
 *
 * THERE ARE NO HERO TILES. An earlier version doubled one tile per category
 * (4x2 / 2x4 / 2x2) for hierarchy, but at 4x the area of everything else those
 * tiles dominated the wall and the composition read as a few slabs plus filler.
 * A uniform wall — every tile exactly one of three sizes — is what makes the
 * shape taxonomy legible, because the only thing distinguishing tiles is their
 * orientation, not their importance. Ranking still exists; it decides which
 * project lands where, not how big it is.
 *
 * ------------------------------------------------------------------ the pack
 *
 * SLOTS is a solved packing found by randomised exhaustive search and verified
 * for overlaps and gaps: 8 cols x 6 rows = 48 cells, 27 tiles, every cell
 * filled exactly once.
 *
 *   web   10 * (2x1) = 20 cells
 *   app   11 * (1x2) = 22 cells
 *   agent  6 * (1x1) =  6 cells
 *                      -- total 48 = 8 x 6
 *
 * Two properties matter beyond "it tessellates", and hand-editing a slot will
 * silently break both:
 *
 *   1. SEAMLESS TILING. No tile crosses the pack's right or bottom edge, so
 *      copies laid edge to edge — horizontally around the drum, vertically as
 *      bands — mate perfectly with no gap, no overlap and no special casing.
 *
 *   2. NO CATEGORY BANDING. The three kinds are interleaved throughout rather
 *      than clustered into rows. The search was scored to punish any row
 *      dominated by a single kind, because a wall with a stripe of landscapes
 *      across the top reads as a layout, not a surface.
 *
 * Layout map (W = web 2x1, P = phone 1x2, A = agent 1x1):
 *
 *   W W A P A W W P
 *   A W W P A W W P
 *   P P W W P P W W
 *   P P A P P P W W
 *   W W P P A P P P
 *   W W P W W P P P
 */

export const COLS = 8;
export const PACK_ROWS = 6;

/**
 * How many bands (stacked copies of the pack) cover a viewport of `height` at
 * base unit `u`.
 *
 * The count is derived, not fixed: U is set from the viewport's WIDTH so the
 * shapes read at a consistent size, which means the height one band covers
 * varies with the window. Ceil plus a spare band guarantees the wall always
 * bleeds past the top and bottom edges instead of leaving dead margin.
 */
export const bandsForViewport = (height, u, gutter = 0) => {
  const bandHeight = PACK_ROWS * (u + gutter);
  if (!Number.isFinite(bandHeight) || bandHeight <= 0) return 2;
  return Math.max(2, Math.ceil(height / bandHeight) + 1);
};

// kind -> the Firestore `type` it renders, and the route it links into.
export const KIND_META = {
  web: { type: 'site', base: '/web', label: 'Web' },
  app: { type: 'app', base: '/apps', label: 'Apps' },
  agent: { type: 'agent', base: '/agents', label: 'Agents' },
};

/**
 * The solved packing. `col`/`row` are 0-indexed; `w`/`h` are in base units.
 */
export const SLOTS = [
  { kind: 'web', col: 0, row: 0, w: 2, h: 1 },
  { kind: 'agent', col: 2, row: 0, w: 1, h: 1 },
  { kind: 'app', col: 3, row: 0, w: 1, h: 2 },
  { kind: 'agent', col: 4, row: 0, w: 1, h: 1 },
  { kind: 'web', col: 5, row: 0, w: 2, h: 1 },
  { kind: 'app', col: 7, row: 0, w: 1, h: 2 },
  { kind: 'agent', col: 0, row: 1, w: 1, h: 1 },
  { kind: 'web', col: 1, row: 1, w: 2, h: 1 },
  { kind: 'agent', col: 4, row: 1, w: 1, h: 1 },
  { kind: 'web', col: 5, row: 1, w: 2, h: 1 },
  { kind: 'app', col: 0, row: 2, w: 1, h: 2 },
  { kind: 'app', col: 1, row: 2, w: 1, h: 2 },
  { kind: 'web', col: 2, row: 2, w: 2, h: 1 },
  { kind: 'app', col: 4, row: 2, w: 1, h: 2 },
  { kind: 'app', col: 5, row: 2, w: 1, h: 2 },
  { kind: 'web', col: 6, row: 2, w: 2, h: 1 },
  { kind: 'agent', col: 2, row: 3, w: 1, h: 1 },
  { kind: 'app', col: 3, row: 3, w: 1, h: 2 },
  { kind: 'web', col: 6, row: 3, w: 2, h: 1 },
  { kind: 'web', col: 0, row: 4, w: 2, h: 1 },
  { kind: 'app', col: 2, row: 4, w: 1, h: 2 },
  { kind: 'agent', col: 4, row: 4, w: 1, h: 1 },
  { kind: 'app', col: 5, row: 4, w: 1, h: 2 },
  { kind: 'app', col: 6, row: 4, w: 1, h: 2 },
  { kind: 'app', col: 7, row: 4, w: 1, h: 2 },
  { kind: 'web', col: 0, row: 5, w: 2, h: 1 },
  { kind: 'web', col: 3, row: 5, w: 2, h: 1 },
];

/**
 * Assigns projects to slots for `bands` stacked copies of the pack.
 *
 * The pack has more slots (27) than there are real projects (14), and the wall
 * stacks several bands on top of that, so projects necessarily repeat across
 * the surface — the wall is a surface of work, not a list.
 *
 * Within a band, each category's slots are filled by walking that category's
 * projects in priority order, wrapping when the list runs out. Each band starts
 * that walk at a different offset (and the offsets are coprime-ish with the
 * pool sizes), so a project doesn't land directly above its own twin in the
 * next band — which is what made the earlier wall read as one row repeating.
 */
export const buildWall = ({ sites = [], apps = [], agents = [], bands = 2 }) => {
  const pools = { web: sites, app: apps, agent: agents };
  const filled = [];

  for (let band = 0; band < bands; band += 1) {
    const cursors = { web: band * 3, app: band * 5, agent: band * 2 };

    SLOTS.forEach((slot, index) => {
      const pool = pools[slot.kind];
      if (!pool.length) return;

      const project = pool[cursors[slot.kind] % pool.length];
      cursors[slot.kind] += 1;

      filled.push({
        ...slot,
        band,
        row: slot.row + band * PACK_ROWS,
        project,
        index,
        id: `b${band}-s${index}-${project.slug || index}`,
      });
    });
  }

  return filled;
};

export default buildWall;
