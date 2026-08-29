import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import useProjects from '../../hooks/useProjects';
import useWallCylinder from './useWallCylinder';
import { KIND_META, SLOTS } from './wallLayout';
import { loadBrandLogos, loadImage, tileImage } from './wallTexture';
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
 *  2. The wall is a real cylinder. It's rendered in WebGL as a single mesh
 *     rather than assembled from DOM tiles — see useWallCylinder.js for why
 *     that turned out to be the only way to get a curve that doesn't facet.
 *
 *  3. Scroll spins the drum. The page never scrolls; the wheel rotates a
 *     concave cylinder the viewer stands inside, and it never ends.
 *
 *  4. The canvas is not the only surface. A parallel list of real links is
 *     rendered alongside it so keyboard users, screen readers and crawlers get
 *     genuine navigable content — a texture on a mesh is invisible to all
 *     three.
 */

const MOBILE_QUERY = '(max-width: 900px)';

// Firestore `type` -> the KIND_META key that describes it.
const KIND_FOR_TYPE = { site: 'web', app: 'app', agent: 'agent' };

// The slider's options, in order. `all` is first so it reads as the default
// resting state at the far left.
const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'web', label: 'Web' },
  { key: 'app', label: 'Apps' },
  { key: 'agent', label: 'Agents' },
];

const Wall = () => {
  const { data: sites, loading: lSites, error: eSites } = useProjects('site');
  const { data: apps, loading: lApps, error: eApps } = useProjects('app');
  const { data: agents, loading: lAgents, error: eAgents } = useProjects('agent');

  const [active, setActive] = useState(null);   // slot shown in the overlay
  // Which section the wall is showing. 'all' is the default and sits leftmost.
  const [filter, setFilter] = useState('all');
  const [entries, setEntries] = useState(null); // slots + loaded images
  /*
   * The slider thumb is MEASURED off the active button rather than computed as
   * an even 1/n of the track.
   *
   * An even pitch assumes every label is the same width. They aren't — "Agents"
   * is the widest by a clear margin, so forcing it into an average-sized quarter
   * left it overflowing its own box: crowded against the track's right edge, and
   * wider than the thumb that was supposed to sit under it.
   *
   * Letting the options size to their own text and reading the resulting
   * offsetLeft/offsetWidth back out keeps the thumb exactly under whichever
   * label is selected, whatever that label happens to be.
   */
  const trackRef = useRef(null);
  const optionRefs = useRef({});
  const [thumb, setThumb] = useState(null);
  /*
   * Narrow viewports get the SAME wall, not a different page. isMobile only
   * tunes how the drum is framed (see useWallCylinder) — a phone screen is a
   * narrow window onto a wide cylinder, so it needs a tighter field of view and
   * a smaller radius to show a comparable slice.
   */
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches
  );

  const loading = lSites || lApps || lAgents;
  const error = eSites || eApps || eAgents;

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const onChange = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  /*
   * Keep the thumb aligned to the active option's real box.
   *
   * Layout effect, not a plain effect: this runs before paint, so the thumb is
   * never seen a frame behind the label it belongs under. Fonts landing late
   * would shift the labels after first measure, so re-measure on the font load
   * and on resize too — both change the option widths without changing filter.
   */
  useLayoutEffect(() => {
    const measure = () => {
      const el = optionRefs.current[filter];
      if (!el) return;
      setThumb({ left: el.offsetLeft, width: el.offsetWidth });
    };
    measure();

    window.addEventListener('resize', measure);
    // `document.fonts` is absent in older browsers; the initial measure still
    // holds there, just against the fallback face.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(measure).catch(() => {});
    }
    return () => window.removeEventListener('resize', measure);
  }, [filter, isMobile]);

  /*
   * Assign projects to the pack's slots.
   *
   * The pack has more slots (27) than there are real projects (14), so projects
   * repeat across the surface — the wall is a surface of work, not a list. Each
   * category's slots walk that category's projects in priority order and wrap.
   */
  const assigned = useMemo(() => {
    const pools = { web: sites, app: apps, agent: agents };
    const cursors = { web: 0, app: 0, agent: 0 };

    return SLOTS.map((slot, index) => {
      const pool = pools[slot.kind];
      if (!pool || !pool.length) return null;
      const project = pool[cursors[slot.kind] % pool.length];
      cursors[slot.kind] += 1;
      return { slot, project, index };
    }).filter(Boolean);
  }, [sites, apps, agents]);

  /*
   * Preload every image before the texture is painted.
   *
   * The pack is composited into one canvas in a single pass, so a screenshot
   * that arrived later would simply be missing — there is no per-tile <img> to
   * fill itself in on load. loadImage resolves null on failure rather than
   * rejecting, so one broken URL degrades to one empty tile, not an empty wall.
   */
  useEffect(() => {
    if (!assigned.length) return undefined;
    let alive = true;

    // Brand marks are loaded alongside the screenshots, since both have to be
    // in hand before the pack can be composited in one pass.
    Promise.all([
      Promise.all(
        assigned.map(async (entry) => ({
          ...entry,
          image: await loadImage(tileImage(entry.project)),
        }))
      ),
      loadBrandLogos(assigned.map((e) => e.project)),
    ]).then(([withImages, logos]) => {
      if (alive) setEntries({ items: withImages, brandLogos: logos });
    });

    return () => {
      alive = false;
    };
  }, [assigned]);

  // Raycasting hands back a slot index; map it to the entry to open.
  const handlePick = useCallback(
    (slotIndex) => {
      const entry = (entries?.items || []).find((e) => e.index === slotIndex);
      if (entry) setActive({ ...entry.slot, project: entry.project });
    },
    [entries]
  );

  const { mountRef } = useWallCylinder({
    entries,
    enabled: !!entries,
    onPick: handlePick,
    filter,
    compact: isMobile,
  });

  const handleClose = useCallback(() => setActive(null), []);


  // One entry per distinct project, for the accessible index and for mobile.
  const distinct = useMemo(() => {
    const seen = new Set();
    return [...sites, ...apps, ...agents].filter((p) => {
      if (!p || seen.has(p.slug)) return false;
      seen.add(p.slug);
      return true;
    });
  }, [sites, apps, agents]);

  const metaFor = (project) => KIND_META[KIND_FOR_TYPE[project.type] || 'web'];

  return (
    <section className="wl-stage">
      {/*
        * The filter slider, along the bottom.
        *
        * A segmented control rather than links: switching sections dims the
        * wall in place instead of navigating away, so the drum is never torn
        * down and rebuilt. "All" sits first and is the default.
        *
        * The thumb is one element translated across the track, so the movement
        * is a single transform rather than four elements restyling — and the
        * label the thumb sits under stays legible because the thumb is glass,
        * not a solid fill.
        */}
      {createPortal(
        <nav className="wl-slider" aria-label="Filter work by section">
        <div className="wl-slider-track" role="tablist" ref={trackRef}>
          <span
            className="wl-slider-thumb"
            aria-hidden="true"
            /* Hidden until measured, so it never flashes at the wrong width. */
            style={
              thumb
                ? { left: `${thumb.left}px`, width: `${thumb.width}px` }
                : { opacity: 0 }
            }
          />
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              role="tab"
              aria-selected={filter === f.key}
              ref={(el) => {
                optionRefs.current[f.key] = el;
              }}
              className={`wl-slider-option${filter === f.key ? ' is-active' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
          </div>
        </nav>,
        document.body
      )}

      {loading ? (
        <p className="wl-state">Loading the wall…</p>
      ) : error ? (
        <p className="wl-state">The wall could not be loaded.</p>
      ) : !distinct.length ? (
        <p className="wl-state">No work to show yet.</p>
      ) : (
        <>
          {/* The cylinder. Purely visual — everything it shows is also present
              as real links in the index below. */}
          <div className="wl-canvas-mount" ref={mountRef} aria-hidden="true" />

          {/* Edge treatment: a blur pass and a darkening gradient on all four
              sides, so the wall dissolves into the room rather than ending on a
              hard rectangular cut. Both sit above the canvas but ignore the
              pointer, so the drum underneath stays fully interactive. */}
          <div className="wl-vignette-blur" aria-hidden="true" />
          <div className="wl-vignette" aria-hidden="true" />

          {/*
            * The accessible surface.
            *
            * The wall is a texture on a mesh, which is invisible to keyboard
            * users, screen readers and crawlers alike. This index is the real
            * content: genuine <a> elements, visually hidden but fully
            * focusable, so tabbing reaches every project and search engines see
            * an ordinary linked list.
            */}
          <ul className="wl-a11y-index">
            {distinct.map((project) => {
              const meta = metaFor(project);
              return (
                <li key={project.slug}>
                  <Link to={`${meta.base}/${project.slug}`}>
                    {project.title} — {meta.label}
                    {project.brand?.name ? ` (${project.brand.name})` : ''}
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {active ? <WallPanel slot={active} onClose={handleClose} /> : null}
    </section>
  );
};

export default Wall;
