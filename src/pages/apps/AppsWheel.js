import React, { useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import './AppsWheel.css';

const NEUTRAL_PICK = '#23262b';
const NEUTRAL_CORNERS = {
  tl: NEUTRAL_PICK,
  tr: NEUTRAL_PICK,
  bl: NEUTRAL_PICK,
  br: NEUTRAL_PICK,
};

/**
 * Horizontal 3D wheel for the Apps page — the vertical Web wheel turned on its
 * side. Portrait phone mockups are mounted around a vertical-axis cylinder
 * (rotateY); scroll, horizontal drag, or arrow keys turn it, snapping the
 * nearest phone to the front — sharp and in color while the rest arc away in
 * grayscale. The focused screenshot tints a footlight glow and the app name
 * reveals with a GSAP split-word rise. The real cursor stays visible with a
 * lagging dot behind it.
 */
const AppsWheel = ({ projects }) => {
  const count = projects.length;

  // Pad the ring with faint ghost slats between real phones so a few apps still
  // read as a round wheel. Kept sparse (~9 facets) so only ~3 are on the visible
  // front arc at once. Snapping only lands on real apps.
  const SLOTS_PER_CARD = count > 0 ? Math.max(1, Math.round(9 / count)) : 1;
  const totalSlots = count * SLOTS_PER_CARD;
  const STEP = totalSlots ? 360 / totalSlots : 0;
  const slots = Array.from({ length: totalSlots }, (_, s) =>
    s % SLOTS_PER_CARD === 0
      ? { type: 'card', cardIndex: s / SLOTS_PER_CARD }
      : { type: 'slat' }
  );

  const CARD_ARC = SLOTS_PER_CARD * STEP;
  // Phones are portrait, so the ring's spacing is set by phone WIDTH. PEEK pushes
  // the radius out beyond the tight-fit value so neighbouring phones sit further
  // around the drum and peek in less.
  const CARD_W = 290;
  const PEEK = 1.05;
  const RADIUS = STEP
    ? Math.round((CARD_W / 2 / Math.tan((Math.PI * STEP) / 360)) * PEEK)
    : 0;

  const [index, setIndex] = useState(0);
  const prevIndexRef = useRef(-1);

  const wheelRef = useRef(null);
  const ambientRef = useRef(null);
  const cursorRef = useRef(null);
  const nameRef = useRef(null);
  const slotRefs = useRef([]);
  const picks = useRef(projects.map(() => ({ ...NEUTRAL_CORNERS })));

  const rotationRef = useRef(0);
  const targetRef = useRef(0);
  const draggingRef = useRef(false);
  const lastIdleRef = useRef(performance.now());

  const reduce =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- lagging cursor dot --------------------------------------------------
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

  const writeTint = useCallback((i) => {
    const corners = picks.current[i] || NEUTRAL_CORNERS;
    const el = ambientRef.current;
    ['tl', 'tr', 'bl', 'br'].forEach((corner) => {
      const val = corners[corner] || NEUTRAL_PICK;
      if (el) el.style.setProperty(`--pick-${corner}`, val);
    });
  }, []);

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

  // --- colorful-pixel-weighted region sampling -----------------------------
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
        if (mx < 18 || mn > 248) continue;
        const chroma = mx - mn;
        if (chroma < 8) continue;
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

  // --- GSAP split-word name reveal -----------------------------------------
  const setName = useCallback(
    (text) => {
      const el = nameRef.current;
      if (!el) return;
      el.innerHTML = '';
      const spans = [];
      text.split(/(\s+)/).forEach((token) => {
        if (/^\s+$/.test(token)) {
          el.appendChild(document.createTextNode(' '));
          return;
        }
        const word = document.createElement('span');
        word.className = 'aw-word';
        token.split('').forEach((ch) => {
          const span = document.createElement('span');
          span.className = 'aw-ch';
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

  // --- the wheel: spin (rotateY), ease/snap, drive focus -------------------
  useEffect(() => {
    if (!count || !CARD_ARC) return undefined;
    let raf;

    // A phone is flat to the camera when rot + s*STEP ≡ 0 → s*STEP ≡ -rot.
    const focusedFor = (rot) => {
      const idx = Math.round(-rot / CARD_ARC) % count;
      return (idx + count) % count;
    };

    const paint = () => {
      const rot = rotationRef.current;
      wheelRef.current.style.transform = `translateZ(${-RADIUS}px) rotateY(${rot}deg)`;
      const focusSlot = Math.round(-rot / CARD_ARC) * SLOTS_PER_CARD;
      slotRefs.current.forEach((el, s) => {
        if (!el) return;
        const delta = (((s * STEP + rot) % 360) + 540) % 360 - 180;
        const ad = Math.abs(delta);
        const front = s === ((focusSlot % totalSlots) + totalSlots) % totalSlots;

        // Color/sharpness ramp smoothly back toward the front over ~one card
        // arc, so a phone regains color as it turns in.
        const t = Math.min(1, ad / CARD_ARC);
        const gray = t;
        const blur = t * 5;
        // Visibility fades on ABSOLUTE angle (independent of slot density): full
        // at front, gone by ~55°. Keeps only the front + its immediate side
        // neighbours on screen (~3 phones) instead of a whole visible arc.
        const FADE_DEG = 55;
        const opacity = Math.max(0, 1 - (ad / FADE_DEG) ** 1.6);

        el.style.opacity = String(opacity);
        el.style.filter =
          front && ad < 0.4 ? '' : `grayscale(${gray}) blur(${blur}px)`;
        el.classList.toggle('is-front', front);
      });
    };

    const loop = () => {
      const now = performance.now();
      if (!draggingRef.current && now - lastIdleRef.current > 90) {
        const snapped = Math.round(targetRef.current / CARD_ARC) * CARD_ARC;
        targetRef.current += (snapped - targetRef.current) * 0.12;
      }
      rotationRef.current += (targetRef.current - rotationRef.current) * 0.12;
      paint();
      const focus = focusedFor(rotationRef.current);
      setIndex((prev) => (prev === focus ? prev : focus));
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [count, STEP, RADIUS, CARD_ARC, SLOTS_PER_CARD, totalSlots]);

  // --- input: wheel + horizontal drag + keys turn the cylinder -------------
  useEffect(() => {
    if (!count) return undefined;
    const stage = wheelRef.current?.closest('.aw-stage');
    if (!stage) return undefined;

    const bump = (deltaDeg) => {
      targetRef.current += deltaDeg;
      lastIdleRef.current = performance.now();
    };

    const onWheel = (e) => {
      e.preventDefault();
      // horizontal scroll (trackpad) or vertical wheel both spin it (reversed)
      bump(-(e.deltaX || e.deltaY) * 0.16);
    };

    let startX = 0;
    let startTarget = 0;
    const onPointerDown = (e) => {
      draggingRef.current = true;
      startX = e.clientX;
      startTarget = targetRef.current;
      stage.setPointerCapture?.(e.pointerId);
    };
    const onPointerMove = (e) => {
      if (!draggingRef.current) return;
      targetRef.current = startTarget + (e.clientX - startX) * 0.22;
      lastIdleRef.current = performance.now();
    };
    const onPointerUp = () => {
      draggingRef.current = false;
      lastIdleRef.current = performance.now();
    };
    const onKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') bump(CARD_ARC);
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') bump(-CARD_ARC);
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

  useEffect(() => {
    const prev = prevIndexRef.current;
    setName(projects[index]?.title || '');
    applyTint(index, prev !== -1);
    prevIndexRef.current = index;
  }, [index, projects, setName, applyTint]);

  const hot = (on) => () => {
    if (cursorRef.current) cursorRef.current.classList.toggle('hot', on);
  };

  const current = projects[index] || {};
  const storeUrl =
    current.appStoreUrl || current.playStoreUrl || current.brand?.url || '#';
  const storeLabel = current.appStoreUrl
    ? 'App Store'
    : current.playStoreUrl
    ? 'Google Play'
    : 'Learn more';

  return (
    <div className="aw-root">
      <div className="aw-ambient" ref={ambientRef}>
        <div className="aw-ambient__c aw-ambient__tl" />
        <div className="aw-ambient__c aw-ambient__tr" />
        <div className="aw-ambient__c aw-ambient__bl" />
        <div className="aw-ambient__c aw-ambient__br" />
      </div>
      <div className="aw-grain" />
      <div className="aw-cursor" ref={cursorRef} />

      <main className="aw-stage">
        <div className="aw-focus">
          <div className="aw-info">
            {/* eslint-disable-next-line jsx-a11y/heading-has-content --
               content is injected as split chars by setName(); aria-label carries
               the accessible name. */}
            <h1 className="aw-info__name" ref={nameRef} aria-label={current.title} />
            {current.platform && (
              <p className="aw-info__meta">{current.platform}</p>
            )}
            <a
              className="aw-info__btn"
              href={storeUrl}
              target="_blank"
              rel="noreferrer"
              onPointerEnter={hot(true)}
              onPointerLeave={hot(false)}
            >
              {storeLabel} <span className="aw-arrow">↗</span>
            </a>
          </div>

          <div className="aw-wheel-scene">
            <div className="aw-wheel" ref={wheelRef}>
              {slots.map((slot, s) => {
                const transform = `rotateY(${s * STEP}deg) translateZ(${RADIUS}px)`;
                if (slot.type === 'slat') {
                  return (
                    <div
                      key={`slat-${s}`}
                      className="aw-slat"
                      ref={(el) => {
                        slotRefs.current[s] = el;
                      }}
                      style={{ transform }}
                    />
                  );
                }
                const p = projects[slot.cardIndex];
                const shot = p.screenshots && p.screenshots[0];
                return (
                  <div
                    key={p.id || p.slug || s}
                    className="aw-phone"
                    ref={(el) => {
                      slotRefs.current[s] = el;
                    }}
                    style={{ transform }}
                  >
                    <div className="aw-phone__halo" />
                    <div className="aw-phone__frame">
                      <span className="aw-phone__notch" />
                      {shot ? (
                        <img
                          src={shot}
                          alt={p.title}
                          onLoad={(e) => samplePick(e.currentTarget, slot.cardIndex)}
                        />
                      ) : (
                        <div className="aw-phone__fallback">
                          {p.icon ? (
                            <img className="aw-phone__icon" src={p.icon} alt={p.title} />
                          ) : (
                            <span>{p.title}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AppsWheel;
