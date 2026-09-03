import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { gsap } from 'gsap';
import './LogoIntro.css';

/**
 * The site's first-load intro — and the home page's loading state, which is
 * the same thing.
 *
 * One NL mark, the same wordmark the nav carries, fades up at centre screen on
 * a full-bleed dark field and breathes there for as long as the wall is still
 * fetching. It covers everything while that happens: the wall's own "LOADING
 * THE WALL…" line is behind this, never seen. When the wall reports itself
 * ready, the field lifts and the mark flies to the nav's own NL and hands off
 * to it — so the loading screen resolves into the site's logo rather than
 * simply disappearing.
 *
 * The landing isn't a guess. The nav's logo button carries `data-nav-logo`,
 * and the flight measures it at the moment it starts — so the mark ends on the
 * real element at whatever position and size the viewport gives it, and the
 * hand-off is a swap between two identical marks rather than a near-miss.
 *
 * Runs on every full page load — it's the home page's loading state, so it
 * plays whenever the wall genuinely has to fetch — but not on client-side
 * navigation back to home, which is a transition rather than an arrival.
 * Skipped outright under prefers-reduced-motion.
 */

/*
 * Played-once flag, scoped to this page load rather than to the session.
 *
 * It's a plain module variable on purpose. A reload re-executes the bundle and
 * resets it, so the intro runs on every hard load — which is what it's for: it
 * IS the home page's loading state, and the wall refetches on every load, so
 * skipping it would just expose the bare "loading the wall" line underneath.
 *
 * What it does prevent is a replay on client-side navigation. Routing back to
 * home from a section page doesn't re-execute the module, so the flag is still
 * set and the intro stays down — that's a transition, not an arrival.
 *
 * (It was sessionStorage first. That survives reloads, so after the very first
 * visit every refresh skipped the intro entirely.)
 */
let hasPlayed = false;

// The mark holds at centre for at least this long even if the data is already
// warm, so a cached load reads as an intro rather than a flash.
const MIN_HOLD_MS = 1100;

// How long the mark takes to fly from centre to the nav.
const FLIGHT_S = 0.9;

// One full revolution of the mark while it waits.
const SPIN_S = 3.4;

/*
 * And never longer than this. If the wall is wedged — offline, a Firestore
 * error, a hung image, a WebGL context that never comes back — the intro still
 * hands off and lets the page show whatever state it's actually in, rather
 * than holding a dark screen forever.
 *
 * Generous, because on a cold load this now covers the whole chain: the fetch,
 * decoding every screenshot, compositing the pack canvas, uploading a
 * 4096x3072 texture and compiling the shader. Cutting it short would put the
 * ceiling back in the business of ending the intro early, which is the exact
 * failure it exists to prevent.
 */
const MAX_HOLD_MS = 14000;

/*
 * How the page tells the intro it's ready.
 *
 * The intro lives in App, above the router, because it has to cover the nav as
 * well as the page. The thing it's waiting for — the wall's projects and their
 * textures — is known only deep inside Home. So the page claims the intro on
 * mount and releases it when it's ready, and the intro holds as long as anyone
 * is holding it.
 *
 * A page that never calls this simply doesn't hold the intro: it plays its
 * minimum and gets out of the way, which is right for the section pages, since
 * they have curtain loaders of their own.
 */
const IntroGateContext = createContext(null);

/**
 * Hold the intro open while `pending` is true.
 *
 *   useIntroHold(loading || !entries);
 *
 * Safe to call anywhere — outside the provider it's a no-op, so a page can use
 * it without knowing whether the intro is playing.
 */
export const useIntroHold = (pending) => {
  const gate = useContext(IntroGateContext);
  useEffect(() => {
    if (!gate || !pending) return undefined;
    return gate.hold();
  }, [gate, pending]);
};

const shouldSkip = () => {
  if (typeof window === 'undefined') return true;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true;
  return hasPlayed;
};

const LogoIntro = ({ children }) => {
  // Decided once, at mount, so a change of motion preference mid-flight can't
  // unmount the thing halfway through its own timeline.
  const [skipped] = useState(shouldSkip);
  const [done, setDone] = useState(skipped);

  // How many callers are currently holding the intro open (see useIntroHold).
  const [holds, setHolds] = useState(0);
  const [minElapsed, setMinElapsed] = useState(skipped);
  const [timedOut, setTimedOut] = useState(false);

  const rootRef = useRef(null);
  const veilLRef = useRef(null);
  const veilRRef = useRef(null);
  const glowRef = useRef(null);
  const markRef = useRef(null);
  const spinRef = useRef(null);
  const pulseRef = useRef(null);
  /*
   * Latches the moment the exit starts.
   *
   * The exit must run exactly once. `ready` is derived from several pieces of
   * state (the hold count, the two clocks), and any of them settling a beat
   * later would re-run the effect — whose cleanup reverts the GSAP context,
   * which wipes the in-flight tween and snaps the doors back shut and the mark
   * back to its start. That was the disappearing act: the flight was being
   * torn down a frame or two after it began.
   */
  const exitStartedRef = useRef(false);

  const gate = useMemo(
    () => ({
      hold: () => {
        setHolds((n) => n + 1);
        return () => setHolds((n) => Math.max(0, n - 1));
      },
    }),
    []
  );

  // Two clocks: the floor (never flash) and the ceiling (never hang).
  useEffect(() => {
    if (skipped) return undefined;
    const floor = setTimeout(() => setMinElapsed(true), MIN_HOLD_MS);
    const ceiling = setTimeout(() => setTimedOut(true), MAX_HOLD_MS);
    return () => {
      clearTimeout(floor);
      clearTimeout(ceiling);
    };
  }, [skipped]);

  /*
   * The page mounts a frame or two after the intro does, so `holds` is 0 at
   * first for a page that WILL hold. Waiting a tick before treating zero holds
   * as "ready" keeps a slow wall from being declared loaded on frame one.
   */
  const [gracePassed, setGracePassed] = useState(false);
  useEffect(() => {
    if (skipped) return undefined;
    const t = setTimeout(() => setGracePassed(true), 120);
    return () => clearTimeout(t);
  }, [skipped]);

  const ready =
    timedOut || (minElapsed && gracePassed && holds === 0);

  const finish = useCallback(() => {
    hasPlayed = true;
    setDone(true);
  }, []);

  /*
   * ---- arrival + hold ------------------------------------------------------
   *
   * Mount-only (`[]`), and that is the whole point.
   *
   * This component renders {children} — the entire app — above its own markup,
   * so Wall is a descendant. React runs a child's effects BEFORE its parent's,
   * which means Wall's useIntroHold fires gate.hold() and bumps `holds` before
   * this effect has ever run. That state change re-renders LogoIntro and, with
   * any dep at all, re-runs this effect — whose cleanup calls ctx.revert() and
   * wipes the entrance tweens back to their CSS start state (opacity 0, no
   * transform). Every subsequent hold change did it again.
   *
   * That was the disappearing act, and it took the doors with it: the mark and
   * the veils were being reverted out from under their own animations, which is
   * why neither ever visibly moved.
   *
   * `skipped` is safe to read here without declaring it: it comes from
   * useState's lazy initialiser and never changes for the life of the mount.
   */
  useLayoutEffect(() => {
    if (skipped) return undefined;

    // Nothing behind the intro should scroll while it plays — the flight is
    // anchored to a fixed nav position, and a scroll mid-flight would have the
    // mark landing on a target that has moved.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const ctx = gsap.context(() => {
      gsap.fromTo(
        glowRef.current,
        { opacity: 0, scale: 0.7 },
        { opacity: 1, scale: 1, duration: 1.2, ease: 'power2.out' }
      );
      gsap.fromTo(
        markRef.current,
        { opacity: 0, y: 26, scale: 0.92, filter: 'blur(12px)' },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: 'blur(0px)',
          duration: 0.95,
          ease: 'power3.out',
          delay: 0.05,
        }
      );

      /*
       * The waiting state. The mark and its bloom breathe on a slow yoyo for
       * however long the fetch takes — this is what stands in for a spinner,
       * and it's why the wall's own loading line is never needed. It's killed
       * by the exit below, which retakes control of the same properties.
       */
      pulseRef.current = gsap.timeline({ repeat: -1, delay: 0.6 });

      /*
       * The mark turns on its own Y axis for as long as the fetch takes. This
       * is the waiting state — it replaces a breathing scale pulse, which read
       * as a spinner standing in for progress; a solid object rotating reads
       * as something being held up for you to look at.
       *
       * On .li-mark3d, never on .li-mark: the flight measures the latter.
       *
       * Linear, and a whole 360 per cycle, so the loop is seamless — an eased
       * revolution visibly hesitates each time it comes back around.
       */
      pulseRef.current.to(
        spinRef.current,
        { rotationY: 360, duration: SPIN_S, ease: 'none', repeat: -1 },
        0
      );

      // The bloom still breathes, half a beat off the spin so the two don't
      // pulse in lockstep.
      pulseRef.current.to(
        glowRef.current,
        {
          opacity: 0.55,
          duration: 1.5,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        },
        0
      );
    }, rootRef);

    return () => {
      /*
       * Revert the entrance only if the exit hasn't taken over. Once the flight
       * is running it owns the mark's transform and opacity, and reverting the
       * entrance context would restore the `opacity: 0` its fromTo started from
       * — blanking the mark in mid-air.
       */
      if (exitStartedRef.current) ctx.kill();
      else ctx.revert();
      document.body.style.overflow = prevOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- exit: fly to the nav ------------------------------------------------
  useLayoutEffect(() => {
    if (skipped || done || !ready) return undefined;
    // Once only — see exitStartedRef. Re-entry here is what killed the flight.
    if (exitStartedRef.current) return undefined;

    const mark = markRef.current;
    if (!mark) return undefined;

    exitStartedRef.current = true;

    /*
     * Hand the mark and the bloom over from the entrance to the exit.
     *
     * `kill()` rather than letting them run: the pulse and the exit animate the
     * same properties, and two live tweens on one property fight frame by
     * frame. Killing by target rather than killing the pulse timeline alone
     * also catches the entrance's fromTo, which may still be running if the
     * wall resolved quickly.
     */
    pulseRef.current?.kill();
    gsap.killTweensOf([mark, glowRef.current, spinRef.current]);

    /*
     * Settle the spin face-on before the hand-off.
     *
     * The nav's NL is flat, so the mark has to arrive flat too — landing
     * mid-rotation would swap a foreshortened mark for a square one at the
     * moment the two are supposed to be indistinguishable.
     *
     * Shortest way round, which is the whole point. Driving to a fixed 360
     * meant the travel depended on where the loop happened to be when the data
     * landed: from 350 that was a 10 degree nudge, but from 10 it was a
     * near-complete revolution squeezed into the settle — and the mark visibly
     * hung at centre before committing to the nav. Normalising to [-180, 180]
     * caps it at half a turn however the timing falls, so the exit takes the
     * same beat every load.
     *
     * It also finishes inside the first half of the flight rather than running
     * its whole length: the mark should be square well before it reaches the
     * corner, not still straightening up as it arrives.
     */
    const spin = spinRef.current;
    if (spin) {
      const turned = gsap.getProperty(spin, 'rotationY') % 360;
      // e.g. 350 -> -10 (nudge forward), 10 -> 10 (nudge back).
      const delta = turned > 180 ? turned - 360 : turned;
      gsap.to(spin, {
        rotationY: `-=${delta}`,
        duration: FLIGHT_S * 0.45,
        ease: 'power2.out',
      });
    }

    gsap.context(() => {
      const target = document.querySelector('[data-nav-logo]');

      /*
       * Measure the mark from a CLEAN baseline, not from wherever the
       * animation happens to have left it.
       *
       * This is what made the mark stop short. The breathing pulse parks it at
       * scale 1.035, so measuring it as-is gave an inflated `from` box. The
       * travel distance was computed centre-to-centre from that inflated box,
       * while `scale` was simultaneously animated to a new value — and because
       * the transform origin is the element's own centre, changing the scale
       * moves where that centre ends up. The two corrections didn't cancel, and
       * the mark landed consistently short of the nav.
       *
       * Clearing x/y/scale first means `from` is the mark's true untransformed
       * layout box, so the offsets below are exact and the scale factor is
       * measured against the size the offsets assume.
       */
      gsap.set(mark, { x: 0, y: 0, scale: 1 });
      const from = mark.getBoundingClientRect();
      const baseWidth = from.width;

      if (!target || !baseWidth) {
        // No nav to land on: fade out in place rather than flying to a guessed
        // coordinate, which would look like a bug rather than a choice.
        gsap.to(
          [mark, veilLRef.current, veilRRef.current, glowRef.current],
          {
            opacity: 0,
            duration: 0.5,
            ease: 'power2.inOut',
            onComplete: finish,
          }
        );
        return;
      }

      const to = target.getBoundingClientRect();
      // Scale from rendered widths, so the mark matches whatever size the
      // nav's type has actually resolved to.
      const scale = to.width / baseWidth;

      /*
       * Centre to centre — and because the mark scales about its own centre,
       * aligning the two centres aligns the two marks at any scale. This is
       * the whole reason to work in centres rather than in top-left corners.
       */
      const dx = to.left + to.width / 2 - (from.left + from.width / 2);
      const dy = to.top + to.height / 2 - (from.top + from.height / 2);

      const tl = gsap.timeline({ onComplete: finish });

      /*
       * The doors open. The two halves of the field pull apart to left and
       * right, uncovering the wall that is already rendered and waiting behind
       * them — the intro doesn't release until the drum has painted its first
       * frame, so there is never an empty stage back there.
       *
       * 101% rather than 100% so each half clears its own edge completely; at
       * exactly 100% a sub-pixel viewport width can leave a one-pixel line.
       */
      tl.to(
        veilLRef.current,
        { xPercent: -101, duration: FLIGHT_S * 1.05, ease: 'power3.inOut' },
        0
      )
        .to(
          veilRRef.current,
          { xPercent: 101, duration: FLIGHT_S * 1.05, ease: 'power3.inOut' },
          0
        )
        // The bloom can't survive the doors opening — it belongs to the field,
        // not to the page — so it goes early and quickly.
        .to(
          glowRef.current,
          { opacity: 0, duration: FLIGHT_S * 0.45, ease: 'power2.in' },
          0
        )
        /*
         * The mark travels to the nav across the same beat, so the reveal and
         * the flight are one gesture rather than two steps: the wall opens up
         * WHILE the NL climbs to its corner.
         */
        .to(
          mark,
          {
            x: dx,
            y: dy,
            scale,
            duration: FLIGHT_S,
            /*
             * power2.inOut. It leaves centre with intent and arrives settling
             * into place — over this distance an `in` ease read as the mark
             * being flung, and an `out` ease spent its last third crawling the
             * final pixels, which is what made it look like it dissolved before
             * arriving.
             */
            ease: 'power2.inOut',
          },
          0
        )
        /*
         * The hand-off, at the destination and not before.
         *
         * Starts only once the flight has fully finished. By then the mark is
         * sitting on the nav's own NL at the same size, face and gradient, so
         * this is two identical marks swapping — not one vanishing. Starting it
         * even slightly early is what made the mark look like it never arrived.
         */
        .to(mark, { opacity: 0, duration: 0.2, ease: 'power1.out' }, FLIGHT_S);
    }, rootRef);

    /*
     * Deliberately no `ctx.revert()` here.
     *
     * Reverting would restore every property this timeline touched — undoing
     * the flight and re-closing the doors. The intro unmounts wholesale the
     * moment the timeline completes (`done`), so there are no styles left to
     * clean up; killing the timeline is enough, and only matters if the whole
     * component is torn down mid-flight.
     */
    /*
     * No cleanup that touches the animation.
     *
     * This effect's deps still change while the flight is playing (`ready` is
     * derived from the hold count and two clocks), so a cleanup here would run
     * mid-flight. The exitStartedRef latch above stops the BODY re-running, but
     * a cleanup fires regardless — so it must not kill or revert anything. The
     * timeline owns the elements until it completes, and completion unmounts
     * the whole overlay, which disposes of the tweens with it.
     */
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  return (
    <IntroGateContext.Provider value={done ? null : gate}>
      {children}
      {!done && (
        <div className="li-root" ref={rootRef} aria-hidden="true">
          <div className="li-veil li-veil--l" ref={veilLRef} />
          <div className="li-veil li-veil--r" ref={veilRRef} />
          <div className="li-glow" ref={glowRef} />
          <div className="li-mark" ref={markRef}>
            {/* The flight owns .li-mark and measures it, so the spin lives on
                this inner node instead: rotating the measured element would
                give the hand-off a foreshortened box to aim at. */}
            <div className="li-mark3d" ref={spinRef}>
              {/* One backing copy, not a stack of them. A stack of discrete
                  slices splays under perspective — each sits at a different
                  depth, so each projects at a slightly different scale and
                  they slide across each other as the mark turns, reading as
                  several NLs shearing rather than one thick one. A single
                  plate with a text-shadow edge holds together at every angle. */}
              <span className="li-mark-edge" aria-hidden="true">NL</span>
              <span className="li-mark-face">NL</span>
            </div>
          </div>
        </div>
      )}
    </IntroGateContext.Provider>
  );
};

export default LogoIntro;
