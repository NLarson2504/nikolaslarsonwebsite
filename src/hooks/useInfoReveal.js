import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(SplitText);

/**
 * Shared entrance choreography for the Web / Apps / Agents info panels. One
 * timeline reveals icon → title → description → button, replayed whenever
 * `revealKey` changes (i.e. the focused item settles). Elements are found by
 * class inside `containerRef`, so it works across the wg-/aw-/ag- prefixes.
 *
 * The title is split into chars that rise from behind a mask (a cleaner version
 * of the hand-rolled split-word rise the wheels used); the description reveals
 * line by line; the icon pops with a soft overshoot; the button(s) land last.
 *
 * Respects prefers-reduced-motion (everything just snaps visible).
 *
 * @param {Object} opts
 * @param {React.RefObject} opts.containerRef  wrapper around the info panel
 * @param {string} opts.prefix                 'wg' | 'aw' | 'ag'
 * @param {string} opts.title                  current title text (drives split)
 * @param {*} opts.revealKey                    change this to replay (e.g. slug)
 */
export default function useInfoReveal({ containerRef, prefix, title, revealKey }) {
  // keep the live SplitText instances so we can revert (free the DOM) on replay
  const splitsRef = useRef([]);

  const reduce =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return undefined;

    const icon = root.querySelector(`.${prefix}-info__icon`);
    const name = root.querySelector(`.${prefix}-info__name`);
    const desc = root.querySelector(`.${prefix}-info__desc`);
    const btns = root.querySelectorAll(`.${prefix}-info__links > *`);

    // Write the title into the heading (it's rendered empty; aria-label carries
    // the accessible name), then split it.
    if (name) name.textContent = title || '';

    // clean up any previous split before re-splitting
    splitsRef.current.forEach((s) => s.revert());
    splitsRef.current = [];

    if (reduce) {
      // no motion — just make sure everything is visible
      [icon, name, desc, ...btns].forEach((el) => el && gsap.set(el, { clearProps: 'all' }));
      return undefined;
    }

    const titleSplit = name
      ? new SplitText(name, {
          type: 'lines,chars',
          linesClass: `${prefix}-word`, // reuses existing masked-line CSS
          charsClass: `${prefix}-ch`,
        })
      : null;
    const descSplit = desc
      ? new SplitText(desc, { type: 'lines', linesClass: `${prefix}-line` })
      : null;
    if (titleSplit) splitsRef.current.push(titleSplit);
    if (descSplit) splitsRef.current.push(descSplit);

    // Set hidden states up front so there's no one-frame flash of the final
    // layout before the timeline starts.
    if (icon) gsap.set(icon, { autoAlpha: 0, scale: 0.72, y: 6 });
    if (titleSplit) gsap.set(titleSplit.chars, { yPercent: 110, opacity: 0 });
    if (descSplit) gsap.set(descSplit.lines, { yPercent: 40, opacity: 0 });
    if (btns.length) gsap.set(btns, { autoAlpha: 0, y: 12 });

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    if (icon) {
      tl.fromTo(
        icon,
        { autoAlpha: 0, scale: 0.72, y: 6 },
        { autoAlpha: 1, scale: 1, y: 0, duration: 0.55, ease: 'back.out(1.7)' },
        0
      );
    }
    if (titleSplit) {
      tl.fromTo(
        titleSplit.chars,
        { yPercent: 110, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 0.7, ease: 'expo.out', stagger: 0.022 },
        0.08
      );
    }
    if (descSplit && descSplit.lines.length) {
      tl.fromTo(
        descSplit.lines,
        { yPercent: 40, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 0.6, stagger: 0.06 },
        0.24
      );
    }
    if (btns.length) {
      tl.fromTo(
        btns,
        { autoAlpha: 0, y: 12 },
        { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.08 },
        0.38
      );
    }

    return () => {
      tl.kill();
      splitsRef.current.forEach((s) => s.revert());
      splitsRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealKey, title]);
}
