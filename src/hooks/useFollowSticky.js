import { useEffect, useRef } from 'react';
import smoothScrollState from './smoothScrollState';

/**
 * Emulates `position: sticky` for rails inside the GSAP smooth-scroll layout,
 * where native sticky can't work (the page is moved by a transform).
 *
 * The rail lives inside the transformed `.scroll-content`, so the content moves
 * it up by `smoothScrollState.offset` — the EASED offset the content itself is
 * translated by. We translate the rail back DOWN by that same eased offset so
 * it appears pinned `top` px below the viewport top. Sharing the eased value
 * means the rail decelerates with the content instead of snapping — the
 * "locomotive" feel — and never jitters against it.
 *
 * Clamped so a short rail never runs past the bottom of its column. Only active
 * while smooth scroll is driving on a wide screen (≥ `minWidth`); otherwise the
 * transform is cleared and the rail sits in normal flow.
 *
 * Returns a `railRef` to attach to the rail element.
 */
const useFollowSticky = ({ top = 112, minWidth = 1024 } = {}) => {
  const railRef = useRef(null);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    const mq = window.matchMedia(`(min-width: ${minWidth}px)`);
    let rafId = null;

    const reset = () => {
      rail.style.transform = '';
      rail.style.willChange = '';
    };

    const tick = () => {
      const parent = rail.parentElement;

      if (!smoothScrollState.enabled || !mq.matches || !parent) {
        reset();
        rafId = requestAnimationFrame(tick);
        return;
      }

      const eased = smoothScrollState.offset;
      const naturalTop = documentOffsetTop(rail);

      // net rail position = naturalTop - eased + shift  ⇒  pin at `top`:
      let shift = eased + top - naturalTop;
      if (shift < 0) shift = 0;

      // Don't let the rail slide past the bottom of its column.
      const maxShift = parent.offsetHeight - rail.offsetHeight;
      if (maxShift > 0 && shift > maxShift) shift = maxShift;

      rail.style.willChange = 'transform';
      rail.style.transform = `translate3d(0, ${shift}px, 0)`;

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      if (rafId != null) cancelAnimationFrame(rafId);
      reset();
    };
  }, [top, minWidth]);

  return railRef;
};

// Offset of an element from the top of the document. Measured via offsetTop,
// which is unaffected by CSS transforms — so the rail's own transform doesn't
// perturb the reading, and neither does the content's translate.
function documentOffsetTop(el) {
  let y = 0;
  let node = el;
  while (node) {
    y += node.offsetTop;
    node = node.offsetParent;
  }
  return y;
}

export default useFollowSticky;
