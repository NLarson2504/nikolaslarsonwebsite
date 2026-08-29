import React, { useEffect, useRef, useState } from 'react';
import { PIXEL_PALS, PALETTE, PAL_SIZE } from '../agents/pixelPals';

// left-to-right order of the trio perched in the hero corner
const PALS = [
  { slug: 'kidd', name: 'Kidd' },
  { slug: 'tallie', name: 'Tallie' },
  { slug: 'lira', name: 'LIRA' },
];

/**
 * One pal sprite drawn crisp on a canvas. Idles with a gentle 1px bob and an
 * occasional blink (frame 2); `delay` staggers the trio so they don't move in
 * unison. Same drawing approach as the AgentCard tiles.
 */
const Pal = ({ slug, name, delay = 0, cell = 5, muted = false, onHover }) => {
  const canvasRef = useRef(null);
  const reduce =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    const pal = PIXEL_PALS[slug];
    const canvas = canvasRef.current;
    if (!pal || !canvas) return undefined;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const size = PAL_SIZE * cell;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.imageSmoothingEnabled = false;

    const drawGrid = (grid) => {
      ctx.clearRect(0, 0, size, size);
      for (let y = 0; y < PAL_SIZE; y += 1) {
        const row = grid[y] || '';
        for (let x = 0; x < PAL_SIZE; x += 1) {
          const color = PALETTE[row[x]];
          if (!color) continue;
          ctx.fillStyle = color;
          ctx.fillRect(x * cell, y * cell, cell, cell);
        }
      }
    };

    if (reduce) {
      drawGrid(pal.idle[0]);
      return undefined;
    }

    let raf;
    let last = 0;
    let blinkTimer = performance.now() + delay + 1500 + Math.random() * 2600;
    let blinking = false;
    const loop = (now) => {
      if (now > blinkTimer) {
        blinking = true;
        if (now > blinkTimer + 130) {
          blinking = false;
          blinkTimer = now + 2200 + Math.random() * 2600;
        }
      }
      if (now - last > 90) {
        last = now;
        drawGrid(blinking ? pal.idle[1] : pal.idle[0]);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [slug, delay, cell, reduce]);

  return (
    <div
      className={`hero-pal-slot${muted ? ' is-muted' : ''}`}
      onMouseEnter={() => onHover(slug)}
      onMouseLeave={() => onHover(null)}
    >
      <span className="hero-pal-name">{name}</span>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="hero-pal"
        style={{
          imageRendering: 'pixelated',
          width: `${PAL_SIZE * cell}px`,
          height: `${PAL_SIZE * cell}px`,
          animationDelay: `${delay}ms`,
        }}
      />
    </div>
  );
};

/**
 * The three AI-agent pixel pals, perched in the bottom-right corner of the
 * hero. Hovering one focuses it and mutes the other two to grayscale, the same
 * way the agents deck dims its off-focus panels; the hovered pal's name rises
 * in above it. Purely decorative, so the group is hidden from assistive tech.
 */
const HeroPals = () => {
  const [hovered, setHovered] = useState(null);

  return (
    <div
      aria-hidden="true"
      className="hero-pals absolute bottom-8 right-6 sm:bottom-10 sm:right-10 flex items-end gap-3 sm:gap-4 select-none z-10"
    >
      {PALS.map(({ slug, name }, i) => (
        <Pal
          key={slug}
          slug={slug}
          name={name}
          delay={i * 420}
          muted={hovered !== null && hovered !== slug}
          onHover={setHovered}
        />
      ))}
    </div>
  );
};

export default HeroPals;
