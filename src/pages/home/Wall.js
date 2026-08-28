import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import useProjects from '../../hooks/useProjects';
import useCylindricalWall from './useCylindricalWall';
import { bandsForViewport, buildWall, COLS, KIND_META } from './wallLayout';
import WallTile from './WallTile';
import WallPanel from './WallPanel';
import './Wall.css';

/*
 * The home page: every project on one endless, curved wall.
 *
 * Four ideas hold it together:
 *
 *  1. Shape is the taxonomy. A tile's silhouette says what kind of work it is
 *     (landscape = web, portrait = app, square = agent), so there is no tag row
 *     anywhere on this page. See wallLayout.js for the solved packing.
 *
 *  2. Nothing reflows. Tiles never expand, so the curvature math is a pure
 *     function of layout and stays out of the animation frame.
 *
 *  3. Scroll spins the drum. The page never scrolls; the wheel rotates a
 *     concave cylinder the viewer stands inside, and it never ends.
 *
 *  4. Filtering dims, it never removes. Pulling tiles out would tear a hole in
 *     the tessellation and the wall would stop reading as a wall.
 */

const MOBILE_QUERY = '(max-width: 900px)';

/*
 * How many copies of the pack are laid side by side around the drum.
 *
 * This has to close the circle completely. The drum's radius is derived from
 * the full strip's width (see useCylindricalWall), so the strip IS the
 * circumference — if it's too short the wall is an arc with nothing behind it,
 * and spinning far enough turns the empty back of the drum toward the viewer.
 * That was the "it disappears once I scroll" bug: three repeats simply weren't
 * a whole circle.
 *
 * The visible arc spans roughly one viewport width, and a full turn is 2*PI
 * radians, so covering the circle needs about 2*PI viewport-widths of wall.
 * MIN_REPEATS is that, rounded up, with headroom so the seam stays behind the
 * viewer. It's computed per resize rather than fixed, because U (and therefore
 * a pack's width) changes with the window.
 */
const MIN_ARC_COVER = 2 * Math.PI;

const Wall = () => {
  const { data: sites, loading: lSites, error: eSites } = useProjects('site');
  const { data: apps, loading: lApps, error: eApps } = useProjects('app');
  const { data: agents, loading: lAgents, error: eAgents } = useProjects('agent');

  const [filter, setFilter] = useState(null); // null = everything lit
  const [active, setActive] = useState(null); // slot shown in the overlay
  const [hovering, setHovering] = useState(false);
  const [circumference, setCircumference] = useState(0);
  // How many stacked copies of the pack it takes to cover this viewport.
  const [bands, setBands] = useState(2);
  // How many copies laid side by side it takes to close the drum.
  const [repeatCount, setRepeatCount] = useState(8);
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches
  );

  const viewportRef = useRef(null);
  const loading = lSites || lApps || lAgents;
  const error = eSites || eApps || eAgents;

  // Projects arrive from useProjects already sorted by priority, so the first
  // of each kind lands in that kind's hero slot.
  const wall = useMemo(
    () => buildWall({ sites, apps, agents, bands: isMobile ? 1 : bands }),
    [sites, apps, agents, bands, isMobile]
  );

  // On mobile the drum is off and repeats would just be duplicate content in a
  // scrolling column, so the wall renders exactly once.
  const repeats = isMobile ? 1 : repeatCount;

  const { canvasRef, recompute } = useCylindricalWall({
    enabled: !isMobile,
    circumference,
    deps: [wall.length, isMobile, repeats, bands],
  });

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const onChange = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  /*
   * Size the base unit U so cells stay square: U = min(w/cols, h/rows). Square
   * cells are non-negotiable — if they stretch, a 2x1 stops looking like a
   * landscape and the taxonomy dies.
   *
   * U is sized against ONE pack's share of the viewport, then the drum's radius
   * is derived from that pack's width so a single repeat is exactly one full
   * turn. useLayoutEffect so U lands before the curvature pass measures.
   */
  useLayoutEffect(() => {
    if (isMobile) return undefined;

    const size = () => {
      const viewport = viewportRef.current;
      const canvas = canvasRef.current;
      if (!viewport || !canvas) return;

      const gutter = 6; // keep in sync with --wl-gutter

      /*
       * U is driven by WIDTH, not height: sizing from height makes the rows
       * fill the screen on their own and blows each tile up into a slab.
       * Height is covered by stacking bands instead (bandsForViewport), so the
       * wall still bleeds off the top and bottom.
       *
       * ARC_PACKS is how many packs span the visible arc, so U DIVIDES by it:
       * more packs across means smaller tiles. At 1.0 the wall is a dozen big
       * slabs; much past 1.5 the screenshots get too small to read as work.
       * 1.25 keeps the tiles substantial while still showing a whole pack.
       */
      const ARC_PACKS = 1.25;
      const availableW = viewport.clientWidth - gutter * (COLS - 1);
      const u = Math.max(24, Math.floor(availableW / (COLS * ARC_PACKS)));

      // With U fixed by width, bands are what cover the height.
      setBands(bandsForViewport(viewport.clientHeight, u, gutter));

      /*
       * Enough copies to close the circle. The visible arc is ~ARC_PACKS packs
       * wide, and a full turn needs MIN_ARC_COVER (2*PI) arc-widths of wall, so
       * the strip must be about ARC_PACKS * 2*PI packs long. +1 keeps the seam
       * comfortably behind the viewer.
       */
      const needed = Math.ceil(ARC_PACKS * MIN_ARC_COVER) + 1;
      setRepeatCount(needed);

      canvas.style.setProperty('--wl-u', `${u}px`);
      canvas.style.setProperty('--wl-cols', String(COLS * needed));

      /*
       * The drum's circumference is the FULL canvas — every repeat end to end —
       * so all of them together make exactly one turn. Passing one pack's width
       * here would make each pack try to be its own full circle and they would
       * overlap.
       */
      const totalCols = COLS * needed;
      setCircumference(u * totalCols + gutter * totalCols);
      recompute();
    };

    size();
    window.addEventListener('resize', size, { passive: true });
    return () => window.removeEventListener('resize', size);
  }, [isMobile, wall.length, repeats, recompute, canvasRef]);

  const handleOpen = useCallback((slot) => setActive(slot), []);
  const handleClose = useCallback(() => setActive(null), []);

  const counts = useMemo(
    () => ({ web: sites.length, app: apps.length, agent: agents.length }),
    [sites, apps, agents]
  );

  return (
    <section className="wl-stage">
      {/* No wordmark or standfirst: the nav already carries the name, and the
          work is the only thing this page has to say. The three filter glyphs
          are the entire chrome. */}
      <header className="wl-chrome">
        {/* Navigation is three glyphs — each a scale model of the tile shape it
            selects. Clicking one dims everything else; it never unpacks the
            wall. */}
        <nav className="wl-filters" aria-label="Filter work by type">
          {Object.entries(KIND_META).map(([kind, meta]) => (
            <button
              key={kind}
              type="button"
              className="wl-filter"
              aria-pressed={filter === kind}
              onClick={() => setFilter((f) => (f === kind ? null : kind))}
            >
              <span className={`wl-glyph wl-glyph--${kind}`} aria-hidden="true" />
              {meta.label}
              <span className="wl-count">{counts[kind]}</span>
            </button>
          ))}
        </nav>
      </header>

      <div className="wl-viewport" ref={viewportRef}>
        {loading ? (
          <p className="wl-state">Loading the wall…</p>
        ) : error ? (
          <p className="wl-state">The wall could not be loaded.</p>
        ) : !wall.length ? (
          <p className="wl-state">No work to show yet.</p>
        ) : (
          <div
            className="wl-canvas"
            ref={canvasRef}
            data-hovered={hovering ? 'true' : 'false'}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
          >
            {/* The pack repeated around the drum. Copies are identical by
                design — the loop is meant to be unnoticeable, so the seam
                carries no visual marker. Only the first copy is exposed to
                assistive tech; the rest are decorative duplicates. */}
            {Array.from({ length: repeats }).map((_, copy) =>
              wall.map((slot) => (
                <WallTile
                  key={`${copy}-${slot.id}`}
                  slot={slot}
                  copy={copy}
                  muted={Boolean(filter) && filter !== slot.kind}
                  onOpen={handleOpen}
                />
              ))
            )}
          </div>
        )}
      </div>

      {active ? <WallPanel slot={active} onClose={handleClose} /> : null}
    </section>
  );
};

export default Wall;
