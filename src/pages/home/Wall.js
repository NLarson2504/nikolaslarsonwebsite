import React, { useCallback, useEffect, useMemo, useState } from 'react';
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

const Wall = () => {
  const { data: sites, loading: lSites, error: eSites } = useProjects('site');
  const { data: apps, loading: lApps, error: eApps } = useProjects('app');
  const { data: agents, loading: lAgents, error: eAgents } = useProjects('agent');

  const [active, setActive] = useState(null);   // slot shown in the overlay
  const [entries, setEntries] = useState(null); // slots + loaded images
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
    enabled: !isMobile && !!entries,
    onPick: handlePick,
  });

  const handleClose = useCallback(() => setActive(null), []);

  const counts = useMemo(
    () => ({ web: sites.length, app: apps.length, agent: agents.length }),
    [sites, apps, agents]
  );

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
      <header className="wl-chrome">
        <nav className="wl-filters" aria-label="Sections">
          {Object.entries(KIND_META).map(([kind, meta]) => (
            <Link key={kind} className="wl-filter" to={meta.base}>
              <span className={`wl-glyph wl-glyph--${kind}`} aria-hidden="true" />
              {meta.label}
              <span className="wl-count">{counts[kind]}</span>
            </Link>
          ))}
        </nav>
      </header>

      {loading ? (
        <p className="wl-state">Loading the wall…</p>
      ) : error ? (
        <p className="wl-state">The wall could not be loaded.</p>
      ) : !distinct.length ? (
        <p className="wl-state">No work to show yet.</p>
      ) : isMobile ? (
        /*
         * Mobile gets a plain scrolling list rather than the cylinder: the drum
         * needs a wide viewport to read at all, and standing up a WebGL context
         * is a poor trade against a phone's battery.
         */
        <ul className="wl-list">
          {distinct.map((project) => {
            const meta = metaFor(project);
            const src = tileImage(project);
            return (
              <li key={project.slug} className={`wl-list-item wl-list-item--${meta.label.toLowerCase()}`}>
                <Link to={`${meta.base}/${project.slug}`}>
                  {src ? <img src={src} alt="" loading="lazy" /> : null}
                  <span className="wl-list-title">{project.title}</span>
                  <span className="wl-list-meta">
                    {project.brand?.name ? `${project.brand.name} · ` : ''}
                    {meta.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
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
