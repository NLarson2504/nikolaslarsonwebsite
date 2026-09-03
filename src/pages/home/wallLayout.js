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

/*
 * ------------------------------------------------------- the opening view
 *
 * SLOTS is written in reading order (top-left to bottom-right), which is the
 * right way to author and verify the packing but the WRONG order to fill it in.
 *
 * The viewer does not open the page looking at the pack's top-left corner. The
 * camera stands inside the drum at rotation 0 and is centred vertically, so
 * what it actually frames is the MIDDLE of the pack, straddling the seam where
 * the pack's right edge meets its left edge (col 7 | col 0). Filling slots in
 * array order therefore put the highest-priority work in row 0 — off screen
 * above — and left the middle rows, which is what you land on, holding whatever
 * came last in each pool.
 *
 * VIEW_ORDER fixes that by ranking every slot on how close it is to the centre
 * of the opening view, so pool position 0 lands where the eye already is.
 *
 *   HORIZONTAL  distance is measured around the seam (the pack wraps), from the
 *               column boundary at col 7|0 that sits dead centre on load.
 *   VERTICAL    distance is measured from the BAND SEAM, not from the middle of
 *               the pack. The cylinder is BANDS packs tall and the camera sits
 *               at its vertical midpoint, which lands on the join between two
 *               stacked copies — so on desktop the ~4 rows on screen are pack
 *               rows 4, 5, 0, 1, wrapping through row 5 -> row 0. Measuring
 *               from PACK_ROWS/2 (row 3) aimed at rows nobody sees.
 *
 * Horizontal distance dominates: the drum spins horizontally, so a tile one
 * column off is a smaller miss than one a row off, which needs no interaction
 * to reach but is simply cropped.
 */

// Centre of the opening view, in grid coordinates. The seam sits at the
// boundary between the last and first column, i.e. col 0's left edge.
const VIEW_CENTER_COL = 0;
/*
 * Row 0's top edge — the band seam, where the camera actually looks. Distances
 * to it are measured wrapped, so rows 5 and 0 are both adjacent to it.
 */
const VIEW_CENTER_ROW = 0;

// A row off centre costs this much more than a column off centre. Tuned so the
// visible band fills before the layout reaches for the rows behind the viewer.
const ROW_WEIGHT = 1.6;

/**
 * Distance from a slot's centre to the centre of the opening view.
 *
 * Columns wrap: the pack repeats around the drum, so col 7 is adjacent to
 * col 0 and the shorter way around is the real distance.
 */
const viewDistance = (slot) => {
  const centerCol = slot.col + slot.w / 2;
  const centerRow = slot.row + slot.h / 2;

  let dCol = Math.abs(centerCol - VIEW_CENTER_COL);
  if (dCol > COLS / 2) dCol = COLS - dCol;

  // Rows wrap as well: the pack stacks into bands, so row 5 is as close to the
  // seam as row 0 is.
  let dRow = Math.abs(centerRow - VIEW_CENTER_ROW);
  if (dRow > PACK_ROWS / 2) dRow = PACK_ROWS - dRow;

  return dCol + dRow * ROW_WEIGHT;
};

/**
 * Slot indices ordered by prominence in the opening view, nearest first.
 *
 * Ties break on the slot's own index so the order stays deterministic across
 * reloads — a wall that reshuffles on refresh reads as a bug.
 */
export const VIEW_ORDER = SLOTS.map((slot, index) => ({ index, d: viewDistance(slot) }))
  .sort((a, b) => (a.d === b.d ? a.index - b.index : a.d - b.d))
  .map((e) => e.index);

/*
 * Wrapped distance between two grid positions.
 *
 * Both axes wrap: the pack repeats around the drum (col 7 touches col 0) and
 * stacks as bands (row 5 touches row 0 of the band above), so the real gap
 * between two tiles is always the shorter way around.
 */
const wrappedDelta = (a, b, span) => {
  const d = Math.abs(a - b);
  return Math.min(d, span - d);
};

/** A slot's centre, used for measuring how far apart two placements are. */
const centerOf = (slot) => ({
  col: slot.col + slot.w / 2,
  row: slot.row + slot.h / 2,
});

const SLOT_CENTERS = SLOTS.map(centerOf);

/*
 * How much a candidate placement is penalised for sitting near a copy of
 * itself. Lower total = better placement.
 *
 * The pack is only 6 rows tall and every project lands more than once (5 web
 * projects across 10 web slots), so twins are unavoidable — the goal is to push
 * them as far apart as the packing allows, not to forbid them.
 *
 * SAME_COLUMN dominates, and that is the lesson of the two bugs this scoring
 * replaced. Forbidding only *touching* twins left CampusLM at row 4 and again
 * at row 0 of the band above with a single tile between them — on a surface
 * that repeats vertically that still reads as one column striped with the same
 * screenshot. A shared column is a near miss at any row distance, so it is
 * priced as one.
 */
/*
 * Showing a project the wall has ALREADY placed, while some project has not
 * been shown at all. Priced above every spacing term so coverage always wins:
 * with 14 projects over 27 slots there is room for all of them, and a wall that
 * repeats while something is still missing looks like a thinner body of work
 * than it is.
 */
const UNSHOWN_FIRST_PENALTY = 5000;

const TOUCH_PENALTY = 1000;   // shares an edge — the solid-block case
const SAME_COLUMN_PENALTY = 60;
const SAME_ROW_PENALTY = 25;
// Falls off with distance, so ties break toward the farther-apart placement.
const PROXIMITY_WEIGHT = 40;

/*
 * Two copies sitting at the same DEPTH — the same distance from the camera's
 * eye line — read as one flat layer repeating rather than as a wall receding
 * past you. Penalising equal depth pushes a project's copies onto different
 * levels, which is what gives the surface its sense of depth.
 *
 * Depth here is the wrapped row distance from the band seam, so rows 5 and 0
 * (both adjacent to the seam, both on screen) count as the same level.
 */
const SAME_DEPTH_PENALTY = 45;

/*
 * Cells a slot covers, as "row:col" keys on the wrapped grid.
 */
const cellsOf = (slot) => {
  const cells = [];
  for (let r = slot.row; r < slot.row + slot.h; r += 1) {
    for (let c = slot.col; c < slot.col + slot.w; c += 1) {
      cells.push(`${((r % PACK_ROWS) + PACK_ROWS) % PACK_ROWS}:${((c % COLS) + COLS) % COLS}`);
    }
  }
  return cells;
};

/*
 * The cells orthogonally touching a slot — its edge neighbours, wrapped.
 *
 * Corners are deliberately excluded: two tiles meeting at a single point read
 * as a diagonal, not as one doubled block.
 */
const neighborsOf = (slot) => {
  const own = new Set(cellsOf(slot));
  const out = new Set();

  for (let r = slot.row - 1; r <= slot.row + slot.h; r += 1) {
    for (let c = slot.col - 1; c <= slot.col + slot.w; c += 1) {
      const insideRows = r >= slot.row && r < slot.row + slot.h;
      const insideCols = c >= slot.col && c < slot.col + slot.w;
      // Orthogonal only: share a row span or a column span, never both/neither.
      if (insideRows === insideCols) continue;
      const key = `${((r % PACK_ROWS) + PACK_ROWS) % PACK_ROWS}:${((c % COLS) + COLS) % COLS}`;
      if (!own.has(key)) out.add(key);
    }
  }
  return out;
};

// Precomputed per slot — the pack is static, so this is done once at module
// load rather than on every fill.
const SLOT_CELLS = SLOTS.map(cellsOf);
const SLOT_NEIGHBORS = SLOTS.map(neighborsOf);

/*
 * A slot's depth level: wrapped row distance from the band seam the camera
 * looks at. 0 = on the eye line, larger = further above or below it.
 */
const depthOf = (slot) => {
  const centerRow = slot.row + slot.h / 2;
  let d = Math.abs(centerRow - VIEW_CENTER_ROW);
  if (d > PACK_ROWS / 2) d = PACK_ROWS - d;
  return Math.round(d);
};

const SLOT_DEPTHS = SLOTS.map(depthOf);

// Columns a slot occupies, wrapped — for the same-column test.
const SLOT_COLS = SLOTS.map((slot) => {
  const cols = new Set();
  for (let c = slot.col; c < slot.col + slot.w; c += 1) {
    cols.add(((c % COLS) + COLS) % COLS);
  }
  return cols;
});

/**
 * Fills the pack once, walking each category's pool in priority order but
 * visiting slots in VIEW_ORDER — so the best work lands in the opening view.
 *
 * TWINS ARE PUSHED APART, not merely kept from touching. Pools are smaller than
 * the slot counts that draw from them, so every project lands more than once.
 * Two earlier versions of this got it wrong in ways worth recording:
 *
 *   1. Filling in pool order stacked two CampusLM web tiles at col 0 rows 4-5,
 *      which merged into one solid 2x2 block of the same screenshot.
 *   2. Forbidding only *touching* twins moved it to col 0 row 4 and row 0 —
 *      one tile apart, and since the pack repeats vertically that still read as
 *      a striped column.
 *   3. Spacing them out still let SIX projects repeat inside the ~19 tiles on
 *      screen while DailyPaws, placed only once, sat entirely off it. The wall
 *      showed 13 of 14 projects but spent 6 tiles saying the same things twice,
 *      which reads as a thinner body of work than there is.
 *
 * So placement is scored rather than filtered: each slot takes the pool entry
 * with the lowest penalty. Coverage outranks everything — nothing repeats while
 * something has yet to appear — then edge contact, then sharing a column, a row
 * or a depth level, then nearness on a sliding scale. Ties fall back to pool
 * order, so priority still decides among equally-good placements.
 *
 * `cursors` seeds each pool's starting position. Returns one entry per slot, in
 * SLOTS order, with nulls where a pool was empty.
 */
export const fillPack = (pools, cursors = { web: 0, app: 0, agent: 0 }) => {
  const next = { ...cursors };
  const out = new Array(SLOTS.length).fill(null);
  // cell key -> slug occupying it, for the touch test.
  const owner = new Map();
  // slug -> slot indices already placed, for the spacing test.
  const placed = new Map();
  // Every slug placed so far, for the coverage test.
  const shown = new Set();

  VIEW_ORDER.forEach((index) => {
    const slot = SLOTS[index];
    const pool = pools[slot.kind];
    if (!pool || !pool.length) return;

    const neighbors = SLOT_NEIGHBORS[index];
    const myCols = SLOT_COLS[index];
    const myCenter = SLOT_CENTERS[index];
    const myDepth = SLOT_DEPTHS[index];
    // Once every project in this pool has been placed once, repeats are
    // unavoidable and the coverage term stops discriminating between them.
    const poolFullyShown = pool.every((p) => shown.has(p.slug || p.title));

    const penaltyFor = (project) => {
      const slug = project.slug || project.title;
      let penalty = 0;

      // Cover the whole body of work before showing anything twice.
      if (!poolFullyShown && shown.has(slug)) penalty += UNSHOWN_FIRST_PENALTY;

      for (const key of neighbors) {
        if (owner.get(key) === slug) {
          penalty += TOUCH_PENALTY;
          break;
        }
      }

      (placed.get(slug) || []).forEach((otherIndex) => {
        const other = SLOTS[otherIndex];
        const otherCenter = SLOT_CENTERS[otherIndex];

        for (const c of SLOT_COLS[otherIndex]) {
          if (myCols.has(c)) {
            penalty += SAME_COLUMN_PENALTY;
            break;
          }
        }
        if (other.row === slot.row) penalty += SAME_ROW_PENALTY;

        // Copies on the same level flatten the wall — push them apart in depth.
        if (SLOT_DEPTHS[otherIndex] === myDepth) penalty += SAME_DEPTH_PENALTY;

        const dCol = wrappedDelta(myCenter.col, otherCenter.col, COLS);
        const dRow = wrappedDelta(myCenter.row, otherCenter.row, PACK_ROWS);
        penalty += PROXIMITY_WEIGHT / (1 + dCol + dRow);
      });

      return penalty;
    };

    /*
     * Walk the whole pool from the cursor and keep the best. Starting at the
     * cursor (rather than at 0) means an all-equal pool still advances in
     * priority order, which is what keeps the opening view ranked.
     */
    let chosen = null;
    let chosenStep = 0;
    let best = Infinity;

    for (let step = 0; step < pool.length; step += 1) {
      const candidate = pool[(next[slot.kind] + step) % pool.length];
      const penalty = penaltyFor(candidate);
      if (penalty < best) {
        best = penalty;
        chosen = candidate;
        chosenStep = step;
      }
    }

    // Advance past the project actually used, so the next slot of this kind
    // continues down the pool instead of re-offering what was just placed.
    next[slot.kind] += chosenStep + 1;

    const slug = chosen.slug || chosen.title;
    SLOT_CELLS[index].forEach((key) => owner.set(key, slug));
    placed.set(slug, [...(placed.get(slug) || []), index]);
    shown.add(slug);
    out[index] = { slot, project: chosen, index };
  });

  return out;
};

/**
 * Assigns projects to slots for `bands` stacked copies of the pack.
 *
 * The pack has more slots (27) than there are real projects (14), and the wall
 * stacks several bands on top of that, so projects necessarily repeat across
 * the surface — the wall is a surface of work, not a list.
 *
 * Within a band, each category's slots are filled by walking that category's
 * projects in priority order, wrapping when the list runs out. Slots are
 * visited in VIEW_ORDER rather than array order, so the top of each pool lands
 * in the opening view instead of in the pack's off-screen top row. Each band
 * starts that walk at a different offset (and the offsets are coprime-ish with
 * the pool sizes), so a project doesn't land directly above its own twin in the
 * next band — which is what made the earlier wall read as one row repeating.
 */
export const buildWall = ({ sites = [], apps = [], agents = [], bands = 2 }) => {
  const pools = { web: sites, app: apps, agent: agents };
  const filled = [];

  for (let band = 0; band < bands; band += 1) {
    const cursors = { web: band * 3, app: band * 5, agent: band * 2 };

    fillPack(pools, cursors).forEach((entry) => {
      if (!entry) return;
      const { slot, project, index } = entry;

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
