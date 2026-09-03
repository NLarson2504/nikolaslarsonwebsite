import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

/**
 * Subtle vertical parallax for the case-study hero preview.
 *
 * The media inside the frame drifts slightly slower than the page, so the
 * screenshot appears to sit a little behind the glass rather than pasted onto
 * it. The frame itself never moves — only its contents — which is what keeps
 * the effect readable as depth instead of as the whole band sliding.
 *
 * ScrollTrigger is deliberately NOT used. The page is moved by a transform on
 * the smooth-scroll container (see useGSAPScrollSmooth), so there is no native
 * scroll position for ScrollTrigger to hook, and its start/end math resolves
 * against a viewport the content isn't really scrolling in — the same reason
 * `useFollowSticky` emulates sticky by hand. Position is derived from the
 * frame's own `getBoundingClientRect` instead, which already reflects whichever
 * mechanism is driving (the smooth-scroll transform on desktop, native scroll
 * on mobile) without this hook needing to know which.
 *
 * `gsap.quickSetter` writes the transform on the compositor path without
 * allocating a tween per frame — this runs every frame, so per-frame tween
 * creation would be the expensive way to do it.
 *
 * Motion is skipped entirely for prefers-reduced-motion, and on narrow screens
 * where the band is short enough that the drift reads as a glitch rather than
 * depth.
 */
const usePreviewParallax = ({ strength = 0.05, minWidth = 768 } = {}) => {
  const frameRef = useRef(null);
  const mediaRef = useRef(null);

  useEffect(() => {
    const frame = frameRef.current;
    const media = mediaRef.current;
    if (!frame || !media) return undefined;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mq = window.matchMedia(`(min-width: ${minWidth}px)`);
    if (reduce) return undefined;

    /*
     * The parallax and the entrance reveal both animate this element's Y, so
     * they must not run at once: the reveal tweens y 34 -> 0 while this loop
     * would be writing its own y every frame, and the reveal would be silently
     * overwritten — the panel would sit still and simply appear.
     *
     * The reveal marks the element `data-revealed` when it finishes; until then
     * this loop leaves the transform alone and lets the entrance own it.
     */
    const setY = gsap.quickSetter(media, 'y', 'px');

    /*
     * How far the frame may drift, in px.
     *
     * This used to be read from `--preview-overscan`, back when the drift moved
     * the screenshot INSIDE a pinned frame: the travel had to stay within the
     * hidden overscan or it would pull a bare strip into the clip. The whole
     * frame moves now, so there is no clip to run out of and no bare edge to
     * expose — the limit is purely a matter of taste, keeping the panel from
     * wandering far enough to open a visible gap against the content around it.
     */
    const MAX_DRIFT = 26;

    let rafId = null;
    let current = 0;

    const tick = () => {
      // Entrance still playing (or not yet started): don't touch the transform.
      if (!media.hasAttribute('data-revealed')) {
        rafId = requestAnimationFrame(tick);
        return;
      }
      if (!mq.matches) {
        if (current !== 0) {
          current = 0;
          setY(0);
        }
        rafId = requestAnimationFrame(tick);
        return;
      }

      const rect = frame.getBoundingClientRect();
      const vh = window.innerHeight;

      // Only compute while the frame is anywhere near the viewport — off-screen
      // frames would otherwise keep writing transforms every frame for nothing.
      if (rect.bottom > -vh && rect.top < vh * 2) {
        // How far the frame's centre sits from the viewport centre, normalised
        // to roughly -1 (below the fold) .. 1 (above it). Using the rect rather
        // than smoothScrollState.offset directly means this works both inside
        // the smooth-scroll transform and on mobile's native scroll — the rect
        // already reflects whichever is driving.
        const centre = rect.top + rect.height / 2;
        const progress = (vh / 2 - centre) / vh;

        // The drift is a fraction of the frame's own height, so a tall hero and
        // a short one shift by proportionally the same amount rather than the
        // tall one appearing to move much further.
        let target = progress * rect.height * strength;

        // Clamp to the slack the media actually has above and below the well.
        // That, and only that, is how far it can travel before the leading edge
        // pulls a bare strip into the frame.
        if (target > MAX_DRIFT) target = MAX_DRIFT;
        if (target < -MAX_DRIFT) target = -MAX_DRIFT;

        // Ease toward the target rather than snapping to it. On mobile the rect
        // tracks raw scroll, which is jumpy; this keeps the drift smooth there
        // and adds a touch of extra lag under the already-eased desktop scroll.
        current += (target - current) * 0.12;
        setY(current);
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      if (rafId != null) cancelAnimationFrame(rafId);
      gsap.set(media, { y: 0 });
    };
  }, [strength, minWidth]);

  return { frameRef, mediaRef };
};

export default usePreviewParallax;
