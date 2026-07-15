import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import PageTemplate from '../../components/PageTemplate';
import CollectionState from '../../components/CollectionState';
import useProjects from '../../hooks/useProjects';
import AgentTerminal from './AgentTerminal';
import './Agents.css';

const NEUTRAL_TINT = '#1f2b45';

// Dominant, saturation-boosted color of an image (same spirit as the wheels'
// per-corner sampler, but one color for the whole icon). Returns null if the
// image is essentially gray or unreadable.
const sampleTint = (img) => {
  try {
    const s = 96;
    const c = document.createElement('canvas');
    c.width = s;
    c.height = s;
    const x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(img, 0, 0, s, s);
    const d = x.getImageData(0, 0, s, s).data;
    let r = 0;
    let g = 0;
    let b = 0;
    let wsum = 0;
    for (let i = 0; i < d.length; i += 4) {
      const rr = d[i];
      const gg = d[i + 1];
      const bb = d[i + 2];
      const mx = Math.max(rr, gg, bb);
      const mn = Math.min(rr, gg, bb);
      if (mx < 18 || mn > 248) continue; // skip near-black / near-white
      const chroma = mx - mn;
      if (chroma < 8) continue; // skip grays
      const w = (chroma / 255) ** 1.5; // favor colorful pixels
      r += rr * w;
      g += gg * w;
      b += bb * w;
      wsum += w;
    }
    if (wsum < 0.02) return null;
    let ar = r / wsum;
    let ag = g / wsum;
    let ab = b / wsum;
    const mean = (ar + ag + ab) / 3;
    const SAT = 1.5;
    ar = mean + (ar - mean) * SAT;
    ag = mean + (ag - mean) * SAT;
    ab = mean + (ab - mean) * SAT;
    // pin to a low-ish luma so it reads as a deep footlight, not a bright wash
    const luma = Math.max(1, 0.3 * ar + 0.59 * ag + 0.11 * ab);
    const scale = 120 / luma;
    const clamp = (v) => Math.max(0, Math.min(255, Math.round(v * scale)));
    return `rgb(${clamp(ar)},${clamp(ag)},${clamp(ab)})`;
  } catch (e) {
    return null; // tainted / unreadable → neutral
  }
};

const Agents = () => {
  const { data: agentsData, loading, error } = useProjects('agent');
  const [activeIndex, setActiveIndex] = useState(0);

  // the real agents, starting on the first (LIRA). Scroll cycles through them.
  const items = useMemo(() => agentsData, [agentsData]);
  const count = items.length;
  const clampedIndex = count ? ((activeIndex % count) + count) % count : 0;
  const current = items[clampedIndex] || null;
  const hasCaseStudy = !!current?.caseStudy;

  // agents have no icon of their own, so fall back to the brand logo (Tarragon).
  const iconSrc = current?.icon || current?.brand?.logo || '';

  const rootRef = useRef(null);
  const nameRef = useRef(null);
  const stageRef = useRef(null);
  const reduce =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- footlight tint picked from the current icon -------------------------
  const applyTint = useCallback(
    (tint) => {
      const root = rootRef.current;
      if (!root) return;
      const value = tint || NEUTRAL_TINT;
      if (reduce) {
        root.style.setProperty('--pick-bl', value);
        root.style.setProperty('--pick-br', value);
        return;
      }
      // stage-light crossfade: dip the glow, swap the color, bring it back
      gsap.to(root, {
        duration: 0.28,
        '--ag-glow': 0.25,
        ease: 'power2.in',
        onComplete: () => {
          root.style.setProperty('--pick-bl', value);
          root.style.setProperty('--pick-br', value);
          gsap.to(root, { duration: 0.6, '--ag-glow': 1, ease: 'power2.out' });
        },
      });
    },
    [reduce]
  );

  // sample whenever the active icon changes
  useEffect(() => {
    if (!iconSrc) {
      applyTint(null);
      return undefined;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    let alive = true;
    img.onload = () => {
      if (alive) applyTint(sampleTint(img));
    };
    img.onerror = () => alive && applyTint(null);
    img.src = iconSrc;
    return () => {
      alive = false;
    };
  }, [iconSrc, applyTint]);

  // --- GSAP split-word name reveal (mirrors the Web/Apps wheels) ------------
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
        word.className = 'ag-word';
        token.split('').forEach((ch) => {
          const span = document.createElement('span');
          span.className = 'ag-ch';
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

  useEffect(() => {
    setName(current?.title || '');
  }, [current?.slug, current?.title, setName]);

  // --- scroll-hijack cycle: wheel over the stage cycles through the agents,
  // wrapping around at either end (activeIndex is normalized by modulo). ---
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || items.length < 2) return undefined;
    let accum = 0;
    let cooling = false;
    const THRESH = 60; // wheel delta needed to advance
    const COOLDOWN = 520; // ms lock after a step, so one gesture = one step

    const onWheel = (e) => {
      e.preventDefault();
      if (cooling) return;
      accum += e.deltaY;
      if (Math.abs(accum) < THRESH) return;
      // wrap freely — modulo in the render keeps the index in range
      setActiveIndex((i) => i + (accum > 0 ? 1 : -1));
      accum = 0;
      cooling = true;
      setTimeout(() => {
        cooling = false;
      }, COOLDOWN);
    };

    stage.addEventListener('wheel', onWheel, { passive: false });
    return () => stage.removeEventListener('wheel', onWheel);
  }, [items.length]);

  return (
    <PageTemplate className="agents-page">
      <div className="ag-root" ref={rootRef}>
        {/* footlight glow rising from the bottom, tinted from the icon */}
        <div className="ag-ambient">
          <div className="ag-ambient__c ag-ambient__bl" />
          <div className="ag-ambient__c ag-ambient__br" />
        </div>
        <div className="ag-grain" />

        <main className="ag-stage" ref={stageRef}>
          <div className="ag-focus">
            {/* left info panel — icon, animated name, desc, case-study link */}
            <div className="ag-info">
              <CollectionState
                loading={loading}
                error={error}
                isEmpty={count === 0}
                label="agents"
              />

              {current && (
                <>
                  {iconSrc ? (
                    <img
                      className="ag-info__icon"
                      src={iconSrc}
                      alt={`${current.title} icon`}
                    />
                  ) : (
                    <span className="ag-info__icon ag-info__icon--glyph">
                      {(current.title || '?').charAt(0)}
                    </span>
                  )}

                  {/* eslint-disable-next-line jsx-a11y/heading-has-content --
                     content is injected as split chars by setName(); aria-label
                     carries the accessible name. */}
                  <h1
                    className="ag-info__name"
                    ref={nameRef}
                    aria-label={current.title}
                  />

                  {current.description && (
                    <p className="ag-info__desc">{current.description}</p>
                  )}

                  {hasCaseStudy && (
                    <div className="ag-info__links">
                      <Link
                        className="ag-info__btn ag-info__btn--primary"
                        to={`/agents/${current.slug}`}
                      >
                        Case study <span className="ag-arrow">→</span>
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* right: the large, frameless "working" render */}
            <div className="ag-render-col">
              {current && <AgentTerminal agent={current} />}
            </div>
          </div>

        </main>
      </div>
    </PageTemplate>
  );
};

export default Agents;
