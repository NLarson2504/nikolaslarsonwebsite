import { useCallback, useEffect, useRef } from 'react';

/*
 * Wraps the grid onto an ENDLESS cylinder with a vertical axis, and spins that
 * cylinder as the user scrolls.
 *
 * Scroll rotates the wall rather than translating the page: wheel/trackpad
 * input turns the drum about its vertical axis, so tiles travel around it and
 * new work swings in from the side. The page itself never scrolls, and the
 * rotation never stops — spin far enough and the wall comes back around.
 *
 * ---------------------------------------------------------------- infinity
 *
 * The drum is a true circle, not a clamped arc. Two things make it endless:
 *
 *   1. The wall is repeated. Wall.js renders the 14-tile pack several times
 *      side by side, and `circumference` is the width of the WHOLE strip, so
 *      all the repeats together wrap exactly once around the drum. The copy
 *      that swings in from the left is the same wall that just left on the
 *      right, and the single seam is always behind the viewer.
 *
 *   2. Each tile's angle is wrapped into (-PI, PI]. A tile that rotates past
 *      the back of the drum re-enters from the opposite side. The wrap happens
 *      where the tile is behind the viewer and hidden, so it is never seen.
 *
 * Because the radius is derived from the content width, there is no clamp and
 * no end — spin.target just accumulates.
 *
 * ------------------------------------------------------------ hot vs. cold
 *
 *   LAYOUT (cold)  Each tile's resting angle comes from its position in the
 *                  grid. Tiles never expand or reflow, so this is a pure
 *                  function of layout, measured once per resize.
 *
 *   ROTATION (hot) One scalar — the drum's angle — is applied to every tile
 *                  each frame. No measurement happens here.
 *
 * Keeping measurement out of the animation frame is what makes this cheap and
 * what stops the math going circular: the cold pass reads offsetLeft/offsetTop,
 * which report the element's UNTRANSFORMED layout box, so re-measuring never
 * sees the previous frame's transform. Using getBoundingClientRect() here would
 * feed each frame's output back into its own input and the wall would shear
 * apart within a second.
 *
 * ----------------------------------------------------------------- concave
 *
 * The drum is CONCAVE — the viewer stands inside it. The centre of the wall is
 * the furthest point away and the edges curve forward, wrapping toward the
 * viewer's periphery, so the work surrounds them rather than bulging out at
 * them. A convex drum reads as an object you look AT from outside; a concave
 * one reads as a room you stand IN, which is what a gallery should feel like.
 * It also pairs correctly with spin: the tile you face is the nearest one.
 *
 * Concavity is the sign of the z term — convex would be `R*cos(theta) - R`.
 * rotateY is negated to match so each tile still turns to face the viewer.
 *
 * Per tile, with theta the wrapped angle:
 *
 *   translate3d(R*sin(theta) - dx, y, R - R*cos(theta)) rotateY(-theta)
 *
 * The `- dx` cancels the tile's own layout offset so the cylinder is built
 * around the canvas centre rather than sliding sideways.
 */

const V_RADIUS = 5200; // vertical bow — far gentler, or the wall looks like a ball
const MAX_TILT = 0.35; // rad — ceiling on the vertical bow
const SPIN_PER_PX = 0.0006; // wheel delta -> radians
const EASE = 0.09; // inertia; lower = longer glide
const TAU = Math.PI * 2;

// Wrap into (-PI, PI] so a tile passing the back of the drum re-enters from the
// other side. This is the whole trick behind the endless wall.
const wrapAngle = (a) => {
  const m = ((a + Math.PI) % TAU + TAU) % TAU;
  return m - Math.PI;
};

export default function useCylindricalWall({ enabled = true, circumference = 0, deps = [] } = {}) {
  const canvasRef = useRef(null);
  const tilesRef = useRef([]);
  const spinRef = useRef({ current: 0, target: 0 });
  const radiusRef = useRef(2300);
  const frameRef = useRef(null);

  /* Cold pass: cache each tile's untransformed geometry and size the drum. */
  const measure = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const nodes = canvas.querySelectorAll('[data-wall-tile]');

    if (!enabled) {
      tilesRef.current = [];
      nodes.forEach((n) => {
        n.style.transform = '';
        n.style.removeProperty('--wl-edge');
      });
      return;
    }

    /*
     * Radius is derived so the ENTIRE canvas — every repeat laid end to end —
     * wraps exactly once around the drum: circumference = 2*PI*R.
     *
     * It must be the whole canvas, not one pack. Tiles are positioned by `dx`,
     * their offset across the full grid, so if R came from a single pack the
     * outer packs would span several radians more than a full turn and wrap
     * back on top of the middle one. Repeats exist to fill the circle, not to
     * each be a circle.
     */
    const total = circumference || canvas.offsetWidth;
    radiusRef.current = Math.max(600, total / TAU);

    const cx = canvas.offsetWidth / 2;
    const cy = canvas.offsetHeight / 2;
    const R = radiusRef.current;

    tilesRef.current = Array.from(nodes).map((node) => {
      const dx = node.offsetLeft + node.offsetWidth / 2 - cx;
      return {
        node,
        dx,
        dy: node.offsetTop + node.offsetHeight / 2 - cy,
        // Resting angle on the drum, from the tile's horizontal position.
        base: dx / R,
      };
    });
  }, [enabled, circumference]);

  /* Hot pass: apply the current drum angle. No measurement in here. */
  const paint = useCallback(() => {
    const spin = spinRef.current.current;
    const R = radiusRef.current;

    for (const tile of tilesRef.current) {
      const theta = wrapAngle(tile.base + spin);
      const phi = Math.min(MAX_TILT, Math.max(-MAX_TILT, tile.dy / V_RADIUS));

      const x = R * Math.sin(theta) - tile.dx;
      const y = V_RADIUS * Math.sin(phi) - tile.dy;
      // Concave: centre pushed back, edges brought forward toward the viewer.
      const z = R - R * Math.cos(theta) + (V_RADIUS - V_RADIUS * Math.cos(phi));

      tile.node.style.transform =
        `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, ${z.toFixed(2)}px) ` +
        `rotateY(${(-theta).toFixed(4)}rad) rotateX(${phi.toFixed(4)}rad)`;

      /*
       * Fade tiles out only as they pass round the SIDES of the drum, and hide
       * the ones genuinely behind the viewer. This keeps the loop's seam
       * invisible — a tile only ever wraps its angle while fully transparent —
       * and stops the far side of the drum painting through the near side.
       *
       * The thresholds are deliberately late. Fading from ~0.5 rad (29deg) made
       * the wall visibly empty out toward the edges, which read as the surface
       * running out of work. Holding full opacity out to FADE_FROM and only
       * cutting at FADE_TO keeps the arc populated right to the screen edge,
       * where the viewport crops it anyway.
       */
      const FADE_FROM = 1.15; // rad (~66deg) — full opacity until here
      const FADE_TO = 1.62;   // rad (~93deg) — hidden past here (behind viewer)
      const a = Math.abs(theta);
      const edge = a > FADE_TO
        ? 0
        : Math.min(1, Math.max(0, 1 - (a - FADE_FROM) / (FADE_TO - FADE_FROM)));
      tile.node.style.setProperty('--wl-edge', edge.toFixed(3));
      tile.node.style.visibility = edge <= 0.001 ? 'hidden' : 'visible';
    }
  }, []);

  useEffect(() => {
    measure();
    paint();

    if (!enabled) return undefined;

    const canvas = canvasRef.current;
    const surface = canvas?.parentElement;
    if (!surface) return undefined;

    const spin = spinRef.current;

    /*
     * Wheel drives the drum. Vertical and horizontal deltas both spin it, so a
     * mouse wheel, a trackpad two-finger swipe, and shift-scroll all work.
     * No clamping: the target accumulates without limit, which is what makes
     * the wall endless. preventDefault stops the page scrolling underneath.
     */
    const onWheel = (e) => {
      e.preventDefault();
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      spin.target -= delta * SPIN_PER_PX;
    };
    surface.addEventListener('wheel', onWheel, { passive: false });

    // Touch drag spins it too, mapped through the radius so a finger tracks the
    // tile it grabbed.
    let touchX = null;
    const onTouchStart = (e) => { touchX = e.touches[0].clientX; };
    const onTouchMove = (e) => {
      if (touchX === null) return;
      const x = e.touches[0].clientX;
      spin.target += (x - touchX) / radiusRef.current;
      touchX = x;
    };
    const onTouchEnd = () => { touchX = null; };
    surface.addEventListener('touchstart', onTouchStart, { passive: true });
    surface.addEventListener('touchmove', onTouchMove, { passive: true });
    surface.addEventListener('touchend', onTouchEnd, { passive: true });

    // Keyboard: the wall is a navigable surface, not just a mouse toy.
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') spin.target += 0.08;
      else if (e.key === 'ArrowRight') spin.target -= 0.08;
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);

    /*
     * Inertia loop. Idles as soon as the drum settles rather than repainting
     * forever — with nothing moving there is nothing to repaint.
     *
     * When it settles, both current and target are folded back into a single
     * turn. Without this, a long session accumulates unbounded radians and the
     * float eventually loses the precision that keeps the seam aligned.
     */
    const tick = () => {
      const diff = spin.target - spin.current;
      if (Math.abs(diff) > 0.00002) {
        spin.current += diff * EASE;
        paint();
      } else if (spin.current !== spin.target) {
        spin.current = spin.target;
        const folded = ((spin.current % TAU) + TAU) % TAU;
        spin.current = folded;
        spin.target = folded;
        paint();
      }
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);

    let observer = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => { measure(); paint(); });
      observer.observe(canvas);
    }
    const onResize = () => { measure(); paint(); };
    window.addEventListener('resize', onResize, { passive: true });

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (observer) observer.disconnect();
      surface.removeEventListener('wheel', onWheel);
      surface.removeEventListener('touchstart', onTouchStart);
      surface.removeEventListener('touchmove', onTouchMove);
      surface.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measure, paint, enabled, ...deps]);

  return {
    canvasRef,
    recompute: useCallback(() => { measure(); paint(); }, [measure, paint]),
  };
}
