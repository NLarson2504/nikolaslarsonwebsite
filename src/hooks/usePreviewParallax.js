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

    const setY = gsap.quickSetter(media, 'y', 'px');

    // The overscan is declared in CSS as `--preview-overscan` and read back
    // here rather than hardcoded, so the two can't drift apart: change the CSS
    // and the clamp follows. It is the TOTAL vertical slack (the media overhangs
    // the well by half of it at each edge), so travel is bounded by half.
    // Reduced motion sets it to 0, which zeroes the drift with no extra branch.
    // Read once — getComputedStyle forces style resolution, and this runs every
    // frame.
    const rawOverscan = parseFloat(
      getComputedStyle(media).getPropertyValue('--preview-overscan')
    );
    const overscan = Number.isFinite(rawOverscan) && rawOverscan > 0
      ? rawOverscan / 2
      : 0;
    let rafId = null;
    let current = 0;

    const tick = () => {
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
        if (target > overscan) target = overscan;
        if (target < -overscan) target = -overscan;

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
