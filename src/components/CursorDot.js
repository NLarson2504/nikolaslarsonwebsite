import React, { useEffect, useRef } from 'react';
import './CursorDot.css';

/**
 * Site-wide lagging cursor dot. A fixed circle that eases toward the pointer a
 * frame behind the real (still-visible) cursor, blended with `mix-blend-mode:
 * difference` so it reads on any background. Lifted from the Web/Apps wheels and
 * made global: it grows into a soft "hot" state while hovering any interactive
 * element (links, buttons, inputs), instead of being wired per-link.
 *
 * Hidden on coarse pointers (touch) via CSS, and disabled entirely for
 * prefers-reduced-motion (the lag is the whole effect).
 */
const CursorDot = () => {
  const dotRef = useRef(null);

  useEffect(() => {
    const dot = dotRef.current;
    if (!dot) return undefined;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    if (reduce || coarse) return undefined;

    let cx = window.innerWidth / 2;
    let cy = window.innerHeight / 2;
    let tx = cx;
    let ty = cy;
    let raf;
    let seen = false; // reveal only once the pointer has actually moved

    const move = (e) => {
      tx = e.clientX;
      ty = e.clientY;
      if (!seen) {
        seen = true;
        cx = tx;
        cy = ty;
        dot.classList.add('is-visible');
      }
    };

    // grow into the "hot" state over anything clickable
    const INTERACTIVE = 'a, button, [role="button"], input, textarea, select, label, summary';
    const over = (e) => {
      if (e.target.closest && e.target.closest(INTERACTIVE)) {
        dot.classList.add('is-hot');
      }
    };
    const out = (e) => {
      // only clear when leaving toward something non-interactive
      const to = e.relatedTarget;
      if (!to || !to.closest || !to.closest(INTERACTIVE)) {
        dot.classList.remove('is-hot');
      }
    };
    const leaveWindow = () => dot.classList.remove('is-visible');
    const enterWindow = () => seen && dot.classList.add('is-visible');

    const loop = () => {
      cx += (tx - cx) * 0.09;
      cy += (ty - cy) * 0.09;
      dot.style.transform = `translate(${cx}px,${cy}px) translate(-50%,-50%)`;
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerover', over);
    window.addEventListener('pointerout', out);
    document.addEventListener('pointerleave', leaveWindow);
    document.addEventListener('pointerenter', enterWindow);
    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerover', over);
      window.removeEventListener('pointerout', out);
      document.removeEventListener('pointerleave', leaveWindow);
      document.removeEventListener('pointerenter', enterWindow);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <div className="site-cursor" ref={dotRef} aria-hidden="true" />;
};

export default CursorDot;
