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
    // Whether the loop has taken over from the entrance yet. The first frame
    // after handover seeds `current` from the real resting position instead of
    // easing up to it from zero — see the tick below.
    let adopted = false;

    /*
     * Publish the resting offset for this scroll position so the entrance can
     * finish ON it rather than on zero. With the reveal landing where the
     * parallax wants the panel, the handover above becomes a no-op and there is
     * no correction to see at all.
     */
    const restingY = () => {
      const rect = frame.getBoundingClientRect();
      const vh = window.innerHeight;
      const centre = rect.top + rect.height / 2;
      const progress = (vh / 2 - centre) / vh;
      let t = progress * rect.height * strength;
      if (t > MAX_DRIFT) t = MAX_DRIFT;
      if (t < -MAX_DRIFT) t = -MAX_DRIFT;
      return t;
    };
    if (media) media.__previewRestY = restingY;

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

        /*
         * On the very first frame after the entrance hands over, ADOPT the
         * target rather than easing toward it.
         *
         * `current` starts at 0 because that is where the reveal leaves the
         * panel, but the parallax's correct resting offset at the current
         * scroll position is not 0 — it can be ~10px away. Easing from 0 to
         * that value made the panel visibly drift into place a beat after the
         * fade finished, which read as a pop. Seeding `current` with the target
         * means the handover is a no-op on screen: the loop simply continues
         * holding the position the panel is already in.
         */
        /*
         * On the first frame after the entrance hands over, adopt the resting
         * offset directly instead of easing to it.
         *
         * The reveal lands the panel at y = 0, but this loop's resting offset
         * at the current scroll position is typically a few px away. Easing
         * from 0 to it made the panel drift into place a beat after the fade
         * had visibly finished — the pop. There is nothing to interpolate here:
         * the entrance is over, and this is simply where the panel belongs at
         * this scroll position, so take it in one step while the eye is still
         * settling rather than animating a correction nobody asked for.
         *
         * `revealRestY` (below) keeps that step at zero in the common case by
         * telling the reveal where to land in the first place.
         */
        if (!adopted) {
          adopted = true;
          current = target;
          setY(current);
          rafId = requestAnimationFrame(tick);
          return;
        }

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
