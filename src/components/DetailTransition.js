import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { averageRegion, NEUTRAL_PICK } from '../utils/pickTint';
import './DetailTransition.css';

/*
 * The transition into a project detail page.
 *
 * Clicking a project anywhere on the site washes the viewport bottom-to-top in
 * that project's own colours, navigates underneath the cover, then lifts it
 * away. The nav is deliberately left uncovered: it stays put across the whole
 * move, so the site's chrome never blinks and the wash reads as the page
 * changing rather than the whole window being replaced.
 *
 * Colours come from the project's asset — the two most prominent tints — so the
 * transition is different per project rather than a generic curtain.
 *
 * Anything that links to a detail page calls `startDetailTransition(project,
 * href)` instead of navigating directly; see useDetailTransition below.
 */

const DetailTransitionContext = createContext(null);

// How long the cover takes to sweep up, and to clear again. The navigation
// happens under the cover between the two.
const RISE = 0.62;
const FALL = 0.55;

/*
 * Pull two prominent colours from an image.
 *
 * The wash reads as a gradient between them, so they need to be different
 * enough to see. Sampling the top and bottom halves usually gives that on a
 * screenshot (chrome vs. content); when it doesn't, the two simply land close
 * together and the wash is near-solid, which still looks deliberate.
 */
/*
 * Darken a sampled colour toward the page's own near-black.
 *
 * averageRegion normalises everything to a fixed luma (~140) so the gallery
 * pages' footlights read at consistent strength. That's far too bright for a
 * full-viewport wash, let alone for sitting behind body copy afterwards, so the
 * pair gets mixed down toward the site's base dark here rather than by changing
 * the shared sampler — the web and apps pages still want the bright version.
 */
const BASE_DARK = { r: 8, g: 9, b: 10 }; // #08090a, the site background

const darken = (value, amount) => {
  const m = String(value).match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
  const hex = String(value).trim().match(/^#([0-9a-f]{6})$/i);
  let r;
  let g;
  let b;
  if (m) {
    [, r, g, b] = m.map(Number);
  } else if (hex) {
    const n = parseInt(hex[1], 16);
    r = (n >> 16) & 255;
    g = (n >> 8) & 255;
    b = n & 255;
  } else {
    return value;
  }
  const mix = (channel, base) => Math.round(base + (channel - base) * amount);
  return `rgb(${mix(r, BASE_DARK.r)},${mix(g, BASE_DARK.g)},${mix(b, BASE_DARK.b)})`;
};

/*
 * How much of the sampled colour survives the mix toward the base dark.
 *
 * ONE value, used by both the wash and the page background. They were two
 * different strengths with a tween between them, which is exactly what made the
 * handover visible: a brighter curtain lifting to reveal a duller page. Sharing
 * the constant means the wash isn't covering the page — it IS the page,
 * arriving early.
 *
 * Tuned for "colourful but slightly dark": high enough that the colour is
 * unmistakable, low enough that it stays a dark surface text can sit on. Raise
 * it for a more saturated page — the wash follows automatically, since both
 * read from here, and they must stay equal for the handover to be invisible.
 */
const TINT_STRENGTH = 0.35;

/*
 * Monotonic id handed to each themed page mount. Used only to answer "is the
 * theme on <body> still mine?" when a page unmounts, so a departing page can't
 * clear the colours an arriving one has already set.
 */
let themeOwnerSeq = 0;
const nextThemeOwner = () => {
  themeOwnerSeq += 1;
  return themeOwnerSeq;
};

const pickPair = (img) => {
  try {
    const s = 96;
    const c = document.createElement('canvas');
    c.width = s;
    c.height = s;
    const x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(img, 0, 0, s, s);
    const d = x.getImageData(0, 0, s, s).data;
    const h = s / 2;
    return [
      averageRegion(d, s, 0, 0, s, h) || NEUTRAL_PICK,
      averageRegion(d, s, 0, h, s, s) || NEUTRAL_PICK,
    ];
  } catch (e) {
    return [NEUTRAL_PICK, NEUTRAL_PICK]; // tainted / unreadable
  }
};

export const DetailTransitionProvider = ({ children }) => {
  const navigate = useNavigate();
  const coverRef = useRef(null);
  const runningRef = useRef(false);

  const reduce =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /*
   * Run the wash, navigating at the point the cover is fully up.
   *
   * `image` is optional: without one the wash still plays, just in the neutral
   * tint. That matters because agents have no screenshot, and they should still
   * get the same transition as everything else.
   */
  const startDetailTransition = useCallback(
    (href, image) => {
      // Reduced motion, or a re-entrant call: just go.
      if (reduce || runningRef.current) {
        navigate(href);
        return;
      }

      const el = coverRef.current;
      if (!el) {
        navigate(href);
        return;
      }

      const run = (pair) => {
        /*
         * Set the theme variables NOW, before the rise.
         *
         * The wash paints from --detail-a/--detail-b, the same variables the
         * themed page paints from, so they have to exist before it animates —
         * the destination page hasn't mounted yet to set them itself. It will
         * set them again on mount (useDetailTheme), to the same values, which
         * is why the handover is seamless: nothing changes hands, the same
         * paint just stops being clipped.
         */
        const body = document.body;
        body.style.setProperty('--detail-a', darken(pair[0], TINT_STRENGTH));
        body.style.setProperty('--detail-b', darken(pair[1], TINT_STRENGTH));
        body.classList.add('has-detail-theme');
        /*
         * Claim the theme on the OUTGOING page's behalf-of-nobody: this stamp
         * belongs to no mount yet, so when the page being left unmounts it sees
         * an owner that isn't its own and leaves these colours alone. The
         * arriving page then re-stamps it with its own id on mount.
         */
        body.dataset.detailThemeOwner = 'transition';

        runningRef.current = true;

        const tl = gsap.timeline({
          onComplete: () => {
            runningRef.current = false;
          },
        });

        const HIDDEN = 'inset(100% 0 0 0)';
        const SHOWN = 'inset(0% 0 0 0)';

        /*
         * Up from the bottom edge and stop at the top. The top inset runs
         * 100% -> 0%, REVEALING a full-size element rather than scaling one —
         * a transform would squash the painted gradient into whatever sliver is
         * showing, so the colour under any given pixel would shift as it rose.
         */
        tl.set(el, { display: 'block', clipPath: HIDDEN })
          .to(el, { clipPath: SHOWN, duration: RISE, ease: 'power3.inOut' })
          // The page is swapped while it's covered.
          .add(() => navigate(href))
          /*
           * Then it's simply removed. No wipe, no fade — the body underneath is
           * painting the identical gradient from the identical variables, so
           * hiding this element changes literally nothing on screen. Animating
           * it out would be animating a surface over its own duplicate, which is
           * what produced the kick at the end of earlier versions.
           *
           * The short hold gives the new page a beat to paint before the cover
           * goes.
           */
          .set(el, { display: 'none', clipPath: HIDDEN }, `+=${FALL}`);
      };

      if (!image) {
        run([NEUTRAL_PICK, NEUTRAL_PICK]);
        return;
      }

      /*
       * Sample first, but never let a slow or broken image block the
       * navigation: if it hasn't decoded in 220ms the wash starts neutral. A
       * transition that stalls is worse than one that's the wrong colour.
       */
      let settled = false;
      const go = (pair) => {
        if (settled) return;
        settled = true;
        run(pair);
      };

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => go(pickPair(img));
      img.onerror = () => go([NEUTRAL_PICK, NEUTRAL_PICK]);
      img.src = image;
      setTimeout(() => go([NEUTRAL_PICK, NEUTRAL_PICK]), 220);
    },
    [navigate, reduce]
  );

  return (
    <DetailTransitionContext.Provider value={startDetailTransition}>
      {children}
      {/*
        * Portalled to <body>: the cover must span the viewport, and rendering it
        * inside the app tree would put it under .scroll-content, whose
        * translate3d makes it the containing block for position:fixed.
        *
        * It sits BELOW the nav's z-index so the navigation stays visible and
        * uncovered for the whole transition.
        */}
      {createPortal(
        /*
         * One layer, one colour. It rises to cover the viewport and stops —
         * no stagger, no brighter leading edge.
         *
         * The colour is the page's own tint (TINT_STRENGTH), so the wash isn't
         * a curtain over the page: it IS the page background, arriving early.
         * That identity is what makes the handover invisible at the end.
         */
        <div
          className="detail-wash"
          ref={coverRef}
          aria-hidden="true"
        />,
        document.body
      )}
    </DetailTransitionContext.Provider>
  );
};

/**
 * Returns `startDetailTransition(href, image)`.
 *
 * Call it from a click handler on anything that leads to a detail page, and
 * preventDefault on the underlying link — the transition does the navigating.
 * Keeping the real <a href> in the markup matters: it stays a genuine link for
 * middle-click, "open in new tab", crawlers and screen readers, and only the
 * plain-left-click path is intercepted.
 */
export const useDetailTransition = () => useContext(DetailTransitionContext);

/**
 * Apply a project's tinted background for as long as its detail page is shown.
 *
 * The page OWNS its theme rather than inheriting whatever the transition left
 * on <body>. That distinction matters: an earlier version only cleared on
 * unmount and relied on the transition to have set the colours, which broke in
 * two ways — StrictMode's double-mount ran the cleanup right after mount and
 * stripped the theme (the "flashes then goes dark" symptom), and arriving by
 * direct URL or refresh meant no colours were ever set at all.
 *
 * Setting them here fixes both: the effect re-runs on every mount, and it
 * samples the project's own asset so the page is themed however you got to it.
 */
export const useDetailTheme = (image) => {
  // Identity for this mount, used to decide whether the teardown below still
  // owns the theme currently on <body>. A ref (not state) so it is stable for
  // the life of the mount and never triggers a render.
  const ownerRef = useRef(nextThemeOwner());
  /*
   * Applying and clearing are deliberately SEPARATE effects.
   *
   * `image` starts null (the project hasn't loaded yet) and changes once the
   * asset is known. With one combined effect that change re-runs the cleanup,
   * so the theme would be stripped and re-applied — a visible flash at exactly
   * the moment the page appears. Splitting them means the colours update in
   * place, and the teardown only runs when the page is genuinely leaving.
   */
  useEffect(() => {
    const body = document.body;
    let alive = true;

    const apply = (pair) => {
      if (!alive) return;
      body.style.setProperty('--detail-a', darken(pair[0], TINT_STRENGTH));
      body.style.setProperty('--detail-b', darken(pair[1], TINT_STRENGTH));
      body.classList.add('has-detail-theme');
      // Claim the theme, so a later unmount knows whether it still owns it.
      body.dataset.detailThemeOwner = String(ownerRef.current);
    };

    if (!image) {
      /*
       * No asset yet. Two very different situations reach here, and they must
       * not be treated the same:
       *
       *  - Arrived via the transition. The wash has ALREADY set this project's
       *    colours on <body> and is painting them full-screen. `project` is
       *    still undefined for the moment the Firestore fetch is in flight, so
       *    this effect runs with a null image — and writing the neutral tint
       *    here would overwrite those colours with flat grey, then swap back to
       *    the real ones when the fetch lands. That grey-and-back is the blip
       *    seen right after the wash finishes: the animation was fine, the
       *    background changed underneath it.
       *
       *  - Arrived by direct URL or refresh. Nothing has themed the page, so
       *    the neutral tint is genuinely wanted — it holds a themed surface
       *    while the data loads instead of showing the untinted page.
       *
       * `has-detail-theme` distinguishes them: it is only present when someone
       * has already set colours, so leave those alone and let the real ones
       * arrive in place.
       */
      if (!document.body.classList.contains('has-detail-theme')) {
        apply([NEUTRAL_PICK, NEUTRAL_PICK]);
      }
    } else {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => apply(pickPair(img));
      img.onerror = () => apply([NEUTRAL_PICK, NEUTRAL_PICK]);
      img.src = image;
    }

    // No cleanup here on purpose — see the unmount effect below.
    return () => {
      alive = false;
    };
  }, [image]);

  /*
   * Teardown, on unmount only, so the tint doesn't follow you off the page.
   *
   * But it must not clear a theme that belongs to the NEXT page. React unmounts
   * the outgoing route after the incoming transition has already set its
   * colours, so an unconditional clear here strips them and the background
   * flashes untinted until the new page re-applies them — a blip after the wash
   * has finished, which is exactly when it is most visible.
   *
   * The generation counter distinguishes the two. Every theme application
   * stamps <body> with the value it wrote; this cleanup only clears if that
   * stamp is still the one THIS mount set. If a newer application has since
   * bumped it, the theme on screen belongs to someone else and is left alone.
   */
  useEffect(
    () => () => {
      const body = document.body;
      if (body.dataset.detailThemeOwner !== String(ownerRef.current)) return;
      delete body.dataset.detailThemeOwner;
      body.classList.remove('has-detail-theme');
      body.style.removeProperty('--detail-a');
      body.style.removeProperty('--detail-b');
    },
    []
  );
};

/**
 * True when a click should be handled by the router rather than the browser
 * (i.e. not a new-tab / new-window / download intent). Links keep their real
 * href and only the plain-left-click path is intercepted.
 */
export const isPlainClick = (e) =>
  !e.defaultPrevented &&
  e.button === 0 &&
  !e.metaKey &&
  !e.ctrlKey &&
  !e.shiftKey &&
  !e.altKey;

export default DetailTransitionContext;
