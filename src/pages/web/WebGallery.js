import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import './WebGallery.css';

const NEUTRAL_PICK = '#23262b';
const NEUTRAL_CORNERS = {
  tl: NEUTRAL_PICK,
  tr: NEUTRAL_PICK,
  bl: NEUTRAL_PICK,
  br: NEUTRAL_PICK,
};

/**
 * Grellier-style 3D wheel for the Web page (after carousel-3D/wheel.html).
 *
 * Site cards are mounted around a horizontal-axis cylinder (a rolodex). Scroll,
 * trackpad, drag, or arrow keys turn the wheel; when you stop it eases and snaps
 * so the nearest card sits cleanly at the front — sharp and in color while the
 * rest tilt away in grayscale. The focused screenshot tints a footlight glow
 * rising from the bottom of the page, and the project name reveals with a GSAP
 * split-char rise. The real cursor stays visible with a lagging dot behind it.
 *
 * The app runs inside a fixed overflow:hidden smooth-scroll shell, so there's no
 * native page scroll to hook — rotation is driven directly off wheel/drag delta
 * captured on the stage, which is exactly how the reference wheel works.
 */
const WebGallery = ({ projects }) => {
  const count = projects.length;

  // The ring is padded with faint empty "ghost" slats between the real cards so
  // that even a few projects read as a smoothly-faceted round wheel rather than
  // a flat polygon. We aim for ~15 total slots; each real project occupies every
  // SLOTS_PER_CARD-th slot, the rest are slats. Snapping targets only the real
  // slots. `slots` describes every position on the ring.
  const SLOTS_PER_CARD = count > 0 ? Math.max(1, Math.round(15 / count)) : 1;
  const totalSlots = count * SLOTS_PER_CARD;
  const STEP = totalSlots ? 360 / totalSlots : 0; // degrees between slots (fine)
  const slots = Array.from({ length: totalSlots }, (_, s) =>
    s % SLOTS_PER_CARD === 0
      ? { type: 'card', cardIndex: s / SLOTS_PER_CARD }
      : { type: 'slat' }
  );

  // Degrees the wheel turns to advance one real card.
  const CARD_ARC = SLOTS_PER_CARD * STEP;
  // Radius sized so every slot (fine STEP apart) tiles edge-to-edge into one
  // continuous cylinder — the faces meet with no gaps, so the ring reads as a
  // true round drum. A small gap factor keeps a hairline seam between facets.
  const CARD_H = 440;
  const RADIUS = STEP
    ? Math.round((CARD_H / 2 / Math.tan((Math.PI * STEP) / 360)) * 1.02)
    : 0;

  const [index, setIndex] = useState(0); // live focus (drives the wheel paint)
  const [settledIndex, setSettledIndex] = useState(0); // debounced (drives info)
  const prevIndexRef = useRef(-1);

  const wheelRef = useRef(null);
  const ambientRef = useRef(null);
  const cursorRef = useRef(null);
  const nameRef = useRef(null);
  const slotRefs = useRef([]); // every ring position (cards + ghost slats)
  const picks = useRef(projects.map(() => ({ ...NEUTRAL_CORNERS })));

  // rotation state (degrees). rotationRef eases toward targetRef each frame.
  const rotationRef = useRef(0);
  const targetRef = useRef(0);
  const draggingRef = useRef(false);
  const lastIdleRef = useRef(performance.now());

  const reduce =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- lagging cursor dot (real cursor stays visible) ----------------------
  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return undefined;
    let cx = window.innerWidth / 2;
    let cy = window.innerHeight / 2;
    let tx = cx;
    let ty = cy;
    let raf;
    const move = (e) => {
      tx = e.clientX;
      ty = e.clientY;
    };
    const loop = () => {
      cx += (tx - cx) * 0.09;
      cy += (ty - cy) * 0.09;
      cursor.style.transform = `translate(${cx}px,${cy}px) translate(-50%,-50%)`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener('pointermove', move);
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener('pointermove', move);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Swap the four corner tints into CSS vars.
  const writeTint = useCallback((i) => {
    const corners = picks.current[i] || NEUTRAL_CORNERS;
    const el = ambientRef.current;
    ['tl', 'tr', 'bl', 'br'].forEach((corner) => {
      const val = corners[corner] || NEUTRAL_PICK;
      if (el) el.style.setProperty(`--pick-${corner}`, val);
    });
  }, []);

  // Stage-light crossfade: dim the wash out, swap the tints mid-dip, then rise
  // back up on the new colors.
  const applyTint = useCallback(
    (i, animate = true) => {
      const el = ambientRef.current;
      if (!el) return;
      if (!animate || reduce) {
        writeTint(i);
        gsap.set(el, { opacity: 0.75, scale: 1 });
        return;
      }
      gsap.killTweensOf(el);
      const tl = gsap.timeline();
      tl.to(el, {
        opacity: 0.12,
        scale: 1.06,
        duration: 0.5,
        ease: 'power2.inOut',
        onComplete: () => writeTint(i),
      }).to(el, {
        opacity: 0.75,
        scale: 1,
        duration: 0.85,
        ease: 'power2.out',
      });
    },
    [reduce, writeTint]
  );

  // --- sample a tint from a region, favouring colorful pixels --------------
  const averageRegion = (data, dim, x0, y0, x1, y1) => {
    let r = 0;
    let g = 0;
    let b = 0;
    let wsum = 0;
    for (let y = y0; y < y1; y += 1) {
      for (let x = x0; x < x1; x += 1) {
        const k = (y * dim + x) * 4;
        const rr = data[k];
        const gg = data[k + 1];
        const bb = data[k + 2];
        const mx = Math.max(rr, gg, bb);
        const mn = Math.min(rr, gg, bb);
        if (mx < 18 || mn > 248) continue; // skip near-black / near-white
        const chroma = mx - mn;
        if (chroma < 8) continue; // effectively gray → don't let it dilute
        const w = (chroma / 255) ** 1.5;
        r += rr * w;
        g += gg * w;
        b += bb * w;
        wsum += w;
      }
    }
    if (wsum < 0.02) return null;
    let ar = r / wsum;
    let ag = g / wsum;
    let ab = b / wsum;
    const mean = (ar + ag + ab) / 3;
    const SAT = 1.6;
    ar = mean + (ar - mean) * SAT;
    ag = mean + (ag - mean) * SAT;
    ab = mean + (ab - mean) * SAT;
    const luma = Math.max(1, 0.3 * ar + 0.59 * ag + 0.11 * ab);
    const target = 140;
    const scale = target / luma;
    const clamp = (v) => Math.max(0, Math.min(255, Math.round(v * scale)));
    return `rgb(${clamp(ar)},${clamp(ag)},${clamp(ab)})`;
  };

  const samplePick = useCallback(
    (img, i) => {
      try {
        const s = 128;
        const c = document.createElement('canvas');
        c.width = s;
        c.height = s;
        const x = c.getContext('2d', { willReadFrequently: true });
        x.drawImage(img, 0, 0, s, s);
        const d = x.getImageData(0, 0, s, s).data;
        const h = s / 2;
        const corners = {
          tl: averageRegion(d, s, 0, 0, h, h),
          tr: averageRegion(d, s, h, 0, s, h),
          bl: averageRegion(d, s, 0, h, h, s),
          br: averageRegion(d, s, h, h, s, s),
        };
        picks.current[i] = {
          tl: corners.tl || NEUTRAL_PICK,
          tr: corners.tr || NEUTRAL_PICK,
          bl: corners.bl || NEUTRAL_PICK,
          br: corners.br || NEUTRAL_PICK,
        };
        if (i === index) writeTint(i);
      } catch (e) {
        /* tainted / unreadable image → keep neutral */
      }
    },
    [index, writeTint]
  );

  // --- GSAP split-char name reveal -----------------------------------------
  // Split by WORD (each word an inline-block that never breaks) and animate the
  // chars within. Whole words stay together so multi-word titles wrap cleanly
  // onto separate lines instead of breaking mid-word.
  const setName = useCallback(
    (text) => {
      const el = nameRef.current;
      if (!el) return;
      el.innerHTML = '';
      const spans = [];
      text.split(/(\s+)/).forEach((token) => {
        if (/^\s+$/.test(token)) {
          // preserve the space as a normal break opportunity between words
          el.appendChild(document.createTextNode(' '));
          return;
        }
        const word = document.createElement('span');
        word.className = 'wg-word';
        token.split('').forEach((ch) => {
          const span = document.createElement('span');
          span.className = 'wg-ch';
          span.textContent = ch;
          word.appendChild(span);
          spans.push(span);
        });
        el.appendChild(word);
      });
      if (reduce) return;
      gsap.fromTo(
        spans,
        { yPercent: 90, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: 0.7,
          ease: 'expo.out',
          stagger: 0.026,
          delay: 0.1,
        }
      );
    },
    [reduce]
  );

  // --- the wheel: spin the cylinder, ease/snap rotation, drive focus -------
  useEffect(() => {
    if (!count || !CARD_ARC) return undefined;
    let raf;

    // A card is flat to the camera when its net rotation (rot + s*STEP) is a
    // multiple of 360 → its slot angle s*STEP ≡ -rot. So the front card index is
    // round(-rot / CARD_ARC).
    const focusedFor = (rot) => {
      const idx = Math.round(-rot / CARD_ARC) % count;
      return (idx + count) % count;
    };

    // Above this per-frame speed we skip the expensive blur (animating blur every
    // frame re-rasterizes each card) and just grayscale, so fast spins stay smooth.
    const FAST_DEGPS = 55;
    let lastRot = rotationRef.current;

    const paint = (fast) => {
      const rot = rotationRef.current;
      wheelRef.current.style.transform = `translateZ(${-RADIUS}px) rotateX(${rot}deg)`;
      const focusSlot = Math.round(-rot / CARD_ARC) * SLOTS_PER_CARD;
      slotRefs.current.forEach((el, s) => {
        if (!el) return;
        // angular distance of this slot from the front (0 = front). Front is at
        // s*STEP ≡ -rot, so measure s*STEP + rot.
        const delta = (((s * STEP + rot) % 360) + 540) % 360 - 180;
        const ad = Math.abs(delta);
        const front = s === ((focusSlot % totalSlots) + totalSlots) % totalSlots;

        // Everything ramps continuously with angular distance, so a card regains
        // color and sharpness smoothly as it turns toward the front instead of
        // popping from gray to color at the snap. `t` is 0 at front, 1 once a
        // card is a full card-arc away (fully gray/blurred/dim).
        const t = Math.min(1, ad / CARD_ARC);
        const opacity = 1 - t * 0.72; // 1 → 0.28
        el.style.opacity = String(opacity);

        if (fast) {
          // cheap path while spinning: grayscale only, no per-frame blur
          el.style.filter = `grayscale(${t})`;
        } else {
          // When the front card has settled flat, drop the filter entirely: any
          // filter (even a ~zero one) forces a rasterized layer the 3D scale
          // then softens. An empty filter lets it render crisp.
          el.style.filter =
            front && ad < 0.4 ? '' : `grayscale(${t}) blur(${t * 5}px)`;
        }
        el.classList.toggle('is-front', front);
      });
    };

    const loop = () => {
      const now = performance.now();
      // Snap: once idle briefly, retarget to the nearest REAL card angle.
      if (!draggingRef.current && now - lastIdleRef.current > 90) {
        const snapped = Math.round(targetRef.current / CARD_ARC) * CARD_ARC;
        targetRef.current += (snapped - targetRef.current) * 0.12;
      }
      rotationRef.current += (targetRef.current - rotationRef.current) * 0.12;
      const speed = Math.abs(rotationRef.current - lastRot);
      lastRot = rotationRef.current;
      paint(speed > FAST_DEGPS);

      const focus = focusedFor(rotationRef.current);
      setIndex((prev) => (prev === focus ? prev : focus));

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [count, STEP, RADIUS, CARD_ARC, SLOTS_PER_CARD, totalSlots]);

  // --- input: wheel + drag + keys turn the cylinder ------------------------
  useEffect(() => {
    if (!count) return undefined;
    const stage = wheelRef.current?.closest('.wg-stage');
    if (!stage) return undefined;

    const bump = (deltaDeg) => {
      targetRef.current += deltaDeg;
      // Cap how far the target can run ahead so a fast flick's momentum stays
      // bounded and the eased catch-up never grinds.
      const MAX_LEAD = CARD_ARC * 2.5;
      const lead = targetRef.current - rotationRef.current;
      if (Math.abs(lead) > MAX_LEAD) {
        targetRef.current = rotationRef.current + Math.sign(lead) * MAX_LEAD;
      }
      lastIdleRef.current = performance.now();
    };

    const onWheel = (e) => {
      e.preventDefault();
      bump(e.deltaY * 0.16);
    };

    let startY = 0;
    let startTarget = 0;
    const onPointerDown = (e) => {
      draggingRef.current = true;
      startY = e.clientY;
      startTarget = targetRef.current;
      stage.setPointerCapture?.(e.pointerId);
    };
    const onPointerMove = (e) => {
      if (!draggingRef.current) return;
      targetRef.current = startTarget - (e.clientY - startY) * 0.22;
      lastIdleRef.current = performance.now();
    };
    const onPointerUp = () => {
      draggingRef.current = false;
      lastIdleRef.current = performance.now();
    };
    const onKey = (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') bump(CARD_ARC);
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') bump(-CARD_ARC);
    };

    stage.addEventListener('wheel', onWheel, { passive: false });
    stage.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('keydown', onKey);
    return () => {
      stage.removeEventListener('wheel', onWheel);
      stage.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('keydown', onKey);
    };
  }, [count, CARD_ARC]);

  // Debounce the live focus `index` into `settledIndex`: during a fast spin the
  // index changes for every card that flies past, but we only want the info
  // panel + the expensive GSAP work to update once the wheel SETTLES.
  useEffect(() => {
    if (prevIndexRef.current === -1) {
      setSettledIndex(index);
      return undefined;
    }
    const id = setTimeout(() => setSettledIndex(index), 130);
    return () => clearTimeout(id);
  }, [index]);

  // Run the name reveal + tint crossfade only when the settled card changes.
  useEffect(() => {
    const prev = prevIndexRef.current;
    setName(projects[settledIndex]?.title || '');
    applyTint(settledIndex, prev !== -1);
    prevIndexRef.current = settledIndex;
  }, [settledIndex, projects, setName, applyTint]);

  const hot = (on) => () => {
    if (cursorRef.current) cursorRef.current.classList.toggle('hot', on);
  };

  // Info panel reads the DEBOUNCED index so its text/links don't thrash mid-spin.
  const current = projects[settledIndex] || {};
  const viewUrl = current.url || current.brand?.url || '';
  const hasCaseStudy = Boolean(current.caseStudy);

  return (
    <div className="wg-root">
      <div className="wg-ambient" ref={ambientRef}>
        <div className="wg-ambient__c wg-ambient__tl" />
        <div className="wg-ambient__c wg-ambient__tr" />
        <div className="wg-ambient__c wg-ambient__bl" />
        <div className="wg-ambient__c wg-ambient__br" />
      </div>
      <div className="wg-grain" />
      <div className="wg-cursor" ref={cursorRef} />

      <main className="wg-stage">
        <div className="wg-focus">
          <div className="wg-wheel-scene">
            <div className="wg-wheel" ref={wheelRef}>
              {slots.map((slot, s) => {
                const transform = `rotateX(${s * STEP}deg) translateZ(${RADIUS}px)`;
                if (slot.type === 'slat') {
                  return (
                    <div
                      key={`slat-${s}`}
                      className="wg-slat"
                      ref={(el) => {
                        slotRefs.current[s] = el;
                      }}
                      style={{ transform }}
                    />
                  );
                }
                const p = projects[slot.cardIndex];
                return (
                  <div
                    key={p.id || p.slug || s}
                    className="wg-card"
                    ref={(el) => {
                      slotRefs.current[s] = el;
                    }}
                    style={{ transform }}
                  >
                    <div className="wg-card__halo" />
                    {p.image ? (
                      <img
                        src={p.image}
                        alt={p.title}
                        crossOrigin="anonymous"
                        onLoad={(e) => samplePick(e.currentTarget, slot.cardIndex)}
                      />
                    ) : (
                      <div className="wg-card__placeholder">{p.title}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="wg-info">
            {current.icon && (
              <img
                className="wg-info__icon"
                src={current.icon}
                alt={`${current.title} icon`}
              />
            )}
            {current.category && (
              <p className="wg-info__eyebrow">{current.category}</p>
            )}
            {/* eslint-disable-next-line jsx-a11y/heading-has-content --
               content is injected as split chars by setName(); aria-label carries
               the accessible name. */}
            <h1 className="wg-info__name" ref={nameRef} aria-label={current.title} />
            {current.description && (
              <p className="wg-info__desc">{current.description}</p>
            )}
            <div className="wg-info__links">
              {hasCaseStudy && (
                <Link
                  className="wg-info__btn wg-info__btn--primary"
                  to={`/web/${current.slug}`}
                  onPointerEnter={hot(true)}
                  onPointerLeave={hot(false)}
                >
                  Case study <span className="wg-arrow">→</span>
                </Link>
              )}
              {viewUrl && (
                <a
                  className="wg-info__btn"
                  href={viewUrl}
                  target="_blank"
                  rel="noreferrer"
                  onPointerEnter={hot(true)}
                  onPointerLeave={hot(false)}
                >
                  View site <span className="wg-arrow">↗</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default WebGallery;
