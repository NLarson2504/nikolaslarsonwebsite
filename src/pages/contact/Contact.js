import React, { useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import PageTemplate from '../../components/PageTemplate';
import CHANNELS from './channels';
import ChannelDeck from './ChannelDeck';
import ChannelDetail from './ChannelDetail';
import './Contact.css';

const NEUTRAL_TINT = '#1f2b45';
const AUTO_MS = 4200; // auto-rotate cadence

const Contact = () => {
  const channels = CHANNELS;
  const count = channels.length;
  const [activeIndex, setActiveIndex] = useState(0);
  const clampedIndex = count ? ((activeIndex % count) + count) % count : 0;
  const current = channels[clampedIndex] || null;

  // auto-rotate stops for good once Email is focused (so filling the form isn't
  // interrupted); it also pauses on hover / manual interaction.
  const [emailLocked, setEmailLocked] = useState(false);
  const [hovering, setHovering] = useState(false);

  const rootRef = useRef(null);
  const detailRef = useRef(null);
  const stageRef = useRef(null);

  const reduce =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- footlight tint: crossfade the glow to the focused channel's brand color
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
      gsap.to(root, {
        duration: 0.28,
        '--ct-glow': 0.25,
        ease: 'power2.in',
        onComplete: () => {
          root.style.setProperty('--pick-bl', value);
          root.style.setProperty('--pick-br', value);
          gsap.to(root, { duration: 0.6, '--ct-glow': 1, ease: 'power2.out' });
        },
      });
    },
    [reduce]
  );

  useEffect(() => {
    applyTint(current?.tint || null);
  }, [current, applyTint]);

  // Gentle entrance for the whole detail panel whenever the focused channel
  // settles. Self-contained (no SplitText / textContent hijack) so the title,
  // blurb, and body — form or grid — are always rendered by React and just fade
  // + rise in. Respects reduced motion.
  useEffect(() => {
    const el = detailRef.current;
    if (!el) return;
    if (reduce) {
      gsap.set(el.children, { clearProps: 'all' });
      return;
    }
    gsap.fromTo(
      el.children,
      { autoAlpha: 0, y: 14 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.55,
        ease: 'power3.out',
        stagger: 0.08,
        overwrite: true,
      }
    );
  }, [current?.slug, reduce]);

  // If we land on Email (by any means), lock auto-rotate.
  useEffect(() => {
    if (current?.kind === 'email') setEmailLocked(true);
  }, [current]);

  // --- auto-rotate: advance on a timer unless paused/locked -----------------
  useEffect(() => {
    if (reduce || emailLocked || hovering || count < 2) return undefined;
    const id = setInterval(() => setActiveIndex((i) => i + 1), AUTO_MS);
    return () => clearInterval(id);
  }, [reduce, emailLocked, hovering, count]);

  // --- manual cycling: wheel over the stage steps through the channels ------
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || count < 2) return undefined;
    let accum = 0;
    let cooling = false;
    const THRESH = 60;
    const COOLDOWN = 520;

    const step = (dir) => {
      // a manual step off Email re-enables auto-rotate; onto it locks again
      setActiveIndex((i) => {
        const next = i + dir;
        const kind = channels[((next % count) + count) % count]?.kind;
        setEmailLocked(kind === 'email');
        return next;
      });
    };

    const onWheel = (e) => {
      e.preventDefault();
      if (cooling) return;
      accum += e.deltaY;
      if (Math.abs(accum) < THRESH) return;
      step(accum > 0 ? 1 : -1);
      accum = 0;
      cooling = true;
      setTimeout(() => {
        cooling = false;
      }, COOLDOWN);
    };

    const onKey = (e) => {
      if (e.key === 'ArrowDown') step(1);
      if (e.key === 'ArrowUp') step(-1);
    };

    stage.addEventListener('wheel', onWheel, { passive: false });
    stage.addEventListener('keydown', onKey);
    return () => {
      stage.removeEventListener('wheel', onWheel);
      stage.removeEventListener('keydown', onKey);
    };
  }, [count, channels]);

  // clicking the focused card = "activate" it: email locks the deck, others open
  const handlePick = (c) => {
    if (c.kind === 'email') {
      setEmailLocked(true);
    } else if (c.url) {
      window.open(c.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <PageTemplate className="contact-page">
      <div className="ct-root" ref={rootRef}>
        {/* footlight glow rising from the bottom, tinted per channel */}
        <div className="ct-ambient">
          <div className="ct-ambient__c ct-ambient__bl" />
          <div className="ct-ambient__c ct-ambient__br" />
        </div>
        <div className="ct-grain" />

        <main
          className="ct-stage"
          ref={stageRef}
          tabIndex={0}
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
        >
          <div className="ct-focus">
            {/* left: the rotating channel deck */}
            <div className="ct-deck-col">
              <ChannelDeck
                channels={channels}
                activeIndex={clampedIndex}
                onPick={handlePick}
              />
            </div>

            {/* right: bespoke detail for the focused channel */}
            <div className="ct-detail" ref={detailRef}>
              {current && (
                <>
                  <h1 className="ct-info__name">{current.name}</h1>
                  {current.blurb && (
                    <p className="ct-info__desc">{current.blurb}</p>
                  )}
                  <ChannelDetail
                    channel={current}
                    onEmailInteract={() => setEmailLocked(true)}
                  />
                  {current.kind !== 'email' && current.url && (
                    <div className="ct-info__links">
                      <a
                        className="ct-info__btn"
                        href={current.url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => setEmailLocked(false)}
                      >
                        {current.cta} <span className="ct-arrow">↗</span>
                      </a>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </PageTemplate>
  );
};

export default Contact;
