import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useProjects from '../../hooks/useProjects';
import useWallCylinder from './useWallCylinder';
import { KIND_META, SLOTS } from './wallLayout';
import { loadBrandLogos, loadImage, tileImage } from './wallTexture';
import {
  useDetailTransition,
  isPlainClick,
} from '../../components/DetailTransition';
import ViewSlider from '../../components/ViewSlider';
import WallList from './WallList';
import { useIntroHold } from '../../components/LogoIntro';
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

  const [entries, setEntries] = useState(null); // slots + loaded images
  /*
   * How the work is shown: the 3D wall ('gallery') or the flat year-grouped
   * list ('list'). The switcher that changes it floats at the bottom of this
   * same page, so the state belongs here rather than being threaded down from
   * the router.
   */
  const [view, setView] = useState('gallery');
  const startDetailTransition = useDetailTransition();
  const navigate = useNavigate();
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

  /*
   * Whether the 3D drum has painted its first frame (see useWallCylinder's
   * onReady). This is the real "the wall is here" moment — `entries` only means
   * the images have decoded, and everything after it (compositing the pack
   * canvas, uploading the texture, compiling the shader, the first render) is
   * a visible beat of its own on a cold load.
   */
  const [wallPainted, setWallPainted] = useState(false);
  const handleWallReady = useCallback(() => setWallPainted(true), []);

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

  /*
   * Raycasting hands back a slot index; map it to its project and go.
   *
   * This used to open an overlay panel on top of the wall. It now runs the
   * detail transition straight to the project's page — one click to the work
   * rather than a summary card in between.
   */
  const handlePick = useCallback(
    (slotIndex) => {
      const entry = (entries?.items || []).find((e) => e.index === slotIndex);
      if (!entry) return;
      const { project } = entry;
      if (!project?.slug) return;
      const base = KIND_META[KIND_FOR_TYPE[project.type] || 'web'].base;
      const href = `${base}/${project.slug}`;
      if (startDetailTransition) {
        startDetailTransition(href, tileImage(project));
      } else {
        navigate(href);
      }
    },
    [entries, startDetailTransition, navigate]
  );

  const isList = view === 'list';

  /*
   * Hold the first-load intro open until there is genuinely a wall to reveal.
   *
   * In gallery view that means waiting for the drum's first painted frame, not
   * merely for the data: releasing on `entries` handed the page over while
   * Three.js was still building the scene, so the intro lifted onto an empty
   * stage and the wall popped in after it.
   *
   * List view and mobile never mount the cylinder, so there `entries` IS the
   * ready signal — waiting on a frame that will never come would pin the intro
   * open until its own timeout.
   *
   * The intro covers the viewport throughout, which is why the `wl-state`
   * loading line is never seen on a cold first load; it still serves every
   * other case (an in-session return, reduced motion, a refetch).
   */
  const wallReady = isList ? !!entries : wallPainted;
  useIntroHold(!error && !wallReady);

  /*
   * The cylinder is torn down in list view rather than merely hidden: it holds a
   * WebGL context and a requestAnimationFrame loop, and leaving those running
   * behind a display:none list would burn a GPU and a frame budget on something
   * nobody can see.
   */
  const { mountRef } = useWallCylinder({
    entries,
    enabled: !!entries && !isList,
    onPick: handlePick,
    compact: isMobile,
    onReady: handleWallReady,
  });

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
    <section className={`wl-stage${isList ? ' wl-stage--list' : ''}`}>

      {loading ? (
        <p className="wl-state">Loading the wall…</p>
      ) : error ? (
        <p className="wl-state">The wall could not be loaded.</p>
      ) : !distinct.length ? (
        <p className="wl-state">No work to show yet.</p>
      ) : isList ? (
        /*
         * List view. It replaces the canvas outright rather than overlaying it —
         * and it needs no hidden a11y index, because every row is already a real
         * link.
         */
        <WallList projects={distinct} />
      ) : (
        <>
          {/* The cylinder. Purely visual — everything it shows is also present
              as real links in the index below. */}
          <div
            className={`wl-canvas-mount${wallPainted ? ' is-in' : ''}`}
            ref={mountRef}
            aria-hidden="true"
          />

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
                  <Link
                    to={`${meta.base}/${project.slug}`}
                    onClick={(e) => {
                      if (!isPlainClick(e) || !startDetailTransition) return;
                      e.preventDefault();
                      startDetailTransition(
                        `${meta.base}/${project.slug}`,
                        tileImage(project)
                      );
                    }}
                  >
                    {project.title} — {meta.label}
                    {project.brand?.name ? ` (${project.brand.name})` : ''}
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {/* The view switcher, bottom-centred. Only once there is work to show —
          while loading or errored there is nothing to switch between. */}
      {!loading && !error && distinct.length ? (
        <ViewSlider view={view} onChange={setView} />
      ) : null}

    </section>
  );
};

export default Wall;
