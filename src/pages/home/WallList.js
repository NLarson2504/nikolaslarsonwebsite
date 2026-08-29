import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  useDetailTransition,
  isPlainClick,
} from '../../components/DetailTransition';
import { gsap } from 'gsap';
import { averageRegion, NEUTRAL_PICK, parseRgb } from '../../utils/pickTint';
import { KIND_META } from './wallLayout';
import { tileImage } from './wallTexture';
import WallListPal from './WallListPal';
import './WallList.css';

/*
 * The home page's list view — the flat counterpart to the 3D wall.
 *
 * The wall is a browsing surface: it shows everything at once and rewards
 * wandering. This is the scanning surface — every project as one line, grouped
 * by year, so the shape of the work over time is readable at a glance in a way
 * a cylinder can never be.
 *
 * Hovering a row lights the PAGE, not the row: a footlight glow rises from the
 * bottom of the viewport in colours sampled from that project's asset, exactly
 * as on the web and apps pages (see .wg-ambient / .aw-ambient). A dimmed preview
 * of the asset also trails the cursor.
 */

// Projects with no usable date land here rather than being dropped.
const UNDATED = 'Undated';

/*
 * Group projects into year buckets, newest first.
 *
 * The year comes from the same fields the priority ranking already trusts
 * (`endDate`, falling back to `date`) rather than a new one, so the list can't
 * disagree with the ordering used elsewhere on the site.
 */
export const groupByYear = (projects) => {
  const buckets = new Map();
  projects.forEach((p) => {
    const raw = p.endDate || p.date || null;
    let year = UNDATED;
    if (raw) {
      const d = new Date(raw);
      if (!Number.isNaN(d.getTime())) year = String(d.getFullYear());
    }
    if (!buckets.has(year)) buckets.set(year, []);
    buckets.get(year).push(p);
  });

  return [...buckets.entries()]
    .sort((a, b) => {
      // Undated sinks to the bottom; real years descend.
      if (a[0] === UNDATED) return 1;
      if (b[0] === UNDATED) return -1;
      return Number(b[0]) - Number(a[0]);
    })
    .map(([year, items]) => ({ year, items }));
};

// Firestore `type` -> the KIND_META key describing it. Same mapping the wall
// itself uses, so the list's labels and links can't drift from the canvas'.
const KIND_FOR_TYPE = { site: 'web', app: 'app', agent: 'agent' };

// Each project's kind metadata (route base + label), defaulting to web so a
// project with an unexpected type still renders a valid link.
const meta = (p) => KIND_META[KIND_FOR_TYPE[p.type] || 'web'];

/*
 * One tint per orb: the upper, middle and lower lights down the left wall.
 *
 * `bl` / `br` are historical names — they were the bottom-left and bottom-right
 * corners before the set moved to the left wall. Kept because they're just
 * labels for colour channels, and renaming would ripple through the CSS
 * variables for no behavioural gain.
 */
const NEUTRAL_CORNERS = {
  bl: NEUTRAL_PICK,
  mid: NEUTRAL_PICK,
  br: NEUTRAL_PICK,
};

const WallList = ({ projects }) => {
  const groups = groupByYear(projects);

  const [hovered, setHovered] = useState(null);
  const tintCache = useRef({});

  const startDetailTransition = useDetailTransition();

  const rootRef = useRef(null);
  const countRef = useRef(null);
  const ambientRef = useRef(null);
  const previewRef = useRef(null);

  // The preview chases the cursor rather than sticking to it: `target` is where
  // the pointer is, `pos` where the preview currently sits, and a rAF loop eases
  // one toward the other. Kept in refs, not state — this updates every frame and
  // must never trigger a React render.
  const target = useRef({ x: 0, y: 0 });
  const pos = useRef({ x: 0, y: 0 });
  const raf = useRef(0);

  const reduce =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /*
   * Flag the list view on <body> so global chrome can respond to it.
   *
   * The footer is rendered once in App.js, outside this component's tree, so it
   * can't be conditioned on state that lives here — a body class is the one
   * hook both sides can see. Removed on unmount, so leaving the list restores
   * the footer.
   */
  useEffect(() => {
    document.body.classList.add('is-wall-list');
    return () => document.body.classList.remove('is-wall-list');
  }, []);

  /* ------------------------------------------------------- the count-up */

  /*
   * The header number counts up to the project total.
   *
   * GSAP tweens a plain object and writes the rounded value out on each update,
   * rather than animating a DOM property directly — there's no numeric CSS
   * property that would render as text, so the tween drives textContent.
   *
   * Layout effect so the element never paints with its final value for a frame
   * before the animation takes it back to zero.
   */
  useLayoutEffect(() => {
    const el = countRef.current;
    if (!el) return undefined;

    const total = projects.length;
    if (reduce) {
      el.textContent = String(total);
      return undefined;
    }

    const counter = { value: 0 };
    const tween = gsap.to(counter, {
      value: total,
      duration: 1.6,
      ease: 'power2.out',
      onUpdate: () => {
        el.textContent = String(Math.round(counter.value));
      },
    });
    return () => tween.kill();
  }, [projects.length, reduce]);

  /* --------------------------------------------------------- the glow */

  /*
   * The colours currently showing, so a change can be tweened FROM them.
   *
   * A plain setProperty swap was instantaneous: moving between rows made the
   * orbs jump to the next project's colour. CSS custom properties don't
   * transition (they're untyped to the animation system without @property), so
   * the interpolation has to happen in JS — GSAP tweens these numbers and each
   * frame writes the composed rgb() back out.
   */
  const liveTint = useRef({
    bl: { r: 35, g: 38, b: 43 },
    mid: { r: 35, g: 38, b: 43 },
    br: { r: 35, g: 38, b: 43 },
  });

  /*
   * Write a project's two orb tints (--pick-bl / --pick-br) as CSS variables,
   * easing from whatever is showing rather than cutting to the new colour.
   *
   * They're set on <body>, not the list root: the ambient field is portalled
   * there, so the variables must resolve on an ancestor it actually has.
   */
  const writeTint = useCallback((corners, { immediate = false } = {}) => {
    const body = document.body;
    const apply = (key) => {
      const c = liveTint.current[key];
      body.style.setProperty(
        `--pick-${key}`,
        `rgb(${Math.round(c.r)},${Math.round(c.g)},${Math.round(c.b)})`
      );
    };

    Object.entries(corners).forEach(([key, value]) => {
      const to = parseRgb(value);
      const from = liveTint.current[key];
      if (!to || !from) return;
      gsap.killTweensOf(from);
      /*
       * While the field is invisible there is nothing to cross-fade, and easing
       * anyway would mean the NEXT hover starts from a stale colour and visibly
       * corrects itself as it fades in. Snap instead.
       */
      if (immediate) {
        Object.assign(from, to);
        apply(key);
        return;
      }
      gsap.to(from, {
        r: to.r,
        g: to.g,
        b: to.b,
        duration: 0.55,
        ease: 'power2.out',
        onUpdate: () => apply(key),
      });
    });
  }, []);

  /*
   * Sample the hovered project's asset for its corner tints.
   *
   * Cached per slug: the sample costs a canvas draw and a getImageData, and a
   * list is somewhere a cursor sweeps across many rows quickly. crossOrigin is
   * set because assets are served from Firebase Storage — without it the canvas
   * is tainted and the read throws, which the catch turns into neutral.
   */
  const sampleFor = useCallback(
    (project, immediate = false) => {
      /*
       * tileImage, not project.image: `site` projects carry a single `image`,
       * but `app` projects keep theirs in `screenshots[]` and agents have no
       * still at all. Reading `.image` directly meant only web projects ever
       * resolved an asset — apps and agents silently fell through.
       */
      const src = tileImage(project);
      if (!src) {
        writeTint(NEUTRAL_CORNERS, { immediate });
        return;
      }
      const cached = tintCache.current[project.slug];
      if (cached) {
        writeTint(cached, { immediate });
        return;
      }
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        let corners = NEUTRAL_CORNERS;
        try {
          const s = 128;
          const c = document.createElement('canvas');
          c.width = s;
          c.height = s;
          const x = c.getContext('2d', { willReadFrequently: true });
          x.drawImage(img, 0, 0, s, s);
          const d = x.getImageData(0, 0, s, s).data;
          const t = Math.round(s / 3);
          corners = {
            bl: averageRegion(d, s, 0, 0, s, t) || NEUTRAL_PICK,
            mid: averageRegion(d, s, 0, t, s, t * 2) || NEUTRAL_PICK,
            br: averageRegion(d, s, 0, t * 2, s, s) || NEUTRAL_PICK,
          };
        } catch (e) {
          /* tainted / unreadable image → keep neutral */
        }
        tintCache.current[project.slug] = corners;
        writeTint(corners, { immediate });
      };
      img.onerror = () => writeTint(NEUTRAL_CORNERS, { immediate });
      img.src = src;
    },
    [writeTint]
  );

  // Fade the ambient field in and out with hover, so the glow arrives as a
  // stage light coming up rather than a hard switch.
  useEffect(() => {
    const el = ambientRef.current;
    if (!el) return;
    gsap.killTweensOf(el);
    gsap.to(el, {
      opacity: hovered ? 0.45 : 0,
      duration: hovered ? 0.65 : 0.45,
      ease: 'power2.out',
    });
  }, [hovered]);

  const handleEnter = useCallback(
    (project) => {
      // Arriving from nothing hovered means the orbs are invisible, so the new
      // colour should be in place BEFORE they fade up rather than easing into
      // view mid-transition.
      const cold = !hovered;
      setHovered(project);
      sampleFor(project, cold);
    },
    [sampleFor, hovered]
  );

  const handleLeave = useCallback(() => setHovered(null), []);

  /*
   * The hovered project's still, resolved the same way the wall resolves its
   * tiles. Agents have no screenshot by design, so this is legitimately null for
   * them and no preview renders — the footlight still lights from their neutral
   * tint.
   */
  const hoveredImage = hovered ? tileImage(hovered) : null;
  const isAgent = hovered?.type === 'agent';

  /* ------------------------------------------------------- the preview */

  // Track the pointer in the list's own coordinate space, so the preview can be
  // absolutely positioned within it rather than fixed to the viewport.
  const handleMove = useCallback((e) => {
    const box = rootRef.current?.getBoundingClientRect();
    if (!box) return;
    target.current = { x: e.clientX - box.left, y: e.clientY - box.top };
  }, []);

  /*
   * Ease the preview toward the cursor.
   *
   * The lag is the whole point — a preview locked to the pointer reads as a
   * tooltip, while one that trails behind reads as something being dragged
   * along. Runs only while a row is hovered, so an idle list costs no frames.
   */
  useEffect(() => {
    if (!hovered || reduce) return undefined;

    // Start where the cursor already is, so it fades in in place rather than
    // flying in from the last row's position.
    pos.current = { ...target.current };

    const tick = () => {
      const el = previewRef.current;
      if (el) {
        pos.current.x += (target.current.x - pos.current.x) * 0.14;
        pos.current.y += (target.current.y - pos.current.y) * 0.14;
        el.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0) translate(-50%, -50%)`;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [hovered, reduce]);

  return (
    <div className="wls-root" ref={rootRef} onMouseMove={handleMove}>
      {/*
        * The footlight field: four screen-blended radial gradients whose origins
        * sit just below the bottom edge, so light rises from the floor and dies
        * out before the nav. Identical construction to .wg-ambient (web) and
        * .aw-ambient (apps) — same masks, same blur — so all three pages glow
        * the same way. Opacity is driven by GSAP above.
        */}
      {/*
        * Portalled to <body>, and that is load-bearing rather than tidiness.
        *
        * The GSAP smooth-scroll wrapper puts a translate3d on .scroll-content,
        * and a transformed ancestor becomes the containing block for
        * position:fixed — so rendered in place this scrolled away with the list
        * instead of staying pinned to the bottom of the viewport. Escaping to
        * <body> restores a real viewport anchor.
        *
        * The corner tints are written to <body> too (see writeTint), because the
        * variables must resolve on an ancestor of wherever the gradients live.
        */}
      {createPortal(
        <div className="wls-ambient" ref={ambientRef} aria-hidden="true">
          <div className="wls-ambient__c wls-ambient__bl" />
          <div className="wls-ambient__c wls-ambient__mid" />
          <div className="wls-ambient__c wls-ambient__br" />
        </div>,
        document.body
      )}

      {/*
        * The cursor-following preview. One element reused across rows rather
        * than one per row: only a single preview is ever visible, and mounting a
        * fresh <img> per hover would re-request the asset each time.
        *
        * aria-hidden — a decorative echo of the row the cursor is already on.
        */}
      {hovered && !reduce && (hoveredImage || isAgent) && (
        <div
          className={`wls-preview${
            hovered.type === 'app' ? ' wls-preview--app' : ''
          }${isAgent ? ' wls-preview--agent' : ''}`}
          ref={previewRef}
          aria-hidden="true"
        >
          {/* Agents have no screenshot by design, so they get their pixel pal
              instead of an empty frame. */}
          {isAgent ? (
            <WallListPal slug={hovered.slug} />
          ) : (
            <img src={hoveredImage} alt="" />
          )}
        </div>
      )}

      <div className="wls-inner">
        {/*
          * The header is just the count, hard against the left edge — it does
          * NOT sit on the year/rows grid below, so it starts at the page gutter
          * rather than being indented to the rows' column.
          */}
        <header className="wls-header">
          <h1 className="wls-header__count">
            <span ref={countRef}>0</span> projects
          </h1>
        </header>

        {groups.map(({ year, items }) => (
          /*
           * Each year is a two-column band: the year alone in a left rail, the
           * projects left-aligned in the right. The year sits at the TOP of its
           * band rather than centred, so it reads as a marker the rows hang
           * beneath.
           */
          <section className="wls-group" key={year}>
            <h2 className="wls-year">{year}</h2>
            <ul className="wls-items">
              {items.map((p) => (
                <li key={p.slug || p.id}>
                  <Link
                    to={`${meta(p).base}/${p.slug}`}
                    className="wls-row"
                    onMouseEnter={() => handleEnter(p)}
                    onMouseLeave={handleLeave}
                    onFocus={() => handleEnter(p)}
                    onBlur={handleLeave}
                    onClick={(e) => {
                      if (!isPlainClick(e) || !startDetailTransition) return;
                      e.preventDefault();
                      startDetailTransition(
                        `${meta(p).base}/${p.slug}`,
                        tileImage(p)
                      );
                    }}
                  >
                    <span className="wls-row__name">{p.title}</span>
                    {/*
                      * Tag pills from the project's `technologies`. The kind
                      * (Web / App / Agent) leads, so every row has at least one
                      * pill even where technologies is empty.
                      */}
                    <span className="wls-row__tags">
                      <span className="wls-tag wls-tag--kind">
                        {meta(p).label}
                      </span>
                      {(p.technologies || []).slice(0, 4).map((t) => (
                        <span className="wls-tag" key={t}>
                          {t}
                        </span>
                      ))}
                    </span>
                    <span className="wls-row__brand">{p.brand?.name || ''}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

    </div>
  );
};

export default WallList;
