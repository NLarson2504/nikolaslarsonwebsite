import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import './LoadingCurtain.css';

/**
 * A shared "curtain" loader that reads as a designed intro rather than a
 * spinner: three rows of a scrolling marquee — each just the page name repeated
 * — slide in from alternating sides (left / right / left) and scroll
 * continuously while loading. Once the content is ready (`loading` flips false)
 * the rows exit out the sides and the curtain unmounts, letting the page
 * content fade + scale + unblur in behind it.
 *
 * Usage: mount the page content and this curtain together; drive the content's
 * reveal off `revealed` (via the render-prop child).
 *
 *   <LoadingCurtain loading={loading} label="WEB">
 *     {(revealed) => <YourContent className={revealed ? 'is-in' : ''} />}
 *   </LoadingCurtain>
 */
const DIRS = [-1, 1, -1]; // row entry/scroll side: left, right, left

const LoadingCurtain = ({ loading, label = '', minMs = 900, children }) => {
  const reduce =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // phase: 'curtain' (marquee showing) → 'revealed' (content in, curtain gone)
  const [phase, setPhase] = useState(reduce ? 'revealed' : 'curtain');
  const rootRef = useRef(null);
  const rowRefs = useRef([]);
  const trackRefs = useRef([]);
  const scrollTweens = useRef([]);
  const mountedAt = useRef(Date.now());
  // even if data arrives instantly, hold the curtain long enough for the intro
  // to play fully (min display time), so it never flashes by.
  const [minElapsed, setMinElapsed] = useState(reduce);
  useEffect(() => {
    if (reduce) return undefined;
    const t = setTimeout(
      () => setMinElapsed(true),
      Math.max(0, minMs - (Date.now() - mountedAt.current))
    );
    return () => clearTimeout(t);
  }, [reduce, minMs]);

  // enter animation + continuous scroll (on mount). No one-time guard here — a
  // guard that survives React 19 StrictMode's mount→cleanup→remount would let
  // the first run get reverted and then skip the re-run, so the enter would
  // never play. gsap.context handles setup/teardown cleanly on each pass.
  useLayoutEffect(() => {
    if (reduce) return undefined;
    const ctx = gsap.context(() => {
      rowRefs.current.forEach((row, i) => {
        if (!row) return;
        const dir = DIRS[i];
        // Continuous travel: the row enters FROM dir * -120 and later exits
        // OUT to dir * +120 — same direction throughout, no reversal.
        gsap.fromTo(
          row,
          { xPercent: dir * -120, opacity: 0 },
          {
            xPercent: 0,
            opacity: 1,
            duration: 0.85,
            ease: 'power3.out',
            delay: 0.08 * i,
          }
        );
      });
      // continuous marquee: each track is two copies; scroll -50% and loop
      trackRefs.current.forEach((track, i) => {
        if (!track) return;
        const dir = DIRS[i];
        const from = dir < 0 ? 0 : -50;
        const to = dir < 0 ? -50 : 0;
        gsap.set(track, { xPercent: from });
        scrollTweens.current[i] = gsap.to(track, {
          xPercent: to,
          duration: 16 + i * 3,
          ease: 'none',
          repeat: -1,
        });
      });
    }, rootRef);
    return () => ctx.revert();
  }, [reduce]);

  // when loading finishes (and the minimum display time has elapsed), play the
  // exit then reveal the content
  useEffect(() => {
    if (reduce || loading || !minElapsed || phase !== 'curtain') return undefined;
    const tl = gsap.timeline({
      onComplete: () => setPhase('revealed'),
    });
    rowRefs.current.forEach((row, i) => {
      if (!row) return;
      tl.to(
        row,
        {
          xPercent: DIRS[i] * 120, // exit out the opposite side (same direction)
          opacity: 0,
          duration: 0.72,
          ease: 'power3.in',
        },
        0.08 * i
      );
    });
    return () => tl.kill();
  }, [loading, phase, reduce, minElapsed]);

  const revealed = phase === 'revealed';

  return (
    <>
      {children(revealed)}
      {!revealed && (
        <div className="lc-root" ref={rootRef} aria-hidden="true">
          <div className="lc-rows">
            {[0, 1, 2].map((i) => (
              <div
                className={`lc-row lc-row--${i === 1 ? 'solid' : 'outline'}`}
                key={i}
                ref={(el) => {
                  rowRefs.current[i] = el;
                }}
              >
                <div
                  className="lc-track"
                  ref={(el) => {
                    trackRefs.current[i] = el;
                  }}
                >
                  {/* two copies for a seamless loop */}
                  <span className="lc-seg">{repeatText(label)}</span>
                  <span className="lc-seg" aria-hidden="true">
                    {repeatText(label)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

// repeat the page name enough times to overflow the row width
function repeatText(text) {
  const unit = `${text} · `;
  return unit.repeat(8);
}

export default LoadingCurtain;
