import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";

/**
 * Entrance choreography for a case-study page.
 *
 * Everything rises from slightly below, unblurring and fading up, in reading
 * order: title, hero frame, dek, stats, then each section. It plays once the
 * project's data has arrived, so the page assembles itself rather than snapping
 * in complete the instant the wash lifts.
 *
 * Row-wise items (the stats grid) stagger left-to-right; everything else is a
 * single centred column, where a horizontal sweep would have nothing to sweep
 * across, so those stagger top-to-bottom. GSAP's grid-aware stagger handles
 * both from one declaration: `from: 'start'` on an axis it can measure.
 *
 * The blur is the expensive part. `filter: blur()` forces a repaint of the
 * whole element every frame, so it is animated only on the small number of
 * top-level blocks here — never on split characters or per-word spans, where
 * dozens of simultaneously-blurring layers drop frames on a mid-range machine.
 * `will-change` is set for the duration and cleared after, rather than left on:
 * a permanent `will-change: filter` keeps every one of these blocks on its own
 * compositor layer for the life of the page.
 *
 * Elements are marked in the markup with `data-reveal`, and optionally ordered
 * with `data-reveal-order`, so the layout decides what participates and this
 * hook stays a mechanism rather than a list of selectors.
 *
 * Respects prefers-reduced-motion: everything is simply left visible.
 *
 * @param {Object} opts
 * @param {React.RefObject} opts.rootRef  wrapper containing the revealable nodes
 * @param {*} opts.revealKey              change to replay (e.g. the project slug)
 * @param {boolean} [opts.ready]          hold the reveal until data has arrived
 */
export default function useDetailReveal({ rootRef, revealKey, ready = true }) {
  // Replaying on every data change would re-hide a page the reader is already
  // looking at, so each key is allowed exactly one play.
  const playedRef = useRef(null);
  // Holds the gsap.context once the tweens are actually built, so the cleanup
  // can kill them even though construction is deferred until images decode.
  const ctxRef = useRef(null);

  /*
   * useLayoutEffect, NOT useEffect.
   *
   * `useEffect` runs after the browser has painted, so the sequence was: paint
   * the content fully visible, then set `autoAlpha: 0` and start animating from
   * there. The result is exactly "it just appears" — the first frame the reader
   * sees is the finished layout, and whatever the tween does afterwards is
   * either invisible or reads as a flicker.
   *
   * useLayoutEffect runs before paint, so the `from` state is committed in the
   * same frame the content mounts and the very first painted frame is already
   * the hidden one. Nothing is ever shown before the reveal begins.
   */
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || !ready) return undefined;
    /*
     * Play once per key — but only count a play that actually FINISHED.
     *
     * Marking the key as played up front looks equivalent and is not: React
     * StrictMode runs every effect twice in development (mount, cleanup,
     * mount). The first pass would claim the key and start the tweens, the
     * cleanup would kill them mid-flight, and the second pass would see the key
     * already claimed and bail — leaving every element parked at the `from`
     * state, invisible, with nothing left to animate them back. The guard is
     * committed on completion instead, and the cleanup below un-hides anything
     * it interrupts, so a torn-down play can always be re-run.
     */
    if (playedRef.current === revealKey) return undefined;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const nodes = gsap.utils.toArray("[data-reveal]", root);
    if (!nodes.length) return undefined;

    if (reduce) {
      playedRef.current = revealKey;
      // No motion: clear anything a previous play left behind and stop.
      gsap.set(nodes, { clearProps: "all" });
      return undefined;
    }

    // Explicit order wins where the markup sets one; otherwise document order,
    // which for this layout is already reading order.
    nodes.sort(
      (a, b) =>
        (Number(a.dataset.revealOrder) || 0) -
        (Number(b.dataset.revealOrder) || 0),
    );

    /*
     * Commit the hidden state for EVERY target up front, synchronously.
     *
     * `gsap.fromTo` does not apply its `from` values until the tween's first
     * tick, which is a frame away — and blocks with a `delay` are further out
     * still. Without this, each block stays fully visible until its own tween
     * starts, so the page paints complete and then blinks out block by block.
     * Setting them all here means the first painted frame is the hidden one and
     * the tweens only ever animate forward.
     */
    const allTargets = [];
    nodes.forEach((node) => {
      const isRow = node.hasAttribute("data-reveal-stagger");
      if (isRow) {
        if (node.children.length)
          allTargets.push(...gsap.utils.toArray(node.children));
      } else {
        allTargets.push(node);
      }
    });
    gsap.set(allTargets, { y: 28, autoAlpha: 0, filter: "blur(9px)" });

    let settled = 0;
    let cancelled = false;

    /*
     * Hold the tweens until the images inside the reveal have decoded.
     *
     * The hero screenshot is fetched from Firebase Storage, so it lands well
     * after this effect runs. Its frame would animate on schedule while the
     * <img> was still empty, and the picture would then pop in at whatever
     * opacity the tween had reached — the frame fades, the image inside it just
     * appears. Waiting means the whole panel, glass and screenshot together,
     * fades and unblurs as one thing.
     *
     * The hidden state is already committed above, so nothing is visible during
     * the wait — the page holds on the themed background rather than flashing
     * content. `decode()` is preferred over `load` because it resolves when the
     * bitmap is actually ready to paint, not merely downloaded; a failed decode
     * resolves too, since a broken image should never stall the reveal.
     *
     * The timeout is the backstop: a slow or hanging image must not hold the
     * page hostage, so after it the reveal plays regardless.
     */
    const images = gsap.utils
      .toArray("img", root)
      .filter((img) => !img.complete);

    const waitForImages = () => {
      if (!images.length) return Promise.resolve();
      return Promise.race([
        Promise.all(
          images.map((img) =>
            (img.decode ? img.decode() : Promise.resolve()).catch(() => {}),
          ),
        ),
        new Promise((resolve) => setTimeout(resolve, 2200)),
      ]);
    };

    const play = () => {
      if (cancelled) return;
      buildTimeline();
    };

    const buildTimeline = () => {
      const ctx = gsap.context(() => {
        nodes.forEach((node, i) => {
          // A container marked `data-reveal-stagger` animates its own children
          // instead of itself, so a row of cards can sweep left-to-right rather
          // than arriving as one block.
          const isRow = node.hasAttribute("data-reveal-stagger");
          const targets = isRow ? gsap.utils.toArray(node.children) : node;
          if (isRow && !node.children.length) return;

          const startAt = i * 0.1;

        // Set by usePreviewParallax on any element it drives, so the entrance
        // can finish exactly where that loop wants the element to sit.
        const targetRestY = !isRow ? node.__previewRestY : null;

          /*
           * Opacity/position and blur are SEPARATE tweens, on purpose.
           *
           * Sharing one tween meant the blur cleared on the same curve as the
           * fade — so by the time the element was faint-but-visible the blur was
           * already almost gone, and it never registered as anything more than a
           * soft edge on frame one. Giving the blur a longer duration and a
           * slower start means it is still visibly clearing while the element is
           * at readable opacity, which is the part the eye actually reads as
           * "focusing in" rather than "switching on".
           */
          gsap.fromTo(
            targets,
            { y: 28, autoAlpha: 0 },
            {
              /*
               * Land on the parallax's resting offset, not on 0.
               *
               * An element that shares its transform with the preview parallax
               * publishes `__previewRestY`. Finishing at 0 and letting that
               * loop then ease the panel to its real offset made it drift a
               * beat after the fade had finished — a visible pop. Ending on the
               * value the parallax already wants makes the handover invisible.
               * Everything else has no such function and simply lands at 0.
               */
              y: () =>
                typeof targetRestY === "function" ? targetRestY() : 0,
              autoAlpha: 1,
              duration: 0.85,
              /*
               * `power1.out`, not `power3.out`. The steeper eases are why this
               * read as "appearing": power3.out puts opacity at 0.88 barely a
               * third of the way through, so the element is effectively fully
               * visible almost immediately and the rest is drift nobody can
               * see. A gentler curve spends real time in the mid-range, which
               * is the part that actually reads as a fade.
               */
              ease: "power2.out",
              stagger: isRow ? { each: 0.08, from: "start", grid: "auto" } : 0,
              delay: startAt,
            },
          );

          gsap.fromTo(
            targets,
            { filter: "blur(9px)" },
            {
              filter: "blur(0px)",
              // Longer than the fade and eased even more gently, so focus
              // resolves last — the element is legible before it is sharp.
              duration: 1.0,
              ease: "sine.out",
              stagger: isRow ? { each: 0.08, from: "start", grid: "auto" } : 0,
              delay: startAt,
              // Blur repaints the whole element every frame; promote for the
              // tween only, never permanently.
              onStart: () =>
                gsap.set(targets, { willChange: "filter, transform" }),
              onComplete: () => {
                gsap.set(targets, { clearProps: "willChange,filter" });
              // Hand the element over: anything that shares its transform (the
              // preview's parallax) waits for this flag before taking control.
              (Array.isArray(targets) ? targets : [targets]).forEach((el) =>
                el.setAttribute("data-revealed", "")
              );
                settled += 1;
                // Every block has landed: the reveal is genuinely done, so this
                // key can be marked played and won't run again.
                if (settled === nodes.length) playedRef.current = revealKey;
              },
            },
          );
        });
      }, root);
      ctxRef.current = ctx;
    };

    waitForImages().then(play);

    return () => {
      cancelled = true;
      const ctx = ctxRef.current;
      /*
       * Kill the tweens, then make sure nothing is left hidden.
       *
       * `ctx.revert()` is wrong here — it restores the `from` state, pushing
       * everything back to blurred and invisible. But a bare `kill()` is not
       * enough either: if the cleanup lands mid-flight (StrictMode's second
       * pass, or a fast navigation) the elements keep whatever partial opacity
       * and blur the tween had reached, and nothing will finish the job.
       *
       * So kill, then clear the inline props the tween set. Anything already
       * complete is unaffected — it had its props cleared on completion — and
       * anything interrupted returns to the stylesheet's own visible state.
       */
      if (ctx) ctx.kill();
      gsap.set(allTargets, {
        clearProps: "opacity,visibility,transform,filter,willChange",
      });
    };
  }, [rootRef, revealKey, ready]);
}
